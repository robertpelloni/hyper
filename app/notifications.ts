import type {BrowserWindow} from 'electron';

import fetch from 'electron-fetch';
import ms from 'ms';

import {version} from './package.json';

const NEWS_URL = 'https://tormentnexus-news.now.sh';

export default function fetchNotifications(win: BrowserWindow) {
  const {rpc} = win;
  const retry = (err?: Error) => {
    setTimeout(() => fetchNotifications(win), ms('30m'));
    if (err) {
      console.error('Notification messages fetch error', err.stack);
    }
  };
  console.log('Checking for notification messages');
  fetch(NEWS_URL, {
    headers: {
      'X-TormentNexus-Version': version,
      'X-TormentNexus-Platform': process.platform
    }
  })
    .then((res) => res.json())
    .then((data) => {
      const message: {text: string; url: string; dismissable: boolean} | '' = data.message || '';
      if (typeof message !== 'object' && message !== '') {
        throw new Error('Bad response');
      }
      if (message === '') {
        console.log('No matching notification messages');
      } else {
        rpc.emit('add notification', message);
      }

      retry();
    })
    .catch(retry);
}
