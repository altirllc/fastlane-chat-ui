/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-native/no-inline-styles */
import React, {
  useEffect,
  useMemo,
  useState,
  useRef,
  useLayoutEffect,
  useContext,
  useCallback,
} from 'react';
import {
  View,
  LogBox,
  FlatList,
  Keyboard,
  LayoutAnimation,
} from 'react-native';
import ImageView from 'react-native-image-viewing';
import { useStyles } from './styles';
import {
  type RouteProp,
  useNavigation,
  useRoute,
  CommonActions,
  useIsFocused,
} from '@react-navigation/native';
import type { RootStackParamList } from '../../routes/RouteParamList';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  MessageContentType,
  MessageRepository,
  SubChannelRepository,
  getSubChannelTopic,
  subscribeTopic,
} from '@amityco/ts-sdk-react-native';
import useAuth from '../../hooks/useAuth';

import EditMessageModal from '../../components/EditMessageModal';
import { AuthContext } from '../../store/context';
import { useReadStatus } from '../../hooks/useReadStatus';
// @ts-ignore
import { EachChatMessage } from './EachChatMessage';
import { TopBar } from './TopBar';
import { ChatRoomTextInput } from './ChatRoomTextInput';
import { RenderLoadingImages } from './components';
import { useImageHook } from './useImageHook';
import { getFormattedMessages } from './helpers';

type ChatRoomScreenComponentType = React.FC<{}>;
LogBox.ignoreLogs(['Warning: ...']); // Ignore log notification by message
LogBox.ignoreAllLogs();

export enum ECustomData {
  announcement = 'announcement',
  post = 'post'
}

export type TCustomData = {
  type?: ECustomData
  text?: string;
  imageIds?: string[];
  id?: string;
  extraData: {
    postCreator: Amity.User
  }
}
export interface IMessage {
  _id: string;
  text?: string;
  createdAt: string;
  editedAt: string;
  user: {
    _id: string;
    name: string;
    avatar: string;
  };
  image?: string;
  messageType: string;
  isPending?: boolean;
  isDeleted: boolean;
  customData?: TCustomData;
}
export interface IDisplayImage {
  url: string;
  fileId: string | undefined;
  fileName: string;
  isUploaded: boolean;
  thumbNail?: string;
}

