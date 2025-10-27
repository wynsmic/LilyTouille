import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

@Injectable()
export class ScraperService {
  private readonly outputDir = path.resolve(__dirname, '..', 'data', 'scrapes');

  async fetchAndStore(
    url: string,
  ): Promise<{ filename: string; filePath: string }> {
    try {
      await mkdir(this.outputDir, { recursive: true });

      const response = await fetch(url, { redirect: 'follow' });
      if (!response.ok) {
        throw new Error(`Fetch failed with status ${response.status}`);
      }

      const html = await response.text();

      const safeName = this.buildSafeFilename(url);
      const filename = `${safeName}.html`;
      const filePath = path.join(this.outputDir, filename);

      await writeFile(filePath, html, 'utf-8');

      return { filename, filePath };
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to scrape and store the page',
      );
    }
  }

  private buildSafeFilename(url: string): string {
    try {
      const u = new URL(url);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const pathPart =
        u.pathname.replace(/\/+$/, '').replace(/\//g, '_') || 'root';
      const queryHash = u.search ? this.hashString(u.search) : 'noquery';
      return `${u.hostname}${pathPart ? `_${  pathPart}` : ''}_${queryHash}_${timestamp}`
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .slice(0, 200);
    } catch {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      return `scrape_${timestamp}`;
    }
  }

  private hashString(input: string): string {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const chr = input.charCodeAt(i);
      hash = (hash << 5) - hash + chr;
      hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }
}
