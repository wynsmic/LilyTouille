import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { useRecipes } from '../hooks';
import { UserProfile } from './index';

interface LayoutProps {
  children: React.ReactNode;
}

const Container = styled.div`
  min-height: 100vh;
  background-color: var(--color-gray-50);
`;

const Header = styled.header`
  background-color: var(--color-white);
  box-shadow: var(--shadow-sm);
  border-bottom: 1px solid var(--color-gray-200);
`;

const HeaderContent = styled.div`
  max-width: 80rem;
  margin: 0 auto;
  padding: 0 var(--space-4);
  padding-top: var(--space-4);
  padding-bottom: var(--space-4);
`;

const HeaderFlex = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Logo = styled(Link)`
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-gray-900);
  text-decoration: none;
  transition: color var(--transition-fast);

  &:hover {
    color: var(--color-primary-600);
  }
`;

const Nav = styled.nav`
  display: flex;
  align-items: center;
  gap: var(--space-6);
`;

const NavLink = styled(Link)<{ $isActive: boolean }>`
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: ${props =>
    props.$isActive ? 'var(--color-primary-600)' : 'var(--color-gray-600)'};
  text-decoration: none;
  transition: color var(--transition-fast);
  position: relative;

  &:hover {
    color: ${props =>
      props.$isActive ? 'var(--color-primary-600)' : 'var(--color-gray-900)'};
  }
`;

const Badge = styled.span`
  position: absolute;
  top: -0.5rem;
  right: -0.5rem;
  background-color: #ef4444;
  color: var(--color-white);
  font-size: var(--font-size-xs);
  border-radius: var(--radius-full);
  height: 1.25rem;
  width: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const { favoriteRecipeIds } = useRecipes();

  return (
    <Container>
      <Header>
        <HeaderContent>
          <HeaderFlex>
            <Logo to="/">LilyTouille</Logo>
            <Nav>
              <NavLink to="/" $isActive={location.pathname === '/'}>
                All Recipes
              </NavLink>
              <NavLink
                to="/favorites"
                $isActive={location.pathname === '/favorites'}
              >
                Favorites
                {favoriteRecipeIds.length > 0 && (
                  <Badge>{favoriteRecipeIds.length}</Badge>
                )}
              </NavLink>
            </Nav>
            <UserProfile />
          </HeaderFlex>
        </HeaderContent>
      </Header>
      <main>{children}</main>
    </Container>
  );
};

export default Layout;
