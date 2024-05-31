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
  const { isConnected } = useAuth();
  const [channelObjects, setChannelObjects] = useState<IChatListProps[]>([]);
  const [loadChannel, setLoadChannel] = useState<boolean>(false);
  const styles = useStyles();
  const { setIsTabBarVisible } = useContext(AuthContext);
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  //const [userIdForChat, setUserIdForChat] = useState('');

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

  useEffect(() => {
    if (isFocused && userIdForChatProp) {
      //setUserIdForChat(userIdForChatProp)
    }
  }, [isFocused, userIdForChatProp])

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
    onQueryChannel();
    return () => {
      console.log(disposers);
      disposers.forEach((fn) => fn());
    };
  }, [isConnected]);

  useEffect(() => {
    if (channels.length > 0) {
      // @ts-ignore
      const formattedChannelObjects: IChatListProps[] = channels.map(
        (item: Amity.Channel<any>) => {
          const lastActivityDate: string = moment(item.lastActivity).format(
            'DD/MM/YYYY'
          );
          const todayDate = moment(Date.now()).format('DD/MM/YYYY');
          let dateDisplay;
          if (lastActivityDate === todayDate) {
            dateDisplay = moment(item.lastActivity).format('hh:mm A');
          } else {
            dateDisplay = moment(item.lastActivity).format('DD/MM/YYYY');
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
      setChannelObjects([...formattedChannelObjects]);
      setLoadChannel(false);
    }
  }, [channels]);

  const handleLoadMore = () => {
    if (hasNextPage && onNextPage) {
      onNextPage();
    }
  };

  const renderRecentChat = useMemo(() => {
    return !loadChannel ? (
      channelObjects.length > 0 ? (
        <FlatList
          data={channelObjects}
          renderItem={({ item }) => renderChatList(item)}
          keyExtractor={(item) => item.chatId.toString()}
          onEndReached={handleLoadMore}
          showsVerticalScrollIndicator={false}
          onEndReachedThreshold={0.4}
          ref={flatListRef}
        />
      ) : (
        <View style={styles.noMessageContainer}>
          <Text style={styles.noMessageText}>No Messages, yet.</Text>
          <Text style={styles.noMessageDesc}>
            No messages in your inbox, yet!
          </Text>
        </View>
      )
    ) : null;
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
      // userIdForChat={userIdForChat}
      //setUserIdForChat={setUserIdForChat}
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
