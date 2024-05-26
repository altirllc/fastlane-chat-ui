import { SubChannelRepository } from '@amityco/ts-sdk-react-native';
import { useEffect, useState } from 'react';
// @ts-ignore
import { TUser, TMetadata } from '../../../../../src/services/types';
import { ECustomData } from '../../src/screens/ChatRoom/ChatRoom';

export type TMessagePreview = {
  channelId: string;
  createdAt: string;
  creatorId: string;
  data: {
    text: string;
    type: ECustomData;
    id?: string;
    images?: string[];
  };
  dataType: 'text' | 'image' | 'custom';
  isDeleted: boolean;
  messagePreviewId: string;
  segment: number;
  subChannelId: string;
  subChannelName: string;
  subChannelUpdatedAt: string;
  updatedAt: string;
  user: TUser<Omit<TMetadata, 'userId'>>;
};

export const useMessagePreview = (subChannelId: string) => {
  const [messagePreview, setMessagePreview] = useState<
    TMessagePreview | undefined
  >();
  const disposers: Amity.Unsubscriber[] = [];

  useEffect(() => {
    if (!subChannelId) return;
    const unsubscribe = SubChannelRepository.getSubChannel(
      subChannelId,
      ({ data: channel }) => {
        // You can access the message preview from the subChannel object direct;
        setMessagePreview(channel?.messagePreview);
      }
    );
    disposers.push(() => unsubscribe);
    return () => disposers.forEach((fn) => fn());
  }, [subChannelId]);

  return { messagePreview };
};
