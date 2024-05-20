import { StyleSheet } from 'react-native';
import { useTheme } from 'react-native-paper';
import type { MyMD3Theme } from '../../providers/amity-ui-kit-provider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
const CAMERA_ICON_SIZE = 30;

export const useStyles = () => {
    const theme = useTheme() as MyMD3Theme;
    const { top, bottom } = useSafeAreaInsets();

    const styles = StyleSheet.create({
        topMostContainer: {
            width: '100%',
            height: '100%',
            marginTop: top,
            marginBottom: bottom,
        },
        topBarContainer: {
            backgroundColor: theme.colors.background,
        },
        container: {
            flex: 1,
            alignItems: 'center',
            paddingHorizontal: 16,
            backgroundColor: theme.colors.background,
        },
        avatarContainer: {
            position: 'relative',
            marginTop: 20,
            marginBottom: 48

        },
        avatar: {
            width: 64,
            height: 64,
            borderRadius: 32
        },
        uploadedImage: {
            width: 55,
            height: 53,
            borderRadius: 32
        },

        uploadedCameraIconContainer: {
            position: 'absolute',
            bottom: 3,
            right: -5,
        },
        cameraIconContainer: {
            position: 'absolute',
            bottom: -8,
            right: -5,
        },
        cameraIcon: {
            backgroundColor: theme.colors.secondary,
            borderRadius: CAMERA_ICON_SIZE / 2,
            padding: 5,
            margin: 5,
        },

        displayNameContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 10,
            justifyContent: 'space-between',
            width: '100%'
        },
        displayNameText: {
            flex: 1,
            fontWeight: '600',
            fontSize: 17,
            color: theme.colors.base
        },
        characterCountContainer: {
            marginRight: 10,
            color: theme.colors.base
        },
        characterCountText: {
            fontSize: 14,
            color: theme.colors.baseShade1,
        },
        input: {
            width: '100%',
            height: 50,
            padding: 10,
            borderBottomWidth: 1,
            borderRadius: 5,
            borderColor: theme.colors.border,
            color: theme.colors.base,
            fontSize: 16,
        },
        topBar: {
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            backgroundColor: theme.colors.background,
            paddingHorizontal: 16,
            // paddingVertical: 20
        },
        headerTextContainer: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
        },
        headerText: {
            fontWeight: '600',
            fontSize: 17,
            textAlign: 'center',
            color: theme.colors.base
        },
        backButton: {
            padding: 10
        },
    });
    return styles;
}
