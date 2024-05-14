import { UserInterface } from "@amityco/react-native-cli-chat-ui-kit/src/types/user.interface"

export type TFinalUser = {
    title: 'Recent Members' | 'All Members',
    data: UserInterface[],
    noDataText: string
}