import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

const AffordabilityForm = () => {
  const {
    vehicles,
    vehicleKey,
    income,
    employment,
    deposit,
    consent,
    affordability,
    setIncome,
    setEmployment,
    setConsent,
    updateDeposit,
    applyVehicle,
    runAffordability,
    scrollTo,
    requestApply,
  } = useApp();
  const [busy, setBusy] = useState(false);

  const handleSubmit = async () => {
    setBusy(true);
    try {
      await runAffordability();
      document.getElementById('lfeResult')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } finally {
      setBusy(false);
    }
  };

  const shown = affordability;
  const cls = shown ? `eligibility-result show ${shown.status}` : 'eligibility-result';

  return (
    <div className="lfe-module" id="lfeModule">
      <div className="lfe-header">
        <h2>
          <i className="fas fa-file-invoice" style={{ color: '#2a7de1' }} /> Estimate affordability
        </h2>
        <span className="lfe-badge">
          <i className="fas fa-microchip" /> ILLUSTRATIVE AFFORDABILITY INDICATOR
        </span>
      </div>
      <p>
        Tell us about your situation and we&apos;ll show you an indicative affordability estimate.{' '}
        <strong>This is not lender underwriting.</strong>
      </p>

      <form
        className="lfe-form"
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        <div>
          <label htmlFor="lfeVehicle">Vehicle you&apos;re interested in</label>
          <select
            id="lfeVehicle"
            value={vehicleKey === 'fleet' ? 'car' : vehicleKey}
            onChange={(e) => applyVehicle(e.target.value)}
          >
            {vehicles
              .filter((v) => v.key !== 'fleet')
              .map((v) => (
                <option key={v.key} value={v.key}>
                  {v.label}
                </option>
              ))}
          </select>
        </div>
        <div>
          <label htmlFor="lfeIncome">Your current monthly income (PKR)</label>
          <input
            id="lfeIncome"
            type="number"
            min="0"
            step="5000"
            placeholder="e.g. 85,000"
            value={income}
            onChange={(e) => setIncome(Number(e.target.value) || 0)}
          />
        </div>
        <div>
          <label htmlFor="lfeEmployment">Employment status</label>
          <select id="lfeEmployment" value={employment} onChange={(e) => setEmployment(e.target.value)}>
            <option value="salaried">Salaried</option>
            <option value="self-employed">Self-employed</option>
            <option value="business">Business owner</option>
            <option value="freelance">Freelance</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label htmlFor="lfeDeposit">Approximate deposit you can make (PKR)</label>
          <input
            id="lfeDeposit"
            type="number"
            min="0"
            step="10000"
            placeholder="e.g. 200,000"
            value={deposit}
            onChange={(e) => updateDeposit(e.target.value)}
          />
        </div>
        <div className="full-width" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="checkbox-row">
            <input id="lfeConsent" type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
            <label htmlFor="lfeConsent">
              I understand this is an illustrative simulation, not credit approval. Final eligibility is subject to
              partner underwriting.
            </label>
          </div>
          <button type="submit" className="btn-submit" disabled={busy}>
            {busy ? 'Estimating…' : 'Estimate affordability'} <i className="fas fa-arrow-right" />
          </button>
        </div>
        <div className="full-width" style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.3rem' }}>
          <i className="fas fa-lock" style={{ color: '#2a7de1' }} /> Affordability estimates are saved on the local
          Drive to Earn API for this demo. See{' '}
          <button type="button" className="inline-link" onClick={() => scrollTo('privacySection')}>
            Privacy
          </button>{' '}
          and{' '}
          <button type="button" className="inline-link" onClick={() => scrollTo('termsSection')}>
            Key Website Terms
          </button>
          .
        </div>
      </form>

      <div className={cls} id="lfeResult">
        {shown && (
          <>
            <h4>
              {shown.status === 'validation' && 'Complete your affordability estimate'}
              {shown.status === 'indicative-fit' && '✓ Within illustrative affordability range'}
              {shown.status === 'outside-range' && 'Outside illustrative affordability range'}
            </h4>
            <p>{shown.message}</p>
            {shown.status !== 'validation' && (
              <div className="in-principle">
                <i className="fas fa-info-circle" /> This is a preliminary simulation, not credit approval. Final
                eligibility is determined by the financing partner following verification and underwriting.
              </div>
            )}
            {shown.status === 'indicative-fit' && (
              <div className="bridge-to-calc" style={{ display: 'block' }}>
                <i className="fas fa-chart-line" style={{ color: '#2a7de1' }} /> See how this vehicle could work.{' '}
                <button
                  type="button"
                  className="inline-link"
                  onClick={() => {
                    applyVehicle(shown.vehicle);
                    scrollTo('calculatorSection');
                  }}
                >
                  See economics →
                </button>
              </div>
            )}
            {shown.status === 'outside-range' && (
              <div className="pathway-suggestion" style={{ display: 'block' }}>
                <i className="fas fa-lightbulb" style={{ color: '#f1b24a' }} />{' '}
                {shown.best_alternative ? (
                  <>
                    A {shown.best_alternative.label} may be within your illustrative affordability range.{' '}
                    <button
                      type="button"
                      className="inline-link"
                      onClick={() => {
                        applyVehicle(shown.best_alternative.type);
                        scrollTo('calculatorSection');
                      }}
                    >
                      Model {shown.best_alternative.label} →
                    </button>
                  </>
                ) : (
                  'Consider building your income or deposit to access a vehicle.'
                )}
              </div>
            )}
          </>
        )}
      </div>
      {shown && shown.status !== 'validation' && (
        <div className="apply-cta-row">
          <button type="button" className="btn-submit" onClick={requestApply}>
            Apply for this vehicle
          </button>
        </div>
      )}
    </div>
  );
};

export default AffordabilityForm;
