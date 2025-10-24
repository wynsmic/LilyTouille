import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useInventProgress } from '../hooks/useInventProgress';
import { RecipeDifficulty } from '../services/inventApi';
import AnimationIcon from './AnimationIcon';

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const Modal = styled.div`
  background: white;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  border-radius: 24px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(10px);
  overflow: hidden;
`;

const Header = styled.div`
  padding: 20px 24px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-align: center;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
    opacity: 0.3;
  }
`;

const Content = styled.div`
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-height: calc(90vh - 80px);
  overflow-y: auto;
`;

const TextArea = styled.textarea<{ $disabled?: boolean }>`
  width: 100%;
  padding: 16px;
  border: 2px solid #e2e8f0;
  border-radius: 16px;
  background: #f8fafc;
  color: #1e293b;
  cursor: ${props => (props.$disabled ? 'not-allowed' : 'text')};
  resize: vertical;
  min-height: 120px;
  font-size: 16px;
  font-family: inherit;
  transition: all 0.2s ease;
  outline: none;

  &:focus {
    border-color: #667eea;
    background: white;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }

  &:hover:not(:disabled) {
    border-color: #cbd5e1;
  }

  &::placeholder {
    color: #94a3b8;
  }
`;

const SliderContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
`;

const SliderLabel = styled.label`
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Slider = styled.input`
  width: 100%;
  height: 8px;
  border-radius: 4px;
  background: #e2e8f0;
  outline: none;
  -webkit-appearance: none;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #667eea;
    cursor: pointer;
    box-shadow: 0 2px 6px rgba(102, 126, 234, 0.3);
    transition: all 0.2s ease;
  }

  &::-webkit-slider-thumb:hover {
    transform: scale(1.1);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  }

  &::-moz-range-thumb {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #667eea;
    cursor: pointer;
    border: none;
    box-shadow: 0 2px 6px rgba(102, 126, 234, 0.3);
  }
`;

const CheckboxGroup = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  gap: 4px;
`;

const CheckboxItem = styled.label<{ $checked: boolean }>`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 8px;
  border-radius: 12px;
  background: ${props => (props.$checked ? '#667eea' : '#f1f5f9')};
  color: ${props => (props.$checked ? 'white' : '#374151')};
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 11px;
  font-weight: 500;
  justify-content: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  &:hover {
    background: ${props => (props.$checked ? '#5a67d8' : '#e2e8f0')};
  }
`;

const Checkbox = styled.input`
  display: none;
`;

const DifficultySliderContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
`;

const DifficultySlider = styled.input`
  width: 100%;
  height: 8px;
  border-radius: 4px;
  background: linear-gradient(to right, #10b981, #f59e0b, #ef4444);
  outline: none;
  -webkit-appearance: none;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: white;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    transition: all 0.2s ease;
    border: 3px solid #667eea;
  }

  &::-webkit-slider-thumb:hover {
    transform: scale(1.1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  &::-moz-range-thumb {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: white;
    cursor: pointer;
    border: 3px solid #667eea;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }
`;

const DifficultyIcon = styled.div`
  font-size: 20px;
  transition: all 0.2s ease;
`;

const Actions = styled.div`
  padding: 24px;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
`;

const Button = styled.button<{ $variant?: 'primary' | 'ghost' | 'retry' }>`
  padding: 12px 24px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  display: flex;
  align-items: center;
  gap: 8px;

  ${props => {
    switch (props.$variant) {
      case 'primary':
        return `
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
          &:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
          }
        `;
      case 'retry':
        return `
          background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
          &:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(255, 107, 107, 0.4);
          }
        `;
      case 'ghost':
      default:
        return `
          background: transparent;
          color: #64748b;
          border: 2px solid #e2e8f0;
          &:hover:not(:disabled) {
            background: #f8fafc;
            color: #374151;
            border-color: #cbd5e1;
          }
        `;
    }
  }}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none !important;
  }

  &:active {
    transform: translateY(0);
  }
`;

const ErrorMessage = styled.div`
  padding: 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 12px;
  color: #dc2626;
  font-size: 14px;
  text-align: center;
`;

const SuccessMessage = styled.div`
  padding: 16px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 12px;
  color: #16a34a;
  font-size: 14px;
  text-align: center;
`;

const ProgressSection = styled.div`
  margin-top: var(--space-6);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
`;

const ProgressAnimation = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-6);
`;

const ProgressStatus = styled.div<{ $stage: string }>`
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: ${props => {
    switch (props.$stage) {
      case 'queued':
        return 'var(--color-gray-500)';
      case 'ai_processing':
        return 'var(--color-purple-600)';
      case 'ai_processed':
        return 'var(--color-purple-700)';
      case 'stored':
        return 'var(--color-green-600)';
      case 'failed':
        return 'var(--color-red-600)';
      default:
        return 'var(--color-gray-500)';
    }
  }};
  text-align: center;
