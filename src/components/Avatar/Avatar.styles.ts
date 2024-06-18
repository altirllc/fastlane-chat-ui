
import { StyleSheet } from 'react-native';

export const AVATAR_SIZE = 48

export const useAvatarStyles = () => {
    const styles = StyleSheet.create({
        avatarContainer: {
            width: AVATAR_SIZE,
            height: AVATAR_SIZE,
            borderRadius: (AVATAR_SIZE / 2),
            backgroundColor: 'white',
            overflow: 'hidden',
        },
        avatarCircle: {
            backgroundColor: '#EDEFF5',
            borderWidth: 0.5,
            borderColor: '#fff',
        },
        avatarImage: {
            width: '100%',
            height: '100%',
        },
        initials: {
            color: '#6E768A',
        },
        membersLeftCount: {
            fontSize: AVATAR_SIZE / 6,
            color: '#6E768A',
        },
    });
    return styles
}

