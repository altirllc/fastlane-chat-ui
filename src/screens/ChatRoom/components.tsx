import React, { memo } from "react";
import { FlatList, View, Text, Image } from "react-native";
import LoadingImage from "../../../src/components/LoadingImage";
import { useStyles } from "./styles";
import { IDisplayImage } from "./ChatRoom";
import moment from 'moment';
import { AvatarIcon } from "../../../src/svg/AvatarIcon";
import { deletedIcon, personXml } from '../../svg/svg-xml-list';
import { SvgXml } from "react-native-svg";
import MediaSection from "../../../src/components/MediaSection";
import useAuth from "../../../src/hooks/useAuth";


export type TRenderLoadingImages = {
    displayImages: IDisplayImage[];
    handleOnFinishImage: (fileId: string, originalPath: string) => Promise<void>
}

export const RenderLoadingImages = memo(({ displayImages, handleOnFinishImage }: TRenderLoadingImages) => {
    const styles = useStyles();

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
});

export const RenderTimeDivider = memo(({ date }: { date: string }) => {
    const currentDate = date;
    const formattedDate = moment(currentDate).format('MMMM DD, YYYY');
    const today = moment().startOf('day');
    const styles = useStyles();

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
});

export type TAvatarComponent = {
    isUserChat: boolean;
    isAnnouncement: boolean;
    avatar: string;
}
export const AvatarComponent = memo(({ isUserChat, isAnnouncement, avatar, }: TAvatarComponent) => {
    const styles = useStyles();

    return !isUserChat && !isAnnouncement ?
        avatar ? (
            <Image
                source={{ uri: avatar }}
                style={styles.avatarImage}
            />
        ) : (
            <View style={styles.avatarImage}>
                <AvatarIcon />
            </View>
        ) : null

})


export const MessageDeletedComponent = memo(({ isUserChat }: { isUserChat: boolean }) => {
    const styles = useStyles();
    return (
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
    )
})

export type TTimeAndReadStatusComponent = {
    isAnnouncement: boolean;
    createdAt: string;
    editedAt: string
    id: string;
    isUserChat: boolean;
    getReadComponent: (messageId: string) => React.JSX.Element;
    isDelivered: boolean
}

export const TimeAndReadStatusComponent = ({ isAnnouncement, isUserChat, createdAt, editedAt, id, getReadComponent, isDelivered }: TTimeAndReadStatusComponent) => {
    const styles = useStyles();

    return !isAnnouncement ? (
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
                {createdAt != editedAt ? 'Edited ·' : ''}{' '}
                {moment(createdAt).format('hh:mm A')}
            </Text>
            {isUserChat && isDelivered ?
                getReadComponent(id)
                : null}
        </View>
    ) : null
}

export type TTextComponent = {
    id: string;
    isUserChat: boolean;
    isGroupChat: boolean;
    text: string
}

export const TextComponent = memo(({ id, isUserChat, isGroupChat, text }: TTextComponent) => {
    const styles = useStyles();
    return (
        <View
            key={id}
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
                {text}
            </Text>
        </View>
    )
})


export const ImageComponent = memo(({ imageStr, isUserChat }: { imageStr: string | undefined; isUserChat: boolean }) => {
    const styles = useStyles();
    return (
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
                    uri: imageStr + '?size=medium',
                }}
            />
        </View>
    )
})

export type TSocialPostComponent = {
    isUserChat: boolean;
    postCreator: Amity.User | undefined
    imageIds: false | string[] | undefined
    customDataText: string | undefined
}

export const SocialPostComponent = ({ isUserChat, postCreator, imageIds, customDataText }: TSocialPostComponent) => {
    const styles = useStyles();
    const { apiRegion } = useAuth();


    return (
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
                {customDataText ? (
                    <Text style={styles.postCaption}>
                        {customDataText}
                    </Text>
                ) : null}
            </View>
        </>
    )
}