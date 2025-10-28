import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRecipes } from '../hooks';
import { useUser } from '../contexts/useUser';
import { useRecipeQuery } from '../hooks/useRecipeQueries';
import { Recipe, recipeApi } from '../services/api';
import Layout from '../components/Layout';
import { RecipeValidationModal, ScrapeRecipeModal } from '../components';
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
  height: 20rem;
  overflow: hidden;

  @media (min-width: 768px) {
    height: 28rem;
  }
`;

const RecipeImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: 50% 75%;
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
  background-color: ${props => (props.$isFavorite ? '#ef4444' : 'var(--color-white)')};
  color: ${props => (props.$isFavorite ? 'var(--color-white)' : 'var(--color-gray-400)')};
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
  const { getAccessTokenSilently } = useAuth0();
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isValidationModalOpen, setIsValidationModalOpen] = useState(false);
  const [isScrapeModalOpen, setIsScrapeModalOpen] = useState(false);

  // Fetch recipe directly from API instead of using cached data
  const recipeId = parseInt(id || '0');
  const { data: recipe, isLoading, error } = useRecipeQuery(recipeId);

  const isRecipeFavorite = recipe ? isFavorite(recipe.id.toString()) : false;

  // Check if user is the owner and recipe needs validation
  const needsValidation =
    !!recipe && !recipe.validatedAt && (recipe.ownerUserId == null || (!!user && user.id === recipe.ownerUserId));

  // Show validation modal when recipe loads and needs validation (only once)
  useEffect(() => {
    if (!isLoading) {
      setIsValidationModalOpen(needsValidation);
    }
  }, [needsValidation, isLoading]);

  // Validate recipe mutation
  const validateMutation = useMutation({
    mutationFn: async (recipeId: number) => {
      const token = await getAccessTokenSilently();
      await recipeApi.validateRecipe(recipeId, token);
    },
    onSuccess: () => {
      setIsValidationModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['recipe', recipeId] });
    },
  });

  // Delete recipe mutation
  const deleteMutation = useMutation({
    mutationFn: async (recipeId: number) => {
      const token = await getAccessTokenSilently();
      await recipeApi.deleteRecipe(recipeId, token);
    },
    onSuccess: () => {
      navigate('/');
    },
  });

  // Validation handlers
  const handleValidate = () => {
    validateMutation.mutate(recipeId);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this recipe?')) {
      deleteMutation.mutate(recipeId);
    }
  };

  // Validation modal is persistent until validated; no separate cancel handler needed

  // Helper function to get ingredients grouped by chunk
  const getIngredientsByChunk = (recipe: Recipe): { chunkTitle?: string; ingredients: string[] }[] => {
    if (!recipe.chunks || recipe.chunks.length === 0) {
      return [];
    }

    return recipe.chunks.map(chunk => ({
      chunkTitle: recipe.chunks.length > 1 ? chunk.title : undefined,
      ingredients: chunk.ingredients,
    }));
  };

  const ingredientsByChunk = recipe ? getIngredientsByChunk(recipe) : [];

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
            <BackButton onClick={() => navigate('/')}>Back to Recipes</BackButton>
          </NotFoundContent>
        </NotFoundContainer>
      </Layout>
    );
  }

  const totalTime = recipe.totalPrepTime + recipe.totalCookTime;

  return (
    <Layout>
      <Container>
        <BackButtonContainer>
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
            <BackButtonLink onClick={() => navigate('/')}>
              <BackIcon fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </BackIcon>
              Back to Recipes
            </BackButtonLink>
          </motion.div>
        </BackButtonContainer>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <RecipeCard>
            <ImageContainer>
              <motion.div
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.8 }}
                style={{ width: '100%', height: '100%' }}
              >
                <RecipeImage src={recipe.imageUrl} alt={recipe.title} style={{ objectPosition: '50% 50%' }} />
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
                    aria-label={isRecipeFavorite ? 'Remove from favorites' : 'Add to favorites'}
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
                  <DifficultyBadge $difficulty={recipe.difficulty}>{recipe.difficulty}</DifficultyBadge>
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
                    <SourceUrlButton href={recipe.sourceUrl} target="_blank" rel="noopener noreferrer">
                      <SourceUrlIcon fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  {ingredientsByChunk.map((chunkGroup, chunkIndex) => (
                    <motion.div
                      key={chunkIndex}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        delay: 0.5 + chunkIndex * 0.1,
                        duration: 0.4,
                      }}
                    >
                      {chunkGroup.chunkTitle && (
                        <h3
                          style={{
                            fontSize: 'var(--font-size-lg)',
                            fontWeight: 'var(--font-weight-semibold)',
                            color: 'var(--color-gray-900)',
                            marginBottom: 'var(--space-3)',
                            marginTop: chunkIndex > 0 ? 'var(--space-6)' : '0',
                          }}
                        >
                          {chunkGroup.chunkTitle}
                        </h3>
                      )}
                      <IngredientsList>
                        <IngredientsUl>
                          {chunkGroup.ingredients.map((ingredient, ingredientIndex) => (
                            <motion.div
                              key={ingredientIndex}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{
                                delay: 0.6 + chunkIndex * 0.1 + ingredientIndex * 0.05,
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
                    </motion.div>
                  ))}

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

              {/* Recipe Chunks */}
              {recipe.chunks && recipe.chunks.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8, duration: 0.6 }}
                >
                  {recipe.chunks.map((chunk, chunkIndex) => (
                    <motion.div
                      key={chunkIndex}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        delay: 0.9 + chunkIndex * 0.1,
                        duration: 0.4,
                      }}
                    >
                      <RecipePartSection>
                        <PartTitle>{chunk.title}</PartTitle>
                        {chunk.description && <PartDescription>{chunk.description}</PartDescription>}

                        {chunk.recipeSteps && chunk.recipeSteps.length > 0 && (
                          <PartStepsContainer>
                            {chunk.recipeSteps.map((step, stepIndex) => (
                              <PartStepItem key={stepIndex} $type={step.type}>
                                {step.type === 'text' ? (
                                  <span>{step.content}</span>
                                ) : (
                                  <>
                                    <PartStepImage src={step.imageUrl} alt={step.content} />
                                    <PartStepImageCaption>{step.content}</PartStepImageCaption>
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
                onClick={() => setIsModalOpen(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{ cursor: 'pointer' }}
              >
                <FloatingButtonElement as="div">
                  <FloatingIcon fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                    />
                  </FloatingIcon>
                </FloatingButtonElement>
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
                        <CloseIcon fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </CloseIcon>
                      </CloseButton>
                    </ModalHeaderContent>

                    <ModalIngredients>
                      <ModalIngredientsTitle>Ingredients</ModalIngredientsTitle>
                      {ingredientsByChunk.map((chunkGroup, chunkIndex) => (
                        <div key={chunkIndex}>
                          {chunkGroup.chunkTitle && (
                            <h4
                              style={{
                                fontSize: 'var(--font-size-base)',
                                fontWeight: 'var(--font-weight-semibold)',
                                color: 'var(--color-gray-900)',
                                marginBottom: 'var(--space-2)',
                                marginTop: chunkIndex > 0 ? 'var(--space-4)' : '0',
                              }}
                            >
                              {chunkGroup.chunkTitle}
                            </h4>
                          )}
                          <ModalIngredientsList>
                            {chunkGroup.ingredients.map((ingredient, ingredientIndex) => (
                              <ModalIngredientItem key={ingredientIndex}>
                                <ModalIngredientBullet />
                                <ModalIngredientText>{ingredient}</ModalIngredientText>
                              </ModalIngredientItem>
                            ))}
                          </ModalIngredientsList>
                        </div>
                      ))}
                    </ModalIngredients>

                    <ModalMetadataGrid>
                      <ModalMetadataCard>
                        <ModalMetadataValue>{totalTime}</ModalMetadataValue>
                        <ModalMetadataLabel>Total Time</ModalMetadataLabel>
                      </ModalMetadataCard>
                      <ModalMetadataCard>
                        <ModalMetadataValue>{recipe.servings}</ModalMetadataValue>
                        <ModalMetadataLabel>Servings</ModalMetadataLabel>
                      </ModalMetadataCard>
                      <ModalMetadataCard>
                        <ModalMetadataValue>{recipe.difficulty}</ModalMetadataValue>
                        <ModalMetadataLabel>Difficulty</ModalMetadataLabel>
                      </ModalMetadataCard>
                    </ModalMetadataGrid>
                  </ModalHeader>
                </ModalContent>
              </motion.div>
            </ModalOverlay>
          )}
        </AnimatePresence>

        {/* Recipe Validation Modal */}
        {recipe && (
          <RecipeValidationModal
            open={isValidationModalOpen}
            recipe={{
              id: recipe.id,
              title: recipe.title,
              description: recipe.description,
              imageUrl: recipe.imageUrl,
            }}
            onValidate={handleValidate}
            onCancel={() => {}}
            onDelete={handleDelete}
            onRetry={() => {
              if (recipe.sourceUrl) {
                setIsScrapeModalOpen(true);
              } else {
                alert('No source URL available to retry scraping.');
              }
            }}
            isLoading={validateMutation.isPending || deleteMutation.isPending}
          />
        )}

        {/* Scrape Modal for Retry - auto starts with the same URL */}
        <ScrapeRecipeModal
          open={isScrapeModalOpen}
          onClose={() => setIsScrapeModalOpen(false)}
          initialUrl={recipe?.sourceUrl}
          autoStart={true}
        />
      </Container>
    </Layout>
  );
};

export default RecipeDetail;
