export interface Review {
    id: string;
    author: string;
    content: string;
    rating: number;
    sourceUrl?: string;
    createdAt: number; // Epoch milliseconds — serialized from Firebase Timestamp in repository
}
