/* eslint-disable indent */
import { createContext } from 'react';

export const AuthContext = createContext<{
  amityAccessToken: string;
  setIsTabBarVisible: (value: boolean) => void;
  onChatPostClick: (postId: string) => void;
}>({
  amityAccessToken: '',
  setIsTabBarVisible: () => {},
  onChatPostClick: (_) => {},
});
