export type PostVisibility = 'local' | 'global';

export type PostCommentRecord = {
  id: string;
  authorId: string;
  user: string;
  text: string;
  createdAt: string;
};

export type PostRecord = {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  visibility: PostVisibility;
  location: string;
  likesCount: number;
  likedBy: string[];
  comments: PostCommentRecord[];
  createdAt: string;
  attachment?: {
    type: 'image' | 'images' | 'poll' | 'document';
    url?: string;
    urls?: string[];
    pollOptions?: { text: string; votes: number }[];
    fileName?: string;
  };
};
