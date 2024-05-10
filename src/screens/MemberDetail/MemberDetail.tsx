import { ChannelRepository } from '@amityco/ts-sdk-react-native';
import React, { useEffect, useState } from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  type ListRenderItemInfo,
  TextInput,
  FlatList,
} from 'react-native';

import { useStyles } from './styles';
import type { UserInterface } from '../../types/user.interface';
import UserItem from '../../components/UserItem';

// import CustomTab from '../../components/CustomTab';
import { SearchIcon } from '../../svg/SearchIcon';
import { CircleCloseIcon } from '../../svg/CircleCloseIcon';
import { useTheme } from 'react-native-paper';
import type { MyMD3Theme } from '../../providers/amity-ui-kit-provider';
import BackButton from '@amityco/react-native-cli-chat-ui-kit/src/components/BackButton';

export type SelectUserList = {
  title: string;
  data: UserInterface[];
};

export default function MemberDetail({ route, navigation }: any) {

  const styles = useStyles();
  const { channelID } = route.params;
  const [sectionedUserList, setSectionedUserList] = useState<UserInterface[]>([]);

  const [usersObject, setUsersObject] = useState<Amity.LiveCollection<Amity.Membership<"channel">>>();
  const [searchTerm, setSearchTerm] = useState('');
  const [tabIndex] = useState<number>(1)
  const { data: userArr = [], onNextPage } = usersObject ?? {};

  const theme = useTheme() as MyMD3Theme;

  const queryAccounts = (text: string = '', roles?: string[]) => {
    ChannelRepository.Membership.getMembers(
      { channelId: channelID, limit: 15, search: text, roles: roles ?? [] },
      (data) => {
        setUsersObject(data)

      }
    );
  };
  const handleChange = (text: string) => {
    setSearchTerm(text);
  };
  useEffect(() => {
    if (searchTerm.length > 0 && tabIndex === 1) {
      queryAccounts(searchTerm);
    }
    else if (searchTerm.length > 0 && tabIndex === 2) {
      queryAccounts(searchTerm, ['channel-moderator']);
    }
  }, [searchTerm]);

  const clearButton = () => {
    setSearchTerm('');
  };

  const createUserList = () => {
    const sectionUserArr = userArr.map((item) => {
      return { userId: item.userId, displayName: item.user?.displayName as string, avatarFileId: item.user?.avatarFileId as string }
    })
    setSectionedUserList(sectionUserArr)

  }

  useEffect(() => {
    createUserList()
  }, [userArr])

  useEffect(() => {
    if (searchTerm.length === 0 && tabIndex === 1) {
      queryAccounts()
    } else if (searchTerm.length === 0 && tabIndex === 2) {
      queryAccounts('', ['channel-moderator'])
    }

  }, [searchTerm, tabIndex])

  const renderItem = ({ item }: ListRenderItemInfo<UserInterface>) => {
    const userObj: UserInterface = { userId: item.userId, displayName: item.displayName as string, avatarFileId: item.avatarFileId as string }
    return (
      <UserItem showThreeDot={false} user={userObj} />
    );
  };


  const handleLoadMore = () => {
    if (onNextPage) {
      onNextPage()
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <BackButton styles={styles.closeButton} />
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerText}>Member Detail</Text>
        </View>
      </View>
      <View style={styles.inputWrap}>
        <TouchableOpacity onPress={() => queryAccounts(searchTerm)}>
          <SearchIcon color={theme.colors.base} />
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          value={searchTerm}
          placeholder='Search Members'
          placeholderTextColor={'#6E768A'}
          onChangeText={handleChange}
        />
        <TouchableOpacity onPress={clearButton}>
          <CircleCloseIcon color={theme.colors.base} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={sectionedUserList}
        renderItem={renderItem}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        style={styles.membersContainer}
        keyExtractor={(item) => item.userId}
      />
    </View>

  );
}
