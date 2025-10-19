import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useParams, useNavigate } from 'react-router-dom';
import { useRecipes } from '../hooks';
import { useRecipeQuery } from '../hooks/useRecipeQueries';
import { Recipe } from '../services/api';
import Layout from '../components/Layout';
import { motion, AnimatePresence } from 'framer-motion';

const Container = styled.div`
  max-width: 64rem;
  margin: 0 auto;
  padding: 0 var(--space-4);
  padding-top: var(--space-8);
  padding-bottom: var(--space-8);
`;

const NotFoundContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 24rem;
`;

const NotFoundContent = styled.div`
  text-align: center;
`;

const NotFoundTitle = styled.h1`
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-gray-900);
  margin-bottom: var(--space-4);
`;

const BackButton = styled.button`
  background-color: var(--color-primary-500);
  color: var(--color-white);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
  border: none;
  cursor: pointer;
  transition: background-color var(--transition-fast);

  &:hover {
    background-color: var(--color-primary-600);
  }
`;

const BackButtonContainer = styled.div`
  margin-bottom: var(--space-6);
`;

const BackButtonLink = styled.button`
  display: flex;
  align-items: center;
  color: var(--color-primary-600);
  background: none;
  border: none;
  cursor: pointer;
  margin-bottom: var(--space-4);
  transition: color var(--transition-fast);

  &:hover {
    color: var(--color-primary-800);
  }
`;

const BackIcon = styled.svg`
  width: 1.25rem;
  height: 1.25rem;
  margin-right: var(--space-2);
`;

const RecipeCard = styled.div`
  background-color: var(--color-white);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
`;

const ImageContainer = styled.div`
  position: relative;
  height: 16rem;
  overflow: hidden;

  @media (min-width: 768px) {
    height: 20rem;
  }
`;

const RecipeImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
`;

const ImageOverlay = styled.div`
  position: absolute;
  top: var(--space-4);
  right: var(--space-4);
  display: flex;
  gap: var(--space-2);
`;

const FavoriteButton = styled.button<{ $isFavorite: boolean }>`
  padding: var(--space-2);
  border-radius: var(--radius-full);
  transition: all var(--transition-fast);
  background-color: ${props =>
    props.$isFavorite ? '#ef4444' : 'var(--color-white)'};
  color: ${props =>
    props.$isFavorite ? 'var(--color-white)' : 'var(--color-gray-400)'};
  border: none;
  cursor: pointer;

  &:hover {
    background-color: ${props => (props.$isFavorite ? '#dc2626' : '#fef2f2')};
    color: ${props => (props.$isFavorite ? 'var(--color-white)' : '#ef4444')};
  }
`;

const FavoriteIcon = styled.svg`
  width: 1.25rem;
  height: 1.25rem;
`;

const DifficultyBadge = styled.span<{ $difficulty: string }>`
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  background-color: ${props =>
    props.$difficulty === 'easy'
      ? 'var(--color-green-100)'
      : props.$difficulty === 'medium'
        ? 'var(--color-yellow-100)'
        : 'var(--color-red-100)'};
  color: ${props =>
    props.$difficulty === 'easy'
      ? 'var(--color-green-800)'
      : props.$difficulty === 'medium'
        ? 'var(--color-yellow-800)'
        : 'var(--color-red-800)'};
`;

const ContentContainer = styled.div`
  padding: var(--space-6);

  @media (min-width: 768px) {
    padding: var(--space-8);
  }
`;

const TitleSection = styled.div`
  margin-bottom: var(--space-6);
`;

const RecipeTitle = styled.h1`
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-gray-900);
  margin-bottom: var(--space-3);
`;

const RecipeDescription = styled.p`
  color: var(--color-gray-600);
  font-size: var(--font-size-lg);
`;

const TagsSection = styled.div`
  margin-bottom: var(--space-6);
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
`;

const Tag = styled.span`
  padding: var(--space-1) var(--space-3);
  background-color: var(--color-primary-100);
  color: var(--color-primary-800);
  font-size: var(--font-size-sm);
  border-radius: var(--radius-full);
`;

const IngredientsSection = styled.div`
  margin-bottom: var(--space-8);
`;

const SectionTitle = styled.h2`
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-gray-900);
  margin-bottom: var(--space-4);
`;

const IngredientsList = styled.div`
  background-color: var(--color-gray-50);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  margin-bottom: var(--space-6);
`;

const IngredientsUl = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const IngredientItem = styled.li`
  display: flex;
  align-items: flex-start;
  margin-bottom: var(--space-3);

  &:last-child {
    margin-bottom: 0;
  }
`;

