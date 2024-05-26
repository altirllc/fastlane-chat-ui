/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-shadow */
import * as React from 'react';

import { View, TouchableHighlight, Image } from 'react-native';

import { ChannelRepository } from '@amityco/ts-sdk-react-native';
import CustomText from '../CustomText';
import { useStyles } from './styles';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import useAuth from '../../hooks/useAuth';
import { useEffect, useMemo, useState } from 'react';
import type { UserInterface } from '../../types/user.interface';
import { PrivateChatIcon } from '../../svg/PrivateChatIcon';
import { EUserRoles } from '../../enum/sessionState';
import { useMessagePreview } from '../../hooks/useMessagePreview';
import { ImageIcon } from '../../svg/ImageIcon';
import { useReadStatus } from '../../hooks/useReadStatus';
import { Avatar } from '../../../src/components/Avatar/Avatar';
import { useAvatarArray } from '../../../src/hooks/useAvatarArray';

export interface IChatListProps {
  chatId: string;
  chatName: string;
  chatMemberNumber: number;
  unReadMessage: number;
  messageDate: string;
  channelType: 'conversation' | 'broadcast' | 'live' | 'community' | '';
  avatarFileId: string | undefined;
}

export interface IGroupChatObject {
  displayName: string;
  memberCount: number;
  users: UserInterface[];
  avatarFileId: string | undefined;
  channelModerator?: Partial<UserInterface>;
}

