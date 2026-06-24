import { useState, useEffect } from 'react';
import { notificationService } from '@core/services/notificationService';
import { formatRelativeTime, formatDateTime } from '@core/utils/helpers';
import { Bell, Check, X, Trash2, Filter, MoreVertical } from 'lucide-react';

import { authService } from '@core/services/firebaseService';

export default function UserNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all');
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [user, setUser] = useState(null);

  // Auth listener
  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange((currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        const mockUser = JSON.parse(sessionStorage.getItem('currentUser'));
        if (mockUser) setUser({ uid: 'mock_user_id', ...mockUser });
      }
    });
    return () => unsubscribe();
  }, []);

  // Real-time listener
  useEffect(() => {
    if (!user) return;
    const unsubscribe = notificationService.subscribeToNotifications(user.uid, (data) => {
      setNotifications(data);
    });
    return () => unsubscribe();
  }, [user]);

  const filteredNotifications = notifications.filter((notif) => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notif.read;
    if (filter === 'read') return notif.read;
    return true;
  });

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(
        notifications.map((notif) =>
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      );
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;
    try {
      await notificationService.markAllAsRead(user.uid);
      setNotifications(notifications.map((notif) => ({ ...notif, read: true })));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleDelete = (notificationId) => {
    setNotifications(notifications.filter((notif) => notif.id !== notificationId));
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'order':
        return '📦';
      case 'promotion':
        return '🎉';
      case 'owner':
        return '🏪';
      case 'admin':
        return '📢';
      default:
        return '🔔';
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Notifications</h2>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
            {['all', 'unread', 'read'].map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-3 py-1 rounded-md text-sm font-medium capitalize transition-all ${
                  filter === type ? 'bg-white shadow text-gray-900' : 'text-gray-600'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
          <button
            onClick={handleMarkAllAsRead}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-all"
          >
            <Check className="w-4 h-4" />
            <span>Mark All Read</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No notifications found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => {
                  setSelectedNotification(notification);
                  if (!notification.read) handleMarkAsRead(notification.id);
                }}
                className={`p-6 hover:bg-gray-50 transition-all cursor-pointer group ${
                  !notification.read ? 'bg-blue-50/50' : ''
                }`}
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className={`p-3 rounded-2xl ${!notification.read ? 'bg-white shadow-sm' : 'bg-gray-100'}`}>
                      <span className="text-3xl">{getNotificationIcon(notification.type)}</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className={`font-bold text-gray-900 group-hover:text-primary-600 transition-colors ${!notification.read ? 'text-lg' : 'text-base'}`}>
                          {notification.title}
                        </h3>
                        <p className="text-gray-600 mt-1 line-clamp-1">{notification.message}</p>
                        <p className="text-xs text-gray-400 mt-2 font-medium">
                          {formatRelativeTime(notification.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(notification.id);
                          }}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Notification Detail Modal */}
      {selectedNotification && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div 
            className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity" 
            onClick={() => setSelectedNotification(null)}
          />
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden relative animate-in fade-in zoom-in duration-300">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div className="p-4 bg-primary-50 rounded-2xl text-4xl">
                  {getNotificationIcon(selectedNotification.type)}
                </div>
                <button 
                  onClick={() => setSelectedNotification(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-gray-900 leading-tight">
                  {selectedNotification.title}
                </h2>
                <div className="flex items-center space-x-2 text-sm text-gray-500 font-medium">
                  <span className="px-2 py-0.5 bg-gray-100 rounded-md uppercase tracking-wider text-[10px]">
                    {selectedNotification.type}
                  </span>
                  <span>•</span>
                  <span>{formatDateTime(selectedNotification.createdAt)}</span>
                </div>
                <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                  <p className="text-gray-700 leading-relaxed text-lg">
                    {selectedNotification.message}
                  </p>
                </div>
              </div>

              <div className="mt-10 flex space-x-4">
                <button
                  onClick={() => setSelectedNotification(null)}
                  className="flex-1 py-4 bg-primary-600 text-white rounded-2xl font-bold hover:bg-primary-700 transition-all shadow-xl shadow-primary-100 hover:scale-[1.02] active:scale-95"
                >
                  Okay, Got it
                </button>
                <button
                  onClick={() => {
                    handleDelete(selectedNotification.id);
                    setSelectedNotification(null);
                  }}
                  className="px-6 py-4 border-2 border-gray-100 text-gray-400 hover:text-red-600 hover:border-red-100 hover:bg-red-50 rounded-2xl transition-all"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
