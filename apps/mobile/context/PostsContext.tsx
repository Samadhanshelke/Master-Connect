import { PostData } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useUserProfile } from '@/context/UserProfileContext';
import {
  deleteNotification,
  followNotificationId,
  mentionNotificationId,
  upsertNotification,
} from '@/services/notifications';
import {
  addPostComment,
  createPost as createPostDoc,
  deletePost as deletePostDoc,
  getPostRecord,
  reportPost as reportPostDoc,
  subscribeToCollectionIds,
  subscribeToPosts,
  toPostData,
  toggleBookmark as toggleBookmarkDoc,
  toggleFollow as toggleFollowDoc,
  togglePostLike,
} from '@/services/posts';
import { PostRecord, PostVisibility } from '@/types/post';
import { findUsersByMentions } from '@/services/users';
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

type PostsContextType = {
  posts: PostData[];
  allPosts: PostData[];
  loading: boolean;
  followingCount: number;
  followerCount: number;
  createPost: (content: string, visibility: PostVisibility, attachment?: PostRecord['attachment']) => Promise<void>;
  toggleLike: (postId: string) => Promise<void>;
  toggleBookmark: (postId: string) => Promise<void>;
  toggleFollow: (postId: string) => Promise<void>;
  addComment: (postId: string, text: string) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
  reportPost: (postId: string) => Promise<void>;
  getPost: (postId: string) => PostData | undefined;
};

const PostsContext = createContext<PostsContextType | undefined>(undefined);