const IngredientBullet = styled.span`
  width: 0.5rem;
  height: 0.5rem;
  background-color: var(--color-primary-500);
  border-radius: var(--radius-full);
  margin-top: 0.5rem;
  margin-right: var(--space-3);
  flex-shrink: 0;
`;

const IngredientText = styled.span`
  color: var(--color-gray-700);
`;

const MetadataGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(1, minmax(0, 1fr));
  gap: var(--space-4);

  @media (min-width: 768px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
`;

const MetadataCard = styled.div`
  background-color: var(--color-white);
  border: 1px solid var(--color-gray-200);
  padding: var(--space-4);
  border-radius: var(--radius-lg);
  text-align: center;
`;

const MetadataValue = styled.div`
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary-600);
`;

const MetadataLabel = styled.div`
  font-size: var(--font-size-sm);
  color: var(--color-gray-600);
`;

const InstructionsSection = styled.div``;

const InstructionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
`;

const InstructionItem = styled.div`
  display: flex;
  align-items: flex-start;
  padding: var(--space-4);
  background-color: var(--color-gray-50);
  border-radius: var(--radius-lg);
`;

const InstructionNumber = styled.span`
  background-color: var(--color-primary-500);
  color: var(--color-white);
  border-radius: var(--radius-full);
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  margin-right: var(--space-4);
  flex-shrink: 0;
`;

const InstructionText = styled.span`
  color: var(--color-gray-700);
  line-height: 1.625;
`;

const RecipeStepsSection = styled.div`
  margin-top: var(--space-8);
`;

const RecipeStepsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
`;

const RecipeStepItem = styled.div<{ $type: 'text' | 'image' }>`
  ${props =>
    props.$type === 'text' &&
    `
    padding: var(--space-2) var(--space-4);
    background-color: var(--color-gray-50);
    border-radius: var(--radius-lg);
    color: var(--color-gray-700);
    line-height: 1.625;
  `}

  ${props =>
    props.$type === 'image' &&
    `
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-3);
  `}
`;

const RecipeStepImage = styled.img`
  width: 100%;
  max-width: 32rem;
  height: auto;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
`;

const RecipeStepImageCaption = styled.p`
  color: var(--color-gray-600);
  font-size: var(--font-size-sm);
  text-align: center;
  font-style: italic;
`;

const SourceUrlButton = styled.a`
  display: inline-flex;
  align-items: center;
  padding: var(--space-2) var(--space-4);
  background-color: var(--color-primary-100);
  color: var(--color-primary-700);
  text-decoration: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  transition: all var(--transition-fast);
  margin-bottom: var(--space-4);

  &:hover {
    background-color: var(--color-primary-200);
    color: var(--color-primary-800);
    text-decoration: none;
  }
`;

const SourceUrlIcon = styled.svg`
  width: 1rem;
  height: 1rem;
  margin-right: var(--space-2);
`;

const RecipePartSection = styled.div`
  margin-bottom: var(--space-8);
`;

const PartTitle = styled.h3`
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-gray-900);
  margin-bottom: var(--space-4);
  padding-bottom: var(--space-2);
  border-bottom: 2px solid var(--color-primary-200);
`;

const PartDescription = styled.p`
  color: var(--color-gray-600);
  font-size: var(--font-size-base);
  margin-bottom: var(--space-4);
`;

const PartIngredientsList = styled.div`
  background-color: var(--color-gray-50);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  margin-bottom: var(--space-4);
`;

const PartIngredientsUl = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const PartIngredientItem = styled.li`
  display: flex;
  align-items: flex-start;
  margin-bottom: var(--space-2);

  &:last-child {
    margin-bottom: 0;
  }
`;

const PartIngredientBullet = styled.span`
  width: 0.5rem;
  height: 0.5rem;
  background-color: var(--color-primary-500);
  border-radius: var(--radius-full);
  margin-top: 0.5rem;
  margin-right: var(--space-3);
  flex-shrink: 0;
`;

const PartIngredientText = styled.span`
  color: var(--color-gray-700);
  font-size: var(--font-size-sm);
`;

const PartStepsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
`;

const PartStepItem = styled.div<{ $type: 'text' | 'image' }>`
  ${props =>
    props.$type === 'text' &&
    `
    padding: var(--space-3);
    background-color: var(--color-gray-50);
    border-radius: var(--radius-lg);
    color: var(--color-gray-700);
    line-height: 1.625;
    font-size: var(--font-size-sm);
  `}

  ${props =>
    props.$type === 'image' &&
    `
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-2);
  `}
`;

