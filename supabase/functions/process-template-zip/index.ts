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

    const { templateId, zipUrl } = await req.json();
    
    console.log('Processing template:', templateId, 'from:', zipUrl);

    // Download ZIP file from storage
    const zipResponse = await fetch(zipUrl);
    if (!zipResponse.ok) {
      throw new Error(`Failed to download ZIP: ${zipResponse.statusText}`);
    }

    const zipBlob = await zipResponse.blob();
    const zipArrayBuffer = await zipBlob.arrayBuffer();
    
    // Load ZIP file
    const zip = await JSZip.loadAsync(zipArrayBuffer);
    
    let htmlContent = '';
    const assetUrls: { [key: string]: string } = {};
    const previewImages: string[] = [];
    let rootDir = '';

    // First pass: find root directory containing index.html
    for (const [filename] of Object.entries(zip.files)) {
      if (filename.endsWith('index.html')) {
        const parts = filename.split('/');
        if (parts.length > 1) {
          // Get all parts except the filename
          rootDir = parts.slice(0, -1).join('/') + '/';
        }
        console.log('Found root directory:', rootDir || '(root)');
        break;
      }
    }

    // Process all files in ZIP
    for (const [filename, file] of Object.entries(zip.files)) {
      if (file.dir) continue;

      // Skip files not in root directory if root dir exists
      if (rootDir && !filename.startsWith(rootDir)) {
        console.log('Skipping file outside root:', filename);
        continue;
      }

      // Remove root directory prefix from path
      const relativePath = rootDir ? filename.substring(rootDir.length) : filename;
      
      console.log('Processing:', filename, '→', relativePath);

      // Extract HTML content
      if (relativePath === 'index.html') {
        htmlContent = await file.async('text');
        console.log('Found main HTML file');
      }
      // Handle assets (images, CSS, JS)
      else if (
        relativePath.match(/\.(jpg|jpeg|png|gif|webp|svg|css|js|woff|woff2|ttf|eot|otf)$/i)
      ) {
        const fileContent = await file.async('blob');
        
        // Upload with relative path (without root directory prefix)
        const uploadPath = `${templateId}/${relativePath}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('templates')
          .upload(uploadPath, fileContent, {
            contentType: fileContent.type || 'application/octet-stream',
            upsert: true,
          });

        if (uploadError) {
          console.error('Error uploading', relativePath, ':', uploadError);
          continue;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('templates')
          .getPublicUrl(uploadPath);

        // Store with relative path as key (matches HTML references)
        assetUrls[relativePath] = urlData.publicUrl;
        console.log('Uploaded:', relativePath, '→', urlData.publicUrl);

        // Track preview images
        if (relativePath.match(/\.(jpg|jpeg|png|gif|webp)$/i) && previewImages.length < 3) {
          previewImages.push(urlData.publicUrl);
        }
      }
    }

    if (!htmlContent) {
      throw new Error('No index.html file found in ZIP');
    }

    // Replace relative asset paths in HTML with public URLs
    let processedHtml = htmlContent;
    
    // Sort paths by length (longest first) to handle nested paths correctly
    const sortedPaths = Object.entries(assetUrls).sort((a, b) => b[0].length - a[0].length);
    
    for (const [relativePath, publicUrl] of sortedPaths) {
      // Escape special regex characters
      const escapedPath = relativePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      // Replace in HTML attributes (href, src)
      processedHtml = processedHtml.replace(
        new RegExp(`(href|src)=["']${escapedPath}["']`, 'gi'),
        `$1="${publicUrl}"`
      );
      
      // Replace in CSS url()
      processedHtml = processedHtml.replace(
        new RegExp(`url\\(["']?${escapedPath}["']?\\)`, 'gi'),
        `url("${publicUrl}")`
      );
    }

    // Update template in database
    const { error: updateError } = await supabase
      .from('templates')
      .update({
        html_content: processedHtml,
        asset_urls: assetUrls,
        preview_images: previewImages.length > 0 ? previewImages : null,
      })
      .eq('id', templateId);

    if (updateError) {
      throw updateError;
    }

    console.log('✅ Template processed successfully');
    console.log('  - Assets:', Object.keys(assetUrls).length);
    console.log('  - Preview images:', previewImages.length);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Template processed successfully',
        previewImages: previewImages.length,
        assetCount: Object.keys(assetUrls).length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Error processing template:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
