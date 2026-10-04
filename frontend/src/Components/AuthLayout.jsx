import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { FiArrowLeft, FiArrowUpRight, FiGlobe, FiKey, FiLock, FiMail, FiPackage, FiSend } from 'react-icons/fi';
import Logo from '../assets/NexusLogo.png';
import Traveler from '../assets/orderMatching.png';
import Recipient from '../assets/orderReception.png';
import './auth.css';

const AuthLayout = ({ mode, title, description, children, verification = false, notice, formHeader }) => {
  const signup = mode === 'signup';
  const recovery = mode === 'recovery';
  const heading = useRef(null);
  const previousTitle = useRef(title);

  useEffect(() => {
    const originalTitle = document.title;
    document.title = `${title} | Nexus`;
    if (previousTitle.current !== title) heading.current?.focus();
    previousTitle.current = title;
    return () => { document.title = originalTitle; };
  }, [title]);

  return (
    <div className={`nexus-auth auth-${mode}`}>
      <a className="auth-skip" href="#auth-form">Skip to form</a>
      <header className="auth-header">
        <Link to="/" className="auth-brand" aria-label="Nexus home">
          <img src={Logo} alt="" width="48" height="48" />
          <span>NEXUS<span>.</span></span>
        </Link>
        <Link to="/" className="auth-home-link"><FiArrowLeft aria-hidden="true" /> Back to home</Link>
      </header>
      {notice}
      <main className="auth-main">
        <aside className="auth-story" aria-label="The Nexus community">
          <div className="auth-story-copy">
            <span className="auth-eyebrow"><span /> GOOD THINGS TRAVEL TOGETHER</span>
            <h2>{recovery ? <>A little reset.<br /><span>A fresh start.</span></> : signup ? <>A world of possibilities.<br /><span>One connection away.</span></> : <>Your next chapter.<br /><span>A little closer.</span></>}</h2>
            <p>{recovery ? 'For the things still on your wishlist and the journeys still ahead. Find your way back to Nexus.' : signup ? 'Find what you need. Carry something that matters. Join a community bringing the world closer, one delivery at a time.' : 'From the things you need to the journeys you make, pick up where you left off with Nexus.'}</p>
          </div>
          {recovery ? <div className="recovery-art" aria-hidden="true">
            <div className="recovery-orbit" /><div className="recovery-orbit recovery-orbit-inner" />
            <div className="recovery-art-mail"><FiMail /></div>
            <div className="recovery-art-key"><FiKey /></div>
            <div className="recovery-art-card"><span className="recovery-art-lock"><FiLock /></span><small>YOUR NEXUS ACCOUNT</small><strong>Back to possibilities.</strong><div className="recovery-art-dots">••••••••<FiKey /></div></div>
            <div className="recovery-art-note"><span /><span>A fresh start, a familiar place.</span></div>
          </div> : <div className="auth-art" aria-hidden="true">
            <div className="auth-art-disc" /><div className="auth-art-orbit" /><div className="auth-art-orbit auth-art-orbit-inner" />
            <div className="auth-art-send"><FiSend /></div>
            <img src={signup ? Recipient : Traveler} alt="" className="auth-art-person" />
            <div className="auth-art-note"><span><FiPackage /></span><div><small>YOUR ORDER. THEIR JOURNEY.</small><strong>A perfect connection.</strong></div><FiArrowUpRight /></div>
          </div>}
          <div className="auth-story-footer"><FiGlobe aria-hidden="true" /><span>Less distance. More connection.</span><span>NEXUS / {new Date().getFullYear()}</span></div>
        </aside>
        <section className="auth-form-panel" id="auth-form" aria-labelledby="auth-heading" tabIndex={-1}>
          <div className="auth-form-inner">
            {formHeader}
            <div className="auth-intro">
              <span className="auth-eyebrow">{recovery ? 'ACCOUNT RECOVERY' : verification ? 'ONE MORE STEP' : 'YOUR NEXUS ACCOUNT'}</span>
              <h1 id="auth-heading" ref={heading} tabIndex={-1}>{title}</h1>
              <p>{description}</p>
            </div>
            {children}
            {!recovery && <p className="auth-switch">{signup ? 'Already part of Nexus?' : 'New to Nexus?'} <Link to={signup ? '/login' : '/signup'}>{signup ? 'Log in' : 'Create an account'} <FiArrowUpRight aria-hidden="true" /></Link></p>}
          </div>
        </section>
      </main>
      <footer className="auth-footer"><span>© {new Date().getFullYear()} Nexus. All rights reserved.</span><span>Good things are on their way.</span></footer>
    </div>
  );
};

AuthLayout.propTypes = {
  mode: PropTypes.oneOf(['login', 'signup', 'recovery']).isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.node.isRequired,
  children: PropTypes.node.isRequired,
  verification: PropTypes.bool,
  notice: PropTypes.node,
  formHeader: PropTypes.node,
};

export default AuthLayout;
