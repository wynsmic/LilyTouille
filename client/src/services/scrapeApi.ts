import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

interface ScrapeRequest {
  url: string;
}

interface ScrapeResponse {
  message: string;
  filename: string;
  filePath: string;
}

export const scrapeApi = createApi({
  reducerPath: 'scrapeApi',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  }),
  endpoints: builder => ({
    scrape: builder.mutation<ScrapeResponse, ScrapeRequest>({
      query: body => ({
        url: '/scrape',
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const { useScrapeMutation } = scrapeApi;
