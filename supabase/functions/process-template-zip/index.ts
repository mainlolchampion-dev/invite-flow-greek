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

    // Process all files in ZIP
    for (const [filename, file] of Object.entries(zip.files)) {
      if (file.dir) continue;

      console.log('Processing file:', filename);

      // Extract HTML content (only main index.html, not nested ones)
      if (filename === 'index.html' || filename.endsWith('/index.html')) {
        htmlContent = await file.async('text');
        console.log('Found HTML file:', filename);
      }
      // Handle assets (images, CSS, JS)
      else if (
        filename.match(/\.(jpg|jpeg|png|gif|webp|svg|css|js)$/i)
      ) {
        const fileContent = await file.async('blob');
        const fileExt = filename.split('.').pop();
        
        // Keep the original path structure but sanitize
        const uploadPath = `${templateId}/${filename}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('templates')
          .upload(uploadPath, fileContent, {
            contentType: fileContent.type || 'application/octet-stream',
            upsert: true,
          });

        if (uploadError) {
          console.error('Error uploading asset:', uploadError);
          continue;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('templates')
          .getPublicUrl(uploadPath);

        // Store with original filename as key
        assetUrls[filename] = urlData.publicUrl;
        console.log('Uploaded asset:', filename, '->', urlData.publicUrl);

        // Track preview images
        if (filename.match(/\.(jpg|jpeg|png|gif|webp)$/i) && previewImages.length < 3) {
          previewImages.push(urlData.publicUrl);
        }
      }
    }

    if (!htmlContent) {
      throw new Error('No HTML file found in ZIP');
    }

    // Replace relative asset paths in HTML with public URLs
    let processedHtml = htmlContent;
    
    // Sort paths by length (longest first) to handle nested paths correctly
    const sortedPaths = Object.entries(assetUrls).sort((a, b) => b[0].length - a[0].length);
    
    for (const [originalPath, publicUrl] of sortedPaths) {
      // Replace various path formats: href="path", src="path", url(path)
      const escapedPath = originalPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      // Replace in attributes
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

    console.log('Template processed successfully:', templateId);

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
    console.error('Error processing template:', error);
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
