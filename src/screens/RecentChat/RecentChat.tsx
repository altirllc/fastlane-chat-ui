import React, {
  type ReactElement,
  useMemo,
  useRef,
  useContext,
  useLayoutEffect,
  useCallback,
} from 'react';

import { View, FlatList, TouchableOpacity, Text } from 'react-native';

import {
  ChannelRepository,
  UserRepository,
  getChannelTopic,
  subscribeTopic,
} from '@amityco/ts-sdk-react-native';
import ChatList, { type IChatListProps } from '../../components/ChatList/index';
import useAuth from '../../hooks/useAuth';
import { useEffect, useState } from 'react';
import moment from 'moment';
import { PlusIcon } from '../../svg/PlusIcon';

import { useStyles } from './styles';
import {
  DrawerActions,
  useFocusEffect,
  useIsFocused,
  useNavigation,
} from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Icon } from 'react-native-paper';
import { useCustomTheme } from '../../hooks/useCustomTheme';
import { getShadowProps } from '../../theme/helpers';
import { LoadingOverlay } from '../../components/LoadingOverlay';
import { SideBarIcon } from '../../svg/Sidebar';
// @ts-ignore
import { Avatar } from '../../../../../../src/components/Avatar/Avatar';
// @ts-ignore
import { screens } from '../../../../../../src/constants/screens';
import { AuthContext } from '../../store/context';
import { createAmityChannel } from '../../../src/providers/channel-provider';
import { UserInterface } from '../../../src/types/user.interface';

export type TRecentChat = {
  chatNavigation: any;
  avatarUrl: string;
  userIdForChatProp: string
};

