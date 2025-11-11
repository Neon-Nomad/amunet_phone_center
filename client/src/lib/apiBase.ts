const trimTrailingSlash = (value: string) => value.replace(/\/+$/u, '');

const determineApiBase = () => {
  const configured = import.meta.env.VITE_API_BASE_URL?.trim();
  if (configured) {
    return trimTrailingSlash(configured);
  }

  if (typeof window === 'undefined') {
    return '';
  }

  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:4000';
  }

  return '';
};

const ensureLeadingSlash = (path: string) => (path.startsWith('/') ? path : `/${path}`);

export const buildApiUrl = (path: string) => {
  const base = determineApiBase();
  const normalizedPath = ensureLeadingSlash(path);
  return base ? `${base}${normalizedPath}` : normalizedPath;
};
