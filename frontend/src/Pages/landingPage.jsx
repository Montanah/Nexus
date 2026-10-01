import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  FiArrowDown, FiArrowUpRight, FiCheck, FiCheckCircle, FiGlobe, FiLock,
  FiMapPin, FiMenu, FiPackage, FiPlus, FiSend, FiShield, FiX,
} from 'react-icons/fi';
import Logo from '../assets/NexusLogo.png';
import OrderImage from '../assets/orderImage.png';
import OrderReception from '../assets/orderReception.png';
import DeliveryImage from '../assets/deliveryImage.png';
import OrderMatching from '../assets/orderMatching.png';
import './landingPage.css';

const steps = [
  { image: OrderImage, title: 'Tell us what you need.', description: 'Create product listing, specify delivery details & pay for the product', alt: 'Customer creating a product listing on her phone' },
  { image: OrderMatching, title: 'Meet your match.', description: 'Our smart algorithm matches your order with nearby travelers', alt: 'Traveler checking an order on his phone' },
  { image: DeliveryImage, title: 'Let the journey begin.', description: 'Traveler purchases the product and proceeds to make delivery', alt: 'Traveler carrying a package for delivery' },
  { image: OrderReception, title: 'Make it a happy arrival.', description: 'Client receives product, verified by both parties', alt: 'Customer receiving her delivery' },
];

const benefits = [
  { icon: FiShield, title: 'Real people. Real trust.', description: 'Connect with verified travelers, so you know who is carrying your order.', label: 'Verified travelers only' },
  { icon: FiLock, title: 'Peace of mind, included.', description: 'Escrow protection keeps secure payments at the heart of your delivery.', label: 'Escrow-protected payments' },
  { icon: FiMapPin, title: 'Follow every step.', description: 'Stay connected to your delivery with real-time package tracking.', label: 'Real-time package tracking' },
];

const questions = [
  { question: 'What makes Nexus different?', answer: 'Nexus connects people who need a product delivered with verified travelers already heading in that direction. It is a simple, secure approach to peer-to-peer delivery.' },
  { question: 'How do I place an order?', answer: 'Create an account, list the product you need, specify your delivery details, and pay for the product. Nexus matches your order with a traveler who purchases it and makes the delivery.' },
  { question: 'Can I join as a traveler?', answer: 'Yes. Create an account to get started as a traveler, find orders along your route, and help bring someone’s delivery closer to home.' },
  { question: 'How are payments protected?', answer: 'Nexus uses escrow protection for secure payments. When the product arrives, both the client and the traveler verify the delivery.' },
];

const perspectives = {
  sender: {
    eyebrow: 'FOR THE THINGS YOU NEED',
    title: 'Your wishlist.\nA little closer to home.',
    description: 'That thing you’ve been looking for? Someone could already be heading your way. Create your order and connect with a traveler on your route.',
    points: ['Tell us what you need and where it should go', 'Get matched with a verified traveler', 'Receive your product and confirm delivery'],
    action: 'Create your first order', image: OrderReception,
    alt: 'A smiling customer receiving a package', caption: 'Good things are on their way.',
  },
  traveler: {
    eyebrow: 'FOR THE JOURNEYS YOU MAKE',
    title: 'You’re going places.\nBring a little more along.',
    description: 'Make your next journey a connection that matters. Find orders along your route, purchase the requested products, and deliver them to someone waiting.',
    points: ['Find orders that fit your journey', 'Purchase and carry the requested product', 'Complete delivery and verify it with the client'],
    action: 'Join as a traveler', image: DeliveryImage,
    alt: 'A traveler ready to deliver a package', caption: 'A journey that goes a little further.',
  },
};

