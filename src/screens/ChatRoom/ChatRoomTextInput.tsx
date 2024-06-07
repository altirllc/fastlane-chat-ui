/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-native/no-inline-styles */
import React, { memo } from 'react';
import {
    View,
    TouchableOpacity,
    TextInput,
    Platform,
    KeyboardAvoidingView,
    ActivityIndicator,
} from 'react-native';
import CustomText from '../../components/CustomText';
import { CameraBoldIcon } from '../../svg/CameraBoldIcon';
import { SendChatIcon } from '../../svg/SendChatIcon';
import { AlbumIcon } from '../../svg/AlbumIcon';
import { SendImage } from '../../svg/SendImage';
import { useStyles } from './styles'
import { useTheme } from 'react-native-paper';
import type { MyMD3Theme } from '../../providers/amity-ui-kit-provider';

export type TChatRoomTextInput = {
    inputMessage: string;
    isSendLoading: boolean;
    isExpanded: boolean;
    setInputMessage: React.Dispatch<React.SetStateAction<string>>;
    handleOnFocus: () => void;
    handleSend: () => Promise<void>;
    handlePress: () => void;
    pickCamera: () => Promise<void>;
    pickImage: () => Promise<void>;
}

export const ChatRoomTextInput = memo(({
    inputMessage,
    isSendLoading,
    isExpanded,
    setInputMessage,
    handleOnFocus,
    handleSend,
    handlePress,
    pickCamera,
    pickImage
}: TChatRoomTextInput) => {
    const styles = useStyles();
    const theme = useTheme() as MyMD3Theme;

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.select({ ios: 50, android: 80 })}
            style={styles.AllInputWrap}
        >
            <View style={styles.InputWrap}>
                <TextInput
                    style={styles.input}
                    value={inputMessage}
                    onChangeText={(text) => setInputMessage(text)}
                    placeholder="Type a message..."
                    placeholderTextColor={theme.colors.baseShade3}
                    onFocus={handleOnFocus}
                    multiline
                />

                {inputMessage.length > 0 ? (
                    isSendLoading ? (
                        <ActivityIndicator style={styles.sendIcon} />
                    ) : (
                        <TouchableOpacity onPress={handleSend} style={styles.sendIcon}>
                            <SendChatIcon color={theme.colors.primary} />
                        </TouchableOpacity>
                    )
                ) : (
                    <View>
                        <TouchableOpacity onPress={handlePress} style={styles.sendIcon}>
                            <SendImage color={theme.colors.base} />
                        </TouchableOpacity>
                    </View>
                )}
            </View>
            {isExpanded && (
                <View style={styles.expandedArea}>
                    <TouchableOpacity
                        onPress={pickCamera}
                        style={{ marginHorizontal: 30 }}
                    >
                        <View style={styles.IconCircle}>
                            <CameraBoldIcon color={theme.colors.base} />
                        </View>
                        <CustomText style={styles.iconText}>Camera</CustomText>
                    </TouchableOpacity>
                    <TouchableOpacity
                        // disabled={loadingImages.length > 0}
                        onPress={pickImage}
                        style={{ marginHorizontal: 20, alignItems: 'center' }}
                    >
                        <View style={styles.IconCircle}>
                            <AlbumIcon color={theme.colors.base} />
                        </View>
                        <CustomText style={styles.iconText}>Album</CustomText>
                    </TouchableOpacity>
                </View>
            )}
        </KeyboardAvoidingView>
    )
})