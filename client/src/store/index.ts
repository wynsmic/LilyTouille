import { configureStore } from '@reduxjs/toolkit';
import recipeReducer from './recipeSlice';
import jobProgressReducer from './scrapeProgressSlice';
import { scrapeApi } from '../services/scrapeApi';
import { inventApi } from '../services/inventApi';

export const store = configureStore({
  reducer: {
    recipes: recipeReducer,
    jobProgress: jobProgressReducer,
    [scrapeApi.reducerPath]: scrapeApi.reducer,
    [inventApi.reducerPath]: inventApi.reducer,
  },
  middleware: getDefaultMiddleware => getDefaultMiddleware().concat(scrapeApi.middleware, inventApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
