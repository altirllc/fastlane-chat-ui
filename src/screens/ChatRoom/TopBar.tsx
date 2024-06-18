import React, { memo } from 'react';
import {
    View,
    Image,
    TouchableOpacity,
} from 'react-native';
import CustomText from '../../components/CustomText';
import BackButton from '../../components/BackButton';
import { AlertIcon } from '../../svg/AlertIcon';
import { Avatar } from '../../../src/components/Avatar/Avatar';
import { useStyles } from './styles'
import { useNavigation } from '@react-navigation/native';
import { useTheme } from 'react-native-paper';
import type { MyMD3Theme } from '../../providers/amity-ui-kit-provider';
import { useAvatarArray } from '../../../src/hooks/useAvatarArray';
import { UserInterface } from '../../../src/types/user.interface';
import { IGroupChatObject } from '../../../src/components/ChatList';
import useAuth from '../../../src/hooks/useAuth';

export type TTopBar = {
    chatReceiver: UserInterface | undefined
    handleBack: () => void
    groupChat: IGroupChatObject | undefined
    channelId: string;
    channelType: string;
    onMemberClick: (memberId: string, displayName: string) => void;
}

export const TopBar = memo(({ chatReceiver, handleBack, groupChat, channelId, channelType, onMemberClick }: TTopBar) => {
    const navigation = useNavigation<any>();
    const styles = useStyles();
    const theme = useTheme() as MyMD3Theme;
    const { apiRegion } = useAuth();

    const { avatarArray } = useAvatarArray(groupChat, chatReceiver);

    const onChatProfilePress = () => {
        if (!chatReceiver) return;
        onMemberClick?.(chatReceiver.userId, chatReceiver.displayName)
    }

    return (
        <View style={styles.topBar}>
            <View style={styles.chatTitleWrap}>
                <BackButton styles={styles.backButton} onPress={handleBack} />
                {chatReceiver?.avatarFileId ? (
                    <TouchableOpacity onPress={onChatProfilePress}>
                        <Image
                            style={styles.avatar}
                            source={{
                                uri: `https://api.${apiRegion}.amity.co/api/v3/files/${chatReceiver?.avatarFileId}/download`,
                            }}
                        />
                    </TouchableOpacity>

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
                <TouchableOpacity disabled={!!groupChat} onPress={onChatProfilePress}>
                    <CustomText style={styles.chatName} numberOfLines={1}>
                        {chatReceiver
                            ? chatReceiver?.displayName
                            : groupChat?.displayName}
                    </CustomText>
                    {groupChat && (
                        <CustomText style={styles.chatMember}>
                            {groupChat?.memberCount} {groupChat.memberCount === 1 ? 'member' : 'members'}
                        </CustomText>
                    )}
                </TouchableOpacity>
            </View>
            {
                channelType === 'broadcast' ? null : (
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
                )
            }

        </View>
    )
})