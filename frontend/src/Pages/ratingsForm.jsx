import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import { fetchOrders, getTravelerOrders, rateClient, rateTraveler } from '../Services/api';
import RatingView from '../Components/RatingView';
import { clientRatingContext, isAlreadyRated, ratingError, ratingPayload, ratingSaved, resolveRatingRole, travelerRatingContext, validateRating } from '../Components/ratingModel';

const RatingSession = ({ role, userId, productId }) => {
  const navigate = useNavigate();
  const [resource, setResource] = useState({ phase: 'loading', context: null });
  const [reload, setReload] = useState(0), [saving, setSaving] = useState(false);
  const [error, setError] = useState(''), [saved, setSaved] = useState(null);
  const lock = useRef(false), mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    if (!role) { setResource({ phase: 'role', context: null }); return; }
    let cancelled = false;
    setResource({ phase: 'loading', context: null }); setError('');
    const request = role === 'client' ? fetchOrders().then(data => clientRatingContext(data.orders, productId))
      : getTravelerOrders(userId).then(products => travelerRatingContext(products, productId));
    request.then(context => {
      if (!cancelled) setResource({ context, phase: !context ? 'missing' : context.existingRating != null ? 'already' : context.eligible ? 'ready' : 'blocked' });
    }).catch(() => { if (!cancelled) setResource({ phase: 'error', context: null }); });
    return () => { cancelled = true; };
  }, [role, userId, productId, reload]);

  const submit = async (rating, comment) => {
    if (lock.current || resource.phase !== 'ready' || validateRating(rating, comment)) return;
    lock.current = true; setSaving(true); setError('');
    try {
      const payload = ratingPayload(productId, rating, comment);
      const response = await (role === 'traveler' ? rateClient(payload) : rateTraveler(payload));
      if (!ratingSaved(response, role)) throw new Error('Rating was not acknowledged.');
      if (mounted.current) { setSaved(payload); setResource(previous => ({ ...previous, phase: 'saved' })); }
    } catch (error) {
      if (mounted.current) {
        if (isAlreadyRated(error)) setResource(previous => ({ ...previous, phase: 'already' }));
        else setError(ratingError(error));
      }
    } finally { lock.current = false; if (mounted.current) setSaving(false); }
  };
  const navigateTo = path => { if (!lock.current) { navigate(path); window.scrollTo({ top: 0 }); } };
  return <RatingView role={role} context={resource.context} phase={resource.phase} saving={saving} error={error} saved={saved} onSubmit={submit} onRetry={() => { if (!lock.current) setReload(value => value + 1); }} onNavigate={navigateTo} />;
};
RatingSession.propTypes = { role: PropTypes.string.isRequired, userId: PropTypes.string.isRequired, productId: PropTypes.string.isRequired };

const RatingForm = () => {
  const { user, userId, loading } = useAuth();
  const { productId } = useParams(), location = useLocation(), navigate = useNavigate();
  const profile = user?.data?.user || user;
  const role = resolveRatingRole(location.search, location.state, profile);
  useEffect(() => { if (!loading && !userId) navigate('/login', { replace: true }); }, [loading, userId, navigate]);
  if (loading) return <div className="cd-auth-loading" role="status">Loading your account…</div>;
  if (!userId) return null;
  return <RatingSession key={JSON.stringify([userId, role, productId])} role={role} userId={userId} productId={productId} />;
};
export default RatingForm;
