const text = value => typeof value === 'string' && value.trim() ? value.trim() : '';

export const paymentReference = search => {
  const params = new URLSearchParams(search);
  const reference = text(params.get('reference') || params.get('trxref'));
  return reference.length <= 200 && ![...reference].some(character => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127) ? reference : '';
};

// This endpoint wraps the provider's verification result in data. A successful
// HTTP response alone does not mean the payment succeeded.
export const verifiedPayment = (response, reference) => {
  const data = response?.data;
  if (response?.success !== true || data?.success !== true || !text(data?.orderNumber)) throw new Error('Payment verification is incomplete.');
  const providerStatus = text(data.status).toLowerCase();
  const status = providerStatus === 'success' ? 'success'
    : ['failed', 'abandoned'].includes(providerStatus) ? 'failed'
      : ['pending', 'processing', 'ongoing', 'queued'].includes(providerStatus) ? 'pending' : 'unconfirmed';
  const minorAmount = typeof data.amount === 'number' || typeof data.amount === 'string' && data.amount.trim() ? Number(data.amount) : NaN;
  return {
    status, method: 'Paystack', reference, orderNumber: text(data.orderNumber),
    // Verification returns minor units. Never substitute the cart total or zero.
    amount: Number.isSafeInteger(minorAmount) && minorAmount > 0 ? minorAmount / 100 : null,
  };
};

export const resultOrder = (order, expectedOrderNumber) => {
  if (!order || order.orderNumber !== expectedOrderNumber) throw new Error('Order details are unavailable.');
  return {
    createdAt: typeof order.createdAt === 'string' && Number.isFinite(Date.parse(order.createdAt)) ? order.createdAt : null,
    items: Array.isArray(order.items) ? order.items.filter(item => item && typeof item === 'object').map((item, index) => ({
      id: item._id || `${expectedOrderNumber}-${index}`,
      name: text(item.product?.productName) || 'Product details unavailable',
      quantity: Number.isSafeInteger(Number(item.quantity)) && Number(item.quantity) > 0 ? Number(item.quantity) : null,
    })) : [],
  };
};

export const resultContent = {
  success: { label: 'Payment confirmed', eyebrow: 'ONE STEP CLOSER TO YOURS', title: 'A good beginning.', description: 'Your payment is confirmed. Follow your order’s next steps from your dashboard.', primary: 'View my orders', destination: '/client-dashboard', secondary: 'Create another order', secondaryDestination: '/new-order' },
  failed: { label: 'Payment not completed', eyebrow: 'THERE’S STILL A WAY FORWARD', title: 'Let’s get you back on track.', description: 'The payment provider reports that this payment was not completed. Check your wallet and existing orders before starting another payment.', primary: 'Check my orders', destination: '/client-dashboard', secondary: 'Return to checkout', secondaryDestination: '/checkout' },
  pending: { label: 'Awaiting confirmation', eyebrow: 'A LITTLE MORE TIME', title: 'Your payment is still being checked.', description: 'Your payment has not been confirmed yet. Check its status again before making another payment.', primary: 'Check payment status', retry: true, secondary: 'View my orders', secondaryDestination: '/client-dashboard' },
  loading: { label: 'Checking payment', eyebrow: 'BRINGING THE DETAILS TOGETHER', title: 'One moment, please.', description: 'We’re checking your payment status. Keep this page open while we get the details.', primary: 'Checking payment…', disabled: true, secondary: 'View my orders', secondaryDestination: '/client-dashboard' },
  error: { label: 'Verification incomplete', eyebrow: 'LET’S CHECK BEFORE MOVING ON', title: 'We couldn’t confirm it just yet.', description: 'Payment verification didn’t complete. Check again or review your orders before making another payment.', primary: 'Check again', retry: true, secondary: 'View my orders', secondaryDestination: '/client-dashboard' },
  unconfirmed: { label: 'Payment not confirmed', eyebrow: 'LET’S FIND WHERE THINGS STAND', title: 'Your payment needs a closer look.', description: 'This page does not have a confirmed payment result. Check your orders for the latest information before making another payment.', primary: 'Check my orders', destination: '/client-dashboard', secondary: 'Return to checkout', secondaryDestination: '/checkout' },
  auth: { label: 'Sign-in required', eyebrow: 'YOUR PAYMENT, YOUR ACCOUNT', title: 'Sign in to check your payment.', description: 'Sign in to the account used at checkout, then reopen this link to check your payment. Keep the link so you can return to it.', primary: 'Sign in', destination: '/login', secondary: 'Nexus home', secondaryDestination: '/' },
};
