import React, { useContext, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert } from 'react-native';
import {
  deleteAmityChannel,
  leaveAmityChannel,
} from '../../providers/channel-provider';
import { useStyles } from './styles';
import AwesomeAlert from 'react-native-awesome-alerts';
import EditIcon from '../../svg/EditIcon';
import { ArrowRightIcon } from '../../svg/ArrowRightIcon';
import { GroupMembersIcon } from '../../svg/GroupMembersIcon';
import { useTheme } from 'react-native-paper';
import type { MyMD3Theme } from '../../providers/amity-ui-kit-provider';
import BackButton from '@amityco/react-native-cli-chat-ui-kit/src/components/BackButton';
import { LoadingOverlay } from '@amityco/react-native-cli-chat-ui-kit/src/components/LoadingOverlay';
import { AuthContext } from '../../store/context';
import { CommonActions } from '@react-navigation/native';
import { MessageContentType, MessageRepository } from '@amityco/ts-sdk-react-native';
// @ts-ignore
import { ECustomData } from '@amityco/react-native-cli-chat-ui-kit/src/screens/ChatRoom/ChatRoom';
import { IGroupChatObject } from '@amityco/react-native-cli-chat-ui-kit/src/components/ChatList';
import useAuth from '@amityco/react-native-cli-chat-ui-kit/src/hooks/useAuth';

interface ChatDetailProps {
  navigation: any;
  route: any;
}

export const ChatRoomSetting: React.FC<ChatDetailProps> = ({
  navigation,
  route,
}) => {
  const theme = useTheme() as MyMD3Theme;
  const styles = useStyles();
  const { client } = useAuth()
  const { amityAccessToken } = useContext(AuthContext);
  const { channelId, channelType } = route.params;
  const groupChat = route?.params?.groupChat as IGroupChatObject;
  const [loading, setLoading] = useState(false);
  const [showReportAlert, setShowReportAlert] = useState<boolean>(false);

  const data = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }];

  const handleGroupProfilePress = () => {
    navigation.navigate('EditChatDetail', {
      navigation,
      channelId: channelId,
      groupChat: groupChat,
    });
  };

  const handleMembersPress = () => {
    navigation.navigate('MemberDetail', {
      navigation,
      channelID: channelId,
      groupChat: groupChat,
    });
  };

  const handleLeaveChatPress = async () => {
    Alert.alert(
      'Leave chat',
      `If leave this group, you’ll no longer be able to see any messages and files.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: () => onLeaveChat(),
        },
      ]
    );
  };

  // async function flagUser() {
  //     if (chatReceiver) {
  //         const didCreateUserReport = await createReport('user', chatReceiver.userId);
  //         if (didCreateUserReport) {
  //             Alert.alert('Report sent', '', [{
  //                 text: 'Ok',
  //             }]);
  //         }
  //     }
  // }

  const onLeaveChat = async () => {
    try {
      setLoading(true)
      //now create new message along with some data to put in the channel;
      const userName = groupChat?.users?.find((eachUser) => eachUser.userId === (client as Amity.Client).userId)?.displayName || ''
      const customMessage = {
        subChannelId: channelId,
        dataType: MessageContentType.CUSTOM,
        data: {
          type: ECustomData.announcement,
          text: `${userName ? userName : 'Someone'} has left the chat.`
        }
      };
      const { data: message } = await MessageRepository.createMessage(customMessage);
      if (message) {
        const isLeave = await leaveAmityChannel(channelId);
        if (isLeave) navigation.navigate('RecentChat');
      }
    } catch (error) {
      console.log('error: ', error);
    } finally {
      setLoading(false)
    }
  };

  const renderItem = ({ item }: any) => {
    switch (item.id) {
      case 1:
        return (
          <TouchableOpacity
            style={styles.rowContainer}
            onPress={handleGroupProfilePress}
          >
            <View style={styles.iconContainer}>
              <EditIcon />
            </View>
            <Text style={styles.rowText}>Group profile</Text>
            <ArrowRightIcon />
          </TouchableOpacity>
        );
      case 2:
        return (
          <TouchableOpacity
            style={styles.rowContainer}
            onPress={handleMembersPress}
          >
            <View style={styles.iconContainer}>
              <GroupMembersIcon />
            </View>
            <Text style={styles.rowText}>Members</Text>
            <ArrowRightIcon color={theme.colors.base} />
          </TouchableOpacity>
        );
      case 3:
        return (
          <TouchableOpacity
            style={styles.rowContainer}
            onPress={handleLeaveChatPress}
          >
            <View style={styles.ChatSettingContainer}>
              <Text style={styles.leaveChatLabel}>Leave Chat</Text>
            </View>
          </TouchableOpacity>
        );
      case 4:
        return (
          <TouchableOpacity
            style={styles.rowContainer}
            onPress={showConfirmationPopup}
          >
            <View style={styles.ChatSettingContainer}>
              <Text style={styles.leaveChatLabel}>Delete Chat</Text>
            </View>
          </TouchableOpacity>
        );
      default:
        return null;
    }
  };

  const deleteChannel = async () => {
    try {
      setLoading(true);
      await deleteAmityChannel(channelId, amityAccessToken);
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'RecentChat' }],
        })
      );
    } catch (e: { data: { message: string | undefined } } | any) {
      Alert.alert(
        'Error!',
        e?.data?.message || e.message || `This chat couldn't be deleted.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Retry',
            style: 'destructive',
            onPress: () => {
              deleteChannel();
            },
          },
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const showConfirmationPopup = () => {
    Alert.alert(
      'Are you sure?',
      `This chat will be also be permanently removed from your friend's devices.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteChannel();
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.width}><BackButton styles={styles.closeButton} /></View>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerText}>Chat Detail</Text>
        </View>
        <View style={styles.width} />

      </View>
      {channelType == 'conversation' ? (
        <>
          {/* <TouchableOpacity style={styles.rowContainer} onPress={flagUser}>
                        <View style={styles.ChatSettingContainer}>
                            <Text style={styles.reportChatLabel}>Report User</Text>
                        </View>
                    </TouchableOpacity> */}
          <TouchableOpacity
            style={styles.rowContainer}
            onPress={showConfirmationPopup}
          >
            <View style={styles.ChatSettingContainer}>
              <Text style={styles.leaveChatLabel}>Delete Chat</Text>
            </View>
          </TouchableOpacity>
        </>
      ) : (
        <FlatList
          data={data}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
        />
      )}
      <AwesomeAlert
        show={showReportAlert}
        showProgress={false}
        title="Report sent"
        closeOnTouchOutside={true}
        closeOnHardwareBackPress={false}
        showCancelButton={false}
        showConfirmButton={true}
        confirmText="OK"
        confirmButtonColor="#1054DE"
        onCancelPressed={() => {
          setShowReportAlert(false);
        }}
        onConfirmPressed={() => setShowReportAlert(false)}
        onDismiss={() => setShowReportAlert(false)}
      />
      {loading ? <LoadingOverlay /> : null}
    </View>
  );
};