const PartStepImage = styled.img`
  width: 100%;
  max-width: 24rem;
  height: auto;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
`;

const PartStepImageCaption = styled.p`
  color: var(--color-gray-600);
  font-size: var(--font-size-xs);
  text-align: center;
  font-style: italic;
`;

const IngredientsNote = styled.div`
  background-color: var(--color-blue-50);
  border: 1px solid var(--color-blue-200);
  border-radius: var(--radius-md);
  padding: var(--space-3);
  margin-bottom: var(--space-4);
  font-size: var(--font-size-sm);
  color: var(--color-blue-800);
  text-align: center;
`;

const FloatingButton = styled.div`
  position: fixed;
  bottom: var(--space-6);
  right: var(--space-6);
  z-index: 50;
`;

const FloatingButtonElement = styled.button`
  background-color: var(--color-primary-500);
  color: var(--color-white);
  padding: var(--space-4);
  border-radius: var(--radius-full);
  box-shadow: var(--shadow-lg);
  border: none;
  cursor: pointer;
  transition: background-color var(--transition-fast);

  &:hover {
    background-color: var(--color-primary-600);
  }
`;

const FloatingIcon = styled.svg`
  width: 1.5rem;
  height: 1.5rem;
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  padding: var(--space-4);
`;

const ModalContent = styled.div`
  background-color: var(--color-white);
  border-radius: var(--radius-lg);
  max-width: 28rem;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
`;

const ModalHeader = styled.div`
  padding: var(--space-6);
`;

const ModalHeaderContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-4);
`;

const ModalTitle = styled.h3`
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-gray-900);
`;

const CloseButton = styled.button`
  color: var(--color-gray-400);
  background: none;
  border: none;
  cursor: pointer;
  transition: color var(--transition-fast);

  &:hover {
    color: var(--color-gray-600);
  }
`;

const CloseIcon = styled.svg`
  width: 1.5rem;
  height: 1.5rem;
`;

const ModalIngredients = styled.div`
  margin-bottom: var(--space-6);
`;

const ModalIngredientsTitle = styled.h4`
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-gray-900);
  margin-bottom: var(--space-3);
`;

const ModalIngredientsList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
`;

const ModalIngredientItem = styled.li`
  display: flex;
  align-items: flex-start;
`;

const ModalIngredientBullet = styled.span`
  width: 0.5rem;
  height: 0.5rem;
  background-color: var(--color-primary-500);
  border-radius: var(--radius-full);
  margin-top: 0.5rem;
  margin-right: var(--space-3);
  flex-shrink: 0;
`;

const ModalIngredientText = styled.span`
  color: var(--color-gray-700);
  font-size: var(--font-size-sm);
`;

const ModalMetadataGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-3);
`;

const ModalMetadataCard = styled.div`
  background-color: var(--color-gray-50);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  text-align: center;
`;

const ModalMetadataValue = styled.div`
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary-600);
`;

const ModalMetadataLabel = styled.div`
  font-size: var(--font-size-xs);
  color: var(--color-gray-600);
