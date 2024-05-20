import { StyleSheet } from 'react-native';
import { useTheme } from 'react-native-paper';
import { ColorValue } from 'react-native/types';
import type { MyMD3Theme } from '../../providers/amity-ui-kit-provider';
import { SCREEN_PADDING } from '../../theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const useStyles = () => {
  const theme = useTheme() as MyMD3Theme;
  const { top } = useSafeAreaInsets();
  const styles = StyleSheet.create({
    fontStyle: {
      color: '#1054DE',
      fontWeight: '500',
      margin: 5,
      fontSize: 17,
    },

    tabStyle: {
      backgroundColor: '#FFFFF',
      minHeight: 30,
      width: 100,
      padding: 6,
    },
    indicatorStyle: {
      backgroundColor: '#1054DE',
    },
    topBar: {
      // paddingTop: Platform.OS === 'ios' ? 50 : 20,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.colors.background,
      paddingHorizontal: 20,
      paddingVertical: 10,
    },
    addChatIcon: {
      width: 24,
      height: 20,
      resizeMode: 'contain',
    },
    titleText: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.colors.base
    },
    tabView: {
      backgroundColor: theme.colors.background,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      flexDirection: 'row',
    },
    tabViewTitle: {
      // paddingHorizontal:20,
      paddingVertical: 14,
      fontWeight: '600',
      fontSize: 17,
      color: theme.colors.primary,
      borderBottomColor: '#1054DE',
      alignSelf: 'flex-start',
    },
    indicator: {
      borderBottomWidth: 2,
      borderBottomColor: theme.colors.primary,
      marginHorizontal: 20,
    },
    androidWrap: {
      marginTop: 0,
    },
    iosWrap: {
      marginTop: 30,
    },
    chatContainer: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    chatHeader: { marginLeft: 24, fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
    chatListContainer: {
      flex: 1,
    },
    createFeedButton: {
      position: "absolute",
      bottom: 24,
      right: 24,
      width: 56,
      height: 56,
      zIndex: 100,
      borderRadius: 28,
      alignItems: "center",
      justifyContent: "center",
    },
    noMessageContainer: {
      backgroundColor: theme.colors.background,
      height: 100,
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 50
    },
    noMessageText: { fontSize: 24, fontWeight: '700', marginBottom: 10 },
    noMessageDesc: { fontSize: 14, fontWeight: 'normal', color: theme.colors.base },
    welcomeContainer: {
      paddingHorizontal: SCREEN_PADDING,
      paddingTop: top,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      width: '100%',
      paddingBottom: 10,
    },
    width1: {
      width: '10%',
      alignItems: 'center',
    },
    width2: {
      width: '80%',
      alignItems: 'center',
    },
  });
  return styles;
}

interface IGetShadowProps {
  offset?: number;
  radius?: number;
  opacity?: number;
  color?: ColorValue;
  noElevation?: boolean;
}

export const getShadowProps = (props?: IGetShadowProps) => {
  const shadowProps = {
    shadowColor: props?.color ?? '#000',
    shadowOffset: {
      width: 0,
      height: props?.offset ?? 2,
    },
    shadowOpacity: props?.opacity ?? 0.2,
    shadowRadius: props?.radius ?? 2,
    elevation: props?.radius ?? 2,
  };

  if (props?.noElevation) {
    return shadowProps;
  }
  return { ...shadowProps, elevation: props?.radius ?? 2 };
};