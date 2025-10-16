import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ScrapeProgress {
  url: string;
  stage:
    | 'queued'
    | 'scraping'
    | 'scraped'
    | 'ai_processing'
    | 'ai_processed'
    | 'stored'
    | 'failed';
  timestamp: number;
  error?: string;
  progress?: number; // 0-100 percentage
  recipeId?: number;
}

export interface ScrapeJob {
  id: string;
  url: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  createdAt: number;
  updatedAt: number;
  progress: ScrapeProgress[];
  recipeId?: number; // Set when stored
}

interface ScrapeProgressState {
  activeJobs: Record<string, ScrapeJob>;
  completedJobs: ScrapeJob[];
  failedJobs: ScrapeJob[];
  isConnected: boolean;
  connectionError: string | null;
}

const initialState: ScrapeProgressState = {
  activeJobs: {},
  completedJobs: [],
  failedJobs: [],
  isConnected: false,
  connectionError: null,
};

const scrapeProgressSlice = createSlice({
  name: 'scrapeProgress',
  initialState,
  reducers: {
    // WebSocket connection management
    setConnectionStatus: (
      state,
      action: PayloadAction<{ connected: boolean; error?: string }>
    ) => {
      state.isConnected = action.payload.connected;
      state.connectionError = action.payload.error || null;
    },

    // Job management
    addJob: (state, action: PayloadAction<{ id: string; url: string }>) => {
      const { id, url } = action.payload;
      const now = Date.now();

      state.activeJobs[id] = {
        id,
        url,
        status: 'pending',
        createdAt: now,
        updatedAt: now,
        progress: [
          {
            url,
            stage: 'queued',
            timestamp: now,
            progress: 0,
          },
        ],
      };
    },

    updateJobProgress: (state, action: PayloadAction<ScrapeProgress>) => {
      const { url, stage, timestamp, error, progress, recipeId } =
        action.payload;

      // Find the job by URL
      let jobId = Object.keys(state.activeJobs).find(
        id => state.activeJobs[id].url === url
      );

      // If job not found in active jobs, check if it's already finalized
      if (!jobId) {
        const alreadyCompleted = state.completedJobs.find(j => j.url === url);
        const alreadyFailed = state.failedJobs.find(j => j.url === url);
        if (alreadyCompleted || alreadyFailed) {
          return;
        }

        // Create a synthetic job so we can surface the update (e.g., failure)
        const syntheticId = `job-${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)}`;
        const now = timestamp || Date.now();
        state.activeJobs[syntheticId] = {
          id: syntheticId,
          url,
          status: 'pending',
          createdAt: now,
          updatedAt: now,
          progress: [
            {
              url,
              stage: 'queued',
              timestamp: now,
              progress: 0,
            },
          ],
        };
        jobId = syntheticId;
      }

      const job = state.activeJobs[jobId];
      const progressUpdate: ScrapeProgress = {
        url,
        stage,
        timestamp,
        error,
        progress,
        recipeId,
      };

      // Add progress update
      job.progress.push(progressUpdate);
      job.updatedAt = timestamp;

      // Update job status based on stage
      if (stage === 'failed') {
        job.status = 'failed';
        // Move to failed jobs
        state.failedJobs.push(job);
        delete state.activeJobs[jobId];
      } else if (stage === 'stored') {
        job.status = 'completed';
        if (typeof recipeId === 'number') {
          job.recipeId = recipeId;
        }
        // Move to completed jobs
        state.completedJobs.push(job);
        delete state.activeJobs[jobId];
      } else if (stage === 'scraping' || stage === 'ai_processing') {
        job.status = 'in_progress';
      }
    },

    // Cleanup completed jobs (keep only last 50)
    cleanupCompletedJobs: state => {
      if (state.completedJobs.length > 50) {
        state.completedJobs = state.completedJobs
          .sort((a, b) => b.updatedAt - a.updatedAt)
          .slice(0, 50);
      }
    },

    // Cleanup failed jobs (keep only last 20)
    cleanupFailedJobs: state => {
      if (state.failedJobs.length > 20) {
        state.failedJobs = state.failedJobs
          .sort((a, b) => b.updatedAt - a.updatedAt)
          .slice(0, 20);
      }
    },

    // Clear all jobs
    clearAllJobs: state => {
      state.activeJobs = {};
      state.completedJobs = [];
      state.failedJobs = [];
    },

    // Retry failed job
    retryJob: (state, action: PayloadAction<string>) => {
      const jobId = action.payload;
      const failedJob = state.failedJobs.find(job => job.id === jobId);

      if (failedJob) {
        // Remove from failed jobs
        state.failedJobs = state.failedJobs.filter(job => job.id !== jobId);

        // Add back to active jobs with reset status
        const now = Date.now();
        state.activeJobs[jobId] = {
          ...failedJob,
          status: 'pending',
          updatedAt: now,
          progress: [
            {
              url: failedJob.url,
              stage: 'queued',
              timestamp: now,
              progress: 0,
            },
          ],
        };
      }
    },
  },
});

export const {
  setConnectionStatus,
  addJob,
  updateJobProgress,
  cleanupCompletedJobs,
  cleanupFailedJobs,
  clearAllJobs,
  retryJob,
} = scrapeProgressSlice.actions;

// Selectors
export const selectActiveJobs = (state: {
  scrapeProgress: ScrapeProgressState;
}) => Object.values(state.scrapeProgress.activeJobs);

export const selectCompletedJobs = (state: {
  scrapeProgress: ScrapeProgressState;
}) => state.scrapeProgress.completedJobs;

export const selectFailedJobs = (state: {
  scrapeProgress: ScrapeProgressState;
}) => state.scrapeProgress.failedJobs;

export const selectJobById = (
  state: { scrapeProgress: ScrapeProgressState },
  jobId: string
) =>
  state.scrapeProgress.activeJobs[jobId] ||
  state.scrapeProgress.completedJobs.find(job => job.id === jobId) ||
  state.scrapeProgress.failedJobs.find(job => job.id === jobId);

export const selectConnectionStatus = (state: {
  scrapeProgress: ScrapeProgressState;
}) => ({
  isConnected: state.scrapeProgress.isConnected,
  error: state.scrapeProgress.connectionError,
});

export const selectTotalJobs = (state: {
  scrapeProgress: ScrapeProgressState;
}) => ({
  active: Object.keys(state.scrapeProgress.activeJobs).length,
  completed: state.scrapeProgress.completedJobs.length,
  failed: state.scrapeProgress.failedJobs.length,
});

export default scrapeProgressSlice.reducer;
