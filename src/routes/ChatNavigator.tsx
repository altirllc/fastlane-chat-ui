/* eslint-disable react/no-unstable-nested-components */
import { NavigationContainer } from '@react-navigation/native';

import RecentChat from '../screens/RecentChat/RecentChat';

import * as React from 'react';

import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SelectMembers from '../screens/SelectMembers/SelectMembers';

import type { RootStackParamList } from './RouteParamList';
import { ChatRoomSetting } from '../screens/ChatDetail/ChatRoomSetting';
import { EditChatRoomDetail } from '../screens/EditChatDetail/EditChatRoomDetail';
import MemberDetail from '../screens/MemberDetail/MemberDetail';
import ChatRoom from '../screens/ChatRoom/ChatRoom';
import useAuth from '../hooks/useAuth';
import { EnterGroupName } from '../screens/EnterGroupName/EnterGroupName';
import AddMembersInChat from '../screens/AddMembersInChat/AddMembersInChat';
import { TCommunity } from '../types/common';
import { AuthContext } from '../store/context';

type TChatNavigator = {
  chapters: TCommunity[];
  amityAccessToken: string;
  chatNavigation: any;
  userData: {
    avatarUrl: string;
  };
  setIsTabBarVisible: (value: boolean) => void;
};

export default function ChatNavigator({
  chapters,
  amityAccessToken,
  chatNavigation,
  userData,
  setIsTabBarVisible,
}: TChatNavigator) {
  const Stack = createNativeStackNavigator<RootStackParamList>();
  const { isConnected } = useAuth();
  return (
    <NavigationContainer independent={true}>
      <AuthContext.Provider value={{ amityAccessToken, setIsTabBarVisible }}>
        {isConnected && (
          <Stack.Navigator
            screenOptions={{
              headerShadowVisible: false,
              contentStyle: {
                backgroundColor: 'white',
              },
              headerShown: false,
            }}
          >
            <Stack.Screen options={({}) => ({ title: '' })} name="RecentChat">
              {() => (
                <RecentChat
                  chatNavigation={chatNavigation}
                  avatarUrl={userData?.avatarUrl}
                />
              )}
            </Stack.Screen>

            <Stack.Screen
              options={({}) => ({ title: '' })}
              name="AddMembersInChat"
            >
              {() => <AddMembersInChat chapters={chapters} />}
            </Stack.Screen>

            <Stack.Screen
              options={({}) => ({ title: '' })}
              name="EnterGroupName"
            >
              {() => <EnterGroupName />}
            </Stack.Screen>

            <Stack.Screen name="ChatRoom">{() => <ChatRoom />}</Stack.Screen>

            <Stack.Screen name="ChatDetail" component={ChatRoomSetting} />
            <Stack.Screen name="MemberDetail" component={MemberDetail} />
            <Stack.Screen
              name="EditChatDetail"
              component={EditChatRoomDetail}
            />

            <Stack.Group screenOptions={{ presentation: 'modal' }}>
              <Stack.Screen name="SelectMembers" component={SelectMembers} />
            </Stack.Group>
          </Stack.Navigator>
        )}
      </AuthContext.Provider>
    </NavigationContainer>
  );
}
