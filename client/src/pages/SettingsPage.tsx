import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { useUser } from '../contexts/useUser';
import Layout from '../components/Layout';
import i18n from '../i18n/config';

const SettingsContainer = styled.div`
  padding: var(--space-6);
  max-width: 800px;
  margin: 0 auto;
`;

const PageHeader = styled.div`
  margin-bottom: var(--space-8);
  text-align: center;
`;

const PageTitle = styled.h1`
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-gray-900);
  margin-bottom: var(--space-2);
`;

const PageSubtitle = styled.p`
  font-size: var(--font-size-lg);
  color: var(--color-gray-600);
`;

const SettingsSection = styled.div`
  background: var(--color-white);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  margin-bottom: var(--space-6);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-gray-200);
`;

const SectionTitle = styled.h2`
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-gray-900);
  margin-bottom: var(--space-4);
`;

const SettingItem = styled.div`
  margin-bottom: var(--space-6);

  &:last-child {
    margin-bottom: 0;
  }
`;

const SettingLabel = styled.label`
  display: block;
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  color: var(--color-gray-700);
  margin-bottom: var(--space-2);
`;

const SettingDescription = styled.p`
  font-size: var(--font-size-sm);
  color: var(--color-gray-500);
  margin-bottom: var(--space-3);
`;

const Select = styled.select`
  width: 100%;
  padding: var(--space-3);
  border: 1px solid var(--color-gray-300);
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  background: var(--color-white);
  color: var(--color-gray-900);
  transition: border-color var(--transition-fast);

  &:focus {
    outline: none;
    border-color: var(--color-primary-500);
    box-shadow: 0 0 0 3px var(--color-primary-100);
  }
`;

const CheckboxContainer = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-2);
`;

const Checkbox = styled.input`
  width: 18px;
  height: 18px;
  accent-color: var(--color-primary-500);
`;

const CheckboxLabel = styled.label`
  font-size: var(--font-size-base);
  color: var(--color-gray-700);
  cursor: pointer;
`;

const SaveButton = styled.button`
  background: var(--color-primary-500);
  color: var(--color-white);
  border: none;
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: background-color var(--transition-fast);

  &:hover {
    background: var(--color-primary-600);
  }

  &:disabled {
    background: var(--color-gray-300);
    cursor: not-allowed;
  }
`;

const SuccessMessage = styled.div`
  background: var(--color-green-50);
  color: var(--color-green-800);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-4);
  border: 1px solid var(--color-green-200);
`;

const ErrorMessage = styled.div`
  background: var(--color-red-50);
  color: var(--color-red-800);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-4);
  border: 1px solid var(--color-red-200);
`;

const SettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const { user, updatePreferences } = useUser();
  const [language, setLanguage] = useState(user?.language || 'en');
  const [theme, setTheme] = useState(user?.preferences?.theme || 'auto');
  const [notifications, setNotifications] = useState(user?.preferences?.notifications ?? true);
  const [cookingSkill, setCookingSkill] = useState(user?.preferences?.cookingSkill || 'beginner');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Sync local state with user data
  useEffect(() => {
    if (user) {
      setLanguage(user.language || 'en');
      setTheme(user.preferences?.theme || 'auto');
      setNotifications(user.preferences?.notifications ?? true);
      setCookingSkill(user.preferences?.cookingSkill || 'beginner');
    }
  }, [user]);

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      // Update i18n language immediately before saving if it changed
      if (language !== user?.language) {
        await i18n.changeLanguage(language);
      }

      await updatePreferences({
        language,
        preferences: {
          theme,
          notifications,
          cookingSkill,
        },
      });

      // Get the success message in the new language
      const successMessage = i18n.getFixedT(language)('settings.settingsSaved');
      setMessage({ type: 'success', text: successMessage });
    } catch (error) {
      // Get the error message in the current/new language
      const errorMessage = i18n.getFixedT(i18n.language)('settings.saveError');
      setMessage({
        type: 'error',
        text: errorMessage,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges =
    language !== user?.language ||
    theme !== user?.preferences?.theme ||
    notifications !== user?.preferences?.notifications ||
    cookingSkill !== user?.preferences?.cookingSkill;

  return (
    <Layout>
      <SettingsContainer>
        <PageHeader>
          <PageTitle>{t('settings.title')}</PageTitle>
          <PageSubtitle>{t('settings.subtitle')}</PageSubtitle>
        </PageHeader>

        {message &&
          (message.type === 'success' ? (
            <SuccessMessage>{message.text}</SuccessMessage>
          ) : (
            <ErrorMessage>{message.text}</ErrorMessage>
          ))}

        <SettingsSection>
          <SectionTitle>{t('settings.preferences')}</SectionTitle>

          <SettingItem>
            <SettingLabel htmlFor="language">{t('settings.language')}</SettingLabel>
            <SettingDescription>{t('settings.languageDescription')}</SettingDescription>
            <Select
              id="language"
              value={language}
              onChange={e => setLanguage(e.target.value as 'en' | 'fr' | 'es' | 'de' | 'it')}
            >
              <option value="en">{t('settings.english')}</option>
              <option value="fr">{t('settings.french')}</option>
              <option value="es">{t('settings.spanish')}</option>
              <option value="de">{t('settings.german')}</option>
              <option value="it">{t('settings.italian')}</option>
            </Select>
          </SettingItem>

          <SettingItem>
            <SettingLabel htmlFor="theme">{t('settings.theme')}</SettingLabel>
            <SettingDescription>{t('settings.themeDescription')}</SettingDescription>
            <Select id="theme" value={theme} onChange={e => setTheme(e.target.value as 'light' | 'dark' | 'auto')}>
              <option value="auto">{t('settings.auto')}</option>
              <option value="light">{t('settings.light')}</option>
              <option value="dark">{t('settings.dark')}</option>
            </Select>
          </SettingItem>

          <SettingItem>
            <SettingLabel htmlFor="notifications">{t('settings.notifications')}</SettingLabel>
            <SettingDescription>{t('settings.notificationsDescription')}</SettingDescription>
            <CheckboxContainer>
              <Checkbox
                id="notifications"
                type="checkbox"
                checked={notifications}
                onChange={e => setNotifications(e.target.checked)}
              />
              <CheckboxLabel htmlFor="notifications">{t('settings.enableNotifications')}</CheckboxLabel>
            </CheckboxContainer>
          </SettingItem>

          <SettingItem>
            <SettingLabel htmlFor="cookingSkill">{t('settings.cookingSkill')}</SettingLabel>
            <SettingDescription>{t('settings.cookingSkillDescription')}</SettingDescription>
            <Select
              id="cookingSkill"
              value={cookingSkill}
              onChange={e => setCookingSkill(e.target.value as 'beginner' | 'intermediate' | 'advanced')}
            >
              <option value="beginner">{t('settings.beginner')}</option>
              <option value="intermediate">{t('settings.intermediate')}</option>
              <option value="advanced">{t('settings.advanced')}</option>
            </Select>
          </SettingItem>

          <SaveButton onClick={handleSave} disabled={!hasChanges || isSaving}>
            {isSaving ? t('settings.saving') : t('settings.saveSettings')}
          </SaveButton>
        </SettingsSection>
      </SettingsContainer>
    </Layout>
  );
};

export default SettingsPage;
