import { createContext } from 'react';
import { UserContextType } from './UserContext';

export const UserContext = createContext<UserContextType | undefined>(undefined);
