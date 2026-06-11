import {NOTIFICATION_MESSAGE, NOTIFICATION_DISMISS} from '../../typings/constants/notifications';
import type {TormentNexusActions} from '../../typings/tormentnexus';

export function dismissNotification(id: string): TormentNexusActions {
  return {
    type: NOTIFICATION_DISMISS,
    id
  };
}

export function addNotificationMessage(text: string, url: string | null = null, dismissable = true): TormentNexusActions {
  return {
    type: NOTIFICATION_MESSAGE,
    text,
    url,
    dismissable
  };
}
