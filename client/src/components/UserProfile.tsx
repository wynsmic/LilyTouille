import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useUser } from '../contexts/useUser';

const ProfileContainer = styled.div`
  position: relative;
`;

const ProfileButton = styled.button`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  background: none;
  border: none;
  cursor: pointer;
  padding: var(--space-2);
  border-radius: var(--radius-md);
  transition: background-color var(--transition-fast);

  &:hover {
    background-color: var(--color-gray-100);
  }
`;

const Avatar = styled.img`
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  border: 2px solid var(--color-gray-200);
`;

const DefaultAvatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  background-color: var(--color-primary-500);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-white);
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-sm);
`;

const UserName = styled.span`
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-gray-700);
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  @media (max-width: 768px) {
    display: none;
  }
`;

const DropdownMenu = styled.div<{ $isOpen: boolean }>`
  position: absolute;
  top: 100%;
  right: 0;
  background-color: var(--color-white);
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  min-width: 200px;
  z-index: 1000;
  opacity: ${props => (props.$isOpen ? 1 : 0)};
  visibility: ${props => (props.$isOpen ? 'visible' : 'hidden')};
  transform: ${props => (props.$isOpen ? 'translateY(0)' : 'translateY(-10px)')};
  transition: all var(--transition-fast);
  margin-top: var(--space-1);
`;

const DropdownItem = styled.button`
  width: 100%;
  padding: var(--space-3) var(--space-4);
  background: none;
  border: none;
  text-align: left;
  font-size: var(--font-size-sm);
  color: var(--color-gray-700);
  cursor: pointer;
  transition: background-color var(--transition-fast);
  border-bottom: 1px solid var(--color-gray-100);
  display: flex;
  align-items: center;
  gap: var(--space-2);

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background-color: var(--color-gray-50);
  }

  &.danger {
    color: var(--color-red-800);

    &:hover {
      background-color: var(--color-red-100);
    }
  }

  &.separator {
    border-top: 2px solid var(--color-gray-200);
    margin-top: var(--space-2);
    padding-top: var(--space-3);
  }
`;

const DropdownIcon = styled.span`
  font-size: var(--font-size-base);
  width: 16px;
  text-align: center;
`;

const UserProfile: React.FC = () => {
  const { user, logout, isLoading } = useAuth0();
  const { favorites } = useUser();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    logout({ logoutParams: { returnTo: window.location.origin } });
  };

  const handleNavigateToFavorites = () => {
    setIsDropdownOpen(false);
    navigate('/favorites');
  };

  const handleNavigateToSettings = () => {
    setIsDropdownOpen(false);
    navigate('/settings');
  };

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <ProfileButton disabled>
        <DefaultAvatar>...</DefaultAvatar>
      </ProfileButton>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <ProfileContainer ref={dropdownRef}>
      <ProfileButton onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
        {user.picture ? (
          <Avatar src={user.picture} alt={user.name || 'User'} />
        ) : (
          <DefaultAvatar>{getUserInitials(user.name || user.email || 'U')}</DefaultAvatar>
        )}
        <UserName>{user.name || user.email}</UserName>
      </ProfileButton>

      <DropdownMenu $isOpen={isDropdownOpen}>
        <DropdownItem onClick={handleNavigateToFavorites}>
          <DropdownIcon>⭐</DropdownIcon>
          {t('favorites.title')} ({favorites.length})
        </DropdownItem>

        <DropdownItem onClick={handleNavigateToSettings}>
          <DropdownIcon>⚙️</DropdownIcon>
          {t('profile.settings')}
        </DropdownItem>

        <DropdownItem className="separator" onClick={handleLogout}>
          <DropdownIcon>🚪</DropdownIcon>
          {t('profile.logout')}
        </DropdownItem>
      </DropdownMenu>
    </ProfileContainer>
  );
};

export default UserProfile;
