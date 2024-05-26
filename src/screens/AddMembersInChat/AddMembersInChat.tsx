import { MessageContentType, MessageRepository, UserRepository } from '@amityco/ts-sdk-react-native';
import React, {
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  type ListRenderItemInfo,
  TextInput,
  SectionList,
  Alert,
  LayoutAnimation,
} from 'react-native';
import { useStyles } from './styles';
import type { UserInterface } from '../../types/user.interface';
import UserItem from '../../components/UserItem';
import SectionHeader from '../../components/ListSectionHeader';
import SelectedUserHorizontal from '../../components/SelectedUserHorizontal';
import { SearchIcon } from '../../svg/SearchIcon';
import { CircleCloseIcon } from '../../svg/CircleCloseIcon';
import { useTheme } from 'react-native-paper';
import type { MyMD3Theme } from '../../providers/amity-ui-kit-provider';
import {
  CommonActions,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import {
  TAddMemberToChannelRequest,
  addMemberToChannel,
  createAmityChannel,
} from '../../providers/channel-provider';
import useAuth from '../../hooks/useAuth';
import { TCommunity } from '../../types/common';
import { CloseIcon } from '../../svg/CloseIcon';
import { ChannelRepository } from '@amityco/ts-sdk-react-native';
import { TFinalUser } from './types';
import { LoadingOverlay } from '../../components/LoadingOverlay';
import { AuthContext } from '../../store/context';
import { IGroupChatObject } from '../../components/ChatList';
// @ts-ignore
import { ECustomData } from '@amityco/react-native-cli-chat-ui-kit/src/screens/ChatRoom/ChatRoom';

type TAddMembersInChat = {
  initUserList?: UserInterface[];
  chapters: TCommunity[];
};
export type SelectUserList = {
  title: string;
  data: UserInterface[];
};

export const SECTIONS: TFinalUser[] = [
  {
    id: 1,
    title: 'Recent Members',
    data: [],
    noDataText: '',
  },
  {
    id: 2,
    title: 'All Members',
    data: [],
    noDataText: '',
  },
];

const AddMembersInChat = ({
  initUserList = [],
  chapters,
}: TAddMembersInChat) => {
  const { client } = useAuth();

  const theme = useTheme() as MyMD3Theme;
  const styles = useStyles();
  const { amityAccessToken, setIsTabBarVisible } = useContext(AuthContext);

  //all members list
  const [usersObject, setUsersObject] =
    useState<Amity.LiveCollection<Amity.User>>();
  const { data: userArr = [], onNextPage } = usersObject ?? {};
  const [sectionedUserList, setSectionedUserList] =
    useState<UserInterface[]>(initUserList);

  //selected user list
  const [selectedUserList, setSelectedUserList] =
    useState<UserInterface[]>(initUserList);

  const [searchTerm, setSearchTerm] = useState('');
  const isShowSectionHeader = false;
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  //routes
  const route = useRoute<any>();
  const recentChatIds = route?.params?.recentChatIds as string[];
  const groupChat = route?.params?.groupChat as IGroupChatObject;
  const from = route?.params?.from as 'MembersScreen' | undefined;
  const channelID = route?.params?.channelID as 'string' | undefined;
  const memberIdsToSkip = route?.params?.memberIdsToSkip as
    | string[]
    | undefined;

  //recent member ids
  const [recentMembersIdsSet, setRecentMemberIdsSet] = useState(new Set());

  //all users for filtering the recent members
  const [allUsersObject, setAllUsersObject] =
    useState<Amity.LiveCollection<Amity.User>>();
  const { data: allUserArr = [] } = allUsersObject ?? {};

  //final user list combining selectedUserList and recentMembers
  const [finalUserList, setFinalUserList] = useState<TFinalUser[]>(SECTIONS);

  // Filtered user list based on search term
  const filteredUserList = useMemo(() => {
    if (searchTerm) {
      return finalUserList.filter(
        (eachSection) => eachSection.title === 'All Members'
      );
    }
    return finalUserList;
  }, [searchTerm, finalUserList]);

  useLayoutEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
    setIsTabBarVisible(false);
  }, []);

  const createSectionGroup = (users: Amity.User[]) => {
    return users
      .filter((eachUser) => eachUser?.metadata?.chapter?.id)
      .map((item) => {
        const chapterName =
          chapters.find(
            (eachChapter) =>
              eachChapter.communityId === item?.metadata?.chapter?.id
          )?.displayName || '';
        return {
          userId: item.userId,
          displayName: item.displayName as string,
          avatarFileId: item.avatarFileId as string,
          chapterId: item?.metadata?.chapter?.id || '',
          chapterName: chapterName,
        };
      });
  };

  const recentMembers = useMemo(() => {
    //once we have the all users array filter the chat group members and show as recent members
    return [
      ...createSectionGroup(allUserArr).filter((eachUser) =>
        recentMembersIdsSet.has(eachUser.userId)
      ),
    ];
  }, [allUserArr]);

  useEffect(() => {
    if (recentMembersIdsSet.size > 0) {
      //once we got the recent member ids, fetch all members available max limit 60 for now.
      UserRepository.getUsers({ displayName: '', limit: 60 }, (data) => {
        if (data && data.data.length > 0) {
          setAllUsersObject(data);
        }
      });
    }
  }, [recentMembersIdsSet]);

  useEffect(() => {
    if (sectionedUserList.length > 0)
      setFinalUserList((prevUserList) => {
        const updatedList = prevUserList.map((item) => {
          if (item.title === 'All Members') {
            return {
              ...item,
              data: sectionedUserList,
            };
          }
          return item;
        });
        return updatedList;
      });
  }, [sectionedUserList]);

  useEffect(() => {
    if (recentMembers.length > 0)
      setFinalUserList((prevUserList) => {
        const updatedList = prevUserList.map((item) => {
          if (item.title === 'Recent Members') {
            return {
              ...item,
              data: recentMembers,
            };
          }
          return item;
        });
        return updatedList;
      });
  }, [recentMembers]);

  useEffect(() => {
    if (recentChatIds.length > 0 && sectionedUserList.length > 0) {
      const ids = new Set();
      recentChatIds.forEach((eachChatId) => {
        //loop for each Chat obj and get all members associated with it.
        ChannelRepository.Membership.getMembers(
          { channelId: eachChatId },
          ({ data: members }) => {
            if (members.length === 2) {
              //only consider one to one chats to show members in recent members
              const targetIndex: number = members?.findIndex(
                (item) => item.userId !== (client as Amity.Client).userId
              );
              ids.add(members[targetIndex]?.userId);
            }
          }
        );
      });
      //set recent members
      setRecentMemberIdsSet(
        (prevMemberIds) => new Set([...prevMemberIds, ...ids])
      );
    }
  }, [recentChatIds, sectionedUserList]);

  const handleOnFinish = async (users: UserInterface[]) => {
    setLoading(true);
    const channel = await createAmityChannel(
      (client as Amity.Client).userId as string,
      users
    );
    setLoading(false);
    if (channel) {
      try {
        if (users.length === 1 && users[0]) {
          const oneOnOneChatObject: UserInterface = {
            userId: users[0].userId,
            displayName: users[0].displayName as string,
            avatarFileId: users[0].avatarFileId as string,
          };
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [
                {
                  name: 'ChatRoom',
                  params: {
                    channelId: channel.channelId,
                    chatReceiver: oneOnOneChatObject,
                    from: 'AddMembersFlow',
                  },
                },
              ],
            })
          );
        }
        console.log('create chat success ' + JSON.stringify(channel));
      } catch (error) {
        console.log('create chat error ' + JSON.stringify(error));
        console.error(error);
      }
    }
  };

  const isGroupSelected = useMemo(() => {
    return selectedUserList.length > 1;
  }, [selectedUserList]);

  const queryAccounts = (text: string = '') => {
    UserRepository.getUsers({ displayName: text, limit: 20 }, (data) => {
      setUsersObject(data);
    });
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

  useEffect(() => {
    let allMembers = [...createSectionGroup(userArr)];
    if (memberIdsToSkip && memberIdsToSkip?.length > 0) {
      //if we need to skip showing some members, skip them from list
      const filteredMembers = allMembers.filter(
        (member) => !memberIdsToSkip.includes(member.userId)
      );
      setSectionedUserList(filteredMembers);
    } else {
      setSectionedUserList(allMembers);
    }
  }, [userArr]);

  useEffect(() => {
    if (searchTerm.length === 0) {
      queryAccounts();
    }
  }, [searchTerm]);

  const onUserPressed = (user: UserInterface) => {
    const isIncluded = selectedUserList.some(
      (item) => item.userId === user.userId
    );
    if (isIncluded) {
      const removedUser = selectedUserList.filter(
        (item) => item.userId !== user.userId
      );
      setSelectedUserList(removedUser);
    } else {
      setSelectedUserList((prev) => [...prev, user]);
    }
  };

  const renderItem = ({ item, index }: ListRenderItemInfo<UserInterface>) => {
    let isrenderheader = true;
    const isAlphabet = /^[A-Z]$/i.test(item.displayName[0] as string);
    const currentLetter = isAlphabet
      ? (item.displayName as string).charAt(0).toUpperCase()
      : '#';
    const selectedUser = selectedUserList.some(
      (user) => user.userId === item.userId
    );
    const userObj: UserInterface = {
      userId: item.userId,
      displayName: item.displayName as string,
      avatarFileId: item.avatarFileId as string,
      chapterName: item.chapterName,
    };

    if (index > 0 && sectionedUserList.length > 0) {
      const isPreviousletterAlphabet = /^[A-Z]$/i.test(
        (sectionedUserList[index - 1] as any)?.displayName[0]
      );
      const previousLetter = isPreviousletterAlphabet
        ? (sectionedUserList[index - 1] as any)?.displayName
          .charAt(0)
          .toUpperCase()
        : '#';
      if (currentLetter === previousLetter) {
        isrenderheader = false;
      } else {
        isrenderheader = true;
      }
    }
    return (
      <View>
        {isrenderheader && <SectionHeader title={currentLetter} />}
        <View style={{ paddingHorizontal: 16 }}>
          <UserItem
            showCheckMark
            showThreeDot={false}
            user={userObj}
            isCheckmark={selectedUser}
            onPress={onUserPressed}
          />
        </View>
      </View>
    );
  };

  const flatListRef = useRef(null);

  const handleOnClose = () => {
    setSelectedUserList(initUserList);
    if (from === 'MembersScreen') {
      navigation.navigate('MemberDetail', { channelID, groupChat });
    } else {
      navigation.goBack();
    }
  };

  const handleLoadMore = () => {
    if (onNextPage) {
      onNextPage();
    }
  };

  const onDeleteUserPressed = (user: UserInterface) => {
    const removedUser = selectedUserList.filter((item) => item !== user);
    setSelectedUserList(removedUser);
  };

  const onDone = () => {
    handleOnFinish(selectedUserList);
    setSelectedUserList([]);
  };

  const onNext = () => {
    //show the view to enter group name
    navigation.navigate('EnterGroupName', { selectedUserList });
  };

  const getTopRightText = () => {
    return from === 'MembersScreen' ? 'Add' : isGroupSelected ? 'Next' : 'Done';
  };

  const addMembers = async () => {
    try {
      if (!channelID) return;
      let requestBody: TAddMemberToChannelRequest = {
        userIds: [],
      };
      selectedUserList.forEach((eachUser) => {
        requestBody.userIds.push(eachUser.userId);
      });
      setLoading(true);
      const result = await addMemberToChannel(
        channelID,
        amityAccessToken,
        requestBody
      );
      if (result) {
        //now create new message along with some data to put in the channel;
        const names = selectedUserList.map((eachUser) => eachUser.displayName).join(', ');
        const customMessage = {
          subChannelId: channelID,
          dataType: MessageContentType.CUSTOM,
          data: {
            type: ECustomData.announcement,
            text: `${names} has been added in the chat.`
          }
        };

        try {
          const { data: message } = await MessageRepository.createMessage(customMessage);
          if (message) {
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: 'RecentChat' }],
              })
            );
          }
        } catch (e) {
          console.log("e", e)
        }
      }
    } catch (e: { data: { message: string | undefined } } | any) {
      Alert.alert(
        'Error!',
        e?.data?.message || e.message || `New members could not be added.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Retry',
            style: 'destructive',
            onPress: () => {
              addMembers();
            },
          },
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const onTopRightButtonPress = () => {
    if (from === 'MembersScreen') {
      addMembers();
    } else if (isGroupSelected) {
      onNext();
    } else {
      onDone();
    }
  };

  return (
    <View style={styles.topmostContainer}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={handleOnClose}>
            <CloseIcon height={17} width={17} color={theme.colors.base} />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerText}>New Chat</Text>
          </View>
          <TouchableOpacity
            style={styles.doneContainer}
            disabled={selectedUserList.length === 0 || loading}
            onPress={onTopRightButtonPress}
          >
            <Text
              style={[
                selectedUserList.length > 0 && !loading
                  ? styles.doneText
                  : styles.disabledDone,
              ]}
            >
              {getTopRightText()}
            </Text>
          </TouchableOpacity>
        </View>
        {selectedUserList.length > 0 ? (
          <View>
            <SelectedUserHorizontal
              users={selectedUserList}
              onDeleteUserPressed={onDeleteUserPressed}
            />
            <View style={styles.separator} />
          </View>
        ) : (
          <View />
        )}
        <View
          style={[
            styles.inputWrap,
            {
              borderColor: isFocused
                ? theme.colors.base
                : theme.colors.baseShade3,
            },
          ]}
        >
          <TouchableOpacity onPress={() => queryAccounts(searchTerm)}>
            <SearchIcon
              color={isFocused ? theme.colors.base : theme.colors.baseShade2}
            />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            value={searchTerm}
            onFocus={() => {
              setIsFocused(true);
            }}
            onBlur={() => {
              setIsFocused(false);
            }}
            onChangeText={handleChange}
            placeholder="Search Members"
            placeholderTextColor={'#6E768A'}
          />
          {searchTerm.length > 0 ? (
            <TouchableOpacity onPress={clearButton}>
              <CircleCloseIcon color={theme.colors.base} />
            </TouchableOpacity>
          ) : null}
        </View>
        <SectionList
          sections={filteredUserList}
          keyExtractor={(item, index) => item.userId + index}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          ref={flatListRef}
          renderSectionHeader={({ section }) => (
            <View>
              <Text style={styles.memberText}>{section.title}</Text>
              {section.data.length === 0 ? (
                <Text style={styles.noData}>No data available</Text>
              ) : null}
            </View>
          )}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          stickySectionHeadersEnabled={false}
          ListHeaderComponent={
            isShowSectionHeader ? <SectionHeader title={''} /> : <View />
          }
        />
      </View>
      {loading ? <LoadingOverlay /> : null}
    </View>
  );
};

export default AddMembersInChat;
