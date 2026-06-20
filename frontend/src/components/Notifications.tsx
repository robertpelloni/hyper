import React from 'react';
import type {Notification} from '../types';

interface NotificationsProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
}

export default function Notifications({notifications, onDismiss}: NotificationsProps) {
  if (notifications.length === 0) return null;

  return (
    <div className="tn_notifications">
      {notifications.map((notif) => (
        <div
          key={notif.id}
          className="tn_notification"
          onClick={() => {
            if (notif.url) {
              window.open(notif.url, '_blank');
            }
            if (notif.dismissable) {
              onDismiss(notif.id);
            }
          }}
        >
          <div className="tn_notification_title">{notif.text}</div>
        </div>
      ))}
    </div>
  );
}
