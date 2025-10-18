// Helper to convert image-based names to editable text
export const processTemplateHtml = (html: string): string => {
  if (!html) return html;
  
  // Add custom styles for text-based names
  const customStyles = `
    <style>
      /* Custom styles for editable text logo and names */
      .wd_text_logo {
        font-family: 'Allura', cursive;
        font-size: 48px;
        color: #ff6b8a;
        margin: 0;
        padding: 20px 0;
        text-align: center;
      }
      .wd_text_logo .bride-name, .wd_text_logo .groom-name {
        display: inline-block;
      }
      .wd_text_logo .and {
        color: #ff6b8a;
        font-size: 36px;
        margin: 0 10px;
      }
      .wd_text_logo .subtitle {
        font-family: 'Open Sans', sans-serif;
        font-size: 14px;
        letter-spacing: 2px;
        text-transform: uppercase;
        display: block;
        margin-top: 5px;
        color: #666;
      }
      .wd_names_hero {
        font-family: 'Allura', cursive;
        font-size: 120px;
        color: #333;
        text-align: center;
        margin: 20px 0;
        line-height: 1.2;
      }
      .wd_names_hero .first-name {
        display: block;
      }
      .wd_names_hero .and-symbol {
        font-size: 80px;
        color: #ff6b8a;
        display: inline-block;
        margin: 0 20px;
      }
      .wd_names_hero .second-name {
        display: block;
      }
    </style>
  `;
  
  // Replace logo image with text
  const logoReplacement = `
    <div class="wd_logo">
      <h1 class="wd_text_logo">
        <span class="bride-name">Jenny</span> <span class="and">&</span> <span class="groom-name">Mark</span>
        <span class="subtitle">are getting married!</span>
      </h1>
    </div>
  `;
  
  // Replace hero names image with text
  const heroNamesReplacement = `
    <div class="wd_names_hero">
      <span class="first-name">Jenny</span>
      <span class="and-symbol">♥</span>
      <span class="second-name">Mark</span>
    </div>
  `;
  
  let processedHtml = html;
  
  // Replace logo image
  processedHtml = processedHtml.replace(
    /<div class="wd_logo">\s*<img[^>]*?logo\.png[^>]*?>\s*<\/div>/gi,
    logoReplacement
  );
  
  // Replace hero names image
  processedHtml = processedHtml.replace(
    /<img[^>]*?name\.png[^>]*?>/gi,
    heroNamesReplacement
  );
  
  // Insert custom styles before </head>
  if (processedHtml.includes('</head>') && !processedHtml.includes('wd_text_logo')) {
    processedHtml = processedHtml.replace('</head>', `${customStyles}</head>`);
  }
  
  return processedHtml;
};