const LandingPage = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [perspective, setPerspective] = useState('sender');
  const menuButton = useRef(null);
  const reduceMotion = useReducedMotion();
  const current = perspectives[perspective];

  useEffect(() => {
    if (!menuOpen) return;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        menuButton.current?.focus();
      }
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [menuOpen]);

  const reveal = {
    initial: { opacity: 0, y: reduceMotion ? 0 : 22 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.12 },
    transition: { duration: reduceMotion ? 0 : 0.55 },
  };

  return (
    <div className="nexus-landing">
      <a className="nx-skip-link" href="#main-content">Skip to content</a>
      <header className="nx-header">
        <div className="nx-nav-wrap">
          <Link to="/" className="nx-brand" aria-label="Nexus home">
            <img src={Logo} alt="" width="52" height="52" />
            <span>NEXUS<span className="nx-brand-dot">.</span></span>
          </Link>
          <nav id="landing-navigation" className={`nx-navigation ${menuOpen ? 'is-open' : ''}`} aria-label="Main navigation">
            <a href="#how-it-works" onClick={() => setMenuOpen(false)}>How it works</a>
            <a href="#why-nexus" onClick={() => setMenuOpen(false)}>Why Nexus</a>
            <a href="#your-journey" onClick={() => { setPerspective('traveler'); setMenuOpen(false); }}>For travelers <FiArrowUpRight aria-hidden="true" /></a>
            <Link className="nx-mobile-login" to="/login">Log in</Link>
          </nav>
          <div className="nx-nav-actions">
            <Link className="nx-login-link" to="/login">Log in</Link>
            <Link className="nx-button nx-button-small" to="/signup">Get started <FiArrowUpRight aria-hidden="true" /></Link>
            <button ref={menuButton} type="button" className="nx-menu-toggle" aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} aria-controls="landing-navigation" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <FiX aria-hidden="true" /> : <FiMenu aria-hidden="true" />}
            </button>
          </div>
        </div>
      </header>

      <main id="main-content" tabIndex={-1}>
        <section className="nx-hero" aria-labelledby="hero-heading">
          <div className="nx-hero-grid nx-container">
            <motion.div className="nx-hero-copy" {...reveal}>
              <span className="nx-eyebrow nx-hero-eyebrow"><span className="nx-status-dot" /> A smaller world. A better way to deliver.</span>
              <h1 id="hero-heading">Global delivery.<br /><span className="nx-gradient-text">Reimagined.</span></h1>
              <p className="nx-hero-lead">Ship with travelers, not couriers.</p>
              <p className="nx-hero-description">Connect with our global network of verified travelers to deliver anything, anywhere — faster and more affordably than traditional shipping.</p>
              <div className="nx-hero-actions">
                <Link to="/signup" className="nx-button">Start your delivery <FiArrowUpRight aria-hidden="true" /></Link>
                <a href="#how-it-works" className="nx-button nx-button-secondary">See how it works <FiArrowDown aria-hidden="true" /></a>
              </div>
              <div className="nx-hero-assurance">
                <div className="nx-assurance-icon"><FiShield aria-hidden="true" /></div>
                <p>People-powered delivery.<br /><strong>Protected every step of the way.</strong></p>
              </div>
            </motion.div>

            <motion.div className="nx-hero-art" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: reduceMotion ? 0 : 0.8 }}>
              <div className="nx-orbit nx-orbit-outer" aria-hidden="true" />
              <div className="nx-orbit nx-orbit-inner" aria-hidden="true" />
              <div className="nx-hero-disc" aria-hidden="true"><span>N</span></div>
              <div className="nx-orbit-point nx-orbit-point-one" aria-hidden="true" />
              <div className="nx-orbit-point nx-orbit-point-two" aria-hidden="true" />
              <div className="nx-airmail" aria-hidden="true"><FiSend /></div>
              <img className="nx-hero-person" src={OrderMatching} alt="A traveler with a backpack checking his next delivery on his phone" width="500" height="500" fetchPriority="high" />
              <div className="nx-traveler-label"><span className="nx-verified-icon"><FiCheck aria-hidden="true" /></span><span>More than a delivery.<strong>A human connection.</strong></span></div>
              <div className="nx-route-card">
                <div className="nx-route-card-top"><span className="nx-package-icon"><FiPackage aria-hidden="true" /></span><div><span>YOUR ORDER. THEIR JOURNEY.</span><strong>A perfect connection.</strong></div><FiArrowUpRight aria-hidden="true" /></div>
                <div className="nx-route-line" aria-hidden="true"><span /><i /><FiSend /><i /><FiMapPin /></div>
                <div className="nx-route-labels"><span>From wherever.</span><span>To your doorstep.</span></div>
              </div>
              <span className="nx-art-caption"><FiGlobe aria-hidden="true" /> GOOD THINGS TRAVEL TOGETHER</span>
            </motion.div>
          </div>
          <div className="nx-hero-bottom nx-container"><span>Less distance. More connection.</span><a href="#how-it-works">Discover the Nexus way <FiArrowDown aria-hidden="true" /></a></div>
        </section>

        <div className="nx-promise-strip" aria-label="Nexus benefits">
          <div className="nx-container">
            <span><FiGlobe aria-hidden="true" /> Global connections</span>
            <span><FiCheckCircle aria-hidden="true" /> Verified travelers</span>
            <span><FiLock aria-hidden="true" /> Escrow protection</span>
            <span><FiMapPin aria-hidden="true" /> Real-time tracking</span>
          </div>
        </div>

        <section id="how-it-works" className="nx-section nx-container" aria-labelledby="journey-heading">
          <motion.div className="nx-section-heading" {...reveal}>
            <div><span className="nx-eyebrow">THE NEXUS WAY</span><h2 id="journey-heading">From “I want it”<br />to “it’s here.”</h2></div>
            <p>A simple journey, powered by people.<br />Four steps to bring your world closer.</p>
          </motion.div>
          <div className="nx-steps">
            {steps.map((step, index) => (
              <motion.article className="nx-step" key={step.title} {...reveal} transition={{ duration: reduceMotion ? 0 : 0.5, delay: reduceMotion ? 0 : index * 0.07 }}>
                <div className={`nx-step-visual nx-step-visual-${index + 1}`}>
                  <span className="nx-step-number">0{index + 1}</span>
                  <img src={step.image} alt={step.alt} width="500" height="500" loading="lazy" decoding="async" />
                  <span className="nx-step-arrow" aria-hidden="true">{index === steps.length - 1 ? <FiCheck /> : <FiArrowUpRight />}</span>
                </div>
                <h3>{step.title}</h3><p>{step.description}</p>
              </motion.article>
            ))}
          </div>
        </section>

        <section id="why-nexus" className="nx-trust-section" aria-labelledby="trust-heading">
          <div className="nx-container">
            <motion.div className="nx-trust-intro" {...reveal}>
              <span className="nx-eyebrow">A LITTLE TRUST GOES A LONG WAY</span>
              <h2 id="trust-heading">Built around people.<br /><span>Backed by peace of mind.</span></h2>
              <p>No middlemen. No overpaying. Just simple, secure peer-to-peer delivery.</p>
            </motion.div>
            <div className="nx-benefits">
              {benefits.map(({ icon: Icon, title, description, label }) => (
                <motion.article className="nx-benefit" key={title} {...reveal}>
                  <span className="nx-benefit-icon"><Icon aria-hidden="true" /></span>
                  <h3>{title}</h3><p>{description}</p>
                  <span className="nx-benefit-label"><FiCheck aria-hidden="true" />{label}</span>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        <section id="your-journey" className="nx-section nx-container" aria-labelledby="perspective-heading">
          <motion.div className="nx-section-heading" {...reveal}>
            <div><span className="nx-eyebrow">WHICHEVER WAY YOU’RE GOING</span><h2 id="perspective-heading">One connection.<br />Two ways to go.</h2></div>
            <p>Something to send, or somewhere to be?<br />There’s a place for you on Nexus.</p>
          </motion.div>
          <div className="nx-perspective">
            <div className="nx-perspective-copy">
              <div className="nx-perspective-switch" role="group" aria-label="Choose your Nexus experience">
                <button type="button" aria-pressed={perspective === 'sender'} aria-controls="perspective-content" onClick={() => setPerspective('sender')}><FiPackage aria-hidden="true" /> I’m ordering</button>
                <button type="button" aria-pressed={perspective === 'traveler'} aria-controls="perspective-content" onClick={() => setPerspective('traveler')}><FiSend aria-hidden="true" /> I’m traveling</button>
              </div>
              <div id="perspective-content" aria-live="polite" aria-atomic="true">
                <span className="nx-eyebrow">{current.eyebrow}</span><h3>{current.title}</h3><p>{current.description}</p>
                <ul>{current.points.map(point => <li key={point}><FiCheckCircle aria-hidden="true" />{point}</li>)}</ul>
                <Link to="/signup" className="nx-text-link">{current.action}<FiArrowUpRight aria-hidden="true" /></Link>
              </div>
            </div>
            <div className={`nx-perspective-art nx-perspective-${perspective}`}>
              <span className="nx-perspective-orbit" aria-hidden="true" />
              <img key={current.image} src={current.image} alt={current.alt} width="500" height="500" loading="lazy" decoding="async" />
              <span className="nx-perspective-caption"><FiPackage aria-hidden="true" />{current.caption}</span>
            </div>
          </div>
        </section>

        <section className="nx-faq nx-container" aria-labelledby="faq-heading">
          <div><span className="nx-eyebrow">GOOD QUESTIONS. SIMPLE ANSWERS.</span><h2 id="faq-heading">A few things<br />you might wonder.</h2><p>Getting closer starts with a little clarity.</p></div>
          <div className="nx-faq-list">
            {questions.map(({ question, answer }) => <details key={question}><summary>{question}<FiPlus aria-hidden="true" /></summary><p>{answer}</p></details>)}
          </div>
        </section>

        <section className="nx-final-cta nx-container" aria-labelledby="cta-heading">
          <span className="nx-cta-orbit nx-cta-orbit-one" aria-hidden="true" /><span className="nx-cta-orbit nx-cta-orbit-two" aria-hidden="true" />
          <span className="nx-eyebrow"><FiGlobe aria-hidden="true" /> YOUR WORLD, A LITTLE CLOSER</span>
          <h2 id="cta-heading">Great connections.<br />Even better deliveries.</h2>
          <p>Your next delivery starts with someone going your way.</p>
          <Link to="/signup" className="nx-button nx-button-white">Let’s get you connected <FiArrowUpRight aria-hidden="true" /></Link>
        </section>
      </main>

      <footer className="nx-footer nx-container">
        <div className="nx-footer-top">
          <Link to="/" className="nx-brand" aria-label="Nexus home"><img src={Logo} alt="" width="52" height="52" /><span>NEXUS<span className="nx-brand-dot">.</span></span></Link>
          <p>Delivering more than packages.<br />Connecting people, everywhere.</p>
          <nav aria-label="Footer navigation"><a href="#how-it-works">How it works</a><a href="#why-nexus">Why Nexus</a><Link to="/login">Log in</Link><Link to="/signup">Sign up <FiArrowUpRight aria-hidden="true" /></Link></nav>
        </div>
        <div className="nx-footer-bottom"><span>Copyright © {new Date().getFullYear()} Nexus. All rights reserved.</span><span>Made for a more connected world.<FiGlobe aria-hidden="true" /></span></div>
      </footer>
    </div>
  );
};

export default LandingPage;
