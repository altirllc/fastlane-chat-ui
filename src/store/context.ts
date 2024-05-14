/* eslint-disable indent */
import { createContext } from 'react';

export const AuthContext = createContext<{
    amityAccessToken: string;
}>({
    amityAccessToken: ''
});
