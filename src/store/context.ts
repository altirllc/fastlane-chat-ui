/* eslint-disable indent */
import { createContext } from 'react';

export const AuthContext = createContext<{
  amityAccessToken: string;
  setIsTabBarVisible: (value: boolean) => void;
  chatNavigation: any;
  marketPlaceCommunityId: string;
}>({
  amityAccessToken: '',
  setIsTabBarVisible: () => { },
  chatNavigation: null,
  marketPlaceCommunityId: ''
});
