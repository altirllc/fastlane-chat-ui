import { StyleSheet } from 'react-native';
import { useTheme } from 'react-native-paper';
import type { MyMD3Theme } from '../../providers/amity-ui-kit-provider';

export const useStyles = () => {
    const theme = useTheme() as MyMD3Theme;
    const styles = StyleSheet.create({
        listItem: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: 50,
            marginVertical: 10,
            width: '100%',
        },
        avatar: {
            width: 40,
            height: 40,
            borderRadius: 72,
            marginRight: 10,
        },
        itemText: {
            fontSize: 15,
            fontWeight: '600',
            color: theme.colors.base
        },
        chapterName: {
            fontSize: 12,
            fontWeight: '300',
            color: theme.colors.base
        },
        leftContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            height: '100%'
        },
        dotIcon: {
            width: 16,
            height: 12
        },
        middleContainer: { width: '70%', height: '100%', justifyContent: 'space-evenly' },
        adminTag: {
            fontSize: 12,
            fontWeight: '300',
            color: theme.colors.base
        }
    })
    return styles;
}
