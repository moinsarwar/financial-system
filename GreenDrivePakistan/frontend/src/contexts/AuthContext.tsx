import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api, loginRequest, mapApp, mapProduct, setToken, getToken } from '../services/api';
import type {
  Application,
  AuthUser,
  CashSale,
  Lender,
  Product,
  UserRole,
  Vendor,
} from '../types';

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  products: Product[];
  vendors: Vendor[];
  applications: Application[];
  cashSales: CashSale[];
  lenders: Lender[];
  users: { id: number; name: string; email: string; salary?: number }[];
  activeLenderId: number | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (data: {
    name: string;
    email: string;
    password: string;
    cnic: string;
    phone: string;
    address: string;
    salary: number;
  }) => Promise<boolean>;
  refreshPublic: () => Promise<void>;
  refreshScoped: () => Promise<void>;
  computeProfit: (price: number) => number;
  getProduct: (id: number) => Product | undefined;
  getVendor: (id: number) => Vendor | undefined;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function mapCash(c: Record<string, unknown>): CashSale {
  return {
    id: c.id as number,
    vendorId: c.vendor_id as number,
    productId: c.product_id as number,
    buyerName: c.buyer_name as string,
    amount: c.amount as number,
    date: c.sale_date ? String(c.sale_date).slice(0, 10) : '',
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      return JSON.parse(localStorage.getItem('gd_user') || 'null');
    } catch {
      return null;
    }
  });
  const [token, setTokenState] = useState<string | null>(() => getToken());
  const [products, setProducts] = useState<Product[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [cashSales, setCashSales] = useState<CashSale[]>([]);
  const [lenders, setLenders] = useState<Lender[]>([]);
  const [users, setUsers] = useState<{ id: number; name: string; email: string; salary?: number }[]>([]);
  const [activeLenderId, setActiveLenderId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const computeProfit = useCallback(
    (price: number) => {
      const lender =
        lenders.find((l) => l.id === activeLenderId) ||
        lenders.find((l) => l.is_active) ||
        lenders[0];
      const rate = lender ? lender.profitRate : 0.13;
      return Math.round(price * rate);
    },
    [lenders, activeLenderId],
  );

  const refreshPublic = useCallback(async () => {
    const [prods, vends] = await Promise.all([
      api<Parameters<typeof mapProduct>[0][]>('/products/'),
      api<{ id: number; name: string; email?: string }[]>('/vendors/'),
    ]);
    const mapped = prods.map(mapProduct).map((p) => ({
      ...p,
      profit: p.profit ?? Math.round(p.price * 0.13),
    }));
    setProducts(mapped);
    setVendors(vends.map((v) => ({ id: v.id, name: v.name, email: v.email })));
  }, []);

  const refreshScoped = useCallback(async () => {
    const role = user?.role;
    const uid = user?.id;
    if (!role || uid == null || !getToken()) return;

    try {
      const me = await api<{
        id: number;
        name: string;
        email: string;
        role?: string;
      }>('/users/me');
      const nextRole = (me.role || role) as UserRole;
      setUser((prev) => {
        if (
          prev &&
          prev.id === me.id &&
          prev.name === me.name &&
          prev.email === me.email &&
          prev.role === nextRole
        ) {
          return prev;
        }
        const authUser: AuthUser = {
          id: me.id,
          name: me.name,
          email: me.email,
          role: nextRole,
        };
        localStorage.setItem('gd_user', JSON.stringify(authUser));
        return authUser;
      });
    } catch (e) {
      console.warn(e);
    }

    if (role === 'vendor') {
      try {
        const [vendorProds, vendorApps, cash] = await Promise.all([
          api<Parameters<typeof mapProduct>[0][]>('/vendors/me/products'),
          api<Record<string, unknown>[]>('/vendors/me/applications'),
          api<Record<string, unknown>[]>('/vendors/me/cash-sales'),
        ]);
        setApplications(vendorApps.map(mapApp));
        setCashSales(cash.map(mapCash));
        setProducts((prev) => {
          const byId = new Map(prev.map((p) => [p.id, p]));
          vendorProds.map(mapProduct).forEach((p) => byId.set(p.id, p));
          return Array.from(byId.values());
        });
      } catch (e) {
        console.warn(e);
      }
      return;
    }

    try {
      const apps = await api<Record<string, unknown>[]>('/applications/');
      setApplications(apps.map(mapApp));
    } catch (e) {
      console.warn(e);
    }

    if (role === 'admin') {
      try {
        const ls = await api<Record<string, unknown>[]>('/admin/lenders');
        const mappedLenders = ls.map((l) => ({
          id: l.id as number,
          name: l.name as string,
          profitRate: l.profit_rate as number,
          maxTenure: l.max_tenure as number,
          is_active: l.is_active as boolean,
        }));
        setLenders(mappedLenders);
        const active = mappedLenders.find((l) => l.is_active);
        setActiveLenderId(active ? active.id : mappedLenders[0]?.id ?? null);

        const us = await api<Record<string, unknown>[]>('/users/');
        setUsers(
          us.map((u) => ({
            id: u.id as number,
            name: u.name as string,
            email: u.email as string,
            salary: u.salary as number | undefined,
          })),
        );

        const cash = await api<Record<string, unknown>[]>('/admin/cash-sales');
        setCashSales(cash.map(mapCash));
      } catch (e) {
        console.warn(e);
      }
    }
  }, [user?.id, user?.role]);

  useEffect(() => {
    (async () => {
      try {
        await refreshPublic();
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [refreshPublic]);

  useEffect(() => {
    if (user && token) {
      refreshScoped().catch(console.warn);
    }
  }, [user?.id, user?.role, token, refreshScoped]);

  useEffect(() => {
    if (!lenders.length) return;
    setProducts((prev) =>
      prev.map((p) => ({
        ...p,
        profit: p.profit ?? computeProfit(p.price),
      })),
    );
  }, [lenders, activeLenderId, computeProfit]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const data = await loginRequest(email, password);
      const authUser: AuthUser = {
        role: data.user.role as UserRole,
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
      };
      setToken(data.access_token);
      setTokenState(data.access_token);
      setUser(authUser);
      localStorage.setItem('gd_user', JSON.stringify(authUser));
      return true;
    } catch {
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setTokenState(null);
    setToken(null);
    localStorage.removeItem('gd_user');
    setApplications([]);
    setCashSales([]);
  }, []);

  const register = useCallback(
    async (data: {
      name: string;
      email: string;
      password: string;
      cnic: string;
      phone: string;
      address: string;
      salary: number;
    }) => {
      await api('/auth/register', { method: 'POST', body: data });
      return login(data.email, data.password);
    },
    [login],
  );

  const getProduct = useCallback((id: number) => products.find((p) => p.id === id), [products]);
  const getVendor = useCallback((id: number) => vendors.find((v) => v.id === id), [vendors]);

  const value = useMemo(
    () => ({
      user,
      token,
      products,
      vendors,
      applications,
      cashSales,
      lenders,
      users,
      activeLenderId,
      loading,
      login,
      logout,
      register,
      refreshPublic,
      refreshScoped,
      computeProfit,
      getProduct,
      getVendor,
    }),
    [
      user,
      token,
      products,
      vendors,
      applications,
      cashSales,
      lenders,
      users,
      activeLenderId,
      loading,
      login,
      logout,
      register,
      refreshPublic,
      refreshScoped,
      computeProfit,
      getProduct,
      getVendor,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
