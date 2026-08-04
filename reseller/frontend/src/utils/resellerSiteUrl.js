/**
 * Local: *.localhost → finOS :5173
 * Production: {subdomain}.thecomparisonengine.com
 */
const APEX_DOMAIN = 'thecomparisonengine.com';

export function getResellerSiteUrl(subdomain, { withProtocol = true } = {}) {
  if (!subdomain) return '';

  const isLocal =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname.endsWith('.localhost'));

  const publicHost = process.env.REACT_APP_FINOS_PUBLIC_HOST;
  let host;
  if (isLocal) {
    host = `${subdomain}.localhost:5173`;
  } else if (publicHost) {
    host = `${subdomain}.${publicHost}`;
  } else {
    host = `${subdomain}.${APEX_DOMAIN}`;
  }

  const protocol =
    typeof window !== 'undefined' && window.location.protocol === 'https:'
      ? 'https'
      : 'http';

  return withProtocol ? `${protocol}://${host}` : host;
}
