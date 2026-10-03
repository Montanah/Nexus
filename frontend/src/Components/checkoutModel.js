import { cartTotals } from './cartModel.js';

export const paymentMethods = [
  { id: 'mpesa', label: 'M-Pesa', hint: 'Approve a request on your phone', mark: 'M', type: 'mobile' },
  { id: 'airtel', label: 'Airtel Money', hint: 'Pay with your mobile wallet', mark: 'a', type: 'mobile' },
  { id: 'paystack', label: 'Paystack', hint: 'Continue to hosted checkout', mark: 'P', type: 'hosted' },
  { id: 'card', label: 'Direct card payment', hint: 'Not available yet', mark: 'card', disabled: true },
  { id: 'paypal', label: 'PayPal', hint: 'Not available yet', mark: 'P', disabled: true },
];

export const normalizePaymentPhone = value => {
  if (!/^[+\d\s()-]+$/.test(value.trim())) return '';
  let digits = value.replace(/\D/g, '');
  if (/^0[17]\d{8}$/.test(digits)) digits = `254${digits.slice(1)}`;
  else if (/^[17]\d{8}$/.test(digits)) digits = `254${digits}`;
  return /^254[17]\d{8}$/.test(digits) ? digits : '';
};

export const validateCheckout = (form, items) => {
  const errors = {};
  const method = paymentMethods.find(option => option.id === form.method && !option.disabled);
  const totals = cartTotals(items);
  if (!totals.canCheckout || !Number.isFinite(totals.total) || totals.total <= 0) errors.cart = 'Review your cart and resolve unavailable items before paying.';
  if (!method) errors.method = 'Choose an available payment method.';
  if (method?.type === 'mobile' && !normalizePaymentPhone(form.phone)) errors.phone = 'Enter a Kenyan mobile number, such as 0712 345 678.';
  if (method?.type === 'hosted') {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()) || form.email.trim().length > 254) errors.email = 'Enter a valid email address for your payment.';
    // The current backend truncates Paystack amounts to whole shillings.
    // Block that mismatch until the provider integration handles cents.
    if (totals.canCheckout && !Number.isInteger(totals.total)) errors.method = 'Paystack can’t process this total yet. Choose M-Pesa or Airtel Money.';
  }
  return errors;
};

export const checkoutPayload = (form, items, userId) => {
  if (!userId || Object.keys(validateCheckout(form, items)).length) throw new Error('Check your cart and payment details before continuing.');
  return {
    userId, paymentMethod: { mpesa: 'Mpesa', airtel: 'Airtel', paystack: 'Paystack' }[form.method],
    amount: cartTotals(items).total,
    cartItems: items.map(({ productId, quantity, productFee }) => ({ productId, quantity, productFee })),
    ...(form.method === 'paystack' ? { email: form.email.trim() } : { phoneNumber: normalizePaymentPhone(form.phone) }),
  };
};

export const checkoutResult = (response, method) => {
  const data = response?.data;
  if (response?.success !== true || data?.success !== true || !data.orderNumber || !data.transactionId) {
    throw new Error('We couldn’t confirm the payment request. Check your orders before trying again.');
  }
  if (method === 'paystack') {
    let url;
    try { url = new URL(data.authorizationUrl); } catch { /* Handled below. */ }
    if (!url || url.protocol !== 'https:' || url.username || url.password) throw new Error('The payment link is unavailable. Check your orders before trying again.');
    return { kind: 'redirect', orderNumber: data.orderNumber, url: url.href };
  }
  // Initiation is not confirmation, even when this endpoint reports "Paid".
  return { kind: 'pending', orderNumber: data.orderNumber };
};
