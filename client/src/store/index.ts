import { configureStore } from '@reduxjs/toolkit';
import recipeReducer from './recipeSlice';
import scrapeProgressReducer from './scrapeProgressSlice';
import { scrapeApi } from '../services/scrapeApi';

export const store = configureStore({
  reducer: {
    recipes: recipeReducer,
    scrapeProgress: scrapeProgressReducer,
    [scrapeApi.reducerPath]: scrapeApi.reducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware().concat(scrapeApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
