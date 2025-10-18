import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1';
import JSZip from 'https://esm.sh/jszip@3.10.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Authentication check
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Verify admin role
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (roleError || !roleData) {
      return new Response(JSON.stringify({ error: 'Forbidden: Admin access required' }), { 
        status: 403, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const { templateId, zipUrl } = await req.json();
    
    // Input validation
    if (!templateId || !zipUrl) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Validate templateId exists
    const { data: template, error: templateError } = await supabase
      .from('templates')
      .select('id')
      .eq('id', templateId)
      .single();

    if (templateError || !template) {
      return new Response(JSON.stringify({ error: 'Template not found' }), { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Validate zipUrl is from templates bucket
    if (!zipUrl.startsWith(supabaseUrl + '/storage/v1/object/public/templates/')) {
      return new Response(JSON.stringify({ error: 'Invalid ZIP URL - must be from templates bucket' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    console.log('Processing template:', templateId, 'from:', zipUrl);

    const zipResponse = await fetch(zipUrl);
    if (!zipResponse.ok) throw new Error(`Failed to download ZIP: ${zipResponse.statusText}`);

    const zipArrayBuffer = await (await zipResponse.blob()).arrayBuffer();
    
    // File size limit: 50MB
    if (zipArrayBuffer.byteLength > 50 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: 'ZIP file too large (max 50MB)' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    const zip = await JSZip.loadAsync(zipArrayBuffer);

    let rootDir = '';
    let htmlContent = '';
    const assetUrls: Record<string, string> = {};
    const previewImages: string[] = [];

    // 1) Detect root directory (folder that contains index.html)
    for (const [name] of Object.entries(zip.files)) {
      if (name.endsWith('index.html')) {
        const parts = name.split('/');
        if (parts.length > 1) rootDir = parts.slice(0, -1).join('/') + '/';
        break;
      }
    }
    console.log('Root dir:', rootDir || '(root)');

    // Collect files by type
    const cssFiles: Array<{ path: string; file: JSZip.JSZipObject }> = [];

    // 2) First pass: upload all non-CSS assets and read HTML
    for (const [name, file] of Object.entries(zip.files)) {
      if (file.dir) continue;
      if (rootDir && !name.startsWith(rootDir)) continue;
      const rel = rootDir ? name.substring(rootDir.length) : name;

      if (rel === 'index.html') {
        htmlContent = await file.async('text');
        continue;
      }

      if (/\.(css)$/i.test(rel)) {
        cssFiles.push({ path: rel, file });
        continue;
      }

      if (/\.(jpg|jpeg|png|gif|webp|svg|js|woff|woff2|ttf|eot|otf)$/i.test(rel)) {
        const blob = await file.async('blob');
        const uploadPath = `${templateId}/${rel}`;
        const { error: uploadError } = await supabase.storage
          .from('templates')
          .upload(uploadPath, blob, { upsert: true, contentType: blob.type || 'application/octet-stream' });
        if (uploadError) { console.error('Upload error (asset):', rel, uploadError); continue; }
        const { data: urlData } = supabase.storage.from('templates').getPublicUrl(uploadPath);
        assetUrls[rel] = urlData.publicUrl;
        if (/\.(jpg|jpeg|png|gif|webp)$/i.test(rel) && previewImages.length < 3) previewImages.push(urlData.publicUrl);
      }
    }

    if (!htmlContent) throw new Error('No index.html file found in ZIP');

    // Helper: resolve a relative path against a base directory
    const resolveRelative = (baseDir: string, relPath: string) => {
      try {
        const u = new URL(relPath, 'http://x/' + (baseDir ? baseDir + '/' : ''));
        return decodeURIComponent(u.pathname.replace(/^\//, ''));
      } catch (_) {
        return relPath;
      }
    };

    // 3) Process and upload CSS with rewritten url(...) to absolute URLs
    for (const { path: rel, file } of cssFiles) {
      const cssText = await file.async('text');
      const baseDir = rel.includes('/') ? rel.substring(0, rel.lastIndexOf('/')) : '';
      const rewritten = cssText.replace(/url\(([^)]+)\)/gi, (match, p1) => {
        let raw = String(p1).trim().replace(/^['"]|['"]$/g, '');
        if (!raw || raw.startsWith('data:') || raw.startsWith('http') || raw.startsWith('#')) return match;
        const resolved = resolveRelative(baseDir, raw);
        const url = assetUrls[resolved];
        return url ? `url("${url}")` : match;
      });

      const cssBlob = new Blob([rewritten], { type: 'text/css' });
      const uploadPath = `${templateId}/${rel}`;
      const { error: cssUploadError } = await supabase.storage
        .from('templates')
        .upload(uploadPath, cssBlob, { upsert: true, contentType: 'text/css' });
      if (cssUploadError) { console.error('Upload error (css):', rel, cssUploadError); continue; }
      const { data: cssUrlData } = supabase.storage.from('templates').getPublicUrl(uploadPath);
      assetUrls[rel] = cssUrlData.publicUrl;
    }

    // 4) Rewrite HTML references (href/src and inline url())
    let processedHtml = htmlContent;
    const sortedPaths = Object.keys(assetUrls).sort((a, b) => b.length - a.length);
    for (const rel of sortedPaths) {
      const publicUrl = assetUrls[rel];
      const escaped = rel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      processedHtml = processedHtml.replace(new RegExp(`(href|src)=["']${escaped}["']`, 'gi'), `$1="${publicUrl}"`);
      processedHtml = processedHtml.replace(new RegExp(`url\\(["']?${escaped}["']?\\)`, 'gi'), `url("${publicUrl}")`);
    }

    const { error: updateError } = await supabase
      .from('templates')
      .update({ html_content: processedHtml, asset_urls: assetUrls, preview_images: previewImages.length ? previewImages : null })
      .eq('id', templateId);
    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({ success: true, message: 'Template processed successfully', assetCount: Object.keys(assetUrls).length, previewImages: previewImages.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing template:', error);
    return new Response(JSON.stringify({ error: (error as Error).message || 'Unknown error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
