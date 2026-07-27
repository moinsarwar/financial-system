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
      // In local dev, window.location.hostname might be ahmed.fincompare.pk
      const hostname = window.location.hostname;
      
      // We can also extract the first part of the hostname or just send the full hostname
      // For now we'll just send the full hostname to the reseller backend verify endpoint
      try {
        const response = await fetch(`http://localhost:9005/api/resellers/verify?domain=${hostname}`);
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
