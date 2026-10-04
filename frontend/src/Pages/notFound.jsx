import { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiArrowRight, FiArrowUpRight, FiCompass, FiHome, FiMapPin, FiPackage, FiSend } from 'react-icons/fi';
import Logo from '../assets/NexusLogo.png';
import './notFound.css';

const NotFound = () => {
  const heading = useRef(null);
  const { pathname } = useLocation();

  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'Page not found | Nexus';
    heading.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0 });
    return () => { document.title = previousTitle; };
  }, [pathname]);

  useEffect(() => {
    const existing = document.querySelector('meta[name="robots"]');
    const meta = existing || document.createElement('meta');
    const previous = meta.getAttribute('content');
    meta.setAttribute('name', 'robots');
    meta.setAttribute('content', 'noindex');
    if (!existing) document.head.appendChild(meta);
    return () => {
      if (!existing) meta.remove();
      else if (previous === null) meta.removeAttribute('content');
      else meta.setAttribute('content', previous);
    };
  }, []);

  return <div className="nexus-not-found">
    <a className="nf-skip" href="#not-found-main">Skip to content</a>
    <header className="nf-header">
      <Link to="/" className="nf-brand" aria-label="Nexus home"><img src={Logo} alt="" width="48" height="48" /><span>NEXUS<span>.</span></span></Link>
      <nav aria-label="Main navigation"><Link className="nf-home-link" to="/"><FiHome aria-hidden="true" />Home</Link><Link className="nf-login" to="/login">Log in<FiArrowUpRight aria-hidden="true" /></Link></nav>
    </header>

    <main id="not-found-main" tabIndex={-1}>
      <section className="nf-hero" aria-labelledby="not-found-heading">
        <div className="nf-copy">
          <span className="nf-eyebrow"><span />404 · PAGE NOT FOUND</span>
          <h1 id="not-found-heading" ref={heading} tabIndex={-1}>A little<br /><span>off course.</span></h1>
          <p className="nf-lead">Let’s get you back on your way.</p>
          <p className="nf-description">We couldn’t find this page. The link may be out of date, or the address may have a typo.</p>
          <div className="nf-actions"><Link className="nf-primary" to="/">Back to home<FiArrowUpRight aria-hidden="true" /></Link><a className="nf-how" href="/#how-it-works">How Nexus works<FiArrowRight aria-hidden="true" /></a></div>
          <div className="nf-reassurance"><FiCompass aria-hidden="true" /><p>Your next connection is<br /><strong>still a little closer.</strong></p></div>
        </div>

        <div className="nf-art" aria-hidden="true">
          <div className="nf-art-grid" /><div className="nf-orbit" /><div className="nf-orbit nf-orbit-inner" />
          <span className="nf-art-label">A SMALL DETOUR</span>
          <div className="nf-route-line"><span /><i /><FiSend /></div>
          <div className="nf-number"><span>4</span><span className="nf-zero"><span><FiCompass /></span></span><span>4</span></div>
          <span className="nf-art-pin"><FiMapPin /></span><span className="nf-art-parcel"><FiPackage /></span>
          <div className="nf-route-card"><span><FiHome /></span><div><small>YOUR NEXT STOP</small><strong>Somewhere familiar.</strong></div><FiArrowUpRight /></div>
          <span className="nf-art-caption">GOOD THINGS FIND THEIR WAY.</span>
        </div>
      </section>

      <section className="nf-directions" aria-labelledby="not-found-directions-heading">
        <div className="nf-directions-intro"><span className="nf-eyebrow">A FAMILIAR DIRECTION</span><h2 id="not-found-directions-heading">Pick up where<br />you left off<span>.</span></h2><p>Your orders and journeys have a place here.</p></div>
        <Link className="nf-destination" to="/client-dashboard"><span className="nf-card-icon"><FiPackage aria-hidden="true" /></span><div><span>FOR CLIENTS</span><h3>Your orders.</h3><p>View your orders and follow their progress.</p><strong>Client dashboard<FiArrowUpRight aria-hidden="true" /></strong></div></Link>
        <Link className="nf-destination nf-traveler" to="/traveler-dashboard"><span className="nf-card-icon"><FiSend aria-hidden="true" /></span><div><span>FOR TRAVELERS</span><h3>Your journeys.</h3><p>Find deliveries and manage the ones you’re carrying.</p><strong>Traveler dashboard<FiArrowUpRight aria-hidden="true" /></strong></div></Link>
      </section>
    </main>
    <footer className="nf-footer"><span>© {new Date().getFullYear()} Nexus. All rights reserved.</span><span>Good things travel together.</span></footer>
  </div>;
};

export default NotFound;
