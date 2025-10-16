import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { useAuth0 } from '@auth0/auth0-react';
import { store } from './store';
import { useRecipes } from './hooks';
import AuthProvider from './auth/AuthProvider';
import { LoginPanel } from './components';
import {
  HomePage,
  RecipeDetail,
  FavoritesPage,
  ScrapeProgressPage,
} from './pages';

const AppContent: React.FC = () => {
  const { fetchRecipes } = useRecipes();

  useEffect(() => {
    // Load recipes using the hook
    fetchRecipes();
  }, [fetchRecipes]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/recipe/:id" element={<RecipeDetail />} />
        <Route path="/favorites" element={<FavoritesPage />} />
        <Route path="/scrape-progress" element={<ScrapeProgressPage />} />
      </Routes>
    </Router>
  );
};

const AuthenticatedApp: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth0();

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          fontSize: 'var(--font-size-lg)',
          color: 'var(--color-gray-600)',
        }}
      >
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPanel />;
  }

  return <AppContent />;
};

function App() {
  return (
    <Provider store={store}>
      <AuthProvider>
        <AuthenticatedApp />
      </AuthProvider>
    </Provider>
  );
}

export default App;
