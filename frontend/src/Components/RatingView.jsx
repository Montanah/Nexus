import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { FiArrowLeft, FiArrowRight, FiArrowUpRight, FiCheck, FiCheckCircle, FiCompass, FiGrid, FiHeart, FiMessageCircle, FiPackage, FiRefreshCw, FiSend, FiStar } from 'react-icons/fi';
import Logo from '../assets/NexusLogo.png';
import { statusLabels } from './clientDashboardModel';
import { ratingLabels, validateRating } from './ratingModel';
import './clientDashboard.css';
import './rating.css';

const RatingView = ({ role, context, phase, saving, error, saved, onSubmit, onRetry, onNavigate, previewControls }) => {
  const [rating, setRating] = useState(0), [comment, setComment] = useState('');
  const [validation, setValidation] = useState(null), [imageFailed, setImageFailed] = useState(false);
  const form = useRef(null), stateHeading = useRef(null), previousPhase = useRef(phase);
  const recipient = role === 'traveler' ? 'client' : 'traveler';
  const dashboard = role === 'traveler' ? '/traveler-dashboard' : '/client-dashboard';
  const back = role === 'client' && context?.orderNumber ? `/orders/${encodeURIComponent(context.orderNumber)}` : dashboard;
  const backLabel = back.startsWith('/orders/') ? 'Back to your order' : 'Back to your dashboard';
  const recorded = phase === 'saved' ? saved : { rating: context?.existingRating, comment: context?.existingComment };
  const hasStars = Number.isInteger(recorded?.rating) && recorded.rating >= 1 && recorded.rating <= 5;
  useEffect(() => { const title = document.title; document.title = 'Your feedback | Nexus'; return () => { document.title = title; }; }, []);
  useEffect(() => { setImageFailed(false); }, [context?.photo]);
  useEffect(() => {
    if (previousPhase.current !== phase && ['saved', 'already'].includes(phase)) stateHeading.current?.focus();
    previousPhase.current = phase;
  }, [phase]);
  const submit = event => {
    event.preventDefault();
    if (saving) return;
    const invalid = validateRating(rating, comment); setValidation(invalid);
    if (invalid) { form.current?.querySelector(invalid.field === 'rating' ? 'input[name="rating"]' : 'textarea')?.focus(); return; }
    onSubmit(rating, comment);
  };
  const states = {
    loading: ['A moment for the details.', 'We’re finding the delivery connected to your feedback.'],
    error: ['Let’s try that again.', 'We couldn’t load this delivery. Try again to leave your rating.'],
    missing: ['We couldn’t find this delivery.', 'Open a delivery from your dashboard to leave feedback for the right person.'],
    blocked: ['This rating isn’t available.', role === 'traveler' ? 'Client ratings open once the delivery is complete. Return to your dashboard to check the remaining steps.' : 'A rating isn’t available at this delivery stage. Return to your order to check its progress and receipt confirmation.'],
    role: ['Start with your delivery.', 'Open the rating from your Client or Traveler dashboard so we can find the right delivery.'],
  };
  return <div className="nexus-client-dashboard nexus-rating">
    <a className="cd-skip" href="#rating-main">Skip to your feedback</a>{previewControls}
    <header className="rv-header"><div><button className="cd-brand" onClick={() => onNavigate('/')} disabled={saving} aria-label="Nexus home"><img src={Logo} alt="" width="44" height="44" /><span>NEXUS<span>.</span></span></button><span>Good things travel together.</span><button className="rv-dashboard-link" disabled={saving} onClick={() => onNavigate(role ? dashboard : '/')}><FiGrid aria-hidden="true" />{role ? 'Your dashboard' : 'Nexus home'}<FiArrowUpRight aria-hidden="true" /></button></div></header>
    <main className="rv-main" id="rating-main" tabIndex={-1}>
      <div className="rv-breadcrumb"><button disabled={saving} onClick={() => onNavigate(back)}><FiArrowLeft aria-hidden="true" />{back.startsWith('/orders/') ? 'Your order' : 'Your dashboard'}</button><span>/</span><span>Your feedback</span></div>
      <div className="rv-page-heading"><div><span className="cd-eyebrow">A LITTLE FEEDBACK. A BETTER NEXT JOURNEY.</span><h1>Good journeys start<br />with good <span>connections.</span></h1><p>Share your experience. Help the next connection feel a little more familiar.</p></div><div className="rv-heading-art" aria-hidden="true"><span className="rv-art-orbit" /><span className="rv-art-message"><FiMessageCircle /><FiHeart /></span><span className="rv-art-star"><FiStar /></span><span className="rv-art-spark">✦</span></div></div>
      <div className="rv-grid">
        <section className="rv-form-card cd-surface" aria-labelledby="rating-form-heading">
          {phase === 'ready' ? <form ref={form} onSubmit={submit} noValidate aria-busy={saving}>
            <div className="rv-form-heading"><span className="rv-section-icon"><FiStar aria-hidden="true" /></span><div><span className="cd-eyebrow">YOUR EXPERIENCE, IN YOUR WORDS</span><h2 id="rating-form-heading">How was your {role === 'traveler' ? 'handover' : 'delivery'}?</h2><p>Rate your experience with <strong>{context?.person || `your ${recipient}`}</strong>.</p></div></div>
            <fieldset className="rv-rating-field" disabled={saving} aria-describedby={validation?.field === 'rating' ? 'rating-validation' : 'rating-help'}>
              <legend>Your rating <span>Required</span></legend>
              <div className="rv-stars">{ratingLabels.map((label, index) => <label key={label} className={`${rating >= index + 1 ? 'is-filled' : ''} ${rating === index + 1 ? 'is-selected' : ''}`}><input type="radio" name="rating" value={index + 1} checked={rating === index + 1} required aria-label={`${index + 1} ${index ? 'stars' : 'star'} — ${label}`} aria-invalid={validation?.field === 'rating' || undefined} onChange={() => { setRating(index + 1); setValidation(null); }} /><FiStar aria-hidden="true" /><span aria-hidden="true">{index + 1}</span></label>)}</div>
              <p id="rating-help" className="rv-rating-help" role="status">{rating ? <><strong>{ratingLabels[rating - 1]}</strong><span>{rating} out of 5 stars</span></> : 'Choose the stars that match your experience.'}</p>
            </fieldset>
            <div className="rv-comment-field"><label htmlFor="rating-comment">Tell us a little more <span>Optional</span></label><p id="rating-comment-help">What stood out about the communication, care, or handover?</p><textarea id="rating-comment" value={comment} onChange={event => { setComment(event.target.value); setValidation(null); }} maxLength={500} rows={5} disabled={saving} aria-describedby={`rating-comment-help rating-comment-count${validation?.field === 'comment' ? ' rating-validation' : ''}`} aria-invalid={validation?.field === 'comment' || undefined} placeholder="A few honest details can make a difference…" /><div className="rv-comment-foot"><span>Keep it about this delivery.</span><span id="rating-comment-count">{comment.length} / 500 characters</span></div></div>
            {validation && <p id="rating-validation" className="rv-error" role="alert">{validation.message}</p>}
            {error && <p className="rv-error" role="alert">{error}</p>}
            <div className="rv-form-actions"><button type="submit" className="cd-button cd-primary" disabled={saving}>{saving ? <><span className="cd-spinner" />Saving your rating…</> : <>Submit rating<FiArrowUpRight aria-hidden="true" /></>}</button><button type="button" className="rv-later" disabled={saving} onClick={() => onNavigate(back)}>Maybe later<FiArrowRight aria-hidden="true" /></button></div>
            <p className="rv-submit-note"><FiCheckCircle aria-hidden="true" />One rating per item. Check your feedback before submitting; ratings can’t be edited here.</p>
          </form> : ['saved', 'already'].includes(phase) ? <div className="rv-result">
            <span className="rv-result-icon"><FiCheck aria-hidden="true" /></span><span className="cd-eyebrow">{phase === 'saved' ? 'A NOTE THAT MAKES A DIFFERENCE' : 'YOUR FEEDBACK IS ALREADY RECORDED'}</span><h2 id="rating-form-heading" ref={stateHeading} tabIndex={-1}>{phase === 'saved' ? 'Thanks for sharing.' : 'You’ve already left a rating.'}</h2><p>{phase === 'saved' ? `Your rating for this ${recipient} has been saved. Thank you for sharing your experience.` : 'This item already has your rating. You don’t need to submit it again.'}</p>
            {hasStars && <div className="rv-saved-rating"><div role="img" aria-label={`${recorded.rating} out of 5 stars`}>{ratingLabels.map((label, index) => <FiStar key={label} className={index < recorded.rating ? 'is-filled' : ''} aria-hidden="true" />)}</div><strong>{ratingLabels[recorded.rating - 1]}</strong>{recorded.comment && <blockquote>{recorded.comment}</blockquote>}</div>}
            <button className="cd-button cd-primary" onClick={() => onNavigate(back)}>{backLabel}<FiArrowUpRight aria-hidden="true" /></button>
          </div> : <div className="rv-result rv-state">
            <span className="rv-result-icon">{phase === 'loading' ? <span className="cd-spinner" /> : <FiCompass aria-hidden="true" />}</span><h2 id="rating-form-heading">{states[phase]?.[0]}</h2><p role={phase === 'error' || phase === 'missing' ? 'alert' : 'status'}>{states[phase]?.[1]}</p><div className="rv-state-actions">{phase === 'error' && <button className="cd-button cd-primary" onClick={onRetry}>Try again<FiRefreshCw aria-hidden="true" /></button>}{phase !== 'loading' && <button className="cd-button cd-secondary" onClick={() => onNavigate(back)}>{phase === 'role' ? 'Client dashboard' : backLabel}<FiArrowRight aria-hidden="true" /></button>}{phase === 'role' && <button className="cd-button cd-secondary" onClick={() => onNavigate('/traveler-dashboard')}>Traveler dashboard<FiArrowRight aria-hidden="true" /></button>}</div>
          </div>}
        </section>
        <aside className="rv-aside">
          <section className="rv-delivery-card cd-surface" aria-labelledby="rating-delivery-heading"><div className="rv-delivery-heading"><span className="cd-eyebrow">THE CONNECTION BEHIND THE JOURNEY</span><h2 id="rating-delivery-heading">{role ? `Your ${recipient}.` : 'Your delivery.'}</h2><FiSend aria-hidden="true" /></div><div className="rv-delivery-body">
            {context ? <><div className="rv-person"><span className="rv-avatar" aria-hidden="true">{context.person.startsWith('Your ') ? <FiCompass /> : context.person.split(/\s+/).slice(0, 2).map(part => part[0]).join('')}</span><div><span>{role === 'traveler' ? 'Client' : 'Traveler'}</span><h3>{context.person}</h3></div></div><div className="rv-product"><span>{context.photo && !imageFailed ? <img src={context.photo} alt="" onError={() => setImageFailed(true)} /> : <FiPackage aria-hidden="true" />}</span><div><small>{context.category}</small><h3>{context.name}</h3></div></div><dl>{context.orderNumber && <div><dt>Order reference</dt><dd>{context.orderNumber}</dd></div>}<div><dt>Delivery stage</dt><dd>{statusLabels[context.status] || 'Not available'}</dd></div></dl></> : <p className="rv-no-details">{phase === 'loading' ? 'Your delivery details will appear here.' : 'Choose a delivery from your dashboard to see its details.'}</p>}
          </div></section>
          <section className="rv-guidance" aria-labelledby="rating-tips-heading"><span className="rv-section-icon"><FiMessageCircle aria-hidden="true" /></span><h2 id="rating-tips-heading">Small details.<br />Helpful feedback.</h2><p>A useful review can be just a sentence or two.</p><ul><li><FiMessageCircle aria-hidden="true" /><div><strong>How was the communication?</strong><span>Think about clarity and helpful updates.</span></div></li><li><FiPackage aria-hidden="true" /><div><strong>How did the handover go?</strong><span>Share what worked, or what could improve.</span></div></li><li><FiHeart aria-hidden="true" /><div><strong>Make it honest and considerate.</strong><span>Describe your own experience in your words.</span></div></li></ul></section>
          {role && <button className="rv-back-link" disabled={saving} onClick={() => onNavigate(back)}><FiArrowLeft aria-hidden="true" />{backLabel}</button>}
        </aside>
      </div>
      <footer className="cd-footer"><span>© {new Date().getFullYear()} Nexus</span><span>Good things travel together.</span></footer>
    </main>
  </div>;
};
RatingView.propTypes = { role: PropTypes.string.isRequired, context: PropTypes.object, phase: PropTypes.string.isRequired, saving: PropTypes.bool, error: PropTypes.string, saved: PropTypes.object, onSubmit: PropTypes.func.isRequired, onRetry: PropTypes.func.isRequired, onNavigate: PropTypes.func.isRequired, previewControls: PropTypes.node };
export default RatingView;
