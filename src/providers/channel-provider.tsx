import {
  ChannelRepository,
} from '@amityco/ts-sdk-react-native';

import { getAmityUser } from './user-provider';
import type { UserInterface } from '../types/user.interface';
import { Alert } from 'react-native'

export const AMITY_HOST = 'https://api.us.amity.co';

export async function createAmityChannel(
  currentUserID: string,
  users: UserInterface[]
): Promise<Amity.Channel> {
  return await new Promise(async (resolve, reject) => {
    if (users.length < 1) {
      return reject(new Error('Insufficient member count'));
    }

    let channelType: Amity.ChannelType =
      users.length > 1 ? 'community' : 'conversation';
    let userIds: string[] = [currentUserID];
    const { userObject } = await getAmityUser(currentUserID);
    let displayName = userObject.data.displayName! + ', ';
    displayName += users.map((user) => user.displayName).join(', ');
    if (displayName.length > 100) {
      displayName = displayName.substring(0, 97) + '...';
    }
    userIds.push(...users.map((user) => user.userId));
    const param = {
      displayName: displayName,
      type: channelType,
      userIds: userIds,
    };


    const { data: channel } = await ChannelRepository.createChannel(param);
    if (channel) {
      resolve({
        ...channel,
        markAsRead: async () => true,
      });
    } else {
      reject(' Create Channel unsuccessful');
    }
  });
}

export async function leaveAmityChannel(
  channelID: string
): Promise<boolean | undefined> {
  return await new Promise(async (resolve, reject) => {
    try {
      const didLeaveChannel = await ChannelRepository.leaveChannel(channelID);
      if (didLeaveChannel) {
        resolve(true)
      }

    } catch (error) {
      Alert.alert('Unable to leave channel due to ' + error, '', []);
      reject(new Error('Unable to leave channel ' + error));
    }

  });
}

export async function updateAmityChannel(
  channelID: string,
  fileId: string,
  displayName: string | undefined
): Promise<Amity.Channel | undefined> {
  let option = {};


  return await new Promise(async (resolve, reject) => {
    if (fileId && !displayName) {
      option = {
        avatarFileId: fileId,
      };
    } else if (!fileId && displayName) {
      option = {
        displayName: displayName,
      };
    } else if (fileId && displayName) {
      option = {
        displayName: displayName,
        avatarFileId: fileId,
      };
    } else {
      return reject(
        new Error(
          'Display name and image path is missing' +
          fileId +
          ' --- ' +
          displayName
        )
      );
    }
    try {
      const { data } = await ChannelRepository.updateChannel(channelID, option);
      if (data) {
        resolve({
          ...data,
          markAsRead: async () => true,
        });
      }
    } catch (error) {
      reject(new Error('Unable to create channel ' + error));
    }


  });
}


export async function deleteAmityChannel(
  channelID: string,
  amityAccessToken: string
): Promise<boolean | undefined> {

  return await new Promise(async (resolve, reject) => {
    if (!channelID) {
      return reject(
        new Error('Channel ID is missing')
      );
    } else if (!amityAccessToken) {
      return reject(
        new Error('Auth Token is missing')
      );
    }
    try {
      const response = await fetch(`${AMITY_HOST}/api/v3/channels/${channelID}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${amityAccessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      // Handle the response data
      console.log(data);
      resolve(true);
    } catch (error) {
      reject(new Error('Unable to delete channel ' + error));
    }
  });
}

export type TAddMemberToChannelRequest = {
  userIds: string[]
}

export async function addMemberToChannel(
  channelID: string,
  amityAccessToken: string,
  requestBody: TAddMemberToChannelRequest
): Promise<boolean | undefined> {

  return await new Promise(async (resolve, reject) => {
    if (!channelID) {
      return reject(
        new Error('Channel ID is missing')
      );
    } else if (!amityAccessToken) {
      return reject(
        new Error('Auth Token is missing')
      );
    } else if (!requestBody?.userIds || requestBody?.userIds?.length === 0) {
      return reject(
        new Error('Could not find the members that needs to be added.')
      );
    }
    try {
      const response = await fetch(`${AMITY_HOST}/api/v3/channels/${channelID}/users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${amityAccessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      // Handle the response data
      console.log(data);
      resolve(data);
    } catch (error) {
      reject(new Error('Unable to add member into channel ' + error));
    }
  });
}
