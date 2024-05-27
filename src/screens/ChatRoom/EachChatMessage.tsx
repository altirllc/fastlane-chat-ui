/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-native/no-inline-styles */
import React, { } from 'react';
import {
    View,
    Image,
    Text,
    Alert,
} from 'react-native';
import moment from 'moment';

// import { SafeAreaView } from 'react-native-safe-area-context';
import {
    Menu,
    MenuOptions,
    MenuOption,
    MenuTrigger,
} from 'react-native-popup-menu';
import { SvgXml } from 'react-native-svg';
import { deletedIcon, personXml } from '../../svg/svg-xml-list';
// import { GroupChatIcon } from '../../svg/GroupChatIcon';
import { AvatarIcon } from '../../svg/AvatarIcon';
// import { MenuIcon } from '../../svg/MenuIcon';
// import { PlusIcon } from '../../svg/PlusIcon';
import MediaSection from 'amity-react-native-social-ui-kit/src/components/MediaSection';
import { ECustomData, IMessage } from '@amityco/react-native-cli-chat-ui-kit/src/screens/ChatRoom/ChatRoom';
import useAuth from '@amityco/react-native-cli-chat-ui-kit/src/hooks/useAuth';
import { useStyles } from './styles';
import { MessageRepository } from '@amityco/ts-sdk-react-native';
// @ts-ignore
import { useReadStatus } from '@amityco/react-native-cli-chat-ui-kit/src/hooks/useReadStatus';

export type TEachChatMessage = {
    message: IMessage;
    index: number;
    sortedMessages: IMessage[];
    isGroupChat: boolean;
    openEditMessageModal: (messageId: string, text: string) => void;
    openFullImage: (image: string, messageType: string) => void;
}

export const EachChatMessage = ({
    message,
    index,
    sortedMessages,
    isGroupChat,
    openEditMessageModal,
    openFullImage
}: TEachChatMessage) => {

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

    const { client, apiRegion } = useAuth();
    const styles = useStyles();

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

    const { isDelivered, getReadComponent } = useReadStatus()


    const isNormalText = message.messageType === 'text';
    const isImage = message.messageType === 'image';
    const isAnnouncement = message?.messageType === "custom" && message.customData?.type === ECustomData.announcement
    const isSocialPost = message?.messageType === "custom" && message.customData?.type === ECustomData.post;
    const imageIds = message?.messageType === "custom" && message.customData?.imageIds;
    const postCreator = message?.customData?.extraData?.postCreator

    return (
        <View>
            {isRenderDivider && renderTimeDivider(message.createdAt)}
            <View
                style={!isUserChat ? isAnnouncement ? styles.leftMessageWrap : [styles.leftMessageWrap, { flexDirection: 'row' }] : styles.rightMessageWrap}
            >
                {!isUserChat && !isAnnouncement &&
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
                    {!isUserChat && isGroupChat && !isAnnouncement ? (
                        <Text
                            style={isUserChat ? styles.chatUserText : styles.chatFriendText}
                        >
                            {message.user.name}
                        </Text>
                    ) : null}
                    {isAnnouncement && message.customData?.text ? (
                        <Text style={{ color: '#6E768A', fontSize: 12, fontWeight: '400', marginHorizontal: 20, lineHeight: 17, alignSelf: 'center' }}>
                            {message.customData?.text}
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
                                {isNormalText ? (
                                    <View
                                        key={message._id}
                                        style={[
                                            styles.textChatBubble,
                                            isUserChat ? styles.userBubble : styles.friendBubble,
                                            isGroupChat
                                                ? { marginVertical: 5 }
                                                : { marginBottom: 5 },
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
                                ) : isImage ? (
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
                                ) : isSocialPost ? (
                                    <>
                                        <View style={[
                                            styles.bodySection,
                                            isUserChat ? { alignSelf: 'flex-end' } : { alignSelf: 'flex-start' }
                                        ]}>
                                            {
                                                postCreator ? (
                                                    <View style={styles.postCreatorContainer}>
                                                        <View style={{ width: '15%' }}>
                                                            {postCreator?.avatarFileId ? (
                                                                <Image
                                                                    style={{
                                                                        width: 35,
                                                                        height: 35,
                                                                        borderRadius: 35 / 2
                                                                    }}
                                                                    source={{
                                                                        uri: `https://api.${apiRegion}.amity.co/api/v3/files/${postCreator?.avatarFileId}/download`,
                                                                    }}
                                                                />
                                                            ) : (
                                                                <View style={{
                                                                    width: 35,
                                                                    height: 35,
                                                                    borderRadius: 35 / 2
                                                                }}>
                                                                    <SvgXml xml={personXml} width="20" height="16" />
                                                                </View>
                                                            )}
                                                        </View>
                                                        {
                                                            postCreator.displayName ? (
                                                                <View style={{ width: '85%', paddingLeft: 15 }}>
                                                                    <Text numberOfLines={1} style={{ fontSize: 16, fontWeight: '600' }}>{postCreator.displayName}</Text>
                                                                </View>
                                                            ) : null
                                                        }
                                                    </View>
                                                ) : null
                                            }
                                            {imageIds && imageIds?.length > 0 && (
                                                <MediaSection borderRadius={false} childrenPosts={imageIds} />
                                            )}
                                            {message.customData?.text ? (
                                                <Text
                                                    style={
                                                        styles.postCaption
                                                    }
                                                >
                                                    {message.customData?.text}
                                                </Text>
                                            ) : null}
                                        </View>
                                    </>
                                ) : null}
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
                    {
                        !isAnnouncement ? (
                            <View
                                style={{
                                    flexDirection: 'row',
                                    alignSelf: isUserChat ? 'flex-end' : 'flex-start',
                                }}
                            >
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
                                {isUserChat && isDelivered ?
                                    getReadComponent(message._id)
                                    : null}
                            </View>
                        ) : null
                    }
                </View>
            </View>
        </View>
    );

}