`;

const RecipeDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toggleFavoriteRecipe, isFavorite } = useRecipes();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch recipe directly from API instead of using cached data
  const recipeId = parseInt(id || '0');
  const { data: recipe, isLoading, error } = useRecipeQuery(recipeId);

  const isRecipeFavorite = recipe ? isFavorite(recipe.id.toString()) : false;

  // Helper function to get all ingredients from main recipe and parts
  const getAllIngredients = (recipe: Recipe): string[] => {
    const allIngredients = [...recipe.ingredients];

    if (recipe.isChunked && recipe.parts) {
      recipe.parts.forEach(part => {
        allIngredients.push(...part.ingredients);
      });
    }

    // Remove duplicates while preserving order
    return Array.from(new Set(allIngredients));
  };

  const allIngredients = recipe ? getAllIngredients(recipe) : [];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 200);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle loading state
  if (isLoading) {
    return (
      <Layout>
        <Container>
          <div>Loading recipe...</div>
        </Container>
      </Layout>
    );
  }

  // Handle error state
  if (error || !recipe) {
    return (
      <Layout>
        <NotFoundContainer>
          <NotFoundContent>
            <NotFoundTitle>Recipe not found</NotFoundTitle>
            <BackButton onClick={() => navigate('/')}>
              Back to Recipes
            </BackButton>
          </NotFoundContent>
        </NotFoundContainer>
      </Layout>
    );
  }

  const totalTime = recipe.prepTime + recipe.cookTime;

  return (
    <Layout>
      <Container>
        <BackButtonContainer>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <BackButtonLink onClick={() => navigate('/')}>
              <BackIcon fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </BackIcon>
              Back to Recipes
            </BackButtonLink>
          </motion.div>
        </BackButtonContainer>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <RecipeCard>
            <ImageContainer>
              <motion.div
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.8 }}
              >
                <RecipeImage src={recipe.imageUrl} alt={recipe.title} />
              </motion.div>
              <ImageOverlay>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                >
                  <FavoriteButton
                    onClick={() => toggleFavoriteRecipe(recipe.id.toString())}
                    $isFavorite={isRecipeFavorite}
                    aria-label={
                      isRecipeFavorite
                        ? 'Remove from favorites'
                        : 'Add to favorites'
                    }
                    as={motion.button}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FavoriteIcon
                      fill={isRecipeFavorite ? 'currentColor' : 'none'}
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </FavoriteIcon>
                  </FavoriteButton>
                  <DifficultyBadge $difficulty={recipe.difficulty}>
                    {recipe.difficulty}
                  </DifficultyBadge>
                </motion.div>
              </ImageOverlay>
            </ImageContainer>

            <ContentContainer>
              <TitleSection>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                >
                  <RecipeTitle>{recipe.title}</RecipeTitle>
                  <RecipeDescription>{recipe.description}</RecipeDescription>
                  {recipe.sourceUrl && (
                    <SourceUrlButton
                      href={recipe.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <SourceUrlIcon
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </SourceUrlIcon>
                      View Original Recipe
                    </SourceUrlButton>
                  )}
                </motion.div>
              </TitleSection>

              <TagsSection>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                >
                  <TagsContainer>
                    {recipe.tags.map((tag, index) => (
                      <motion.div
                        key={tag}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4 + index * 0.1, duration: 0.4 }}
                      >
                        <Tag>{tag}</Tag>
                      </motion.div>
                    ))}
                  </TagsContainer>
                </motion.div>
              </TagsSection>

              <IngredientsSection>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                >
                  <SectionTitle>Ingredients</SectionTitle>
                  {recipe.isChunked &&
                    recipe.parts &&
                    recipe.parts.length > 0 && (
                      <IngredientsNote>
                        📋 Combined ingredients from all recipe parts
                      </IngredientsNote>
                    )}
                  <IngredientsList>
                    <IngredientsUl>
                      {allIngredients.map((ingredient, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{
                            delay: 0.5 + index * 0.1,
                            duration: 0.4,
                          }}
                        >
                          <IngredientItem>
                            <IngredientBullet />
                            <IngredientText>{ingredient}</IngredientText>
                          </IngredientItem>
                        </motion.div>
                      ))}
                    </IngredientsUl>
                  </IngredientsList>

                  <MetadataGrid>
                    <MetadataCard>
                      <MetadataValue>{totalTime}</MetadataValue>
                      <MetadataLabel>Total Time (min)</MetadataLabel>
                    </MetadataCard>
                    <MetadataCard>
                      <MetadataValue>{recipe.servings}</MetadataValue>
                      <MetadataLabel>Servings</MetadataLabel>
                    </MetadataCard>
                    <MetadataCard>
                      <MetadataValue>{recipe.difficulty}</MetadataValue>
                      <MetadataLabel>Difficulty</MetadataLabel>
                    </MetadataCard>
                  </MetadataGrid>
                </motion.div>
              </IngredientsSection>

              <InstructionsSection>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.6 }}
                >
                  <SectionTitle>Overview</SectionTitle>
                  <InstructionsContainer>
                    {recipe.overview.map((instruction, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.7 + index * 0.1, duration: 0.4 }}
                      >
                        <InstructionItem>
                          <InstructionNumber>{index + 1}</InstructionNumber>
                          <InstructionText>{instruction}</InstructionText>
                        </InstructionItem>
                      </motion.div>
                    ))}
                  </InstructionsContainer>
                </motion.div>
              </InstructionsSection>

              <RecipeStepsSection>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8, duration: 0.6 }}
                >
                  <SectionTitle>Recipe Steps</SectionTitle>
                  <RecipeStepsContainer>
                    {recipe.recipeSteps.map((step, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.9 + index * 0.1, duration: 0.4 }}
                      >
                        <RecipeStepItem $type={step.type}>
                          {step.type === 'text' ? (
                            <span>{step.content}</span>
                          ) : (
                            <>
                              <RecipeStepImage
                                src={step.imageUrl}
                                alt={step.content}
                              />
                              <RecipeStepImageCaption>
                                {step.content}
                              </RecipeStepImageCaption>
                            </>
                          )}
                        </RecipeStepItem>
                      </motion.div>
                    ))}
                  </RecipeStepsContainer>
                </motion.div>
              </RecipeStepsSection>

              {/* Chunked Recipe Parts */}
              {recipe.isChunked && recipe.parts && recipe.parts.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.0, duration: 0.6 }}
                >
                  <SectionTitle>Recipe Parts</SectionTitle>
                  {recipe.parts.map((part, partIndex) => (
                    <motion.div
                      key={partIndex}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        delay: 1.1 + partIndex * 0.1,
                        duration: 0.4,
                      }}
                    >
                      <RecipePartSection>
                        <PartTitle>{part.title}</PartTitle>
                        {part.description && (
                          <PartDescription>{part.description}</PartDescription>
                        )}

                        {part.ingredients && part.ingredients.length > 0 && (
                          <PartIngredientsList>
                            <PartIngredientsUl>
                              {part.ingredients.map(
                                (ingredient, ingredientIndex) => (
                                  <PartIngredientItem key={ingredientIndex}>
                                    <PartIngredientBullet />
                                    <PartIngredientText>
                                      {ingredient}
                                    </PartIngredientText>
                                  </PartIngredientItem>
                                )
                              )}
                            </PartIngredientsUl>
                          </PartIngredientsList>
                        )}

                        {part.recipeSteps && part.recipeSteps.length > 0 && (
                          <PartStepsContainer>
                            {part.recipeSteps.map((step, stepIndex) => (
                              <PartStepItem key={stepIndex} $type={step.type}>
                                {step.type === 'text' ? (
                                  <span>{step.content}</span>
                                ) : (
                                  <>
                                    <PartStepImage
                                      src={step.imageUrl}
                                      alt={step.content}
                                    />
                                    <PartStepImageCaption>
                                      {step.content}
                                    </PartStepImageCaption>
                                  </>
                                )}
                              </PartStepItem>
                            ))}
                          </PartStepsContainer>
                        )}
                      </RecipePartSection>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </ContentContainer>
          </RecipeCard>
        </motion.div>

        <AnimatePresence>
          {isScrolled && (
            <FloatingButton>
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 20 }}
                transition={{ duration: 0.3 }}
              >
                <motion.button
                  onClick={() => setIsModalOpen(true)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FloatingButtonElement>
                    <FloatingIcon
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </FloatingIcon>
                  </FloatingButtonElement>
                </motion.button>
              </motion.div>
            </FloatingButton>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isModalOpen && (
            <ModalOverlay
              as={motion.div}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.3 }}
                onClick={e => e.stopPropagation()}
              >
                <ModalContent>
                  <ModalHeader>
                    <ModalHeaderContent>
                      <ModalTitle>Recipe Info</ModalTitle>
                      <CloseButton onClick={() => setIsModalOpen(false)}>
                        <CloseIcon
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </CloseIcon>
                      </CloseButton>
                    </ModalHeaderContent>

                    <ModalIngredients>
                      <ModalIngredientsTitle>Ingredients</ModalIngredientsTitle>
                      {recipe.isChunked &&
                        recipe.parts &&
                        recipe.parts.length > 0 && (
                          <IngredientsNote>
                            📋 Combined ingredients from all recipe parts
                          </IngredientsNote>
                        )}
                      <ModalIngredientsList>
                        {allIngredients.map((ingredient, index) => (
                          <ModalIngredientItem key={index}>
                            <ModalIngredientBullet />
                            <ModalIngredientText>
                              {ingredient}
                            </ModalIngredientText>
                          </ModalIngredientItem>
                        ))}
                      </ModalIngredientsList>
                    </ModalIngredients>

                    <ModalMetadataGrid>
                      <ModalMetadataCard>
                        <ModalMetadataValue>{totalTime}</ModalMetadataValue>
                        <ModalMetadataLabel>Total Time</ModalMetadataLabel>
                      </ModalMetadataCard>
                      <ModalMetadataCard>
                        <ModalMetadataValue>
                          {recipe.servings}
                        </ModalMetadataValue>
                        <ModalMetadataLabel>Servings</ModalMetadataLabel>
                      </ModalMetadataCard>
                      <ModalMetadataCard>
                        <ModalMetadataValue>
                          {recipe.difficulty}
                        </ModalMetadataValue>
                        <ModalMetadataLabel>Difficulty</ModalMetadataLabel>
                      </ModalMetadataCard>
                    </ModalMetadataGrid>
                  </ModalHeader>
                </ModalContent>
              </motion.div>
            </ModalOverlay>
          )}
        </AnimatePresence>
      </Container>
    </Layout>
  );
};

export default RecipeDetail;
