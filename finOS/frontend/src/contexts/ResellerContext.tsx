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

export const ResellerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [resellerId, setResellerId] = useState<number | null>(null);
  const [resellerSubdomain, setResellerSubdomain] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    const checkDomain = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const ref = urlParams.get('ref');
      
      let domainToVerify = window.location.hostname;
      if (ref) {
        domainToVerify = ref;
      }

      // Use correct API host depending on where we are running
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      // If not localhost, point to the live server's reseller backend IP
      const apiHost = isLocalhost ? 'http://localhost:9005' : 'http://163.245.222.160:9005';

      try {
        const response = await fetch(`${apiHost}/api/resellers/verify?domain=${domainToVerify}`);
        if (response.ok) {
          const data = await response.json();
          setResellerId(data.id);
          setResellerSubdomain(data.subdomain);
          localStorage.setItem('reseller_id', data.id.toString());
        } else {
          localStorage.removeItem('reseller_id');
        }
      } catch (error) {
        console.error("Failed to verify reseller domain:", error);
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
