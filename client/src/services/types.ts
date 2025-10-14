export interface ProgressUpdate {
  url: string;
  stage: 'scraped' | 'ai_processed' | 'stored';
  timestamp: number;
}
