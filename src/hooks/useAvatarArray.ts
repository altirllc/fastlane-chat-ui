import { UserInterface } from "../types/user.interface";
import { IGroupChatObject } from "../components/ChatList";
import { getInitials } from "../helpers";
import { useMemo } from "react";


export type TAvatarArray = {
    type: "avatar" | "nameInitials" | "membersLeftCount";
    value: string
}

export const typeOrder: any = {
    avatar: 1,
    nameInitials: 2,
};

export const useAvatarArray = (groupChat: IGroupChatObject | undefined, chatReceiver: UserInterface | undefined) => {
    const avatarArray = useMemo(() => {
        if (groupChat && Object.keys(groupChat).length > 0 && groupChat?.users?.length > 0) {
            const avatarArray: TAvatarArray[] = [];

            //alphabetically sorted users excluding loggedin user
            //.filter((eachUser) => eachUser.userId !== (client as Amity.Client).userId);
            const sortedUsers = groupChat?.users.sort((a, b) => a.displayName.localeCompare(b.displayName))

            //based on avatar presence/absence create avatar array
            sortedUsers.forEach((eachUser) => {
                if (eachUser.avatarFileId) {
                    avatarArray.push({
                        type: 'avatar',
                        value: eachUser.avatarFileId
                    })
                } else if (eachUser.displayName) {
                    avatarArray.push({
                        type: 'nameInitials',
                        value: getInitials(eachUser.displayName)
                    })
                }
            })

            //bring all avatar present members at start of the array to give them more priority over initials.
            const sortByAvatarArr = avatarArray.sort((a, b) => typeOrder[a.type] - typeOrder[b.type]);


            if (sortByAvatarArr.length > 4) {
                //in case of >4 members, show 3 people avatar along with remaining count of people.
                // const loggedInUserCount = 0; //include loggedin user also for the total remaining count
                const membersLeftCount = sortByAvatarArr.length - 3; //Maximum we only have to show 3 member avatar.
                const finalAvatarArr = sortByAvatarArr.slice(0, 3); //contain only first 3 members from array
                finalAvatarArr.push({
                    type: 'membersLeftCount',
                    value: (membersLeftCount).toString()
                })
                return finalAvatarArr;
            } else return sortByAvatarArr //in case of 2, 3 or 4 members loop them and directly show in UI.
        } else if (chatReceiver && Object.keys(chatReceiver).length > 0 && chatReceiver.displayName && chatReceiver.userId) {
            const avatarArray: TAvatarArray[] = [];
            if (chatReceiver.avatarFileId) {
                avatarArray.push({
                    type: 'avatar',
                    value: chatReceiver.avatarFileId
                })
            } else {
                avatarArray.push({
                    type: 'nameInitials',
                    value: getInitials(chatReceiver.displayName)
                })
            }

            return avatarArray;
        } else return []
    }, [groupChat, chatReceiver])

    return { avatarArray };
}