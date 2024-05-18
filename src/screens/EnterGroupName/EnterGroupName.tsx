import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    TouchableOpacity,
    View,
    Text,
    TextInput,
    FlatList,
    ListRenderItemInfo,
} from 'react-native';
import { useEnterGroupNameStyles } from './styles'
import { useTheme } from 'react-native-paper';
import type { MyMD3Theme } from '../../providers/amity-ui-kit-provider';
import { CommonActions, useNavigation, useRoute } from '@react-navigation/native';
import { CircleCloseIcon } from '@amityco/react-native-cli-chat-ui-kit/src/svg/CircleCloseIcon';
import { UserInterface } from '@amityco/react-native-cli-chat-ui-kit/src/types/user.interface';
import UserItem from '@amityco/react-native-cli-chat-ui-kit/src/components/UserItem';
import { createAmityChannel } from '../../providers/channel-provider';
import useAuth from '../../hooks/useAuth';
import { type IGroupChatObject } from '../../components/ChatList/index';
import { updateAmityChannel } from '../../providers/channel-provider';
import { LoadingOverlay } from '@amityco/react-native-cli-chat-ui-kit/src/components/LoadingOverlay';
import { BackIcon } from '@amityco/react-native-cli-chat-ui-kit/src/svg/BackIcon';

export const EnterGroupName = () => {
    const theme = useTheme() as MyMD3Theme;
    const styles = useEnterGroupNameStyles();
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const [inputMessage, setInputMessage] = useState('');
    const inputRef = useRef<any>();
    const [loading, setLoading] = useState(false);
    const { client } = useAuth();
    const [isFocused, setIsFocused] = useState(false)

    const selectedUserList = route?.params?.selectedUserList as UserInterface[];

    const isDisabled = useMemo(() => {
        return !inputMessage || loading
    }, [inputMessage, loading])

    useEffect(() => {
        if (inputRef.current) {
            inputRef?.current?.focus();
            setIsFocused(true)
        }
    }, [])

    const goBack = () => {
        navigation.goBack();
    }

    const updateGroupName = async (channel: Amity.Channel<any>, updatedInputmessage: string) => {
        const result = await updateAmityChannel(
            channel._id,
            '',
            updatedInputmessage
        );
        return result;
    }

    const onCreateClick = async () => {
        const updatedInputmessage = inputMessage.trim()
        //first create a channel
        setLoading(true);
        const channel = await createAmityChannel((client as Amity.Client).userId as string, selectedUserList);
        if (channel) {
            try {
                if (updatedInputmessage) {
                    const result = await updateGroupName(channel, updatedInputmessage)
                    if (result) {
                        console.log("updateGroupName success", JSON.stringify(result))
                    }
                }
                const chatDisplayName = selectedUserList.map(
                    (item) => item.displayName
                );
                const userObject = selectedUserList.map((item: UserInterface) => {
                    return {
                        userId: item.userId,
                        displayName: item.displayName,
                        avatarFileId: item.avatarFileId,
                    };
                });
                const groupChatObject: IGroupChatObject = {
                    displayName: updatedInputmessage ? updatedInputmessage : chatDisplayName.join(','),
                    users: userObject,
                    memberCount: channel.memberCount as number,
                    avatarFileId: channel.avatarFileId,
                    channelModerator: {
                        userId: (client as Amity.Client).userId //because loggedin user is creating group.
                    }
                };
                setLoading(false)
                navigation.dispatch(
                    CommonActions.reset({
                        index: 0,
                        routes: [{
                            name: "ChatRoom", params: {
                                channelId: channel.channelId,
                                groupChat: groupChatObject,
                                from: 'AddMembersFlow'
                            }
                        }],
                    }),
                );
                console.log('create chat success ' + JSON.stringify(channel));
            } catch (error) {
                setLoading(false)
                console.log('create chat error ' + JSON.stringify(error));
                console.error(error);
            }
        }
    }

    const clearGroupName = () => {
        setInputMessage('')
    }

    const renderItem = ({ item }: ListRenderItemInfo<UserInterface>) => {
        const userObj: UserInterface = { userId: item.userId, displayName: item.displayName as string, avatarFileId: item.avatarFileId as string, chapterName: item.chapterName }

        return (
            <UserItem showCheckMark={false} showThreeDot={false} user={userObj} />
        );
    };

    return (
        <>
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.closeButton} onPress={() => {
                        goBack();
                    }}>
                        <BackIcon color={theme.colors.base} />
                    </TouchableOpacity>
                    <View style={styles.headerTextContainer}>
                        <Text style={styles.headerText}>New Chat</Text>
                    </View>
                    <TouchableOpacity disabled={isDisabled} style={[styles.doneContainer, isDisabled && styles.disabledDone]} onPress={onCreateClick}>
                        <Text style={styles.doneText}>{'Create'}</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.innerContainer}>
                    <View style={[styles.inputWrap, { borderWidth: 1, borderColor: isFocused ? theme.colors.base : theme.colors.baseShade3 }]}>
                        <TextInput
                            ref={inputRef as any}
                            onFocus={() => { setIsFocused(true) }}
                            onBlur={() => { setIsFocused(false) }}
                            value={inputMessage}
                            onChangeText={(text) => setInputMessage(text)}
                            placeholder="Conversation Name..."
                            placeholderTextColor={theme.colors.baseShade3}
                        />
                        <TouchableOpacity onPress={clearGroupName}>
                            <CircleCloseIcon color={theme.colors.base} />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.memberText}>Members</Text>
                    <FlatList
                        data={selectedUserList || []}
                        renderItem={renderItem}
                        style={{ marginTop: 15 }}
                        keyExtractor={(item) => item.userId}
                        showsVerticalScrollIndicator={false}
                    />
                </View>
            </View>
            {loading ? <LoadingOverlay /> : null}
        </>
    )
}