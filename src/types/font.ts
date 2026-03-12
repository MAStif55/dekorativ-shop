export interface FontModel {
    id?: string;
    name: string;
    category: string;
    file: string;
    url: string;
    tags: string[];
    createdAt?: number;
    isVerified?: boolean;
}
