import { IDisplayImage } from "@amityco/react-native-cli-chat-ui-kit/src/screens/ChatRoom/ChatRoom";
import { MessageContentType, MessageRepository } from "@amityco/ts-sdk-react-native";
import { useCallback, useEffect, useState } from "react";
import ImagePicker, {
    launchImageLibrary,
    type Asset,
    launchCamera,
} from 'react-native-image-picker';

export const useImageHook = (channelId: string) => {

    const [visibleFullImage, setIsVisibleFullImage] = useState<boolean>(false);
    const [fullImage, setFullImage] = useState<string>('');
    const [imageMultipleUri, setImageMultipleUri] = useState<string[]>([]);
    const [displayImages, setDisplayImages] = useState<IDisplayImage[]>([]);

    const openFullImage = useCallback((image: string, messageType: string) => {
        if (messageType === 'image' || messageType === 'file') {
            const fullSizeImage: string = image + '?size=full';
            setFullImage(fullSizeImage);
            setIsVisibleFullImage(true);
        }
    }, []);

    const pickImage = async () => {
        const result: ImagePicker.ImagePickerResponse = await launchImageLibrary({
            mediaType: 'photo',
            quality: 1,
            selectionLimit: 10,
        });
        if (!result.didCancel && result.assets && result.assets.length > 0) {
            const selectedImages: Asset[] = result.assets;
            const imageUriArr: string[] = selectedImages.map(
                (item: Asset) => item.uri
            ) as string[];
            const imagesArr = [...imageMultipleUri];
            const totalImages = imagesArr.concat(imageUriArr);
            setImageMultipleUri(totalImages);
        }
    };

    useEffect(() => {
        if (imageMultipleUri.length > 0 && displayImages.length === 0) {
            const imagesObject: IDisplayImage[] = imageMultipleUri.map(
                (url: string) => {
                    const fileName: string = url.substring(url.lastIndexOf('/') + 1);

                    return {
                        url: url,
                        fileName: fileName,
                        fileId: '',
                        isUploaded: false,
                    };
                }
            );
            setDisplayImages([imagesObject[0]] as IDisplayImage[]);
        }
    }, [imageMultipleUri]);


    const createImageMessage = async (fileId: string) => {
        if (fileId) {
            const imageMessage = {
                subChannelId: channelId,
                dataType: MessageContentType.IMAGE,
                fileId: fileId,
            };
            await MessageRepository.createMessage(imageMessage);
        }
    };


    const handleOnFinishImage = async (fileId: string, originalPath: string) => {
        createImageMessage(fileId);
        setTimeout(() => {
            setDisplayImages((prevData) => {
                const newData: IDisplayImage[] = prevData.filter(
                    (item: IDisplayImage) => item.url !== originalPath
                ); // Filter out objects containing the desired value
                return newData; // Update the state with the filtered array
            });
            setImageMultipleUri((prevData) => {
                const newData = prevData.filter((url: string) => url !== originalPath); // Filter out objects containing the desired value
                return newData; // Update the state with the filtered array
            });
        }, 0);
    };


    const pickCamera = async () => {
        const result: ImagePicker.ImagePickerResponse = await launchCamera({
            mediaType: 'photo',
            quality: 1,
        });
        if (
            result.assets &&
            result.assets.length > 0 &&
            result.assets[0] !== null &&
            result.assets[0]
        ) {
            const imagesArr: string[] = [...imageMultipleUri];
            imagesArr.push(result.assets[0].uri as string);
            setImageMultipleUri(imagesArr);
        }
    };

    return {
        openFullImage,
        pickImage,
        handleOnFinishImage,
        pickCamera,
        displayImages,
        fullImage,
        visibleFullImage,
        setIsVisibleFullImage
    }

}