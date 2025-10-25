import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit';

export interface JobProgress {
  url: string; // For scraping jobs, this is the URL. For invention jobs, this is the task ID.
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

export interface Job {
  id: string;
  url: string; // For scraping jobs, this is the URL. For invention jobs, this is the task ID.
  type: 'scrape' | 'invent';
  title?: string; // For invention jobs, this is the recipe title
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  createdAt: number;
  updatedAt: number;
  progress: JobProgress[];
  recipeId?: number; // Set when stored
}

interface JobProgressState {
  activeJobs: Record<string, Job>;
  completedJobs: Job[];
  failedJobs: Job[];
  isConnected: boolean;
  connectionError: string | null;
}

const initialState: JobProgressState = {
  activeJobs: {},
  completedJobs: [],
  failedJobs: [],
  isConnected: false,
  connectionError: null,
};

const jobProgressSlice = createSlice({
  name: 'jobProgress',
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
    addJob: (
      state,
      action: PayloadAction<{
        id: string;
        url: string;
        type: 'scrape' | 'invent';
        title?: string;
      }>
    ) => {
      const { id, url, type, title } = action.payload;
      const now = Date.now();

      state.activeJobs[id] = {
        id,
        url,
        type,
        title,
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

    updateJobProgress: (state, action: PayloadAction<JobProgress>) => {
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
          type: 'scrape', // Default to scrape for backward compatibility
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
      const progressUpdate: JobProgress = {
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

    // Remove job from active jobs (for cleanup on failure)
    removeJob: (state, action: PayloadAction<string>) => {
      const jobId = action.payload;
      delete state.activeJobs[jobId];
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
  removeJob,
} = jobProgressSlice.actions;

// Base selectors
const selectJobProgressState = (state: { jobProgress: JobProgressState }) =>
  state.jobProgress;

const selectActiveJobsMap = createSelector(
  [selectJobProgressState],
  (jobProgress) => jobProgress.activeJobs
);

const selectCompletedJobsArray = createSelector(
  [selectJobProgressState],
  (jobProgress) => jobProgress.completedJobs
);

const selectFailedJobsArray = createSelector(
  [selectJobProgressState],
  (jobProgress) => jobProgress.failedJobs
);

const selectConnectionInfo = createSelector(
  [selectJobProgressState],
  (jobProgress) => ({
    isConnected: jobProgress.isConnected,
    error: jobProgress.connectionError,
  })
);

// Memoized selectors
export const selectActiveJobs = createSelector(
  [selectActiveJobsMap],
  (activeJobs) => Object.values(activeJobs)
);

export const selectCompletedJobs = selectCompletedJobsArray;

export const selectFailedJobs = selectFailedJobsArray;

export const selectJobById = createSelector(
  [selectActiveJobsMap, selectCompletedJobsArray, selectFailedJobsArray],
  (activeJobs, completedJobs, failedJobs) => (jobId: string) =>
    activeJobs[jobId] ||
    completedJobs.find(job => job.id === jobId) ||
    failedJobs.find(job => job.id === jobId)
);

export const selectConnectionStatus = selectConnectionInfo;

export const selectTotalJobs = createSelector(
  [selectActiveJobsMap, selectCompletedJobsArray, selectFailedJobsArray],
  (activeJobs, completedJobs, failedJobs) => ({
    active: Object.keys(activeJobs).length,
    completed: completedJobs.length,
    failed: failedJobs.length,
  })
);

export default jobProgressSlice.reducer;
