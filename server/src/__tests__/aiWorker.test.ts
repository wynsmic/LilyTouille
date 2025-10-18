import {
  cleanHtml,
  limitPayloadSize,
  removeCommentSections,
  estimateTokenCount,
} from '../workers/aiWorker';

describe('AI Worker Functions', () => {
  describe('cleanHtml', () => {
    it('should remove script tags and their content', () => {
      const html = `
        <div class="recipe">
          <h1>Test Recipe</h1>
          <script>console.log('test');</script>
          <p>Recipe content</p>
        </div>
      `;

      const result = cleanHtml(html);
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('console.log');
      expect(result).toContain('Test Recipe');
      expect(result).toContain('Recipe content');
    });

    it('should remove style tags and their content', () => {
      const html = `
        <div class="recipe">
          <h1>Test Recipe</h1>
          <style>.recipe { color: red; }</style>
          <p>Recipe content</p>
        </div>
      `;

      const result = cleanHtml(html);
      expect(result).not.toContain('<style>');
      expect(result).not.toContain('color: red');
      expect(result).toContain('Test Recipe');
      expect(result).toContain('Recipe content');
    });

    it('should remove HTML comments', () => {
      const html = `
        <div class="recipe">
          <h1>Test Recipe</h1>
          <!-- This is a comment -->
          <p>Recipe content</p>
        </div>
      `;

      const result = cleanHtml(html);
      expect(result).not.toContain('<!--');
      expect(result).not.toContain('This is a comment');
      expect(result).toContain('Test Recipe');
      expect(result).toContain('Recipe content');
    });

    it('should normalize whitespace', () => {
      const html = `
        <div    class="recipe">
          <h1>   Test Recipe   </h1>
          <p>Recipe    content</p>
        </div>
      `;

      const result = cleanHtml(html);
      expect(result).not.toContain('   ');
      expect(result).toContain('Test Recipe');
      expect(result).toContain('Recipe content');
    });

    it('should preserve recipe content while removing unwanted elements', () => {
      const html = `
        <div class="recipe">
          <h1>Chocolate Cake</h1>
          <p>This is a delicious chocolate cake recipe.</p>
          <script>track('recipe_view');</script>
          <style>.recipe { margin: 10px; }</style>
          <!-- SEO comment -->
          <ul>
            <li>Flour</li>
            <li>Sugar</li>
            <li>Cocoa powder</li>
          </ul>
        </div>
      `;

      const result = cleanHtml(html);
      expect(result).toContain('Chocolate Cake');
      expect(result).toContain('delicious chocolate cake recipe');
      expect(result).toContain('Flour');
      expect(result).toContain('Sugar');
      expect(result).toContain('Cocoa powder');
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('<style>');
      expect(result).not.toContain('<!--');
    });
  });

  describe('removeCommentSections', () => {
    it('should remove French commentaires sections', () => {
      const html = `
        <div class="recipe-content">
          <h1>Recette de Pâtes</h1>
          <p>Instructions de la recette...</p>
        </div>
        <section class="commentaires">
          <h2>Commentaires</h2>
          <div class="comment">
            <p>Très bonne recette!</p>
          </div>
        </section>
      `;

      const result = removeCommentSections(html);
      expect(result).toContain('Recette de Pâtes');
      expect(result).toContain('Instructions de la recette');
      expect(result).not.toContain('commentaires');
      expect(result).not.toContain('Très bonne recette');
    });

    it('should remove English comments sections', () => {
      const html = `
        <div class="recipe">
          <h1>Pasta Recipe</h1>
          <p>Recipe instructions...</p>
        </div>
        <div id="comments">
          <h3>Comments</h3>
          <div class="user-comment">
            <p>Great recipe!</p>
          </div>
        </div>
      `;

      const result = removeCommentSections(html);
      expect(result).toContain('Pasta Recipe');
      expect(result).toContain('Recipe instructions');
      expect(result).not.toContain('comments');
      expect(result).not.toContain('Great recipe');
    });

    it('should remove reviews sections', () => {
      const html = `
        <article class="recipe-post">
          <h1>Chocolate Cake</h1>
          <p>How to make chocolate cake...</p>
        </article>
        <section class="reviews">
          <h2>Reviews</h2>
          <div class="review">
            <p>5 stars - amazing!</p>
          </div>
        </section>
      `;

      const result = removeCommentSections(html);
      expect(result).toContain('Chocolate Cake');
      expect(result).toContain('How to make chocolate cake');
      expect(result).not.toContain('reviews');
      expect(result).not.toContain('5 stars');
    });

    it('should remove French avis sections', () => {
      const html = `
        <div class="content">
          <h1>Ratatouille</h1>
          <p>Recette traditionnelle...</p>
        </div>
        <aside class="avis">
          <h3>Avis</h3>
          <p>Les utilisateurs adorent cette recette!</p>
        </aside>
      `;

      const result = removeCommentSections(html);
      expect(result).toContain('Ratatouille');
      expect(result).toContain('Recette traditionnelle');
      expect(result).not.toContain('avis');
      expect(result).not.toContain('Les utilisateurs adorent');
    });

    it('should preserve recipe content that mentions comment-related words', () => {
      const html = `
        <div class="recipe-content">
          <h1>Special Recipe</h1>
          <p>Add a comment of salt to taste</p>
          <p>The chef commented that this step is crucial</p>
          <p>Comment: You can substitute butter for oil</p>
          <ul>
            <li>Comment: This ingredient is optional</li>
          </ul>
        </div>
      `;

      const result = removeCommentSections(html);
      expect(result).toContain('Special Recipe');
      expect(result).toContain('Add a comment of salt to taste');
      expect(result).toContain('The chef commented that this step is crucial');
      expect(result).toContain('Comment: You can substitute butter for oil');
      expect(result).toContain('Comment: This ingredient is optional');
    });

    it('should remove comment headings and their following content', () => {
      const html = `
        <div class="recipe">
          <h1>Test Recipe</h1>
          <p>Recipe content here</p>
        </div>
        <h2>Comments</h2>
        <p>This is a comment section</p>
        <div class="comment">User comment here</div>
        <h3>Next Section</h3>
        <p>This should be preserved</p>
      `;

      const result = removeCommentSections(html);
      expect(result).toContain('Test Recipe');
      expect(result).toContain('Recipe content here');
      expect(result).toContain('Next Section');
      expect(result).toContain('This should be preserved');
      expect(result).not.toContain('Comments');
      expect(result).not.toContain('This is a comment section');
      expect(result).not.toContain('User comment here');
    });
  });

  describe('estimateTokenCount', () => {
    it('should estimate tokens based on character count', () => {
      const text = 'Hello world!';
      const tokens = estimateTokenCount(text);
      expect(tokens).toBe(Math.ceil(text.length / 3.5));
    });

    it('should handle empty string', () => {
      const tokens = estimateTokenCount('');
      expect(tokens).toBe(0);
    });

    it('should handle HTML markup', () => {
      const html = '<div class="test">Hello world!</div>';
      const tokens = estimateTokenCount(html);
      expect(tokens).toBe(Math.ceil(html.length / 3.5));
    });
  });

  describe('limitPayloadSize', () => {
    it('should return content unchanged if under token limit', () => {
      const content = 'Short content';
      const result = limitPayloadSize(content, 100);
      expect(result).toBe(content);
    });

    it('should truncate content at HTML tag boundary when possible', () => {
      const content =
        'A'.repeat(1000) + '<p>End of paragraph</p>' + 'B'.repeat(1000);
      const result = limitPayloadSize(content, 400); // ~1140 characters, should find the tag
      expect(result).toContain('End of paragraph');
      expect(result).toContain('...');
    });

    it('should truncate content at sentence boundary when no HTML tags', () => {
      const content =
        'A'.repeat(1000) + '. End of sentence.' + 'B'.repeat(1000);
      const result = limitPayloadSize(content, 400); // ~1140 characters, should find the sentence
      expect(result).toContain('End of sentence');
      expect(result).toContain('...');
    });

    it('should use simple truncation as fallback', () => {
      const content = 'A'.repeat(2000);
      const result = limitPayloadSize(content, 100); // ~28 tokens (very small limit)
      expect(result).toContain('...');
      // Should be truncated to approximately 100 * 3.5 = 350 characters
      expect(result.length).toBeLessThanOrEqual(353); // 350 + '...'
    });

    it('should handle edge case with very short token limit', () => {
      const content = 'This is a test sentence.';
      const result = limitPayloadSize(content, 2); // ~7 characters (very small limit)
      expect(result.length).toBeLessThanOrEqual(10); // 7 + '...'
      expect(result).toContain('...');
    });

    it('should preserve content structure when truncating', () => {
      const content =
        `
        <div class="recipe">
          <h1>Recipe Title</h1>
          <p>Recipe description</p>
          <ul>
            <li>Ingredient 1</li>
            <li>Ingredient 2</li>
          </ul>
        </div>
      ` + 'A'.repeat(200000);

      const result = limitPayloadSize(content, 200); // ~700 characters
      expect(result.length).toBeLessThanOrEqual(703); // 700 + '...'
      expect(result).toContain('Recipe Title');
      expect(result).toContain('...');
    });

    it('should use default limit of 128000 tokens', () => {
      const shortContent = 'Short content';
      const longContent = 'A'.repeat(500000); // Way over 128k tokens

      const shortResult = limitPayloadSize(shortContent);
      const longResult = limitPayloadSize(longContent);

      expect(shortResult).toBe(shortContent);
      // 128k tokens ≈ 448k characters
      expect(longResult.length).toBeLessThanOrEqual(448003); // 448000 + '...'
    });

    it('should respect token-based calculation', () => {
      // Create content that's exactly at the token limit
      const content = 'A'.repeat(448000); // Exactly 128k tokens
      const result = limitPayloadSize(content, 128000);

      // Should not be truncated since it's exactly at the limit
      expect(result).toBe(content);

      // Test with content slightly over the limit
      const overLimitContent = 'A'.repeat(448001); // 1 character over
      const overLimitResult = limitPayloadSize(overLimitContent, 128000);
      expect(overLimitResult).toContain('...');
    });
  });

  describe('Integration tests', () => {
    it('should clean HTML and remove comment sections together', () => {
      const html = `
        <div class="recipe">
          <h1>Test Recipe</h1>
          <script>console.log('test');</script>
          <style>.recipe { color: red; }</style>
          <!-- Comment -->
          <p>Recipe content</p>
        </div>
        <section class="commentaires">
          <h2>Commentaires</h2>
          <p>User comment here</p>
        </section>
      `;

      const result = cleanHtml(html);
      expect(result).toContain('Test Recipe');
      expect(result).toContain('Recipe content');
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('<style>');
      expect(result).not.toContain('<!--');
      expect(result).not.toContain('commentaires');
      expect(result).not.toContain('User comment here');
    });

    it('should handle large HTML with all cleaning functions', () => {
      const largeHtml =
        `
        <div class="recipe">
          <h1>Large Recipe</h1>
          <script>console.log('tracking');</script>
          <style>.recipe { margin: 10px; }</style>
          <p>Recipe content</p>
        </div>
        <section class="commentaires">
          <h2>Commentaires</h2>
          <p>Many user comments here...</p>
        </section>
      ` + 'A'.repeat(200000);

      const cleaned = cleanHtml(largeHtml);
      const limited = limitPayloadSize(cleaned, 1000); // ~3500 characters

      expect(limited.length).toBeLessThanOrEqual(3503); // 3500 + '...'
      expect(limited).toContain('Large Recipe');
      expect(limited).not.toContain('<script>');
      expect(limited).not.toContain('commentaires');
      expect(limited).toContain('...');
    });
  });
});
