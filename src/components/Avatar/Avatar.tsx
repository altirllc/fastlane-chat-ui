import { TAvatarArray } from '../../../src/hooks/useAvatarArray';
import { AVATAR_SIZE, useAvatarStyles } from './Avatar.styles';
import * as React from 'react';
import { View, Text, Image, FlatList } from 'react-native';


export type TAvatar = {
    avatars: TAvatarArray[];
    heightProp?: number;
    widthProp?: number;
}

const DEFAULT_WIDTH = AVATAR_SIZE;
const DEFAULT_HEIGHT = AVATAR_SIZE;

export const Avatar = ({ avatars, heightProp = DEFAULT_HEIGHT, widthProp = DEFAULT_WIDTH }: TAvatar) => {
    const styles = useAvatarStyles();
    const renderAvatar = (avatar: TAvatarArray, index: number, height: number, width: number, initialsFontSize: number = AVATAR_SIZE / 6) => {
        switch (avatar.type) {
            case 'avatar':
                return (
                    <View style={[styles.avatarCircle, {
                        width: width,
                        height: height,
                    }]} key={index}>
                        <View style={{ width: '100%', height: '100%' }}>
                            {/* TODO: Replace harcoded "us" with apiregion  */}
                            <Image resizeMode='cover' source={{ uri: `https://api.${'us'}.amity.co/api/v3/files/${avatar.value}/download?size=small` }} style={styles.avatarImage} />
                        </View>
                    </View>
                );
            case 'nameInitials':
                return (
                    <View style={[styles.avatarCircle, {
                        width: width,
                        height: height,
                        alignItems: 'center',
                        justifyContent: 'center'
                    }]} key={index}>
                        <View style={{ margin: 5 }}>
                            <Text style={[styles.initials, { fontSize: initialsFontSize }]}>{avatar.value}</Text>
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
                avatars && avatars.length === 1 ? (
                    <View style={{ width: '100%', height: '100%' }}>
                        {
                        /* TODO: Replace harcoded "us" with apiregion  
                        */}
                        {
                            // @ts-ignore
                            renderAvatar(avatars[0], 0, heightProp, widthProp, AVATAR_SIZE / 3.5)
                            // <Image resizeMode='cover' source={{ uri: `https://api.${'us'}.amity.co/api/v3/files/${avatars[0]?.value}/download?size=small` }} style={styles.avatarImage} />
                        }
                    </View>
                ) : avatars && avatars.length === 2 ? (
                    <View style={{ flexDirection: 'row' }}>
                        <View style={{ width: '50%', borderRightWidth: 0.5, borderColor: '#fff', }}>
                            {
                                // @ts-ignore
                                renderAvatar(avatars[0], 0, heightProp, widthProp / 2)
                            }
                        </View>
                        <View style={{ width: '50%', borderRightWidth: 0.5, borderColor: '#fff' }}>
                            {
                                // @ts-ignore
                                renderAvatar(avatars[1], 0, heightProp, widthProp / 2)
                            }
                        </View>
                    </View>
                ) : avatars && avatars.length === 3 ? (
                    <View style={{ flexDirection: 'row' }}>
                        <View style={{ width: '50%', borderRightWidth: 0.5, borderColor: '#fff', }}>
                            {
                                // @ts-ignore
                                renderAvatar(avatars[0], 0, heightProp, widthProp / 2)
                            }
                        </View>
                        <View style={{ width: '50%', overflow: 'hidden' }}>
                            <FlatList
                                data={avatars.slice(1, avatars.length)}
                                numColumns={1}
                                renderItem={({ item, index }) => renderAvatar(item, index, heightProp / 2, widthProp / 2)}
                                keyExtractor={(item) => item.value.toString()}
                            />
                        </View>
                    </View>
                ) : (
                    <FlatList
                        data={avatars}
                        numColumns={2}
                        renderItem={({ item, index }) => renderAvatar(item, index, heightProp / 2, widthProp / 2)}
                        keyExtractor={(item) => item.value.toString()}
                    />
                )
            }

        </View>
    )
}