`;

type Props = {
  open: boolean;
  onClose: () => void;
};

const InventRecipeModal: React.FC<Props> = ({ open, onClose }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    description: '',
    difficulty: 50, // 0-100 range for smooth progression
    servings: 4,
    dietaryRestrictions: [] as string[],
    cookingMethods: [] as string[],
  });

  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const getDifficultyIcon = (value: number) => {
    if (value < 10) return '😊'; // Very Easy
    if (value < 20) return '😌'; // Easy
    if (value < 30) return '🤗'; // Easy-Medium
    if (value < 40) return '😋'; // Medium-Easy
    if (value < 50) return '🤔'; // Medium
    if (value < 60) return '😏'; // Medium-Hard
    if (value < 70) return '😤'; // Hard-Medium
    if (value < 80) return '🤯'; // Hard
    if (value < 90) return '🔥'; // Very Hard
    if (value < 95) return '💀'; // Expert
    return '👹'; // Master Chef
  };

  const { activeJobs, completedJobs, failedJobs, triggerInvent } =
    useInventProgress();

  // Get current job details
  const currentJob = currentJobId
    ? activeJobs.find(job => job.id === currentJobId) ||
      completedJobs.find(job => job.id === currentJobId) ||
      failedJobs.find(job => job.id === currentJobId)
    : null;

  // Get current progress from the job's progress array
  const currentProgress = currentJob
    ? currentJob.progress[currentJob.progress.length - 1]
    : null;

  const isProcessing =
    currentProgress &&
    currentProgress.stage !== 'stored' &&
    currentProgress.stage !== 'failed';
  const isCompleted = currentProgress && currentProgress.stage === 'stored';
  const isFailed = currentProgress && currentProgress.stage === 'failed';

  useEffect(() => {
    if (!open) {
      if (!isFailed) {
        setFormData({
          description: '',
          difficulty: 50,
          servings: 4,
          dietaryRestrictions: [],
          cookingMethods: [],
        });
        setCurrentJobId(null);
        setError(null);
        setIsSuccess(false);
      }
    }
  }, [open, isFailed]);

  // Handle successful completion
  useEffect(() => {
    if (isCompleted && currentProgress?.recipeId) {
      setIsSuccess(true);
      setTimeout(() => {
        onClose();
        navigate(`/recipe/${currentProgress.recipeId}`);
      }, 2000);
    }
  }, [isCompleted, currentProgress, navigate, onClose]);

  // Handle failure
  useEffect(() => {
    if (isFailed) {
      setError(
        'Recipe invention failed. Please try again with different parameters.'
      );
    }
  }, [isFailed]);

  if (!open) return null;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description.trim()) return;

    setError(null);
    setIsSuccess(false);

    try {
      // Convert 0-100 range to difficulty enum
      const getDifficultyEnum = (value: number) => {
        if (value < 40) return RecipeDifficulty.EASY;
        if (value < 80) return RecipeDifficulty.MEDIUM;
        return RecipeDifficulty.HARD;
      };

      const result = await triggerInvent({
        title: '', // AI will generate the title
        description: formData.description,
        difficulty: getDifficultyEnum(formData.difficulty),
        servings: formData.servings,
        dietaryRestrictions: formData.dietaryRestrictions,
        cookingMethods: formData.cookingMethods,
      });

      if (result.success && result.jobId) {
        setCurrentJobId(result.jobId);
      } else {
        setError(result.error || 'Failed to start recipe invention');
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to start recipe invention'
      );
    }
  };

  const handleRetry = async () => {
    if (!formData.description.trim()) return;

    setError(null);
    setIsSuccess(false);

    try {
      // Convert 0-100 range to difficulty enum
      const getDifficultyEnum = (value: number) => {
        if (value < 40) return RecipeDifficulty.EASY;
        if (value < 80) return RecipeDifficulty.MEDIUM;
        return RecipeDifficulty.HARD;
      };

      const result = await triggerInvent({
        title: '', // AI will generate the title
        description: formData.description,
        difficulty: getDifficultyEnum(formData.difficulty),
        servings: formData.servings,
        dietaryRestrictions: formData.dietaryRestrictions,
        cookingMethods: formData.cookingMethods,
      });

      if (result.success && result.jobId) {
        setCurrentJobId(result.jobId);
      } else {
        setError(result.error || 'Failed to retry recipe invention');
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to retry recipe invention'
      );
    }
  };

  const handleClose = () => {
    setFormData({
      description: '',
      difficulty: 50,
      servings: 4,
      dietaryRestrictions: [],
      cookingMethods: [],
    });
    setCurrentJobId(null);
    setError(null);
    setIsSuccess(false);
    onClose();
  };

  const getCurrentStep = (currentProgress: any) => {
    if (!currentProgress) return null;

    const stageToCurrentStep: Record<string, string> = {
      queued: 'Our AI chef is getting ready...',
      ai_processing: 'Creating your masterpiece...',
      ai_processed: 'Adding the final touches...',
      stored: 'All done! Your recipe is ready!',
      failed: 'Something went wrong',
    };

    return stageToCurrentStep[currentProgress.stage] || currentProgress.stage;
  };

  return (
    <Backdrop onClick={handleClose}>
      <Modal onClick={e => e.stopPropagation()}>
        <Header>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div
              style={{
                fontSize: '24px',
                fontWeight: '700',
                marginBottom: '8px',
              }}
            >
              🧙‍♀️ AI Recipe Creator
            </div>
            <div style={{ fontSize: '16px', opacity: 0.9 }}>
              Describe your dream dish and watch it come to life
            </div>
          </div>
        </Header>
        <Content>
          <form onSubmit={onSubmit}>
            <TextArea
              placeholder="Describe your dream recipe... What flavors, ingredients, or cooking style do you want? The AI will create a complete recipe for you!"
              value={formData.description}
              onChange={e =>
                setFormData(prev => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              disabled={!!isProcessing}
              $disabled={!!isProcessing}
              required
            />

            <SliderContainer>
              <SliderLabel>
                <span>Servings</span>
                <span>{formData.servings}</span>
              </SliderLabel>
              <Slider
                type="range"
                min="1"
                max="12"
                value={formData.servings}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    servings: parseInt(e.target.value),
                  }))
                }
                disabled={!!isProcessing}
              />
            </SliderContainer>

            <DifficultySliderContainer>
              <SliderLabel>
                <span>Difficulty Level</span>
                <DifficultyIcon>
                  {getDifficultyIcon(formData.difficulty)}
                </DifficultyIcon>
              </SliderLabel>
              <DifficultySlider
                type="range"
                min="0"
                max="100"
                value={formData.difficulty}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    difficulty: parseInt(e.target.value),
                  }))
                }
                disabled={!!isProcessing}
              />
            </DifficultySliderContainer>

            <div>
              <SliderLabel style={{ marginBottom: '8px' }}>
                Preferences & Methods
              </SliderLabel>
              <CheckboxGroup>
                {[
                  'Vegetarian',
                  'Vegan',
                  'Gluten-Free',
                  'Dairy-Free',
                  'Keto',
                  'Low-Carb',
                  'Grilled',
                  'Baked',
                  'Fried',
                  'Steamed',
                  'Slow-Cooked',
                  'Raw',
                ].map(option => {
                  const isDietary = [
                    'Vegetarian',
                    'Vegan',
                    'Gluten-Free',
                    'Dairy-Free',
                    'Keto',
                    'Low-Carb',
                  ].includes(option);
                  const isChecked = isDietary
                    ? formData.dietaryRestrictions.includes(option)
                    : formData.cookingMethods.includes(option);

                  return (
                    <CheckboxItem key={option} $checked={isChecked}>
                      <Checkbox
                        type="checkbox"
                        checked={isChecked}
                        onChange={e => {
                          if (isDietary) {
                            if (e.target.checked) {
                              setFormData(prev => ({
                                ...prev,
                                dietaryRestrictions: [
                                  ...prev.dietaryRestrictions,
                                  option,
                                ],
                              }));
                            } else {
                              setFormData(prev => ({
                                ...prev,
                                dietaryRestrictions:
                                  prev.dietaryRestrictions.filter(
                                    item => item !== option
                                  ),
                              }));
                            }
                          } else {
                            if (e.target.checked) {
                              setFormData(prev => ({
                                ...prev,
                                cookingMethods: [
                                  ...prev.cookingMethods,
                                  option,
                                ],
                              }));
                            } else {
                              setFormData(prev => ({
                                ...prev,
                                cookingMethods: prev.cookingMethods.filter(
                                  item => item !== option
                                ),
                              }));
                            }
                          }
                        }}
                        disabled={!!isProcessing}
                      />
                      {option}
                    </CheckboxItem>
                  );
                })}
              </CheckboxGroup>
            </div>
          </form>

          {isSuccess && (
            <SuccessMessage>
              🎉 Amazing! Your recipe is ready! Taking you to see your delicious
              creation...
            </SuccessMessage>
          )}

          {error && (
            <ErrorMessage>
              😔 Oops! Something went wrong. Let's try again!
            </ErrorMessage>
          )}

          {currentProgress && (
            <ProgressSection>
              {(currentProgress.stage === 'ai_processing' ||
                currentProgress.stage === 'ai_processed') && (
                <ProgressAnimation>
                  <AnimationIcon stage="ai_processing" size={64} />
                </ProgressAnimation>
              )}
              <ProgressStatus $stage={currentProgress.stage}>
                {getCurrentStep(currentProgress)}
              </ProgressStatus>
            </ProgressSection>
          )}
        </Content>
        <Actions>
          <Button $variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          {isFailed ? (
            <Button $variant="retry" onClick={handleRetry}>
              Try Again
            </Button>
          ) : (
            <Button
              onClick={onSubmit as any}
              disabled={isProcessing || !formData.description.trim()}
            >
              {isProcessing ? 'Creating...' : '✨ Create Recipe'}
            </Button>
          )}
        </Actions>
      </Modal>
    </Backdrop>
  );
};

export default InventRecipeModal;
