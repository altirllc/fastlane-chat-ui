import { StyleSheet } from "react-native";
import { useTheme } from "react-native-paper";
import type { MyMD3Theme } from "../../providers/amity-ui-kit-provider";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const useEnterGroupNameStyles = () => {
    const theme = useTheme() as MyMD3Theme;
    const { top, bottom } = useSafeAreaInsets();

    const styles = StyleSheet.create({
        container: {
            height: '100%',
            marginTop: top,
            marginBottom: bottom,
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
        doneText: {
            color: theme.colors.primary
        },
        disabledDone: {
            opacity: 0.5
        },
        innerContainer: {
            paddingHorizontal: 20
        },
        memberText: {
            fontWeight: '300',
            fontSize: 12,
            textAlign: 'left',
            color: theme.colors.baseShade1,
            marginTop: 15
        },
        inputWrap: {
            backgroundColor: theme.colors.secondary,
            borderRadius: 10,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 16,
            marginVertical: 10,
            paddingVertical: 15,
        },
    });
    return styles;
}
