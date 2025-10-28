import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

interface ScrapeRequest {
  url: string;
}

interface QueueScrapeRequest extends ScrapeRequest {
  token?: string;
}

interface ScrapeResponse {
  message: string;
  filename: string;
  filePath: string;
}

interface QueueScrapeResponse {
  message: string;
  url: string;
}

interface QueueStatusResponse {
  processing: number;
  ai: number;
  timestamp: number;
}

export const scrapeApi = createApi({
  reducerPath: 'scrapeApi',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  }),
  tagTypes: ['QueueStatus'],
  endpoints: builder => ({
    scrape: builder.mutation<ScrapeResponse, ScrapeRequest>({
      query: body => ({
        url: '/scrape',
        method: 'POST',
        body,
      }),
    }),
    queueScrape: builder.mutation<QueueScrapeResponse, QueueScrapeRequest>({
      query: ({ token, ...body }) => ({
        url: '/scrape/queue',
        method: 'POST',
        body,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      }),
      invalidatesTags: ['QueueStatus'],
    }),
    getQueueStatus: builder.query<QueueStatusResponse, void>({
      query: () => '/scrape/queue/status',
      providesTags: ['QueueStatus'],
    }),
  }),
});

export const { useScrapeMutation, useQueueScrapeMutation, useGetQueueStatusQuery } = scrapeApi;
