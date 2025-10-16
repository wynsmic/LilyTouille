export interface ProgressUpdate {
  url: string;
  stage: 'scraped' | 'ai_processed' | 'stored' | 'failed';
  timestamp: number;
  recipeId?: number;
  error?: string;
}
