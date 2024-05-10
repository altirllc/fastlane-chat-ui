import { UserRepository } from '@amityco/ts-sdk-react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    TouchableOpacity,
    View,
    Text,
    type NativeScrollEvent,
    type ListRenderItemInfo,
    TextInput,
    FlatList,
    type NativeSyntheticEvent,
} from 'react-native';
import { useStyles } from './styles';
import type { UserInterface } from '../../types/user.interface';
import UserItem from '../../components/UserItem';
import SectionHeader from '../../components/ListSectionHeader';
import SelectedUserHorizontal from '../../components/SelectedUserHorizontal';
import { CloseIcon } from '../../svg/CloseIcon';
import { SearchIcon } from '../../svg/SearchIcon';
import { CircleCloseIcon } from '../../svg/CircleCloseIcon';
import { useTheme } from 'react-native-paper';
import type { MyMD3Theme } from '../../providers/amity-ui-kit-provider';
import { useNavigation } from '@react-navigation/native';
import { createAmityChannel } from '../../providers/channel-provider';
import { type IGroupChatObject } from '../../components/ChatList/index';
import useAuth from '../../hooks/useAuth';
import { LoadingOverlay } from '../../components/LoadingOverlay';

interface IModal {
    initUserList?: UserInterface[];
}
export type SelectUserList = {
    title: string;
    data: UserInterface[];
};

