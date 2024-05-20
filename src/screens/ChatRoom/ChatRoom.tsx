/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-native/no-inline-styles */
import React, { useEffect, useMemo, useState, useRef } from 'react';
import {
  View,
  Image,
  LogBox,
  TouchableOpacity,
  TextInput,
  Platform,
  Text,
  KeyboardAvoidingView,
  FlatList,
  Keyboard,
  Alert,
  ActivityIndicator,
} from 'react-native';
import ImageView from 'react-native-image-viewing';
import CustomText from '../../components/CustomText';
import { useStyles } from './styles';
import { type RouteProp, useNavigation, useRoute, CommonActions } from '@react-navigation/native';
import type { RootStackParamList } from '../../routes/RouteParamList';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import BackButton from '../../components/BackButton';
import moment from 'moment';
import {
  MessageContentType,
  MessageRepository,
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
import {
  Menu,
  MenuOptions,
  MenuOption,
  MenuTrigger,
} from 'react-native-popup-menu';
import { SvgXml } from 'react-native-svg';
import { deletedIcon } from '../../svg/svg-xml-list';
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
import { CommunityChatIcon } from '../../svg/CommunityChatIcon';
import { SendImage } from '../../svg/SendImage';
import { CheckIcon } from '../../svg/CheckIcon';

type ChatRoomScreenComponentType = React.FC<{}>;
LogBox.ignoreLogs(['Warning: ...']); // Ignore log notification by message
LogBox.ignoreAllLogs();

interface IMessage {
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
}
export interface IDisplayImage {
  url: string;
  fileId: string | undefined;
  fileName: string;
  isUploaded: boolean;
  thumbNail?: string;
}

interface MessageStatus {
  readMessageStatus: boolean;
}

type MessageStatusMap = Map<string, MessageStatus>;

const ChatRoom: ChatRoomScreenComponentType = () => {
  const styles = useStyles();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  const route = useRoute<RouteProp<RootStackParamList, 'ChatRoom'>>();
  const { chatReceiver, groupChat, channelId, from } = route.params;

  const isGroupChat = useMemo(() => {
    return groupChat !== undefined;
  }, [groupChat])

  const { client, apiRegion } = useAuth();
  // const { setIsTabBarVisible } = useContext(AuthContext)
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

  const [messageStatusMap, setMessageStatusMap] = useState<MessageStatusMap>(new Map());
  const [isSendLoading, setIsSendLoading] = useState(false);

  // useLayoutEffect(() => {
  //   setIsTabBarVisible(false);
  // }, []);

  const setMessageStatus = (messageId: string, readMessageStatus: boolean) => {
    setMessageStatusMap(prevMap => {
      const newMap = new Map(prevMap);
      newMap.set(messageId, { readMessageStatus });
      return newMap;
    });
  };


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

  const getReadStatusForMessage = async (messageId: string): Promise<boolean | undefined> => {
    return await new Promise(async (resolve, reject) => {
      try {
        const { data: users } = await MessageRepository.getReadUsers({
          messageId,
          memberships: ['member', 'banned', 'muted', 'non-member', 'deleted'],
        });
        if (users) {
          let isMessageReadByReceiver = false;
          const messageSeenUserIds = users.map(user => user.userId);

          if (chatReceiver) {
            //if one to one chat, check if reciever id exist in list of users who has seen this message.
            isMessageReadByReceiver = messageSeenUserIds.includes(chatReceiver?.userId);

          } else if (isGroupChat && groupChat?.users && groupChat.users.length > 0) {

            let haveAllUsersSeenMessage = true;

            for (let i = 0; i < groupChat?.users.length; i++) {
              const eachUser = groupChat?.users[i];
              if (eachUser && !messageSeenUserIds.includes(eachUser.userId)) {
                //if even one user from group chat haven't seen the message, just mark read status as false
                haveAllUsersSeenMessage = false;
                break; // Exit the loop
              }
            }

            isMessageReadByReceiver = haveAllUsersSeenMessage
          }
          setMessageStatus(messageId, isMessageReadByReceiver)
          resolve(true);
        }
      } catch (error) {
        reject(new Error('Unable to create channel ' + error));
      }
    });
  }

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
        const isUserChat = eachMessage.creatorId === (client as Amity.Client).userId;
        if (isUserChat) {
          //get read status only for the logged in user's own chats
          await getReadStatusForMessage(eachMessage.messageId);
        }
      }
    })()
  }, [messagesArr, isGroupChat, chatReceiver])

  useEffect(() => {
    if (messagesArr.length > 0) {
      const formattedMessages = messagesArr.map((item) => {
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
            name: chatReceiver?.displayName ??
              groupChat?.users?.find((user) => user.userId === item.creatorId)
                ?.displayName ??
              '',
            avatar: avatarUrl,
          },
          messageType: item.dataType,
          isDeleted: item.isDeleted as boolean,
        }
        if ((item?.data as Record<string, any>)?.fileId) {
          //if file present
          return {
            text: '',
            image:
              `https://api.${apiRegion}.amity.co/api/v3/files/${(item?.data as Record<string, any>).fileId
              }/download` ?? undefined,
            ...commonObj
          };
        } else {
          //if file doesnt present
          return {
            text:
              ((item?.data as Record<string, string>)?.text as string) ?? '',
            ...commonObj
          };
        }
      });
      setMessages(formattedMessages);
    }
  }, [messagesArr]);

  const handleSend = async () => {
    setIsSendLoading(true)
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
      setIsSendLoading(false)
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
          routes: [{ name: "RecentChat" }],
        }),
      );
    } else {
      //or else just go back
      navigation.goBack()
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

  const openFullImage = (image: string, messageType: string) => {
    if (messageType === 'image' || messageType === 'file') {
      const fullSizeImage: string = image + '?size=full';
      setFullImage(fullSizeImage);
      setIsVisibleFullImage(true);
    }
  };

  const renderTimeDivider = (date: string) => {
    const currentDate = date;
    const formattedDate = moment(currentDate).format('MMMM DD, YYYY');
    const today = moment().startOf('day');

    let displayText = formattedDate;

    if (moment(currentDate).isSame(today, 'day')) {
      displayText = 'Today';
    }

    return (
      <View style={styles.bubbleDivider}>
        <View style={styles.textDivider}>
          <Text style={styles.dateText}>{displayText}</Text>
        </View>
      </View>
    );
  };

  const deleteMessage = async (messageId: string) => {
    const message = await MessageRepository.softDeleteMessage(messageId);
    return message;
  };

  const reportMessage = async (messageId: string) => {
    const isFlagged = await MessageRepository.flagMessage(messageId);
    if (isFlagged) {
      Alert.alert('Report sent ✅');
    }
  };

  const renderChatMessages = (message: IMessage, index: number) => {
    const isUserChat: boolean =
      message?.user?._id === (client as Amity.Client).userId;
    //isUserChat - is chat of the the user who is logged in?

    let isRenderDivider = false;
    const messageDate = moment(message.createdAt);

    const previousMessageDate = moment(sortedMessages[index + 1]?.createdAt);
    const isSameDay = messageDate.isSame(previousMessageDate, 'day');

    if (!isSameDay || index === sortedMessages.length - 1) {
      isRenderDivider = true;
    }

    //as message is apprearing on feed, mark it as delivered
    const isDelivered = true;
    const isRead = messageStatusMap.get(message._id)?.readMessageStatus;

    return (
      <View>
        {isRenderDivider && renderTimeDivider(message.createdAt)}
        <View
          style={!isUserChat ? styles.leftMessageWrap : styles.rightMessageWrap}
        >
          {!isUserChat &&
            (message.user.avatar ? (
              <Image
                source={{ uri: message.user.avatar }}
                style={styles.avatarImage}
              />
            ) : (
              <View style={styles.avatarImage}>
                <AvatarIcon />
              </View>
            ))}

          <View>
            {!isUserChat && isGroupChat ? (
              <Text
                style={isUserChat ? styles.chatUserText : styles.chatFriendText}
              >
                {message.user.name}
              </Text>
            ) : null}
            {message.isDeleted ? (
              <View
                style={[
                  styles.deletedMessageContainer,
                  isUserChat
                    ? styles.userMessageDelete
                    : styles.friendMessageDelete,
                ]}
              >
                <View style={styles.deletedMessageRow}>
                  <SvgXml xml={deletedIcon} width={20} height={20} />
                  <Text style={styles.deletedMessage}>Message Deleted</Text>
                </View>
              </View>
            ) : (
              <Menu>
                <MenuTrigger
                  onAlternativeAction={() =>
                    openFullImage(message.image as string, message.messageType)
                  }
                  customStyles={{
                    triggerTouchable: { underlayColor: 'transparent' },
                  }}
                  triggerOnLongPress
                >
                  {message.messageType === 'text' ? (
                    <View
                      key={message._id}
                      style={[
                        styles.textChatBubble,
                        isUserChat ? styles.userBubble : styles.friendBubble,
                        isGroupChat ? { marginVertical: 5 } : { marginBottom: 5 }
                      ]}
                    >
                      <Text
                        style={
                          isUserChat
                            ? styles.chatUserText
                            : styles.chatFriendText
                        }
                      >
                        {message.text}
                      </Text>
                    </View>
                  ) : (
                    <View
                      style={[
                        styles.imageChatBubble,
                        isUserChat
                          ? styles.userImageBubble
                          : styles.friendBubble,
                      ]}
                    >
                      <Image
                        style={styles.imageMessage}
                        source={{
                          uri: message.image + '?size=medium',
                        }}
                      />
                    </View>
                  )}
                </MenuTrigger>
                <MenuOptions
                  customStyles={{
                    optionsContainer: {
                      ...styles.optionsContainer,
                      marginLeft: isUserChat
                        ? 240 +
                        (message.text && message.text.length < 5
                          ? message.text.length * 10
                          : 10)
                        : 0,
                    },
                  }}
                >
                  {isUserChat ? (
                    <MenuOption
                      onSelect={() =>
                        Alert.alert(
                          'Delete this message?',
                          `Message will be also be permanently removed from your friend's devices.`,
                          [
                            { text: 'Cancel', style: 'cancel' },
                            {
                              text: 'Delete',
                              style: 'destructive',
                              onPress: () => deleteMessage(message._id),
                            },
                          ]
                        )
                      }
                      text="Delete"
                    />
                  ) : (
                    <MenuOption
                      onSelect={() => reportMessage(message._id)}
                      text="Report"
                    />
                  )}
                  {message.messageType === 'text' && isUserChat && (
                    <MenuOption
                      onSelect={() => {
                        return openEditMessageModal(
                          message._id,
                          message.text as string
                        );
                      }}
                      text="Edit"
                    />
                  )}
                </MenuOptions>
              </Menu>
            )}
            <View style={{ flexDirection: 'row', alignSelf: isUserChat ? 'flex-end' : 'flex-start' }}>
              <Text
                style={[
                  styles.chatTimestamp,
                  {
                    alignSelf: isUserChat ? 'flex-end' : 'flex-start',
                  },
                ]}
              >
                {message.createdAt != message.editedAt ? 'Edited ·' : ''}{' '}
                {moment(message.createdAt).format('hh:mm A')}
              </Text>
              {
                isUserChat && isDelivered ?
                  (
                    <View style={{ marginLeft: 5, flexDirection: 'row' }}>
                      <CheckIcon height={20} width={20} color={isRead ? theme.colors.chatBubbles?.userBubble : theme.colors.baseShade2} />
                      <View style={{ marginLeft: -10 }}>
                        <CheckIcon height={20} width={20} color={isRead ? theme.colors.chatBubbles?.userBubble : theme.colors.baseShade2} />
                      </View>
                    </View>
                  ) : null
              }
            </View>
          </View>
        </View>
      </View>
    );
  };

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

  const openEditMessageModal = (messageId: string, text: string) => {
    setEditMessageId(messageId);
    setEditMessageModal(true);
    setEditMessageText(text);
  };

  const closeEditMessageModal = () => {
    setEditMessageId('');
    setEditMessageText('');
    setEditMessageModal(false);
  };

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
              <CommunityChatIcon />
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
          renderItem={({ item, index }) => renderChatMessages(item, index)}
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
        keyboardVerticalOffset={Platform.select({ ios: 120, android: 80 })}
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

          {inputMessage.length > 0 ? isSendLoading ? <ActivityIndicator style={styles.sendIcon} /> : (
            <TouchableOpacity onPress={handleSend} style={styles.sendIcon}>
              <SendChatIcon color={theme.colors.primary} />
            </TouchableOpacity>
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
