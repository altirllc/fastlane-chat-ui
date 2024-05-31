import React, { memo } from "react";
import { View } from "react-native";
import { useStyles } from '../../components/ChatList/styles';
import useAuth from "../../../src/hooks/useAuth";
import { TMessagePreview } from "../../../src/hooks/useMessagePreview";
import { ECustomData } from "../../../src/screens/ChatRoom/ChatRoom";
import { ImageIcon } from "../../../src/svg/ImageIcon";
import CustomText from "../../../src/components/CustomText";

export type TMessagePreviewComponent = {
    messagePreview: TMessagePreview | undefined;
    chatMemberNumber: number;
    isDelivered: boolean;
    isUserLoggedInPreviewChat: boolean;
    getReadComponent: (messageId: string) => React.JSX.Element
}

export const MessagePreviewComponent = memo(({
    messagePreview,
    chatMemberNumber,
    isDelivered,
    isUserLoggedInPreviewChat,
    getReadComponent
}: TMessagePreviewComponent) => {

    const styles = useStyles();
    const { client } = useAuth();

    const dataType = messagePreview?.dataType;
    const isPost = dataType === "custom" && messagePreview?.data.type === ECustomData.post;
    const isAnnouncement = dataType === "custom" && messagePreview?.data.type === ECustomData.announcement
    const previewText = messagePreview?.data?.text;
    const lastMessageCreatorDisplayName = messagePreview?.user?.displayName
    const lastMessageCreatorId = messagePreview?.user?.userId;
    const isLoggedInUser = lastMessageCreatorId === (client as Amity.Client).userId;
    const text = dataType === "text" || isAnnouncement ? (previewText ? previewText : '') : dataType === "image" ? 'Photo' : isPost ? 'Post' : ''


    if (chatMemberNumber === 2) {
        //add read status if isLoggedInUser is true
        return (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 7, width: '100%', }}>
                {
                    isUserLoggedInPreviewChat &&
                        isDelivered &&
                        messagePreview?.messagePreviewId ?
                        getReadComponent(messagePreview?.messagePreviewId) :
                        null
                }
                {
                    dataType === "image" || isPost ? (
                        <View style={{ marginRight: 5 }}>
                            <ImageIcon height={16} width={16} />
                        </View>
                    ) : null
                }
                <CustomText numberOfLines={1} style={styles.messagePreview}>
                    {text}
                </CustomText>
            </View>
        )
    }
    if (chatMemberNumber > 2) {
        //add read status if isLoggedInUser is true
        return (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 7, width: '100%', }}>
                <CustomText numberOfLines={1} style={styles.messagePreview}>
                    {
                        isUserLoggedInPreviewChat &&
                            isDelivered &&
                            messagePreview?.messagePreviewId &&
                            !isAnnouncement
                            ?
                            getReadComponent(messagePreview?.messagePreviewId) :
                            null
                    }
                    {
                        lastMessageCreatorId ?
                            isLoggedInUser ?
                                'You: ' :
                                (lastMessageCreatorDisplayName ?
                                    `${lastMessageCreatorDisplayName}: ` : '') :
                            ''
                    }
                    {
                        dataType === "image" || isPost ? (
                            <View style={{ marginRight: 5 }}>
                                <ImageIcon height={16} width={16} />
                            </View>
                        ) : null
                    }
                    {text}
                    {/* <CustomText numberOfLines={1} style={styles.messagePreview}>
              {text}
            </CustomText> */}
                </CustomText>
            </View>
        )
    }
    return <></>
});
