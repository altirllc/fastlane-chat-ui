import { UserInterface } from "../../../src/types/user.interface"

export type TFinalUser = {
    id: number;
    title: 'Recent Members' | 'All Members',
    data: UserInterface[],
    noDataText: string
}