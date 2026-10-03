import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import { fetchOneOrder, verifyPaystackPayment } from '../Services/api';
import PaymentResultView from '../Components/PaymentResultView';
import { paymentReference, resultOrder, verifiedPayment } from '../Components/paymentResultModel';

const PaymentResult = () => {
  const { userId, loading: authLoading } = useAuth();
  const location = useLocation(), navigate = useNavigate();
  const reference = paymentReference(location.search);
  const [attempt, setAttempt] = useState(0), [detailsAttempt, setDetailsAttempt] = useState(0);
  const [verification, setVerification] = useState(null), [details, setDetails] = useState(null);
  const verificationRequest = useRef(null), detailsRequest = useRef(null);
  const key = JSON.stringify([userId, reference, attempt]);
  const payment = authLoading ? { status: 'loading' } : !reference ? { status: 'unconfirmed' } : !userId ? { status: 'auth' }
    : verification?.key === key ? verification.payment : { status: 'loading', reference, method: 'Paystack' };
  const detailsKey = payment.orderNumber ? JSON.stringify([userId, payment.orderNumber, detailsAttempt]) : '';

  useEffect(() => {
    if (authLoading || !userId || !reference) return;
    let cancelled = false;
    // Reuse the in-flight request during StrictMode's effect replay.
    if (verificationRequest.current?.key !== key) verificationRequest.current = { key, promise: verifyPaystackPayment(reference) };
    verificationRequest.current.promise.then(response => {
      const payment = verifiedPayment(response, reference);
      if (!cancelled) setVerification({ key, payment });
    }).catch(() => { if (!cancelled) setVerification({ key, payment: { status: 'error', reference, method: 'Paystack' } }); });
    return () => { cancelled = true; };
  }, [authLoading, userId, reference, key]);

  useEffect(() => {
    if (!userId || !payment.orderNumber || !detailsKey) return;
    let cancelled = false;
    const orderNumber = payment.orderNumber;
    if (detailsRequest.current?.key !== detailsKey) detailsRequest.current = { key: detailsKey, promise: fetchOneOrder(orderNumber) };
    detailsRequest.current.promise.then(order => {
      const data = resultOrder(order, orderNumber);
      if (!cancelled) setDetails({ key: detailsKey, data });
    }).catch(() => { if (!cancelled) setDetails({ key: detailsKey, error: true }); });
    return () => { cancelled = true; };
  }, [userId, payment.orderNumber, detailsKey]);

  const currentDetails = details?.key === detailsKey ? details : null;
  return <PaymentResultView payment={payment} order={currentDetails?.data} detailsLoading={Boolean(detailsKey && !currentDetails)} detailsError={Boolean(currentDetails?.error)} onVerify={() => setAttempt(value => value + 1)} onRetryDetails={() => setDetailsAttempt(value => value + 1)} onNavigate={path => { navigate(path); window.scrollTo({ top: 0 }); }} />;
};
export default PaymentResult;
