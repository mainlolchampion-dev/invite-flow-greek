/**
 * Processes the Dahlia template HTML to make it editable
 * Adds data-editable attributes and CSS variables for theming
 */

export const processDahliaTemplate = (html: string): string => {
  let processedHtml = html;

  // Add CSS variables for primary color theming
  const cssVariables = `
    <style>
      :root {
        --primary-color: #C4A57B;
        --secondary-color: #6d8a91;
      }
      
      /* Apply CSS variables to elements */
      .bg-secondary, .border-secondary, .divider-secondary, .text-secondary {
        background-color: var(--primary-color) !important;
        border-color: var(--primary-color) !important;
        color: var(--primary-color) !important;
      }
      
      .divider-primary {
        background-color: var(--primary-color) !important;
      }
      
      .ornament-primary {
        border-color: var(--primary-color) !important;
      }
      
      /* Editable styles */
      [data-editable]:hover {
        outline: 2px dashed var(--primary-color) !important;
        outline-offset: 2px !important;
        cursor: pointer !important;
      }
      
      [data-editable].editing {
        outline: 3px solid var(--primary-color) !important;
        outline-offset: 2px !important;
      }
    </style>
  `;

  // Add CSS variables to head
  processedHtml = processedHtml.replace('</head>', `${cssVariables}\n</head>`);

  // Make couple names editable
  processedHtml = processedHtml.replace(
    /<h2 class="font-alt fw-bold m-0">Milea<\/h2>/g,
    '<h2 class="font-alt fw-bold m-0" data-editable="bride-name" contenteditable="true">Milea</h2>'
  );

  processedHtml = processedHtml.replace(
    /<h2 class="font-alt fw-bold m-0">Dilan<\/h2>/g,
    '<h2 class="font-alt fw-bold m-0" data-editable="groom-name" contenteditable="true">Dilan</h2>'
  );

  // Make full names editable
  processedHtml = processedHtml.replace(
    /<h5 class="font-alt fw-bold text-uppercase">Jane Milea<\/h5>/g,
    '<h5 class="font-alt fw-bold text-uppercase" data-editable="bride-fullname" contenteditable="true">Jane Milea</h5>'
  );

  processedHtml = processedHtml.replace(
    /<h5 class="font-alt fw-bold text-uppercase">John Dilan<\/h5>/g,
    '<h5 class="font-alt fw-bold text-uppercase" data-editable="groom-fullname" contenteditable="true">John Dilan</h5>'
  );

  // Make taglines editable
  processedHtml = processedHtml.replace(
    /<p class="font-alt fst-italic text-muted">I kind of have a thing for Him<\/p>/g,
    '<p class="font-alt fst-italic text-muted" data-editable="bride-tagline" contenteditable="true">I kind of have a thing for Him</p>'
  );

  processedHtml = processedHtml.replace(
    /<p class="font-alt fst-italic text-muted">I kind of have a thing for Her<\/p>/g,
    '<p class="font-alt fst-italic text-muted" data-editable="groom-tagline" contenteditable="true">I kind of have a thing for Her</p>'
  );

  // Make ceremony details editable
  processedHtml = processedHtml.replace(
    /Sunday - September 13th, 2021<br>/g,
    '<span data-editable="ceremony-date" contenteditable="true">Sunday - September 13th, 2021</span><br>'
  );

  processedHtml = processedHtml.replace(
    /09:00am - 10:00am/g,
    '<span data-editable="ceremony-time" contenteditable="true">09:00am - 10:00am</span>'
  );

  processedHtml = processedHtml.replace(
    /St\. Patrick's Catholic Church<br>/g,
    '<span data-editable="ceremony-location" contenteditable="true">St. Patrick\'s Catholic Church</span><br>'
  );

  // Make reception details editable
  processedHtml = processedHtml.replace(
    /06:00pm - 10:00pm/g,
    '<span data-editable="reception-time" contenteditable="true">06:00pm - 10:00pm</span>'
  );

  processedHtml = processedHtml.replace(
    /The Mayflower Hotel<br>/g,
    '<span data-editable="reception-location" contenteditable="true">The Mayflower Hotel</span><br>'
  );

  // Make love story titles editable
  processedHtml = processedHtml.replace(
    /<h4 class="font-alt">First Meet Each Other<\/h4>/g,
    '<h4 class="font-alt" data-editable="story-1-title" contenteditable="true">First Meet Each Other</h4>'
  );

  processedHtml = processedHtml.replace(
    /<h4 class="font-alt">When We Go Out Together<\/h4>/g,
    '<h4 class="font-alt" data-editable="story-2-title" contenteditable="true">When We Go Out Together</h4>'
  );

  processedHtml = processedHtml.replace(
    /<h4 class="font-alt">Have a Lovely Time<\/h4>/g,
    '<h4 class="font-alt" data-editable="story-3-title" contenteditable="true">Have a Lovely Time</h4>'
  );

  processedHtml = processedHtml.replace(
    /<h4 class="font-alt">We Fall in Love Each Other<\/h4>/g,
    '<h4 class="font-alt" data-editable="story-4-title" contenteditable="true">We Fall in Love Each Other</h4>'
  );

  processedHtml = processedHtml.replace(
    /<h4 class="font-alt">We Decide to Live Together<\/h4>/g,
    '<h4 class="font-alt" data-editable="story-5-title" contenteditable="true">We Decide to Live Together</h4>'
  );

  // Make proposal story editable
  processedHtml = processedHtml.replace(
    /<h3 class="font-alt fs-4 fw-bold text-uppercase">How He Proposed<\/h3>/g,
    '<h3 class="font-alt fs-4 fw-bold text-uppercase" data-editable="proposal-title" contenteditable="true">How He Proposed</h3>'
  );

  // Make RSVP deadline editable
  processedHtml = processedHtml.replace(
    /Please RSVP by November 21, 2023\./g,
    'Please RSVP by <span data-editable="rsvp-deadline" contenteditable="true">November 21, 2023</span>.'
  );

  // Make all images clickable for editing
  processedHtml = processedHtml.replace(
    /<img ([^>]*class="[^"]*"[^>]*)>/g,
    '<img $1 data-editable="image" style="cursor: pointer;">'
  );

  return processedHtml;
};

/**
 * Apply a color theme to the template
 */
export const applyColorTheme = (html: string, primaryColor: string): string => {
  return html.replace(
    /--primary-color:\s*#[0-9A-Fa-f]{6};/g,
    `--primary-color: ${primaryColor};`
  );
};

/**
 * Extract editable field values from HTML
 */
export const extractFieldValues = (html: string): Record<string, string> => {
  const fields: Record<string, string> = {};
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  doc.querySelectorAll('[data-editable]').forEach((el) => {
    const key = el.getAttribute('data-editable');
    if (key) {
      fields[key] = el.textContent?.trim() || '';
    }
  });
  
  return fields;
};
