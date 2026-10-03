import test from 'node:test';
import assert from 'node:assert/strict';
import { cartTotals, normalizeCart, removeCartItem } from '../src/Components/cartModel.js';

test('cart totals include quantities and do not add the service fee twice', () => {
  const items = normalizeCart([{ productId: 'a', quantity: '2', productFee: '1000', finalCharge: '2300' }, { productId: 'b', quantity: 1, productFee: 500, finalCharge: 575 }]);
  assert.deepEqual(cartTotals(items), { quantity: 3, subtotal: 2500, fee: 375, total: 2875, canCheckout: true });
});

test('server line totals remain authoritative and aggregate rounding matches checkout', () => {
  const items = normalizeCart([{ productId: 'a', quantity: 1, productFee: 0.03, finalCharge: 0.0345 }, { productId: 'b', quantity: 1, productFee: 0.03, finalCharge: 0.0345 }]);
  assert.deepEqual(cartTotals(items), { quantity: 2, subtotal: 0.06, fee: 0.01, total: 0.07, canCheckout: true });
  assert.equal(cartTotals(normalizeCart([{ productId: 'a', quantity: 1, productFee: 1000, finalCharge: 1200 }])).total, 1200);
});

test('missing or invalid product data cannot silently become a free checkout', () => {
  for (const change of [{ productId: null }, { finalCharge: null }, { finalCharge: 'invalid' }, { productFee: '' }, { quantity: 0 }, { quantity: 1.5 }]) {
    const totals = cartTotals(normalizeCart([{ productId: 'a', quantity: 1, productFee: 1000, finalCharge: 1150, ...change }]));
    assert.equal(totals.canCheckout, false);
    assert.equal(totals.total, null);
  }
});

test('removal preserves other product prices and supports the final-item empty state', () => {
  const items = normalizeCart([{ productId: 'a', quantity: 2, productFee: 100, finalCharge: 230 }, { productId: 'b', quantity: 1, productFee: 200, finalCharge: 230 }]);
  const remaining = removeCartItem(items, 'a');
  assert.equal(items.length, 2);
  assert.equal(remaining[0], items[1]);
  assert.equal(cartTotals(remaining).total, 230);
  assert.deepEqual(cartTotals(removeCartItem(remaining, 'b')), { quantity: 0, subtotal: 0, fee: 0, total: 0, canCheckout: false });
});

test('missing photos, deleted products, and non-array responses render safely', () => {
  const items = normalizeCart([null, 'deleted', { productId: null, quantity: 1, productPhotos: null }]);
  assert.equal(items.length, 1);
  assert.equal(items[0].productName, 'Unavailable item');
  assert.deepEqual(items[0].productPhotos, []);
  assert.deepEqual(normalizeCart(null), []);
});
