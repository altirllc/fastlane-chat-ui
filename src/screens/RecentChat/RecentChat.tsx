import React, { type ReactElement, useMemo, useRef } from 'react';

import {
  View,
  FlatList,
  TouchableOpacity,
  Text,
} from 'react-native';

import { ChannelRepository, getChannelTopic, subscribeTopic } from '@amityco/ts-sdk-react-native';
import ChatList, { type IChatListProps } from '../../components/ChatList/index';
import useAuth from '../../hooks/useAuth';
import { useEffect, useState } from 'react';
import moment from 'moment';
import { PlusIcon } from '../../svg/PlusIcon';

import { useStyles } from './styles';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Icon } from 'react-native-paper';
import { useCustomTheme } from '../../hooks/useCustomTheme';
import { getShadowProps } from '../../theme/helpers';
import { LoadingOverlay } from '@amityco/react-native-cli-chat-ui-kit/src/components/LoadingOverlay';

export default function RecentChat() {
  const { isConnected } = useAuth();
  const [channelObjects, setChannelObjects] = useState<IChatListProps[]>([]);
  const [loadChannel, setLoadChannel] = useState<boolean>(false);
  const styles = useStyles()

  const flatListRef = useRef(null);
  const { colors } = useCustomTheme();

  const [channelData, setChannelData] = useState<Amity.LiveCollection<Amity.Channel>>();


  const {
    data: channels = [],
    onNextPage,
    hasNextPage,
  } = channelData ?? {};
  const disposers: Amity.Unsubscriber[] = [];
  const subscribedChannels: Amity.Channel['channelId'][] = [];

  const subscribeChannels = (channels: Amity.Channel[]) =>
    channels.forEach(c => {
      if (!subscribedChannels.includes(c.channelId) && !c.isDeleted) {
        subscribedChannels.push(c.channelId);

        disposers.push(subscribeTopic(getChannelTopic(c)));
      }
    });


  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  useEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [])

  const onQueryChannel = () => {
    setLoadChannel(true)
    const unsubscribe = ChannelRepository.getChannels(
      { sortBy: 'lastActivity', limit: 15, membership: 'member' },
      (value) => {
        setChannelData(value);
        subscribeChannels(channels);
        if (value?.data?.length > 0) setLoadChannel(false);
      },
    );
    disposers.push(unsubscribe);
  };
  useEffect(() => {
    onQueryChannel();
    return () => {
      console.log(disposers)
      disposers.forEach(fn => fn());
    };
  }, [isConnected]);


  useEffect(() => {
    if (channels.length > 0) {
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
            unReadMessage: item.unreadCount ?? 0,
            messageDate: dateDisplay ?? '',
            channelType: item.type ?? '',
            avatarFileId: item.avatarFileId,
          };
        }
      );
      setChannelObjects([...formattedChannelObjects]);
      setLoadChannel(false);
    }
  }, [channelData]);

  const handleLoadMore = () => {
    if (hasNextPage && onNextPage) {
      onNextPage();
    }
  };


  const renderRecentChat = useMemo(() => {
    return loadChannel ? <LoadingOverlay /> : <FlatList
      data={channelObjects}
      renderItem={({ item }) => renderChatList(item)}
      keyExtractor={(item) => item.chatId.toString()}
      onEndReached={handleLoadMore}
      onEndReachedThreshold={0.4}
      ref={flatListRef}
    />
  }, [loadChannel, channelObjects, handleLoadMore]);


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
      />
    );
  };


  return (
    <View style={styles.chatContainer}>
      <Text style={styles.chatHeader}>Chats</Text>
      {renderRecentChat}
      <TouchableOpacity
        onPress={() => {
          navigation.navigate("AddMembersInChat")
        }}
        style={[
          styles.createFeedButton,
          {
            ...getShadowProps({ color: colors.secondary.main }),
            backgroundColor: colors.primary.main,
          },
        ]}>
        <Icon
          source={PlusIcon}
          size={"xs"}
          color="transparent"
        />
      </TouchableOpacity>
    </View>
  );
}
