import { emptyOrderForm, localDate } from '../Components/newOrderModel';

const date = new Date();
date.setDate(date.getDate() + 7);
const item = (id, productName, category, categoryId, productFee, quantity, description) => ({
  productId: `cart-preview-${id}`, productName, category, quantity, productFee,
  finalCharge: productFee * quantity * 1.15, productPhotos: [],
  previewForm: {
    ...emptyOrderForm, productName, quantity: String(quantity), productCategory: categoryId,
    productDescription: description, country: 'KE', state: '30', city: 'Nairobi',
    deliveryDate: localDate(date), productPrice: String(productFee),
  },
});
// Development-only synthetic items. previewForm supports editing between previews.
export const previewCartItems = [
  item('headphones', 'Wireless headphones', 'Electronics', 'preview-category-electronics', 14950, 1, 'Sony WH-1000XM5 headphones in black. Keep in their original packaging.'),
  item('backpack', 'Travel backpack', 'Fashion', 'preview-category-fashion', 6800, 1, 'A black everyday backpack with a padded laptop compartment.'),
  item('books', 'A reader’s collection', 'Books', 'preview-category-books', 2400, 2, 'Two paperback books in the original editions. Please keep the covers protected.'),
];
