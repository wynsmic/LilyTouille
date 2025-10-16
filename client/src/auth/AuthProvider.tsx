import React from 'react';
import { Auth0Provider } from '@auth0/auth0-react';

interface AuthProviderProps {
  children: React.ReactNode;
}

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const domain = import.meta.env.VITE_AUTH0_DOMAIN;
  const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID;
  const redirectUri = window.location.origin;

  if (!domain || !clientId) {
    console.error(
      'Auth0 configuration is missing. Please set VITE_AUTH0_DOMAIN and VITE_AUTH0_CLIENT_ID environment variables.'
    );
    return <>{children}</>;
  }

  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: redirectUri,
      }}
    >
      {children}
    </Auth0Provider>
  );
};

export default AuthProvider;
