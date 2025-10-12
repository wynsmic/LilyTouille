import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider, useDispatch } from 'react-redux';
import { store } from './store';
import { setRecipes } from './store/recipeSlice';
import { recipes } from './data/recipes';
import HomePage from './pages/HomePage';
import RecipeDetail from './pages/RecipeDetail';

const AppContent: React.FC = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    // Load dummy data into Redux store
    dispatch(setRecipes(recipes));
  }, [dispatch]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/recipe/:id" element={<RecipeDetail />} />
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
