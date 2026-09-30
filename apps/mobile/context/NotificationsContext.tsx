import { useAuth } from '@/context/AuthContext';
import {
  ensureWelcomeNotification,
  markAllNotificationsRead as markAllReadDoc,
  markNotificationRead,
  subscribeToNotifications,
} from '@/services/notifications';
import { NotificationRecord } from '@/types/notification';
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

type NotificationsContextType = {
  notifications: NotificationRecord[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
};

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    ensureWelcomeNotification(user.uid).catch((error) => {
      console.error('Error creating welcome notification:', error);
    });

    const unsubscribe = subscribeToNotifications(
      user.uid,
      (next) => {
        setNotifications(next);
        setLoading(false);
      },
      (error) => {
        console.error('Error loading notifications:', error);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [user]);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.isRead).length,
    [notifications],
  );

  const markAsRead = async (notificationId: string) => {
    if (!user) return;
    const item = notifications.find((notification) => notification.id === notificationId);
    if (!item || item.isRead) return;
    await markNotificationRead(user.uid, notificationId);
  };

  const markAllAsRead = async () => {
    if (!user) return;
    const unreadIds = notifications.filter((item) => !item.isRead).map((item) => item.id);
    await markAllReadDoc(user.uid, unreadIds);
  };

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
}