const ChatList = ({
  chatId,
  chatName,
  chatMemberNumber,
  unReadMessage,
  messageDate,
  channelType,
  avatarFileId,
}: IChatListProps) => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { client, apiRegion } = useAuth();

  const [usersObject, setUsersObject] =
    useState<Amity.LiveCollection<Amity.Membership<'channel'>>>();
  const { data: usersArr = [] } = usersObject ?? {};

  const [oneOnOneChatObject, setOneOnOneChatObject] =
    useState<Amity.Membership<'channel'>[]>();
  const [groupChatObject, setGroupChatObject] =
    useState<Amity.Membership<'channel'>[]>();
  const styles = useStyles();

  const chatReceiver = useMemo(() => {
    if (oneOnOneChatObject && oneOnOneChatObject.length > 0) {
      const targetIndex: number = oneOnOneChatObject?.findIndex(
        (item) => item.userId !== (client as Amity.Client).userId
      );
      const chatReceiver: UserInterface = {
        userId: oneOnOneChatObject[targetIndex]?.userId as string,
        displayName: oneOnOneChatObject[targetIndex]?.user
          ?.displayName as string,
        avatarFileId: oneOnOneChatObject[targetIndex]?.user?.avatarFileId ?? '',
      };
      return chatReceiver;
    }
    return undefined
  }, [oneOnOneChatObject, client])

  const groupChat = useMemo(() => {
    if (groupChatObject && groupChatObject?.length > 0) {
      const userArr: UserInterface[] = groupChatObject?.map((item) => {
        return {
          userId: item.userId as string,
          displayName: item.user?.displayName as string,
          avatarFileId: item.user?.avatarFileId as string,
        };
      });
      let channelModerator = groupChatObject?.find((eachUser) => eachUser.roles?.includes(
        EUserRoles['channel-moderator']
      ))
      const groupChat: IGroupChatObject = {
        users: userArr,
        displayName: chatName as string,
        avatarFileId: avatarFileId,
        memberCount: chatMemberNumber,
      };
      if (channelModerator) {
        //if channel admin exist, add its info separately
        groupChat.channelModerator = {
          userId: channelModerator.userId,
        }
      }
      return groupChat
    }
    return undefined
  }, [groupChatObject, chatName, avatarFileId, chatMemberNumber])

  const { avatarArray } = useAvatarArray(groupChat)

  const isGroupChat = useMemo(() => {
    return groupChat !== undefined;
  }, [groupChat]);

  const { messagePreview } = useMessagePreview(chatId);
  const { getReadStatusForMessage, isDelivered, getReadComponent } = useReadStatus()

  const avatarId = useMemo(() => {
    //return latest avatarID
    if (oneOnOneChatObject) {
      const targetIndex: number = oneOnOneChatObject?.findIndex(
        (item) => item.userId !== (client as Amity.Client).userId
      );
      return (
        (oneOnOneChatObject &&
          oneOnOneChatObject[targetIndex]?.user?.avatarFileId) ||
        ''
      );
    } else if (groupChatObject) {
      return avatarFileId;
    } else return '';
  }, [oneOnOneChatObject, groupChatObject, avatarFileId]);

  const chatDisplayName = useMemo(() => {
    //return latest chat name
    if (oneOnOneChatObject) {
      const targetIndex: number = oneOnOneChatObject?.findIndex(
        (item) => item.userId !== (client as Amity.Client).userId
      );
      return oneOnOneChatObject[targetIndex]?.user?.displayName as string;
    } else if (groupChatObject) {
      return chatName;
    } else return '';
  }, [oneOnOneChatObject, groupChatObject, chatName]);

  const isUserLoggedInPreviewChat = useMemo(() => {
    const lastMessageCreatorId = messagePreview?.user?.userId;
    const isUserChat = lastMessageCreatorId === (client as Amity.Client).userId
    return isUserChat;
  }, [messagePreview, client])

  const handlePress = () => {
    if (oneOnOneChatObject && oneOnOneChatObject.length > 0 && chatReceiver) {
      if (chatReceiver.userId) {
        navigation.navigate('ChatRoom', {
          channelId: chatId,
          chatReceiver: chatReceiver,
        });
      }
    }
    if (groupChatObject && groupChatObject?.length > 0 && groupChat) {
      navigation.navigate('ChatRoom', {
        channelId: chatId,
        groupChat: groupChat,
      });
    }
  };

  useEffect(() => {
    if (chatMemberNumber === 2 && usersArr) {
      setOneOnOneChatObject(usersArr);
    } else if (usersArr) {
      setGroupChatObject(usersArr);
    }
  }, [usersArr]);


  useEffect(() => {
    ChannelRepository.Membership.getMembers(
      { channelId: chatId, limit: 100 },
      (data) => {
        setUsersObject(data);
      }
    );
  }, []);

  useEffect(() => {
    (async () => {
      //get the message read status
      if (!messagePreview?.messagePreviewId) return;
      if (!isGroupChat && !chatReceiver) {
        //get the read statuses only if there is a group chat or one to one chat.
        return;
      }
      if (isUserLoggedInPreviewChat) {
        await getReadStatusForMessage(messagePreview?.messagePreviewId,
          chatReceiver,
          groupChat,
          isGroupChat
        );
      }
    })();
  }, [messagePreview, isUserLoggedInPreviewChat]);

  const getMessagePreview = () => {
    const dataType = messagePreview?.dataType; //can be text or image.
    const previewText = messagePreview?.data?.text; //available if dataType is text
    const lastMessageCreatorDisplayName = messagePreview?.user?.displayName
    const lastMessageCreatorId = messagePreview?.user?.userId;
    const isLoggedInUser = lastMessageCreatorId === (client as Amity.Client).userId

    if (chatMemberNumber === 2) {
      //add read status if isLoggedInUser is true
      return (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 7 }}>
          {
            isUserLoggedInPreviewChat &&
              isDelivered &&
              messagePreview?.messagePreviewId ?
              getReadComponent(messagePreview?.messagePreviewId) :
              null
          }
          {
            dataType === "image" ? (
              <View style={{ marginRight: 5 }}>
                <ImageIcon height={16} width={16} />
              </View>
            ) : null
          }
          <CustomText numberOfLines={1} style={styles.messagePreview}>
            {dataType ? dataType === "text" ? (previewText ? previewText : '') : "Photo" : ''}
          </CustomText>
        </View>
      )
    }
    if (chatMemberNumber > 2) {
      //add read status if isLoggedInUser is true
      return (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 7 }}>
          {
            isUserLoggedInPreviewChat &&
              isDelivered &&
              messagePreview?.messagePreviewId ?
              getReadComponent(messagePreview?.messagePreviewId) :
              null
          }
          <CustomText numberOfLines={1} style={styles.messagePreview}>
            {
              lastMessageCreatorId ?
                isLoggedInUser ?
                  'You: ' :
                  (lastMessageCreatorDisplayName ?
                    `${lastMessageCreatorDisplayName}: ` : '') :
                ''
            }
          </CustomText>
          {
            dataType === "image" ? (
              <View style={{ marginRight: 5 }}>
                <ImageIcon height={16} width={16} />
              </View>
            ) : null
          }
          <CustomText numberOfLines={1} style={styles.messagePreview}>
            {dataType === "text" ? (previewText ? previewText : '') : dataType === "image" ? 'Photo' : ''}
          </CustomText>
        </View>
      )
    }
    return <></>
  }

  return (
    <TouchableHighlight onPress={() => handlePress()}>
      <View style={styles.chatCard}>
        <View style={styles.avatarSection}>
          {avatarId ? (
            <Image
              style={styles.icon}
              source={{
                uri: `https://api.${apiRegion}.amity.co/api/v3/files/${avatarId}/download?size=small`,
              }}
            />
          ) : (
            <View style={styles.icon}>
              {channelType === 'community' ? (
                <Avatar avatars={avatarArray} />
              ) : (
                <PrivateChatIcon />
              )}
            </View>
          )}
        </View>

        <View style={styles.chatDetailSection}>
          <View style={{ width: '70%' }}>
            <View style={styles.chatNameWrap}>
              <CustomText style={styles.chatName} numberOfLines={1}>
                {chatDisplayName}
              </CustomText>
              {chatMemberNumber > 2 ? (
                <CustomText style={styles.chatLightText}>
                  ({chatMemberNumber})
                </CustomText>
              ) : null}
            </View>
            {getMessagePreview()}
          </View>
          <View style={styles.chatTimeWrap}>
            <CustomText style={styles.chatLightText}>{messageDate}</CustomText>
            {unReadMessage > 0 && (
              <View style={styles.unReadBadge}>
                <CustomText style={styles.unReadText}>
                  {unReadMessage}
                </CustomText>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableHighlight>
  );
};
export default ChatList;
