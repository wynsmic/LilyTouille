import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import { useRecipes } from './hooks';
import { HomePage, RecipeDetail, FavoritesPage } from './pages';

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
      </Routes>
    </Router>
  );
};

function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}

export default App;