const ChatRoom: ChatRoomScreenComponentType = () => {
  const styles = useStyles();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  const route = useRoute<RouteProp<RootStackParamList, 'ChatRoom'>>();
  const { chatReceiver, groupChat, channelId, from, channelType } = route.params;

  const isGroupChat = useMemo(() => {
    return groupChat !== undefined;
  }, [groupChat]);

  const { client, apiRegion } = useAuth();
  const { setIsTabBarVisible } = useContext(AuthContext);
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [messagesData, setMessagesData] =
    useState<Amity.LiveCollection<Amity.Message>>();

  const {
    data: messagesArr = [],
    onNextPage,
    hasNextPage,
  } = messagesData ?? {};

  const [inputMessage, setInputMessage] = useState('');
  const [sortedMessages, setSortedMessages] = useState<IMessage[]>([]);
  const flatListRef = useRef(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [subChannelData, setSubChannelData] = useState<Amity.SubChannel>();
  const [editMessageModal, setEditMessageModal] = useState<boolean>(false);
  const [editMessageId, setEditMessageId] = useState<string>('');
  const [editMessageText, setEditMessageText] = useState<string>('');
  const disposers: Amity.Unsubscriber[] = [];

  const [showTextInput, setShowTextInput] = useState(true)
  const [channelTypeBox, setChannelTypeBox] = useState<string>('')

  const { getReadStatusForMessage, messageStatusMap, getReadComponent, isDelivered } = useReadStatus()

  const [isSendLoading, setIsSendLoading] = useState(false);

  const {
    openFullImage,
    pickImage,
    handleOnFinishImage,
    pickCamera,
    displayImages,
    fullImage,
    visibleFullImage,
    setIsVisibleFullImage
  } = useImageHook(channelId)

  const isFocused = useIsFocused();

  useLayoutEffect(() => {
    //IMP: Don't remove setTimeout as this is used for showing footer on the screen.
    setTimeout(() => {
      if (isFocused) {
        //after screen focus, hide tabbar
        LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
        setIsTabBarVisible(false);
      }
    }, 500);
  }, [isFocused]);

  const subscribeSubChannel = (subChannel: Amity.SubChannel) =>
    disposers.push(subscribeTopic(getSubChannelTopic(subChannel)));

  useEffect(() => {
    if (channelId) {
      SubChannelRepository.getSubChannel(channelId, ({ data: subChannel }) => {
        setSubChannelData(subChannel);
      });
    }
    return () => {
      disposers.forEach((fn) => fn());
      stopRead();
    };
  }, [channelId]);

  const startRead = async () => {
    await SubChannelRepository.startMessageReceiptSync(channelId);
  };

  const stopRead = useCallback(async () => {
    await SubChannelRepository.stopMessageReceiptSync(channelId);
  }, [channelId]);

  useEffect(() => {
    if (subChannelData && channelId) {
      startRead();
      const unsubscribe = MessageRepository.getMessages(
        { subChannelId: channelId, limit: 10, includeDeleted: true },
        (value) => {
          const messages = value.data;
          //mark the last message as read
          if (messages.length > 0) {
            messages.forEach((eachMessage) => {
              if (eachMessage.creatorId !== (client as Amity.Client).userId) {
                //if friend's message, mark message as read
                eachMessage.markRead();
              }
            })
          }
          setMessagesData(value);
          //subsribe to the subchannel so that we recieve automatic updates of subchannel from server.
          subscribeSubChannel(subChannelData as Amity.SubChannel);
        }
      );
      disposers.push(() => unsubscribe);
    }
  }, [subChannelData]);

  useEffect(() => {
    (async () => {
      //if messages are changed, get the latest read status of them.
      if (!isGroupChat && !chatReceiver) {
        //get the read statuses only if there is a group chat or one to one chat.
        return;
      }
      const promises = messagesArr.map((eachMessage) => {
        //for each message, get the status
        //first check if creator id is same as the logged in user.
        const isUserChat =
          eachMessage.creatorId === (client as Amity.Client).userId;
        if (isUserChat) {
          //get read status only for the logged in user's own chats
          return getReadStatusForMessage(eachMessage.messageId, chatReceiver, groupChat, isGroupChat);
        }
        // Return a resolved promise for unselected channels to keep the array length consistent
        return Promise.resolve(null);
      });
      try {
        // Wait for all promises to be resolved
        await Promise.all(promises);
      } catch (e) {
        console.log('e', e);
      }
    })();
  }, [messagesArr, isGroupChat, chatReceiver, groupChat]);

  useEffect(() => {
    (() => {
      if (messagesArr.length > 0) {
        const resultantArray = getFormattedMessages(messagesArr, groupChat, apiRegion, chatReceiver)
        setMessages(resultantArray);
      }
    })()
  }, [messagesArr]);

  useEffect(() => {
    if (channelType && channelType === 'broadcast') {
      setShowTextInput(false)
      setChannelTypeBox('broadcast')
    } else {
      setShowTextInput(true)
      setChannelTypeBox('')
    }
  }, [channelType])

  const handleSend = useCallback(async () => {
    setIsSendLoading(true);
    if (inputMessage.trim() === '') {
      return;
    }
    Keyboard.dismiss();

    const textMessage = {
      subChannelId: channelId,
      dataType: MessageContentType.TEXT,
      data: {
        text: inputMessage,
      },
    };

    const { data: message } =
      await MessageRepository.createMessage(textMessage);
    if (message) {
      setInputMessage('');
      scrollToBottom();
      setIsSendLoading(false);
    }
  }, [inputMessage, channelId]);

  const handleBack = useCallback(() => {
    disposers.forEach((fn) => fn());
    stopRead();
    if (from === 'AddMembersFlow') {
      //if coming from add group name screen, reload the chats
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'RecentChat' }],
        })
      );
    } else {
      //or else just go back
      navigation.goBack();
    }
  }, [disposers, from, navigation])

  const loadNextMessages = () => {
    if (flatListRef.current && hasNextPage && onNextPage) {
      onNextPage();
    }
  };

  useEffect(() => {
    const sortedMessagesData: IMessage[] = messages.sort((x, y) => {
      return new Date(x.createdAt) < new Date(y.createdAt) ? 1 : -1;
    });
    const reOrderArr = sortedMessagesData;
    setSortedMessages([...reOrderArr]);
  }, [messages]);

  const handlePress = () => {
    Keyboard.dismiss();
    setIsExpanded(!isExpanded);
  };

  const scrollToBottom = useCallback(() => {
    if (flatListRef && flatListRef.current) {
      (flatListRef.current as Record<string, any>).scrollToOffset({
        animated: true,
        offset: 0,
      });
    }
  }, [flatListRef]);

  const handleOnFocus = useCallback(() => {
    setIsExpanded(false);
  }, []);

  const openEditMessageModal = useCallback((messageId: string, text: string) => {
    setEditMessageId(messageId);
    setEditMessageModal(true);
    setEditMessageText(text);
  }, []);

  const closeEditMessageModal = () => {
    setEditMessageId('');
    setEditMessageText('');
    setEditMessageModal(false);
  };

  return (
    <View style={styles.container}>
      <TopBar
        chatReceiver={chatReceiver}
        handleBack={handleBack}
        groupChat={groupChat}
        channelId={channelId}
        channelType={channelTypeBox}
      />
      <View style={styles.chatContainer}>
        <FlatList
          data={sortedMessages}
          renderItem={({ item, index }) => (
            <EachChatMessage
              isGroupChat={isGroupChat}
              index={index}
              message={item}
              sortedMessages={sortedMessages}
              openEditMessageModal={openEditMessageModal}
              openFullImage={openFullImage}
              getReadComponent={getReadComponent}
              isDelivered={isDelivered}
            />
          )}
          keyExtractor={(item) => item._id}
          onEndReached={loadNextMessages}
          onEndReachedThreshold={0.5}
          inverted
          extraData={messageStatusMap}
          showsVerticalScrollIndicator={false}
          ref={flatListRef}
          ListHeaderComponent={() => (
            <RenderLoadingImages
              displayImages={displayImages}
              handleOnFinishImage={handleOnFinishImage}
            />)
          }
        />
      </View>
      {
        showTextInput ? (
          <ChatRoomTextInput
            inputMessage={inputMessage}
            isSendLoading={isSendLoading}
            isExpanded={isExpanded}
            setInputMessage={setInputMessage}
            handleOnFocus={handleOnFocus}
            handleSend={handleSend}
            handlePress={handlePress}
            pickCamera={pickCamera}
            pickImage={pickImage}
          />
        ) : null
      }

      <ImageView
        images={[{ uri: fullImage }]}
        imageIndex={0}
        visible={visibleFullImage}
        onRequestClose={() => setIsVisibleFullImage(false)}
      />
      <EditMessageModal
        visible={editMessageModal}
        onClose={closeEditMessageModal}
        messageText={editMessageText}
        onFinishEdit={closeEditMessageModal}
        messageId={editMessageId}
      />
    </View>
  );
};
export default ChatRoom;
