import React from 'react';
import { MessageRepository } from '@amityco/ts-sdk-react-native';
import { UserInterface } from '../types/user.interface';
import { useState } from 'react';
import { IGroupChatObject } from '../components/ChatList';
import { View } from 'react-native';
import { CheckIcon } from '../svg/CheckIcon';
import { useTheme } from 'react-native-paper';
import type { MyMD3Theme } from '../providers/amity-ui-kit-provider';

type MessageStatusMap = Map<string, MessageStatus>;

interface MessageStatus {
  readMessageStatus: boolean;
}

export const useReadStatus = () => {
  const [messageStatusMap, setMessageStatusMap] = useState<MessageStatusMap>(
    new Map()
  );
  const theme = useTheme() as MyMD3Theme;

  const isDelivered = true;
  const isRead = (messageId: string) => {
    return messageStatusMap.get(messageId)?.readMessageStatus;
  };

  const setMessageStatus = (messageId: string, readMessageStatus: boolean) => {
    setMessageStatusMap((prevMap) => {
      const newMap = new Map(prevMap);
      newMap.set(messageId, { readMessageStatus });
      return newMap;
    });
  };

  const getReadStatusForMessage = async (
    messageId: string,
    chatReceiver: UserInterface | undefined,
    groupChat: IGroupChatObject | undefined,
    isGroupChat: boolean
  ): Promise<boolean | undefined> => {
    return await new Promise(async (resolve, reject) => {
      try {
        const { data: users } = await MessageRepository.getReadUsers({
          messageId,
          memberships: ['member', 'banned', 'muted', 'non-member', 'deleted'],
        });
        if (users) {
          let isMessageReadByReceiver = false;
          const messageSeenUserIds = users.map((user) => user.userId);
          if (chatReceiver) {
            //if one to one chat, check if reciever id exist in list of users who has seen this message.
            isMessageReadByReceiver = messageSeenUserIds.includes(
              chatReceiver?.userId
            );
          } else if (
            isGroupChat &&
            groupChat?.users &&
            groupChat.users.length > 0
          ) {
            let haveAllUsersSeenMessage = true;

            for (let i = 0; i < groupChat?.users.length; i++) {
              const eachUser = groupChat?.users[i];
              if (eachUser && !messageSeenUserIds.includes(eachUser.userId)) {
                //if even one user from group chat haven't seen the message, just mark read status as false
                haveAllUsersSeenMessage = false;
                break; // Exit the loop
              }
            }

            isMessageReadByReceiver = haveAllUsersSeenMessage;
          }
          setMessageStatus(messageId, isMessageReadByReceiver);
          resolve(true);
        }
      } catch (error) {
        reject(new Error('Unable to create channel ' + error));
      }
    });
  };

  const getReadComponent = (messageId: string) => {
    return (
      <View style={{ flexDirection: 'row' }}>
        <CheckIcon
          height={20}
          width={20}
          color={
            isRead(messageId)
              ? theme.colors.chatBubbles?.userBubble
              : theme.colors.baseShade2
          }
        />
        <View style={{ marginLeft: -10 }}>
          <CheckIcon
            height={20}
            width={20}
            color={
              isRead(messageId)
                ? theme.colors.chatBubbles?.userBubble
                : theme.colors.baseShade2
            }
          />
        </View>
      </View>
    );
  };

  return {
    getReadStatusForMessage,
    isDelivered,
    isRead,
    getReadComponent,
    messageStatusMap,
  };
};
