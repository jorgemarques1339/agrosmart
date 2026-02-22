import { StateCreator } from 'zustand';
import { AppState } from '../useStore';
import { db } from '../../services/db';
import { syncManager } from '../../services/SyncManager';
import { Notification, FeedItem } from '../../types';

export interface NotificationSlice {
    notifications: Notification[];
    feedItems: FeedItem[];
    hasUnreadFeed: boolean;
    alertCount: number;
    setNotifications: (notifications: Notification[]) => void;
    setFeedItems: (items: FeedItem[]) => void;
    addNotification: (notification: Notification) => Promise<void>;
    markNotificationRead: (id: string) => Promise<void>;
    addFeedItem: (item: FeedItem) => Promise<void>;
}

export const createNotificationSlice: StateCreator<AppState, [], [], NotificationSlice> = (set, get) => ({
    notifications: [],
    feedItems: [],
    hasUnreadFeed: false,
    alertCount: 0,

    setNotifications: (notifications) => set({ notifications }),
    setFeedItems: (feedItems) => set({ feedItems }),

    addNotification: async (notif) => {
        await db.notifications.add(notif);
        set(state => ({ notifications: [notif, ...state.notifications] }));
    },

    markNotificationRead: async (id) => {
        await db.notifications.update(id, { read: true });
        set(state => ({
            notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n)
        }));
    },

    addFeedItem: async (item) => {
        await db.feed.add(item);
        syncManager.addToQueue('ADD_FEED_ITEM', item);
        set(state => ({
            feedItems: [item, ...state.feedItems],
            hasUnreadFeed: true
        }));

        const notif: Notification = {
            id: `notif-feed-${item.id}`,
            title: item.type === 'alert' ? `ALERTA: ${item.userName}` : `Novo Post: ${item.userName}`,
            message: item.content,
            type: item.type === 'alert' ? 'critical' : 'info',
            timestamp: item.timestamp,
            read: false
        };
        await db.notifications.add(notif);
        set(state => ({ notifications: [notif, ...state.notifications] }));
    },
});
