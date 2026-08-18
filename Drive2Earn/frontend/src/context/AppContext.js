import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createApplication, estimateAffordability, getAssumptions, getVehicles } from '../api/client';
import { clampDeposit, getEffectiveVehicle } from '../utils/model';
import { popPendingAction, savePendingAction } from '../utils/pendingAction';
import { useAuth } from './AuthContext';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [vehicles, setVehicles] = useState([]);
  const [assumptions, setAssumptions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [vehicleKey, setVehicleKey] = useState('car');
  const [price, setPrice] = useState(1800000);
  const [deposit, setDeposit] = useState(0);
  const [income, setIncome] = useState(75000);
  const [employment, setEmployment] = useState('salaried');
  const [consent, setConsent] = useState(false);
  const [affordability, setAffordability] = useState(null);
  const [mode, setMode] = useState('drive');
  const [scenario, setScenario] = useState('expected');
  const [days, setDays] = useState(25);
  const [daily, setDaily] = useState(7400);
  const [fuelPct, setFuelPct] = useState(11.5);
  const [fleetSize, setFleetSize] = useState(1);
  const [rental, setRental] = useState(4500);
  const [rentalDays, setRentalDays] = useState(25);
  const [management, setManagement] = useState(12000);
  const [payoutPct, setPayoutPct] = useState(70);
  const [applyOpen, setApplyOpen] = useState(false);
  const [toast, setToast] = useState('');

  const selected = useMemo(
    () => vehicles.find((v) => v.key === vehicleKey) || vehicles.find((v) => v.key === 'car'),
    [vehicles, vehicleKey],
  );
  const effective = useMemo(
    () => getEffectiveVehicle(vehicles, vehicleKey, assumptions),
    [vehicles, vehicleKey, assumptions],
  );

  const showToast = useCallback((message) => {
    setToast(message);
    setTimeout(() => setToast(''), 4000);
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [v, a] = await Promise.all([getVehicles(), getAssumptions()]);
        setVehicles(v);
        setAssumptions(a);
        const car = v.find((row) => row.key === 'car');
        if (car) {
          setPrice(car.price);
          setDaily(car.default_daily_earning);
          setFuelPct(car.default_fuel_pct);
          setRental(car.default_rental);
        }
      } catch (err) {
        console.error(err);
        setError('Could not load Drive to Earn data. Check that the API is running on port 9018.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const applyVehicle = useCallback(
    (key) => {
      const config = vehicles.find((v) => v.key === key);
      if (!config) return;
      const nextPrice = config.price;
      setVehicleKey(key);
      setPrice(nextPrice);
      setDeposit((prev) => clampDeposit(prev, nextPrice));
      setDaily(config.default_daily_earning);
      setFuelPct(config.default_fuel_pct);
      setRental(config.default_rental);
      if (key === 'fleet') setMode('fleet');
      else setMode('drive');
    },
    [vehicles],
  );

  const updatePrice = useCallback((next) => {
    const val = Number(next) || 0;
    setPrice(val);
    setDeposit((prev) => clampDeposit(prev, val));
  }, []);

  const updateDeposit = useCallback(
    (next) => {
      setDeposit(clampDeposit(Number(next) || 0, price));
    },
    [price],
  );

  const runAffordability = useCallback(async () => {
    const result = await estimateAffordability({
      vehicle_key: vehicleKey === 'fleet' ? 'car' : vehicleKey,
      income,
      employment,
      deposit,
      consent,
      vehicle_price: price,
    });
    setAffordability(result);
    if (result.deposit != null) setDeposit(result.deposit);
    return result;
  }, [vehicleKey, income, employment, deposit, consent, price]);

  const requestApply = useCallback(() => {
    if (!selected) {
      showToast('Select a vehicle first');
      return;
    }
    if (!user) {
      savePendingAction({ type: 'apply', vehicleKey, pathway: mode });
      showToast('Sign in or register to apply for this vehicle');
      navigate('/login?reason=apply&next=/');
      return;
    }
    setApplyOpen(true);
  }, [selected, user, vehicleKey, mode, navigate, showToast]);

  const submitApplication = useCallback(
    async (form) => {
      const row = await createApplication({
        pathway: mode === 'fleet' ? 'fleet' : 'drive',
        vehicle_key: vehicleKey,
        vehicle_price: price,
        deposit,
        customer_name: form.name,
        phone: form.phone,
        email: form.email,
        city: form.city,
        income,
        employment,
        notes: form.notes,
      });
      setApplyOpen(false);
      showToast('Application submitted. Track it from your dashboard.');
      return row;
    },
    [mode, vehicleKey, price, deposit, income, employment, showToast],
  );

  useEffect(() => {
    if (!user || location.pathname !== '/') return;
    const pending = popPendingAction();
    if (pending?.type === 'apply') {
      if (pending.vehicleKey) applyVehicle(pending.vehicleKey);
      if (pending.pathway) setMode(pending.pathway);
      setApplyOpen(true);
    }
  }, [user, location.pathname, applyVehicle]);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const value = {
    vehicles,
    assumptions,
    loading,
    error,
    vehicleKey,
    selected,
    effective,
    price,
    deposit,
    income,
    employment,
    consent,
    affordability,
    setAffordability,
    mode,
    setMode,
    scenario,
    setScenario,
    days,
    setDays,
    daily,
    setDaily,
    fuelPct,
    setFuelPct,
    fleetSize,
    setFleetSize,
    rental,
    setRental,
    rentalDays,
    setRentalDays,
    management,
    setManagement,
    payoutPct,
    setPayoutPct,
    applyVehicle,
    updatePrice,
    updateDeposit,
    setIncome,
    setEmployment,
    setConsent,
    runAffordability,
    scrollTo,
    applyOpen,
    setApplyOpen,
    requestApply,
    submitApplication,
    toast,
    showToast,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => useContext(AppContext);
