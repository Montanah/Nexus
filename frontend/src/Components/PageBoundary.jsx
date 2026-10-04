import { Component, Suspense } from 'react';
import { Link, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import './pageLoading.css';

export const PageLoading = ({ message = 'Loading your page…' }) => (
  <div className="nexus-page-loading" role="status"><span aria-hidden="true" />{message}</div>
);
PageLoading.propTypes = { message: PropTypes.string };

class PageError extends Component {
  state = { failed: false, pathname: this.props.pathname };
  static getDerivedStateFromProps({ pathname }, state) {
    return pathname !== state.pathname ? { pathname, failed: false } : null;
  }
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) return <main className="nexus-page-error">
      <div><span className="nexus-page-eyebrow">NEXUS</span><h1>This page couldn’t load.</h1>
        <p>Check your connection, then reload the page to try again.</p>
        <button onClick={() => window.location.reload()}>Reload page</button><Link to="/">Back to home</Link>
      </div>
    </main>;
    return this.props.children;
  }
}
PageError.propTypes = { children: PropTypes.node.isRequired, pathname: PropTypes.string.isRequired };

const PageBoundary = ({ children }) => {
  const { pathname } = useLocation();
  return <PageError pathname={pathname}><Suspense fallback={<PageLoading />}>{children}</Suspense></PageError>;
};
PageBoundary.propTypes = { children: PropTypes.node.isRequired };
export default PageBoundary;
