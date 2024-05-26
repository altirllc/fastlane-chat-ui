
import { StyleSheet } from 'react-native';
import { useTheme } from "react-native-paper";
import type { MyMD3Theme } from "../../providers/amity-ui-kit-provider";
import { AVATAR_SIZE } from '../../../src/components/Avatar/Avatar.styles';

export const useStyles = () => {
  const theme = useTheme() as MyMD3Theme;
  const styles = StyleSheet.create({
    icon: {
      backgroundColor: '#EDEFF5',
      width: AVATAR_SIZE,
      height: AVATAR_SIZE,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: AVATAR_SIZE / 2,
    },
    chatCard: {
      backgroundColor: theme.colors.background,
      paddingLeft: 16,
      flexDirection: 'row',
    },
    chatDetailSection: {
      flex: 6,
      borderBottomColor: theme.colors.border,
      borderBottomWidth: 1,
      paddingVertical: 16,
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingRight: 16,
    },
    avatarSection: {
      flex: 1,
      paddingVertical: 16,
      marginRight: 10,
    },
    chatName: {
      fontWeight: '600',
      fontSize: 17,
      color: theme.colors.base,
      width: 'auto',
      maxWidth: 200,
    },
    chatNameWrap: {
      flexDirection: 'row',
    },
    chatLightText: {
      fontWeight: '400',
      fontSize: 13,
      marginHorizontal: 4,
      marginVertical: 2,
      color: theme.colors.baseShade1
    },
    messagePreview: {
      fontWeight: '400',
      fontSize: 15,
      color: theme.colors.baseShade1,
    },
    unReadBadge: {
      borderRadius: 72,
      backgroundColor: '#007AFF',
      width: 'auto',
      display: 'flex',
      alignItems: 'center',
      marginVertical: 2,
      minWidth: 22,
    },
    unReadText: {
      color: '#FFFFFF',
      textAlign: 'center',
      padding: 3,
      minWidth: 20,
    },
    chatTimeWrap: {
      width: '25%',
      flexDirection: 'column',
      alignItems: 'flex-end',
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 72,
      marginRight: 8,
      marginLeft: 10,
    },
  });
  return styles
}

