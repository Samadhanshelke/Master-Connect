export type ChatRoomType = 'group';

export type ChatGroup = {
  id: string;
  name: string;
  city: string;
  memberCount: number;
};

export type PollOptionRecord = {
  text: string;
  votes: number;
  votedBy: string[];
};

export type MessageAttachmentRecord = {
  type: 'image' | 'poll' | 'document';
  url?: string;
  fileName?: string;
  pollOptions?: PollOptionRecord[];
};

export type ChatMessageRecord = {
  id: string;
  authorId: string;
  authorName: string;
  text: string;
  createdAt: string;
  attachment?: MessageAttachmentRecord;
};
