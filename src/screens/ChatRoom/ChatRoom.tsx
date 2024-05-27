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
  Image,
  LogBox,
  TouchableOpacity,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  FlatList,
  Keyboard,
  ActivityIndicator,
  LayoutAnimation,
} from 'react-native';
import ImageView from 'react-native-image-viewing';
import CustomText from '../../components/CustomText';
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
import BackButton from '../../components/BackButton';
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
// import { SafeAreaView } from 'react-native-safe-area-context';
import LoadingImage from '../../components/LoadingImage';
import EditMessageModal from '../../components/EditMessageModal';
// import { GroupChatIcon } from '../../svg/GroupChatIcon';
import { AvatarIcon } from '../../svg/AvatarIcon';
import { CameraBoldIcon } from '../../svg/CameraBoldIcon';
// import { MenuIcon } from '../../svg/MenuIcon';
// import { PlusIcon } from '../../svg/PlusIcon';
import { SendChatIcon } from '../../svg/SendChatIcon';
import { AlbumIcon } from '../../svg/AlbumIcon';
import { useTheme } from 'react-native-paper';
import type { MyMD3Theme } from '../../providers/amity-ui-kit-provider';
import { AlertIcon } from '../../svg/AlertIcon';
import { SendImage } from '../../svg/SendImage';
import { AuthContext } from '../../store/context';
import { useReadStatus } from '../../hooks/useReadStatus';
import { useAvatarArray } from '../../../src/hooks/useAvatarArray';
import { Avatar } from '../../../src/components/Avatar/Avatar';
// @ts-ignore
import { EachChatMessage } from '@amityco/react-native-cli-chat-ui-kit/src/screens/ChatRoom/EachChatMessage';

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

  const { avatarArray } = useAvatarArray(groupChat)

  const isGroupChat = useMemo(() => {
    return groupChat !== undefined;
  }, [groupChat]);

  const { client, apiRegion } = useAuth();
  const { setIsTabBarVisible } = useContext(AuthContext);
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [messagesData, setMessagesData] =
    useState<Amity.LiveCollection<Amity.Message>>();
  const [imageMultipleUri, setImageMultipleUri] = useState<string[]>([]);
  const theme = useTheme() as MyMD3Theme;

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
  const stopRead = async () => {
    await SubChannelRepository.stopReading(channelId);
  };
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

  const handleSend = async () => {
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
  };

  function handleBack(): void {
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
  }

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

  const scrollToBottom = () => {
    if (flatListRef && flatListRef.current) {
      (flatListRef.current as Record<string, any>).scrollToOffset({
        animated: true,
        offset: 0,
      });
    }
  };
  const handleOnFocus = () => {
    setIsExpanded(false);
  };

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
      <View style={styles.topBar}>
        <View style={styles.chatTitleWrap}>
          <BackButton styles={styles.backButton} onPress={handleBack} />
          {chatReceiver ? (
            chatReceiver?.avatarFileId ? (
              <Image
                style={styles.avatar}
                source={{
                  uri: `https://api.${apiRegion}.amity.co/api/v3/files/${chatReceiver?.avatarFileId}/download`,
                }}
              />
            ) : (
              <View style={styles.avatar}>
                <AvatarIcon />
              </View>
            )
          ) : groupChat?.avatarFileId ? (
            <Image
              style={styles.avatar}
              source={{
                uri: `https://api.${apiRegion}.amity.co/api/v3/files/${groupChat?.avatarFileId}/download`,
              }}
            />
          ) : (
            <View style={styles.icon}>
              <Avatar avatars={avatarArray} />
            </View>
          )}
          <View>
            <CustomText style={styles.chatName} numberOfLines={1}>
              {chatReceiver
                ? chatReceiver?.displayName
                : groupChat?.displayName}
            </CustomText>
            {groupChat && (
              <CustomText style={styles.chatMember}>
                {groupChat?.memberCount} members
              </CustomText>
            )}
          </View>
        </View>
        <TouchableOpacity
          onPress={() => {
            navigation.navigate('ChatDetail', {
              channelId: channelId,
              channelType: chatReceiver ? 'conversation' : 'community',
              chatReceiver: chatReceiver ?? undefined,
              groupChat: groupChat ?? undefined,
            });
          }}
        >
          <AlertIcon color={theme.colors.base} />
        </TouchableOpacity>
      </View>
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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.select({ ios: 50, android: 80 })}
        style={styles.AllInputWrap}
      >
        <View style={styles.InputWrap}>
          <TextInput
            style={styles.input}
            value={inputMessage}
            onChangeText={(text) => setInputMessage(text)}
            placeholder="Type a message..."
            placeholderTextColor={theme.colors.baseShade3}
            onFocus={handleOnFocus}
          />

          {inputMessage.length > 0 ? (
            isSendLoading ? (
              <ActivityIndicator style={styles.sendIcon} />
            ) : (
              <TouchableOpacity onPress={handleSend} style={styles.sendIcon}>
                <SendChatIcon color={theme.colors.primary} />
              </TouchableOpacity>
            )
          ) : (
            <View>
              <TouchableOpacity onPress={handlePress} style={styles.sendIcon}>
                <SendImage color={theme.colors.base} />
              </TouchableOpacity>
            </View>
          )}
        </View>
        {isExpanded && (
          <View style={styles.expandedArea}>
            <TouchableOpacity
              onPress={pickCamera}
              style={{ marginHorizontal: 30 }}
            >
              <View style={styles.IconCircle}>
                <CameraBoldIcon color={theme.colors.base} />
              </View>
              <CustomText style={styles.iconText}>Camera</CustomText>
            </TouchableOpacity>
            <TouchableOpacity
              // disabled={loadingImages.length > 0}
              onPress={pickImage}
              style={{ marginHorizontal: 20, alignItems: 'center' }}
            >
              <View style={styles.IconCircle}>
                <AlbumIcon color={theme.colors.base} />
              </View>
              <CustomText style={styles.iconText}>Album</CustomText>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
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
