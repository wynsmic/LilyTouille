import * as cheerio from 'cheerio';

export interface ImageMapping {
  [placeholder: string]: string;
}

export interface PreprocessedHtml {
  cleanedHtml: string;
  imageMap: ImageMapping;
}

/**
 * Preprocesses HTML for AI processing by:
 * 1. Removing irrelevant tags
 * 2. Replacing image URLs with stable placeholders
 * 3. Building a mapping for later restoration
 *
 * @param html - Raw HTML string
 * @returns Object with cleaned HTML and image mapping
 */
export function prepareHtmlForIA(html: string): PreprocessedHtml {
  const $ = cheerio.load(html);
  const imageMap: ImageMapping = {};
  let imageCounter = 0;

  // Remove irrelevant tags
  $('script, style, nav, header, footer, iframe, noscript, aside, svg').remove();

  // Remove elements that typically contain ads
  $('[class*="ad"], [id*="ad"], [class*="advertisement"], [id*="advertisement"]').remove();
  $('[class*="sponsor"], [id*="sponsor"], [class*="promo"], [id*="promo"]').remove();

  // Remove social media widgets
  $('[class*="social"], [id*="social"], [class*="facebook"], [class*="twitter"], [class*="instagram"]').remove();

  // Remove navigation and menu elements
  $('[class*="menu"], [id*="menu"], [class*="navigation"]').remove();

  // Remove common comment/review sections
  $('[class*="comment"], [id*="comment"], [class*="review"], [id*="review"]').remove();
  $('[class*="reply"], [id*="reply"], [class*="disqus"], [id*="disqus"]').remove();
  $('[class*="feedback"], [id*="feedback"], [class*="rating"], [id*="rating"]').remove();

  // Process images: replace src with placeholders
  $('img').each((_, element) => {
    const $img = $(element);
    const src = $img.attr('src') || $img.attr('data-src') || $img.attr('data-image-url');

    if (src && (src.startsWith('http') || src.startsWith('//') || src.startsWith('/') || src.includes('.'))) {
      const placeholder = `[[IMG_${imageCounter}]]`;
      imageMap[placeholder] = src;

      // Replace src with placeholder and remove other potentially large attributes
      $img.attr('src', placeholder);
      $img.removeAttr('data-src data-lazy-src data-image-url class style');
      imageCounter++;
    }
  });

  // Remove broken or empty img tags
  $('img[src=""], img:not([src])').remove();

  // Get the cleaned HTML
  const cleanedHtml = $.html();

  return {
    cleanedHtml,
    imageMap,
  };
}