const AddMembersInChat = ({ initUserList = [] }: IModal) => {
    const { client } = useAuth();

    const theme = useTheme() as MyMD3Theme;
    const styles = useStyles();
    const [sectionedUserList, setSectionedUserList] = useState<UserInterface[]>(initUserList);
    const [selectedUserList, setSelectedUserList] = useState<UserInterface[]>(initUserList);
    const [usersObject, setUsersObject] = useState<Amity.LiveCollection<Amity.User>>();
    const [searchTerm, setSearchTerm] = useState('');
    const [isShowSectionHeader, setIsShowSectionHeader] = useState<boolean>(false)
    const { data: userArr = [], onNextPage } = usersObject ?? {};
    const navigation = useNavigation<any>();
    const [loading, setLoading] = useState(false);

    const handleOnFinish = async (users: UserInterface[]) => {
        setLoading(true)
        const channel = await createAmityChannel((client as Amity.Client).userId as string, users);
        setLoading(false)
        if (channel) {
            try {
                if (users.length === 1 && users[0]) {
                    const oneOnOneChatObject: UserInterface = {
                        userId: users[0].userId,
                        displayName: users[0].displayName as string,
                        avatarFileId: users[0].avatarFileId as string,
                    };
                    navigation.navigate('ChatRoom', {
                        channelId: channel.channelId,
                        chatReceiver: oneOnOneChatObject,
                    });

                } else if (users.length > 1) {
                    const chatDisplayName = users.map(
                        (item) => item.displayName
                    );
                    const userObject = users.map((item: UserInterface) => {
                        return {
                            userId: item.userId,
                            displayName: item.displayName,
                            avatarFileId: item.avatarFileId,
                        };
                    });
                    const groupChatObject: IGroupChatObject = {
                        displayName: chatDisplayName.join(','),
                        users: userObject,
                        memberCount: channel.memberCount as number,
                        avatarFileId: channel.avatarFileId
                    };
                    navigation.navigate('ChatRoom', {
                        channelId: channel.channelId,
                        groupChat: groupChatObject,
                    });
                }

                console.log('create chat success ' + JSON.stringify(channel));
            } catch (error) {
                console.log('create chat error ' + JSON.stringify(error));
                console.error(error);
            }

        }
    }

    const isGroupSelected = useMemo(() => {
        return selectedUserList.length > 1;
    }, [selectedUserList])

    const queryAccounts = (text: string = '') => {
        UserRepository.getUsers(
            { displayName: text, limit: 20 },
            (data) => {
                setUsersObject(data)

            }
        );


    };
    const handleChange = (text: string) => {
        setSearchTerm(text);
    };
    useEffect(() => {
        if (searchTerm.length > 2) {
            queryAccounts(searchTerm);
        }
    }, [searchTerm]);

    const clearButton = () => {
        setSearchTerm('');
    };

    const createSectionGroup = () => {
        const sectionUserArr = userArr.map((item) => {
            return { userId: item.userId, displayName: item.displayName as string, avatarFileId: item.avatarFileId as string }

        })
        setSectionedUserList(sectionUserArr)
    }

    useEffect(() => {
        createSectionGroup()
    }, [userArr])

    useEffect(() => {
        if (searchTerm.length === 0) {
            queryAccounts()
        }

    }, [searchTerm])


    const renderSectionHeader = () => (
        <SectionHeader title={''} />
    );

    const onUserPressed = (user: UserInterface) => {
        const isIncluded = selectedUserList.some(item => item.userId === user.userId)
        if (isIncluded) {
            const removedUser = selectedUserList.filter(item => item.userId !== user.userId)
            setSelectedUserList(removedUser)
        } else {
            setSelectedUserList(prev => [...prev, user])
        }

    };


    const renderItem = ({ item, index }: ListRenderItemInfo<UserInterface>) => {
        let isrenderheader = true;
        const isAlphabet = /^[A-Z]$/i.test(item.displayName[0] as string);
        const currentLetter = isAlphabet ? (item.displayName as string).charAt(0).toUpperCase() : '#'
        const selectedUser = selectedUserList.some(
            (user) => user.userId === item.userId
        );
        const userObj: UserInterface = { userId: item.userId, displayName: item.displayName as string, avatarFileId: item.avatarFileId as string }

        if (index > 0 && sectionedUserList.length > 0) {

            const isPreviousletterAlphabet = /^[A-Z]$/i.test(((sectionedUserList[index - 1]) as any).displayName[0]);
            const previousLetter = isPreviousletterAlphabet ? ((sectionedUserList[index - 1]) as any).displayName.charAt(0).toUpperCase() : '#'
            if (currentLetter === previousLetter) {
                isrenderheader = false
            } else {
                isrenderheader = true
            }

        }
        return (
            <View>
                {isrenderheader && <SectionHeader title={currentLetter} />}
                <View style={{ paddingHorizontal: 16, }}>
                    <UserItem showCheckMark showThreeDot={false} user={userObj} isCheckmark={selectedUser} onPress={onUserPressed} />
                </View>
            </View>

        );
    };



    const flatListRef = useRef(null);

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const yOffset = event.nativeEvent.contentOffset.y;

        if (yOffset >= 40) {
            setIsShowSectionHeader(true)
        } else {
            setIsShowSectionHeader(false)
        }
    };

    const handleOnClose = () => {
        setSelectedUserList(initUserList)
        navigation.goBack();
    }

    const handleLoadMore = () => {
        if (onNextPage) {
            onNextPage()
        }
    }

    const onDeleteUserPressed = (user: UserInterface) => {
        const removedUser = selectedUserList.filter(item => item !== user)
        setSelectedUserList(removedUser)
    }


    const onDone = () => {
        handleOnFinish(selectedUserList)
        setSelectedUserList([])
    }

    const onNext = () => {
        //show the view to enter group name
        navigation.navigate("EnterGroupName", { selectedUserList })
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.closeButton} onPress={handleOnClose}>
                    <CloseIcon color={theme.colors.base} />
                </TouchableOpacity>
                <View style={styles.headerTextContainer}>
                    <Text style={styles.headerText}>New Chat</Text>
                </View>
                <TouchableOpacity style={styles.doneContainer} disabled={selectedUserList.length === 0} onPress={isGroupSelected ? onNext : onDone}>
                    <Text style={[selectedUserList.length > 0 ? styles.doneText : styles.disabledDone]}>{isGroupSelected ? 'Next' : 'Done'}</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.inputWrap}>
                <TouchableOpacity onPress={() => queryAccounts(searchTerm)}>
                    <SearchIcon color={theme.colors.base} />
                </TouchableOpacity>
                <TextInput
                    style={styles.input}
                    value={searchTerm}
                    onChangeText={handleChange}
                    placeholder='Search Members'
                    placeholderTextColor={'#6E768A'}
                />
                <TouchableOpacity onPress={clearButton}>
                    <CircleCloseIcon color={theme.colors.base} />
                </TouchableOpacity>
            </View>
            {selectedUserList.length > 0 ? (
                <SelectedUserHorizontal
                    users={selectedUserList}
                    onDeleteUserPressed={onDeleteUserPressed}
                />
            ) : (
                <View />
            )}
            <FlatList
                data={sectionedUserList}
                renderItem={renderItem}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
                keyExtractor={(item) => item.userId}
                ListHeaderComponent={isShowSectionHeader ? renderSectionHeader : <View />}
                stickyHeaderIndices={[0]}
                showsVerticalScrollIndicator={false}
                ref={flatListRef}
                onScroll={handleScroll}
            />
            {
                loading ? <LoadingOverlay /> : null
            }
        </View>
    );
};

export default AddMembersInChat;

