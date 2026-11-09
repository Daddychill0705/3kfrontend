import { useEffect, useState } from 'react';

export function isOrderChatOpen(order, now = Date.now()) {
  if (!order || order.status === 'Cancelled') return false;
  if (order.status !== 'Completed') return true;
  return Number(order.chat_expires_at_ms) > now;
}

export function useOrderChatClock(orders) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const nextExpiry = orders
      .filter(order => order.status === 'Completed')
      .map(order => Number(order.chat_expires_at_ms))
      .filter(expiry => expiry > Date.now())
      .sort((a, b) => a - b)[0];

    if (!nextExpiry) return undefined;

    const timeout = setTimeout(() => setNow(Date.now()), nextExpiry - Date.now() + 50);
    return () => clearTimeout(timeout);
  }, [orders, now]);

  return now;
}
