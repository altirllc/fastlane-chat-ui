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
  PostRepository,
  SubChannelRepository,
  getSubChannelTopic,
  subscribeTopic,
} from '@amityco/ts-sdk-react-native';
import useAuth from '../../hooks/useAuth';

import ImagePicker, {
  launchImageLibrary,
  type Asset,
  launchCamera,
} from 'react-native-image-picker';
import LoadingImage from '../../components/LoadingImage';
import EditMessageModal from '../../components/EditMessageModal';
import { AuthContext } from '../../store/context';
import { useReadStatus } from '../../hooks/useReadStatus';
// @ts-ignore
import { EachChatMessage } from './EachChatMessage';
import { TopBar } from './TopBar';
import { ChatRoomTextInput } from './ChatRoomTextInput';

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

//type TPostDetailsMap = Map<string, TPostDetail>;

// type TPostDetail = {
//   postImage: string;
//   postId: string;
//   postText: string;
// }

const ChatRoom: ChatRoomScreenComponentType = () => {
  const styles = useStyles();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  const route = useRoute<RouteProp<RootStackParamList, 'ChatRoom'>>();
  const { chatReceiver, groupChat, channelId, from } = route.params;

  const isGroupChat = useMemo(() => {
    return groupChat !== undefined;
  }, [groupChat]);

  const { client, apiRegion } = useAuth();
  const { setIsTabBarVisible } = useContext(AuthContext);
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [messagesData, setMessagesData] =
    useState<Amity.LiveCollection<Amity.Message>>();
  const [imageMultipleUri, setImageMultipleUri] = useState<string[]>([]);

  const {
    data: messagesArr = [],
    onNextPage,
    hasNextPage,
  } = messagesData ?? {};

  const [inputMessage, setInputMessage] = useState('');
  const [sortedMessages, setSortedMessages] = useState<IMessage[]>([]);
  const flatListRef = useRef(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [visibleFullImage, setIsVisibleFullImage] = useState<boolean>(false);
  const [fullImage, setFullImage] = useState<string>('');
  const [subChannelData, setSubChannelData] = useState<Amity.SubChannel>();
  const [displayImages, setDisplayImages] = useState<IDisplayImage[]>([]);
  const [editMessageModal, setEditMessageModal] = useState<boolean>(false);
  const [editMessageId, setEditMessageId] = useState<string>('');
  const [editMessageText, setEditMessageText] = useState<string>('');
  const disposers: Amity.Unsubscriber[] = [];

  const { getReadStatusForMessage, messageStatusMap } = useReadStatus()

  const [isSendLoading, setIsSendLoading] = useState(false);
  // const [postDetailsMap, setPostDetailsMap] = useState<TPostDetailsMap>(new Map())

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
    await SubChannelRepository.startReading(channelId);
  };

  const stopRead = useCallback(async () => {
    await SubChannelRepository.stopReading(channelId);
  }, [channelId]);

  useEffect(() => {
    if (subChannelData && channelId) {
      startRead();
      const unsubscribe = MessageRepository.getMessages(
        { subChannelId: channelId, limit: 10, includeDeleted: true },
        (value) => {
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
      for (const eachMessage of messagesArr) {
        //for each message, get the status

        //first check if creator id is same as the logged in user.
        const isUserChat =
          eachMessage.creatorId === (client as Amity.Client).userId;
        if (isUserChat) {
          //get read status only for the logged in user's own chats
          await getReadStatusForMessage(eachMessage.messageId, chatReceiver, groupChat, isGroupChat);
        }
      }
    })();
  }, [messagesArr, isGroupChat, chatReceiver, groupChat]);

  useEffect(() => {
    (() => {
      if (messagesArr.length > 0) {
        let formattedMessages: IMessage[] = [];
        for (const item of messagesArr) {
          const targetIndex: number | undefined =
            groupChat &&
            groupChat.users?.findIndex(
              (groupChatItem) => item.creatorId === groupChatItem.userId
            );
          let avatarUrl = '';
          if (
            groupChat &&
            targetIndex &&
            (groupChat?.users as any)[targetIndex as number]?.avatarFileId
          ) {
            avatarUrl = `https://api.${apiRegion}.amity.co/api/v3/files/${(groupChat?.users as any)[targetIndex as number]
              ?.avatarFileId as any
              }/download`;
          } else if (chatReceiver && chatReceiver.avatarFileId) {
            avatarUrl = `https://api.${apiRegion}.amity.co/api/v3/files/${chatReceiver.avatarFileId}/download`;
          }
          let commonObj = {
            _id: item.messageId,
            createdAt: item.createdAt as string,
            editedAt: item.updatedAt as string,
            user: {
              _id: item.creatorId ?? '',
              name:
                chatReceiver?.displayName ??
                groupChat?.users?.find((user) => user.userId === item.creatorId)
                  ?.displayName ??
                '',
              avatar: avatarUrl,
            },
            messageType: item.dataType,
            isDeleted: item.isDeleted as boolean,
            // @ts-ignore
            customData: {
              type: '',
              text: '',
              imageIds: [],
              id: '',
              extraData: {
                postCreator: null
              }
            } as TCustomData
          };
          // @ts-ignore
          if (item.dataType === 'custom' && item?.data?.type === ECustomData.post && item?.data?.id) {
            //if datatype is custom and data is post from social feed
            //TODO: Handle post image data and UI also
            // @ts-ignore
            PostRepository.getPost(item.data?.id, ({ data }) => {
              console.log("data for post", data)
              if (data) {
                //let imageUrls = []
                if (data.children?.length > 0) {
                  commonObj.customData.imageIds = [...data.children]
                }
                if (data?.creator && Object.keys(data.creator).length > 0) {
                  commonObj.customData.extraData.postCreator = data?.creator
                }
                commonObj.customData.type = ECustomData.post
                commonObj.customData.id = data._id;
                commonObj.customData.text = data?.data?.text;
              }
            });
            // @ts-ignore
          } else if (item.dataType === 'custom' && item?.data?.type === ECustomData.announcement) {
            commonObj.customData.type = ECustomData.announcement
            commonObj.customData.text = (item?.data as Record<string, string>)?.text as string;
          }
          if ((item?.data as Record<string, any>)?.fileId) {
            //if file present
            // @ts-ignore
            formattedMessages.push({
              text: '',
              image:
                `https://api.${apiRegion}.amity.co/api/v3/files/${(item?.data as Record<string, any>).fileId
                }/download` ?? undefined,
              ...commonObj,
            })
          } else {
            //if file doesnt present
            // @ts-ignore
            formattedMessages.push({
              text:
                ((item?.data as Record<string, string>)?.text as string) ?? '',
              ...commonObj,
            })
          }
        }
        setMessages(formattedMessages);
      }
    })()
  }, [messagesArr]);

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

  const pickCamera = async () => {
    const result: ImagePicker.ImagePickerResponse = await launchCamera({
      mediaType: 'photo',
      quality: 1,
    });
    if (
      result.assets &&
      result.assets.length > 0 &&
      result.assets[0] !== null &&
      result.assets[0]
    ) {
      const imagesArr: string[] = [...imageMultipleUri];
      imagesArr.push(result.assets[0].uri as string);
      setImageMultipleUri(imagesArr);
    }
  };

  const createImageMessage = async (fileId: string) => {
    if (fileId) {
      const imageMessage = {
        subChannelId: channelId,
        dataType: MessageContentType.IMAGE,
        fileId: fileId,
      };
      await MessageRepository.createMessage(imageMessage);
    }
  };

  const handleOnFinishImage = async (fileId: string, originalPath: string) => {
    createImageMessage(fileId);
    setTimeout(() => {
      setDisplayImages((prevData) => {
        const newData: IDisplayImage[] = prevData.filter(
          (item: IDisplayImage) => item.url !== originalPath
        ); // Filter out objects containing the desired value
        return newData; // Update the state with the filtered array
      });
      setImageMultipleUri((prevData) => {
        const newData = prevData.filter((url: string) => url !== originalPath); // Filter out objects containing the desired value
        return newData; // Update the state with the filtered array
      });
    }, 0);
  };

  useEffect(() => {
    if (imageMultipleUri.length > 0 && displayImages.length === 0) {
      const imagesObject: IDisplayImage[] = imageMultipleUri.map(
        (url: string) => {
          const fileName: string = url.substring(url.lastIndexOf('/') + 1);

          return {
            url: url,
            fileName: fileName,
            fileId: '',
            isUploaded: false,
          };
        }
      );
      setDisplayImages([imagesObject[0]] as IDisplayImage[]);
    }
  }, [imageMultipleUri]);

  const pickImage = async () => {
    const result: ImagePicker.ImagePickerResponse = await launchImageLibrary({
      mediaType: 'photo',
      quality: 1,
      selectionLimit: 10,
    });
    if (!result.didCancel && result.assets && result.assets.length > 0) {
      const selectedImages: Asset[] = result.assets;
      const imageUriArr: string[] = selectedImages.map(
        (item: Asset) => item.uri
      ) as string[];
      const imagesArr = [...imageMultipleUri];
      const totalImages = imagesArr.concat(imageUriArr);
      setImageMultipleUri(totalImages);
    }
  };
  const renderLoadingImages = useMemo(() => {
    return (
      <View style={styles.loadingImage}>
        <FlatList
          keyExtractor={(item, index) => item.fileName + index}
          data={displayImages}
          renderItem={({ item, index }) => (
            <LoadingImage
              source={item.url}
              index={index}
              onLoadFinish={handleOnFinishImage}
              isUploaded={item.isUploaded}
              fileId={item.fileId}
            />
          )}
          scrollEnabled={false}
          numColumns={1}
        />
      </View>
    );
  }, [displayImages, handleOnFinishImage]);

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

  const openFullImage = useCallback((image: string, messageType: string) => {
    if (messageType === 'image' || messageType === 'file') {
      const fullSizeImage: string = image + '?size=full';
      setFullImage(fullSizeImage);
      setIsVisibleFullImage(true);
    }
  }, []);

  return (
    <View style={styles.container}>
      <TopBar
        chatReceiver={chatReceiver}
        handleBack={handleBack}
        groupChat={groupChat}
        channelId={channelId}
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
            />
          )}
          keyExtractor={(item) => item._id}
          onEndReached={loadNextMessages}
          onEndReachedThreshold={0.5}
          inverted
          extraData={messageStatusMap}
          showsVerticalScrollIndicator={false}
          ref={flatListRef}
          ListHeaderComponent={renderLoadingImages}
        />
      </View>
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
