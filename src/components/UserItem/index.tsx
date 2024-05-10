import React, { useState } from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { useStyles } from './styles';
import RoundCheckbox from '../RoundCheckbox/index';
import type { UserInterface } from '../../types/user.interface';
import useAuth from '../../hooks/useAuth';
import { AvatarIcon } from '../../svg/AvatarIcon';
// import { ThreeDotsIcon } from '../../svg/ThreeDotsIcon';
// import { useTheme } from 'react-native-paper';
// import type { MyMD3Theme } from '../../providers/amity-ui-kit-provider';

export default function UserItem({
  user,
  isCheckmark,
  // showThreeDot,
  onPress,
  // onThreeDotTap,
  showCheckMark = false,
}: {
  user: UserInterface;
  isCheckmark?: boolean | undefined;
  showThreeDot?: boolean | undefined;
  onPress?: (user: UserInterface) => void;
  onThreeDotTap?: (user: UserInterface) => void;
  showCheckMark?: boolean
}) {

  // const theme = useTheme() as MyMD3Theme;
  const styles = useStyles();
  const { apiRegion } = useAuth()
  const [isChecked, setIsChecked] = useState(false);
  const maxLength = 25;
  const handleToggle = () => {
    setIsChecked(!isChecked);
    if (onPress) {
      onPress(user);
    }
  };

  const displayName = () => {
    if (user.displayName) {
      if (user.displayName!.length > maxLength) {
        return user.displayName!.substring(0, maxLength) + '..';
      }
      return user.displayName!;
    }
    return 'Display name';
  };
  const avatarFileURL = (fileId: string) => {
    return `https://api.${apiRegion}.amity.co/api/v3/files/${fileId}/download?size=medium`;
  };


  return (
    <TouchableOpacity style={styles.listItem} disabled={!showCheckMark} onPress={handleToggle}>
      <View style={styles.listItem} >
        <View style={[styles.leftContainer, { alignItems: 'center' }]}>
          <View style={{ width: '15%' }}>
            {
              user?.avatarFileId ? (
                <Image
                  style={styles.avatar}
                  source={{ uri: avatarFileURL(user.avatarFileId) }}
                />
              ) : (
                <View style={styles.avatar}>
                  <AvatarIcon />
                </View>
              )
            }
          </View>
          <View style={styles.middleContainer}>
            <Text style={styles.itemText}>{displayName()}</Text>
            {
              user.chapterName ? <Text style={styles.chapterName}>{user.chapterName}</Text> : null
            }
          </View>
        </View>
      </View >
      {
        showCheckMark ? <RoundCheckbox isChecked={isCheckmark ?? false} /> : null
      }
    </TouchableOpacity>

  );
}
