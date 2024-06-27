import { UserInterface } from "../../../src/types/user.interface";
import { ECustomData, IMessage, TCustomData } from "./ChatRoom";
import { IGroupChatObject } from "../../../src/components/ChatList";
import { PostRepository } from "@amityco/ts-sdk-react-native";

export const getFormattedMessages = (
    messagesArr: Amity.Message<any>[],
    groupChat: IGroupChatObject | undefined,
    apiRegion: string | undefined,
    chatReceiver: UserInterface | undefined
) => {
    let formattedMessages: IMessage[] = [];
    for (const item of messagesArr) {
        const targetIndex: number | undefined =
            groupChat &&
            groupChat.users?.findIndex(
                (groupChatItem) => item.creatorId === groupChatItem.userId
            );
        let avatarUrl = '';
        let avatarFileId = '';
        if (
            groupChat &&
            targetIndex !== undefined &&
            targetIndex >= 0 &&
            (groupChat?.users as any)[targetIndex as number]?.avatarFileId
        ) {
            avatarUrl = `https://api.${apiRegion}.amity.co/api/v3/files/${(groupChat?.users as any)[targetIndex as number]
                ?.avatarFileId as any
                }/download`;
            avatarFileId = (groupChat?.users as any)[targetIndex as number]?.avatarFileId as any
        } else if (chatReceiver && chatReceiver.avatarFileId) {
            avatarUrl = `https://api.${apiRegion}.amity.co/api/v3/files/${chatReceiver.avatarFileId}/download`;
            avatarFileId = chatReceiver.avatarFileId;
        }
        let commonObj = {
            _id: item.messageId,
            createdAt: item.createdAt as string,
            editedAt: item.updatedAt as string,
            user: {
                _id: item.creatorId ?? '',
                name: item.channelType === 'broadcast'
                    ? 'Announcement'
                    : (
                        chatReceiver?.displayName ??
                        groupChat?.users?.find((user) => user.userId === item.creatorId)?.displayName ??
                        ''
                    ),
                avatar: avatarUrl,
                avatarFileId: avatarFileId
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
                    postCreator: null,
                    targetCommunityId: null
                }
            } as TCustomData
        };
        // @ts-ignore
        const isPostPresent = item.dataType === 'custom' && item?.data?.type === ECustomData.post && item?.data?.id
        if (isPostPresent) {
            //if datatype is custom and data is post from social feed
            //TODO: Handle post image data and UI also
            commonObj.customData.type = ECustomData.post
            // @ts-ignore
            PostRepository.getPost(item.data?.id, ({ data, error }) => {
                if (data) {
                    //let imageUrls = []
                    if (data?.children?.length > 0) {
                        commonObj.customData.imageIds = [...data.children]
                    }
                    if (data?.creator && Object.keys(data.creator).length > 0) {
                        commonObj.customData.extraData.postCreator = data?.creator
                    }
                    if (data?.targetId) {
                        commonObj.customData.extraData.targetCommunityId = data.targetId
                    }
                    // @ts-ignore
                    commonObj.customData.id = item.data?.id;
                    commonObj.customData.text = data?.data?.text;
                } else if (!data && error) {
                    commonObj.customData.text = 'Post does not exist.'
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
    return formattedMessages
}