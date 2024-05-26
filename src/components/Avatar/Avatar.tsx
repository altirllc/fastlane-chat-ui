import { TAvatarArray } from '../../../src/hooks/useAvatarArray';
import useAuth from '../../../src/hooks/useAuth';
import { AVATAR_SIZE, useAvatarStyles } from './Avatar.styles';
import * as React from 'react';
import { View, Text, Image, FlatList } from 'react-native';


export type TAvatar = {
    avatars: TAvatarArray[]
}

export const Avatar = ({ avatars }: TAvatar) => {
    const { apiRegion } = useAuth();
    const styles = useAvatarStyles();
    const renderAvatar = (avatar: TAvatarArray, index: number, height: number, width: number) => {
        switch (avatar.type) {
            case 'avatar':
                return (
                    <View style={[styles.avatarCircle, {
                        width: width,
                        height: height,
                    }]} key={index}>
                        <View style={{ width: '100%', height: '100%' }}>
                            <Image resizeMode='cover' source={{ uri: `https://api.${apiRegion}.amity.co/api/v3/files/${avatar.value}/download?size=small` }} style={styles.avatarImage} />
                        </View>
                    </View>
                );
            case 'nameInitials':
                return (
                    <View style={[styles.avatarCircle, {
                        width: width,
                        height: height,
                    }]} key={index}>
                        <View style={{ margin: 5 }}>
                            <Text style={styles.initials}>{avatar.value}</Text>
                        </View>
                    </View>
                );
            case 'membersLeftCount':
                return (
                    <View style={[styles.avatarCircle, {
                        width: width,
                        height: height,
                    }]} key={index}>
                        <View style={{ margin: 5 }}>
                            <Text style={styles.membersLeftCount}>+{avatar.value}</Text>
                        </View>
                    </View>
                );
            default:
                return null;
        }
    };
    return (
        <View style={styles.avatarContainer}>
            {
                avatars && avatars.length === 3 ? (
                    <View style={{ flexDirection: 'row' }}>
                        <View style={{ width: '50%', borderRightWidth: 0.5, borderColor: '#fff', }}>
                            {
                                // @ts-ignore
                                renderAvatar(avatars[0], 0, AVATAR_SIZE, AVATAR_SIZE / 2)
                            }
                        </View>
                        <View style={{ width: '50%', overflow: 'hidden' }}>
                            <FlatList
                                data={avatars.slice(1, avatars.length)}
                                numColumns={1}
                                renderItem={({ item, index }) => renderAvatar(item, index, AVATAR_SIZE / 2, AVATAR_SIZE / 2)}
                                keyExtractor={(item) => item.value.toString()}
                            />
                        </View>
                    </View>
                ) : <FlatList
                    data={avatars}
                    numColumns={2}
                    renderItem={({ item, index }) => renderAvatar(item, index, AVATAR_SIZE / 2, AVATAR_SIZE / 2)}
                    keyExtractor={(item) => item.value.toString()}
                />
            }

        </View>
    )
}