export default function RecentChat({
  chatNavigation,
  avatarUrl,
  userIdForChatProp,
}: TRecentChat) {
  const { isConnected, client } = useAuth();
  const [channelObjects, setChannelObjects] = useState<IChatListProps[]>([]);
  const [loadChannel, setLoadChannel] = useState<boolean>(false);
  const styles = useStyles();
  const { setIsTabBarVisible } = useContext(AuthContext);
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [userIdForChat, setUserIdForChat] = useState('');

  useEffect(() => {
    setUserIdForChat(userIdForChatProp)
  }, [userIdForChatProp])

  const flatListRef = useRef(null);
  const { colors } = useCustomTheme();

  const [channelData, setChannelData] =
    useState<Amity.LiveCollection<Amity.Channel>>();
  const [showFabIcon, setShowFabIcon] = useState(false);

  const { data: channels = [], onNextPage, hasNextPage } = channelData ?? {};

  const disposers: Amity.Unsubscriber[] = [];
  const subscribedChannels: Amity.Channel['channelId'][] = [];

  const recentChatIds = useMemo(() => {
    //pass chatIds with only one to one chats
    return channelObjects
      .filter((eachChannel) => eachChannel.chatMemberNumber === 2)
      .map((channel) => channel.chatId);
  }, [channelObjects]);

  const subscribeChannels = (channels: Amity.Channel[]) => {
    channels.forEach((c) => {
      if (!subscribedChannels.includes(c.channelId) && !c.isDeleted) {
        subscribedChannels.push(c.channelId);
        disposers.push(subscribeTopic(getChannelTopic(c)));
      }
    });
  };

  const isFocused = useIsFocused();

  useLayoutEffect(() => {
    //IMP: Don't remove setTimeout as this is used for showing footer on the screen.
    setTimeout(() => {
      if (isFocused) {
        setIsTabBarVisible(true);
      }
    }, 500);
  }, [isFocused]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, []);

  const onQueryChannel = () => {
    setLoadChannel(true);
    const unsubscribe = ChannelRepository.getChannels(
      {
        sortBy: 'lastActivity',
        limit: 15,
        membership: 'member',
        isDeleted: false,
      },
      (value) => {
        setChannelData(value);
        subscribeChannels(channels);
        if (value.data.length > 0 || (value.data.length === 0 && !value.hasNextPage && !value.loading)) {
          setTimeout(() => {
            setLoadChannel(false);
            setShowFabIcon(true);
          }, 1000);
        }
      }
    );
    disposers.push(unsubscribe);
  };

  useEffect(() => {
    (async () => {
      if (!userIdForChat) onQueryChannel()
      return () => {
        console.log(disposers);
        disposers.forEach((fn) => fn());
      };
    })()
  }, [isConnected, userIdForChat]);

  useFocusEffect(
    useCallback(() => {
      return () => setUserIdForChat('');
    }, [])
  );

  useEffect(() => {
    (async () => {
      if (!userIdForChat || channels.length === 0) return;
      try {
        //if we have userId from route, that means we need to create new chat with that user
        setLoadChannel(true);
        const users: UserInterface[] = [];
        //first fetch that user's information
        const result = await UserRepository.getUserByIds([userIdForChat]);
        const user = result && result.data && result.data[0]
        if (!user) {
          // ToastMessageService.showError({ text: 'User not found' })
          return;
        }
        users.push({
          displayName: user.displayName || '',
          avatarFileId: user.avatarFileId || '',
          userId: user.userId || ''
        })
        //now create new channel with that user
        const channel = await createAmityChannel(
          (client as Amity.Client).userId as string,
          users
        );
        if (channel) {
          try {
            if (users.length === 1 && users[0]) {
              const oneOnOneChatObject: UserInterface = {
                userId: users[0].userId,
                displayName: users[0].displayName as string,
                avatarFileId: users[0].avatarFileId as string,
              };
              navigation.navigate('ChatRoom', {
                channelId: channel.channelId,
                chatReceiver: oneOnOneChatObject,
              })
            }
          } catch (error) {
            console.log('create chat error ' + JSON.stringify(error));
            console.error(error);
          }
        }
      } catch (e) {
        console.log("error", e)
      } finally {
        setLoadChannel(false);
      }
    })()
  }, [userIdForChat, channels])


  const getDaysDiff = (date: Date) => {
    //.startOf('day') sets time at 00:00:00 before performing diff
    let todaysDate = moment().startOf('day');
    let date1 = moment(date).startOf('day');
    return Math.abs(todaysDate.diff(date1, 'days'));
  };

  useEffect(() => {
    if (channels.length > 0) {
      // @ts-ignore
      const formattedChannelObjects: IChatListProps[] = channels.map(
        (item: Amity.Channel<any>) => {
          const lastActivityDate: string = moment(item.lastActivity).format(
            'MM/DD/YY'
          );
          const todayDate = moment(Date.now()).format('MM/DD/YY');
          const daysDiff = getDaysDiff(moment(item.lastActivity).toDate());
          let dateDisplay;
          if (daysDiff === 0 && lastActivityDate === todayDate) {
            dateDisplay = moment(item.lastActivity).format('hh:mm A');
          } else if (daysDiff === 1) {
            dateDisplay = 'Yesterday'
          } else {
            dateDisplay = moment(item.lastActivity).format('MM/DD/YY');
          }

          return {
            chatId: item.channelId ?? '',
            chatName: item.displayName ?? '',
            chatMemberNumber: item.memberCount ?? 0,
            unReadMessage: item.subChannelsUnreadCount ?? 0,
            messageDate: dateDisplay ?? '',
            channelType: item.type ?? '',
            avatarFileId: item.avatarFileId,
          };
        }
      );
      const sortedChannelObjects = formattedChannelObjects.sort((a, b) => {
        if (a.channelType === 'broadcast' && b.channelType !== 'broadcast') {
          return -1;
        }
        if (a.channelType !== 'broadcast' && b.channelType === 'broadcast') {
          return 1;
        }
        return 0;
      });
      setChannelObjects([...sortedChannelObjects]);
      setLoadChannel(false);
    }
  }, [channels]);

  const handleLoadMore = () => {
    if (hasNextPage && onNextPage) {
      onNextPage();
    }
  };

  const renderRecentChat = useMemo(() => {
    return channelObjects.length > 0 ? (
      <FlatList
        data={channelObjects}
        renderItem={({ item }) => renderChatList(item)}
        keyExtractor={(item) => item.chatId.toString()}
        onEndReached={handleLoadMore}
        showsVerticalScrollIndicator={false}
        onEndReachedThreshold={0.4}
        ref={flatListRef}
      />
    ) : !loadChannel ? (
      <View style={styles.noMessageContainer}>
        <Text style={styles.noMessageText}>No Messages, yet.</Text>
        <Text style={styles.noMessageDesc}>
          No messages in your inbox, yet!
        </Text>
      </View>
    ) : null
  }, [loadChannel, channelObjects, handleLoadMore]);

  const markChannelAsRead = useCallback(async (channelId: string) => {
    const resultantChannel = channels.find((eachChannel) => eachChannel.channelId === channelId);
    if (resultantChannel) await resultantChannel.markAsRead();
  }, [channels])

  const renderChatList = (item: IChatListProps): ReactElement => {
    return (
      <ChatList
        key={item.chatId}
        chatId={item.chatId}
        chatName={item.chatName}
        chatMemberNumber={item.chatMemberNumber}
        unReadMessage={item.unReadMessage}
        messageDate={item.messageDate}
        channelType={item.channelType}
        avatarFileId={item.avatarFileId}
        markChannelAsRead={markChannelAsRead}
      />
    );
  };

  return (
    <View style={{ position: 'relative', height: '100%', width: '100%' }}>
      <View style={styles.chatContainer}>
        <View
          style={[
            styles.welcomeContainer,
            { backgroundColor: colors.secondary.main },
          ]}
        >
          <View style={styles.width1}>
            <TouchableOpacity
              onPress={() => {
                chatNavigation.dispatch(DrawerActions.openDrawer());
              }}
            >
              <SideBarIcon height={30} width={30} />
            </TouchableOpacity>
          </View>
          <View style={styles.width2} />
          <View style={styles.width1}>
            <Avatar
              image={avatarUrl}
              size={40}
              onPress={() => {
                chatNavigation.navigate(screens.Profile);
              }}
              light={true}
              shadow
            />
          </View>
        </View>
        <Text style={styles.chatHeader}>Chats</Text>
        <View style={{ flex: 1 }}>{renderRecentChat}</View>
        {showFabIcon ? (
          <TouchableOpacity
            onPress={() => {
              navigation.navigate('AddMembersInChat', { recentChatIds });
            }}
            style={[
              styles.createFeedButton,
              {
                ...getShadowProps({ color: colors.secondary.main }),
                backgroundColor: colors.primary.main,
              },
            ]}
          >
            <Icon source={PlusIcon} size={'xs'} color="transparent" />
          </TouchableOpacity>
        ) : null}
      </View>
      {loadChannel ? <LoadingOverlay /> : null}
    </View>
  );
}
