export const formatOrderNumber = order => {
  if (order && typeof order === 'object') {
    if (order.order_number) return order.order_number;
    return `O-${String(order.id ?? '').padStart(4, '0')}`;
  }
  const value = String(order ?? '');
  return value.startsWith('O-') ? value : `O-${value.padStart(4, '0')}`;
};
