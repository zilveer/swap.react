export const createOrder = orders => order => {
  const created = orders.create(order)
  return created
}

export const removeOrder = orders => order => {
  if (!order.id) return

  orders.remove(order.id)
}

export const getItems = orders => {
  return orders.items
}

export const removeMyOrders = (Orders: any, allOrders: boolean = false) => {
  getItems(Orders)
    .filter(o => o.isMy)
    .filter((o) => {
      return (allOrders && !o.isRequested) || (!o.isRequested && !o.isProcessing)
    })
    .map(removeOrder(Orders))
}
