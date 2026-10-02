import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import { createCategory, createProduct, fetchCart, getCategories, getProductDetails, updateProductDetails } from '../Services/api';
import NewOrderView from '../Components/NewOrderView';
import { apiErrorMessage, emptyOrderForm, formFromProduct, orderPayload } from '../Components/newOrderModel';

const NewOrder = () => {
  const { user, userId, logout, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const editId = location.state?.itemToEdit?.productId || '';
  const editQuantity = location.state?.itemToEdit?.quantity;
  const [categories, setCategories] = useState([]);
  const [cart, setCart] = useState([]);
  const [initialForm, setInitialForm] = useState(editId ? null : emptyOrderForm);
  const [loading, setLoading] = useState({ categories: true, cart: true, edit: Boolean(editId) });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const lock = useRef(false);
  const versions = useRef({});

  const loadResource = useCallback(async key => {
    if (!userId) return;
    const version = (versions.current[key] || 0) + 1;
    versions.current[key] = version;
    setLoading(previous => ({ ...previous, [key]: true }));
    setErrors(previous => ({ ...previous, [key]: '' }));
    try {
      const data = await (key === 'categories' ? getCategories() : key === 'cart' ? fetchCart() : getProductDetails(editId));
      if (versions.current[key] !== version) return;
      if (key === 'categories') setCategories(Array.isArray(data) ? data : []);
      else if (key === 'cart') setCart(Array.isArray(data) ? data : []);
      else setInitialForm(formFromProduct(data, { quantity: editQuantity }));
    } catch {
      if (versions.current[key] === version) setErrors(previous => ({ ...previous, [key]: `We couldn’t load ${key === 'edit' ? 'this item' : `your ${key}`}. Please try again.` }));
    } finally {
      if (versions.current[key] === version) setLoading(previous => ({ ...previous, [key]: false }));
    }
  }, [userId, editId, editQuantity]);

  useEffect(() => {
    if (authLoading) return;
    if (!userId) { navigate('/login', { replace: true }); return; }
    loadResource('categories'); loadResource('cart');
    if (editId) loadResource('edit');
    const requestVersions = versions.current;
    return () => {
      for (const key of ['categories', 'cart', 'edit']) requestVersions[key] = (requestVersions[key] || 0) + 1;
    };
  }, [userId, authLoading, navigate, loadResource, editId]);

  const save = async form => {
    if (lock.current) return { ok: false, message: 'Your item is already being saved.' };
    lock.current = true; setSubmitting(true); setNotice('');
    let categoryId = form.productCategory;
    try {
      if (categoryId === 'custom') {
        const existing = categories.find(category => category.categoryName.toLowerCase() === form.customCategory.trim().toLowerCase());
        if (existing) categoryId = existing._id;
        else {
          const response = await createCategory({ categoryName: form.customCategory.trim() });
          const category = response?.data?.category;
          if (!category?._id) throw new Error('The category could not be created. Please try again.');
          categoryId = category._id;
          setCategories(previous => [...previous.filter(item => item._id !== categoryId), category]);
        }
      }
      const payload = orderPayload(form, categoryId);
      if (new TextEncoder().encode(JSON.stringify(payload)).length > 95 * 1024) throw new Error('The photos are too large to save together. Remove a photo and try again.');
      const response = editId ? await updateProductDetails(editId, payload) : await createProduct(payload);
      if (!response?.data?.product?._id) throw new Error('We couldn’t verify that this item was saved. Check your cart before trying again.');
      // Refresh is separate from the successful mutation: a refresh failure
      // must never invite a duplicate product submission.
      await loadResource('cart');
      return { ok: true };
    } catch (error) {
      return { ok: false, message: apiErrorMessage(error, 'We couldn’t save this item. Please try again.'), categoryId: categoryId !== 'custom' ? categoryId : undefined };
    } finally { lock.current = false; setSubmitting(false); }
  };
  const handleLogout = async () => {
    if (logoutLoading || lock.current) return;
    setLogoutLoading(true); setNotice('');
    try { await logout(); }
    catch { setNotice('We couldn’t log you out. Please try again.'); }
    finally { setLogoutLoading(false); }
  };
  const handleNavigate = (path, options) => {
    if (path.includes('#')) { window.location.assign(path); return; }
    navigate(path, options); window.scrollTo({ top: 0 });
  };

  if (authLoading) return <div className="cd-auth-loading" role="status">Loading your account…</div>;
  if (!userId) return null;
  return <NewOrderView user={user?.data?.user || user} categories={categories} categoryLoading={loading.categories} categoryError={errors.categories} cart={cart} cartLoading={loading.cart} cartError={errors.cart} initialForm={initialForm} editing={Boolean(editId)} editError={errors.edit} submitting={submitting} logoutLoading={logoutLoading} onSave={save} onRetry={loadResource} onNavigate={handleNavigate} onLogout={handleLogout} notice={notice} />;
};
export default NewOrder;