export function PostsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const [records, setRecords] = useState<PostRecord[]>([]);
  const [extraRecords, setExtraRecords] = useState<PostRecord[]>([]);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [followerIds, setFollowerIds] = useState<Set<string>>(new Set());
  const [bookmarkIds, setBookmarkIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRecords([]);
      setExtraRecords([]);
      setFollowingIds(new Set());
      setFollowerIds(new Set());
      setBookmarkIds(new Set());
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubPosts = subscribeToPosts(
      (posts) => {
        setRecords(posts);
        setLoading(false);
      },
      (error) => {
        console.error('Error loading posts:', error);
        setLoading(false);
      },
    );

    const unsubFollowing = subscribeToCollectionIds(
      ['users', user.uid, 'following'],
      setFollowingIds,
      (error) => console.error('Error loading following:', error),
    );

    const unsubFollowers = subscribeToCollectionIds(
      ['users', user.uid, 'followers'],
      setFollowerIds,
      (error) => console.error('Error loading followers:', error),
    );

    const unsubBookmarks = subscribeToCollectionIds(
      ['users', user.uid, 'bookmarks'],
      setBookmarkIds,
      (error) => console.error('Error loading bookmarks:', error),
    );

    return () => {
      unsubPosts();
      unsubFollowing();
      unsubFollowers();
      unsubBookmarks();
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const knownIds = new Set(records.map((record) => record.id));
    const missingIds = [...bookmarkIds].filter((id) => !knownIds.has(id));
    if (missingIds.length === 0) {
      setExtraRecords([]);
      return;
    }

    let cancelled = false;
    Promise.all(missingIds.map((id) => getPostRecord(id)))
      .then((found) => {
        if (!cancelled) {
          setExtraRecords(found.filter((item): item is PostRecord => item !== null));
        }
      })
      .catch((error) => console.error('Error loading saved posts:', error));

    return () => {
      cancelled = true;
    };
  }, [bookmarkIds, records, user]);

  const uid = user?.uid;

  const allRecords = useMemo(() => {
    const byId = new Map<string, PostRecord>();
    [...records, ...extraRecords].forEach((record) => byId.set(record.id, record));
    return [...byId.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [records, extraRecords]);

  const allPosts = useMemo(
    () => allRecords.map((record) => toPostData(record, uid, followingIds, bookmarkIds)),
    [allRecords, uid, followingIds, bookmarkIds],
  );

  const posts = useMemo(() => {
    const location = profile?.location;

    return allPosts.filter((post) => {
      const record = allRecords.find((item) => item.id === post.id);
      if (!record || record.visibility === 'global') return true;
      if (!location) return true;
      return record.location === location || record.authorId === uid;
    });
  }, [allPosts, allRecords, profile?.location, uid]);

  const getPost = (postId: string) => allPosts.find((post) => post.id === postId);

  const actorName = () => profile?.name || user?.email?.split('@')[0] || 'Someone';

  const notifyMentions = async (postId: string, text: string) => {
    if (!user) return;
    const handles = [...text.matchAll(/@(\w+)/g)].map((match) => match[1]);
    if (handles.length === 0) return;
    try {
      const mentioned = (await findUsersByMentions(handles)).filter((mentionedUser) => mentionedUser.id !== user.uid);
      await Promise.all(
        mentioned.map((mentionedUser) =>
          upsertNotification(mentionNotificationId(postId, mentionedUser.id), {
            type: 'mention',
            recipientId: mentionedUser.id,
            actorId: user.uid,
            actorName: actorName(),
            message: 'mentioned you',
            postId,
          }),
        ),
      );
    } catch (error) {
      console.error('Error notifying mentions:', error);
    }
  };

  const createPost = async (content: string, visibility: PostVisibility, attachment?: PostRecord['attachment']) => {
    if (!user) throw new Error('You must be signed in to post');

    const postId = await createPostDoc({
      authorId: user.uid,
      authorName: profile?.name || user.email?.split('@')[0] || 'User',
      content,
      visibility,
      location: profile?.location || '',
      attachment,
    });

    await notifyMentions(postId, content);
  };

  const toggleLike = async (postId: string) => {
    if (!user) throw new Error('You must be signed in');
    const post = getPost(postId);
    if (!post) return;
    await togglePostLike(postId, user.uid, post.isLiked);
  };

  const toggleBookmark = async (postId: string) => {
    if (!user) throw new Error('You must be signed in');
    const post = getPost(postId);
    if (!post) return;
    await toggleBookmarkDoc(user.uid, postId, post.isBookmarked);
  };

  const toggleFollow = async (postId: string) => {
    if (!user) throw new Error('You must be signed in');
    const post = getPost(postId);
    if (!post || post.authorId === user.uid) return;
    await toggleFollowDoc(user.uid, post.authorId, post.isFollowing);

    const notificationId = followNotificationId(user.uid);
    if (post.isFollowing) {
      try {
        await deleteNotification(post.authorId, notificationId);
      } catch (error) {
        console.error('Error removing follow notification:', error);
      }
      return;
    }

    try {
      await upsertNotification(notificationId, {
        type: 'follow',
        recipientId: post.authorId,
        actorId: user.uid,
        actorName: actorName(),
        message: 'started following you',
        postId: null,
      });
    } catch (error) {
      console.error('Error creating follow notification:', error);
    }
  };

  const addComment = async (postId: string, text: string) => {
    if (!user) throw new Error('You must be signed in');
    const post = getPost(postId);
    await addPostComment(postId, {
      authorId: user.uid,
      user: actorName(),
      text,
    });

    if (!post) return;
    await notifyMentions(postId, text);
  };

  const deletePost = async (postId: string) => {
    if (!user) throw new Error('You must be signed in');
    const post = getPost(postId);
    if (!post || post.authorId !== user.uid) {
      throw new Error('You can only delete your own posts');
    }
    await deletePostDoc(postId);
  };

  const reportPost = async (postId: string) => {
    if (!user) throw new Error('You must be signed in');
    const post = getPost(postId);
    await reportPostDoc(postId, user.uid, {
      content: post?.content,
      authorId: post?.authorId,
    });
  };

  return (
    <PostsContext.Provider
      value={{
        posts,
        allPosts,
        loading,
        followingCount: followingIds.size,
        followerCount: followerIds.size,
        createPost,
        toggleLike,
        toggleBookmark,
        toggleFollow,
        addComment,
        deletePost,
        reportPost,
        getPost,
      }}
    >
      {children}
    </PostsContext.Provider>
  );
}

export function usePosts() {
  const context = useContext(PostsContext);
  if (context === undefined) {
    throw new Error('usePosts must be used within a PostsProvider');
  }
  return context;
}
