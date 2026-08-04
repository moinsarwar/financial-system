import React, { createContext, useContext, useEffect, useState } from 'react';

interface ResellerContextType {
  resellerId: number | null;
  resellerSubdomain: string | null;
  isVerifying: boolean;
}

const ResellerContext = createContext<ResellerContextType>({
  resellerId: null,
  resellerSubdomain: null,
  isVerifying: true,
});

const APEX_DOMAIN = 'thecomparisonengine.com';

/** Reserved hosts that are NOT partner white-label subdomains. */
function isReservedHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return (
    h === APEX_DOMAIN ||
    h === `www.${APEX_DOMAIN}` ||
    h === `reseller.${APEX_DOMAIN}` ||
    h === 'localhost' ||
    h === '127.0.0.1'
  );
}

/** Only true local/dev hosts — production domains must NOT match. */
function isLocalDevHost(hostname: string): boolean {
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.endsWith('.localhost')
  );
}

function getResellerApiHost(hostname: string): string {
  const fromEnv = import.meta.env.VITE_RESELLER_API_URL as string | undefined;
  if (fromEnv) return fromEnv.replace(/\/$/, '');

  if (isLocalDevHost(hostname)) {
    return 'http://localhost:9005';
  }

  // Production: reseller portal / API on reseller.<apex>
  if (hostname === APEX_DOMAIN || hostname.endsWith(`.${APEX_DOMAIN}`)) {
    return `http://reseller.${APEX_DOMAIN}`;
  }

  // Legacy server IP fallback
  return 'http://163.245.222.160:9005';
}

export const ResellerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [resellerId, setResellerId] = useState<number | null>(null);
  const [resellerSubdomain, setResellerSubdomain] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    const checkDomain = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const ref = urlParams.get('ref');
      const hostname = window.location.hostname;

      // Apex / www / reseller portal = no partner attribution unless ?ref=subdomain
      let domainToVerify: string | null = null;
      if (ref && ref !== 'owner') {
        domainToVerify = ref;
      } else if (!isReservedHost(hostname) || hostname.endsWith('.localhost')) {
        // ahmedfin.thecomparisonengine.com or ahmedfin.localhost
        if (hostname.endsWith('.localhost') && hostname !== 'localhost') {
          domainToVerify = hostname;
        } else if (!isReservedHost(hostname)) {
          domainToVerify = hostname;
        }
      }

      if (!domainToVerify) {
        localStorage.removeItem('reseller_id');
        localStorage.removeItem('reseller_subdomain');
        setIsVerifying(false);
        return;
      }

      const apiHost = getResellerApiHost(hostname);

      try {
        const response = await fetch(
          `${apiHost}/api/resellers/verify?domain=${encodeURIComponent(domainToVerify)}`,
        );
        if (response.ok) {
          const data = await response.json();
          setResellerId(data.id);
          setResellerSubdomain(data.subdomain);
          localStorage.setItem('reseller_id', data.id.toString());
          localStorage.setItem('reseller_subdomain', data.subdomain);
        } else {
          localStorage.removeItem('reseller_id');
          localStorage.removeItem('reseller_subdomain');
        }
      } catch (error) {
        console.error('Failed to verify reseller domain:', error);
      } finally {
        setIsVerifying(false);
      }
    };

    checkDomain();
  }, []);

  return (
    <ResellerContext.Provider value={{ resellerId, resellerSubdomain, isVerifying }}>
      {children}
    </ResellerContext.Provider>
  );
};

export const useReseller = () => useContext(ResellerContext);
