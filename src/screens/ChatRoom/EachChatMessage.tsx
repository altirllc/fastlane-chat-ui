/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-native/no-inline-styles */
import React, { memo } from 'react';
import {
    View,
    Text,
    Alert,
} from 'react-native';
import moment from 'moment';

import {
    Menu,
    MenuOptions,
    MenuOption,
    MenuTrigger,
} from 'react-native-popup-menu';
import { ECustomData, IMessage } from './ChatRoom';
import useAuth from '../../../src/hooks/useAuth';
import { useStyles } from './styles';
import { MessageRepository } from '@amityco/ts-sdk-react-native';
import {
    AvatarComponent,
    ImageComponent,
    MessageDeletedComponent,
    RenderTimeDivider,
    SocialPostComponent,
    TextComponent,
    TimeAndReadStatusComponent
} from '../../../src/screens/ChatRoom/components';

export type TEachChatMessage = {
    message: IMessage;
    index: number;
    sortedMessages: IMessage[];
    isGroupChat: boolean;
    openEditMessageModal: (messageId: string, text: string) => void;
    openFullImage: (image: string, messageType: string) => void;
    getReadComponent: (messageId: string) => React.JSX.Element;
    isDelivered: boolean;
}

export const EachChatMessage = memo(({
    message,
    index,
    sortedMessages,
    isGroupChat,
    openEditMessageModal,
    openFullImage,
    getReadComponent,
    isDelivered
}: TEachChatMessage) => {

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

    const onMessageDeletePress = () => {
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
    const { client } = useAuth();
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

    const isNormalText = message.messageType === 'text';
    const isImage = message.messageType === 'image';
    const isAnnouncement = message?.messageType === "custom" && message.customData?.type === ECustomData.announcement
    const isSocialPost = message?.messageType === "custom" && message.customData?.type === ECustomData.post;
    const imageIds = message?.messageType === "custom" && message.customData?.imageIds;
    const postCreator = message?.customData?.extraData?.postCreator

    return (
        <View>
            {isRenderDivider ? <RenderTimeDivider date={message.createdAt} /> : null}
            <View
                style={!isUserChat ? isAnnouncement ? styles.leftMessageWrap : [styles.leftMessageWrap, { flexDirection: 'row' }] : styles.rightMessageWrap}
            >
                <AvatarComponent isUserChat={isUserChat} isAnnouncement={isAnnouncement} avatar={message?.user?.avatar || ''} />
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
                        <MessageDeletedComponent isUserChat={isUserChat} />
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
                                    <TextComponent
                                        id={message._id}
                                        text={message.text || ''}
                                        isUserChat={isUserChat}
                                        isGroupChat={isGroupChat} />
                                ) : isImage ? (
                                    <ImageComponent imageStr={message.image} isUserChat={isUserChat} />
                                ) : isSocialPost ? (
                                    <SocialPostComponent customDataText={message.customData?.text} isUserChat={isUserChat} postCreator={postCreator} imageIds={imageIds} />
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
                                        onSelect={onMessageDeletePress}
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
                    <TimeAndReadStatusComponent
                        isAnnouncement={isAnnouncement}
                        createdAt={message.createdAt}
                        editedAt={message.editedAt}
                        id={message._id}
                        isUserChat={isUserChat}
                        getReadComponent={getReadComponent}
                        isDelivered={isDelivered}
                    />
                </View>
            </View>
        </View>
    );

});