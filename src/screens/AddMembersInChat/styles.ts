import { StyleSheet } from "react-native";
import { useTheme } from "react-native-paper";
import type { MyMD3Theme } from '../../providers/amity-ui-kit-provider';
import { SCREEN_PADDING } from "@amityco/react-native-cli-chat-ui-kit/src/theme";

export const useStyles = () => {

    const theme = useTheme() as MyMD3Theme;

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.colors.background,
        },
        header: {
            zIndex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 15
        },
        closeButton: {
            width: '10%',
            paddingVertical: 15,
        },
        doneContainer: { width: '15%', paddingVertical: 12, alignItems: 'flex-end' },
        headerTextContainer: {
            width: '75%',
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
        avatar: {
            width: 40,
            height: 40,
            borderRadius: 20,
            marginBottom: 10,
            backgroundColor: '#D9E5FC',
        },
        categoryIcon: {
            alignItems: 'center'
        },
        LoadingIndicator: {
            paddingVertical: 20,
        },
        headerWrap: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        inputWrap: {
            marginHorizontal: 16,
            backgroundColor: theme.colors.secondary,
            borderRadius: 30,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 10,
            marginVertical: 10,
            paddingVertical: 10,
            borderWidth: 1,
        },
        memberText: {
            fontWeight: '300',
            fontSize: 12,
            textAlign: 'left',
            color: theme.colors.baseShade1,
            marginVertical: 20,
            paddingLeft: 10
        },
        input: { flex: 1, marginHorizontal: 6 },
        cancelBtn: {
            marginRight: 16,
        },
        searchScrollList: {
            paddingBottom: 110,
            marginTop: 10,
        },
        doneText: {
            color: theme.colors.primary
        },
        disabledDone: {
            opacity: 0.5
        },
        noMembersContainer: {
            backgroundColor: theme.colors.background,
            height: 100,
            width: '100%',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 50,
            paddingHorizontal: SCREEN_PADDING
        },
        noMembersText: { fontSize: 24, fontWeight: '700', marginBottom: 10 },
        noMembersDesc: { fontSize: 14, fontWeight: 'normal', color: theme.colors.base },
        separator: {
            borderBottomWidth: 0.7,
            borderColor: theme.colors.baseShade3,
            marginVertical: 10,
            shadowColor: theme.colors.baseShade3,
            shadowOffset: {
                width: 0,
                height: 2,
            },
            shadowOpacity: 0.4,
            shadowRadius: 2,
            elevation: 2,
        }
    });
    return styles;
}
