import axios from 'axios';

const AUTH_TIMEOUT = 15000;
const publicAuthPaths = new Set([
  '/api/auth/loginUser', '/api/auth/register', '/api/auth/verifyLoginOTP',
  '/api/auth/verifyUser', '/api/auth/resendVerificationCode',
  '/api/auth/forgotPassword', '/api/auth/resetPassword',
  '/api/auth/verify-social', '/api/auth/refresh-token', '/api/auth/logout',
]);

const isPublicAuth = config => {
  const path = new URL(config.url, 'https://nexus.invalid').pathname.replace(/\/+$/, '');
  return publicAuthPaths.has(path)
    || /^\/api\/auth\/(google|apple)\/(login|signup)\/(initiate|callback)$/.test(path);
};

// Cookie-based authentication: never copy access/refresh tokens into browser storage.
export const createSessionClient = (options = {}) => {
  const api = axios.create({ ...options, withCredentials: true });
  let refreshPromise = null;
  let refreshController = null;
  let logoutPromise = null;
  let sessionVersion = 0;
  let refreshVersion = 0;
  let expiredError = null;
  const listeners = new Set();
  const changedSession = () => new axios.CanceledError('The session changed before this request completed.');

  const reset = () => {
    sessionVersion += 1;
    refreshVersion = 0;
    expiredError = null;
    refreshController?.abort();
    refreshController = null;
    refreshPromise = null;
  };

  const expire = error => {
    if (!expiredError) {
      error.isSessionExpired = true;
      expiredError = error;
      sessionVersion += 1;
      listeners.forEach(listener => listener());
    }
    return expiredError;
  };

  const refresh = () => {
    if (expiredError) return Promise.reject(expiredError);
    if (refreshPromise) return refreshPromise;
    const version = sessionVersion;
    refreshController = new AbortController();
    const pending = api.post('/api/auth/refresh-token', {}, { timeout: AUTH_TIMEOUT, signal: refreshController.signal })
      .then(() => {
        if (version !== sessionVersion) throw changedSession();
        refreshVersion += 1;
      })
      .catch(error => {
        if (version !== sessionVersion) throw changedSession();
        // A timeout, offline connection or server outage does not invalidate a session.
        if ([401, 403].includes(error.response?.status)) throw expire(error);
        throw error;
      })
      .finally(() => {
        if (refreshPromise === pending) {
          refreshPromise = null;
          refreshController = null;
        }
      });
    refreshPromise = pending;
    return pending;
  };

  api.interceptors.request.use(config => {
    if (isPublicAuth(config)) {
      if (!config.timeout) config.timeout = AUTH_TIMEOUT;
      return config;
    }
    if (expiredError) throw expiredError;
    if (logoutPromise || (config._sessionVersion !== undefined && config._sessionVersion !== sessionVersion)) throw changedSession();
    config._sessionVersion = sessionVersion;
    config._refreshVersion ??= refreshVersion;
    return config;
  });

  api.interceptors.response.use(response => {
    if (!isPublicAuth(response.config)
      && (logoutPromise || response.config._sessionVersion !== sessionVersion)) throw changedSession();
    return response;
  }, async error => {
    const request = error.config;
    if (!request || isPublicAuth(request) || error.response?.status !== 401) throw error;
    if (expiredError) throw expiredError;
    if (logoutPromise || request._sessionVersion !== sessionVersion) throw changedSession();
    if (request._retry) throw expire(error);
    request._retry = true;
    // Late 401s from requests sent before a successful refresh use the new cookie.
    if (request._refreshVersion === refreshVersion) await refresh();
    if (request.signal?.aborted) throw new axios.CanceledError();
    if (request._sessionVersion !== sessionVersion) throw changedSession();
    return api(request);
  });

  const logout = () => {
    if (logoutPromise) return logoutPromise;
    // Finish any refresh before clearing server cookies; block other protected retries.
    const pending = (async () => {
      if (refreshPromise) await refreshPromise;
      let response;
      try {
        response = await api.post('/api/auth/logout', {});
      } catch (error) {
        // The backend requires an access cookie even when a refresh cookie is valid.
        if (error.response?.status !== 400 || error.response?.data?.message !== 'No token provided') throw error;
        await refresh();
        response = await api.post('/api/auth/logout', {});
      }
      reset();
      return response.data;
    })().finally(() => { logoutPromise = null; });
    logoutPromise = pending;
    return pending;
  };

  return {
    api,
    session: {
      reset,
      logout,
      subscribe: listener => {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
    },
  };
};
