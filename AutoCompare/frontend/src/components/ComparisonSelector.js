import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { compareVehicles } from '../api/client';

const ComparisonSelector = ({ vehicles }) => {
  const {
    setComparisonResults,
    setLoading,
    showToast,
    showDifferences,
    setShowDifferences,
    setCompareStatus,
    setSelectedVehicle,
  } = useContext(AppContext);
  const [itemA, setItemA] = useState('');
  const [itemB, setItemB] = useState('');

  useEffect(() => {
    if (vehicles.length >= 2 && !itemA && !itemB) {
      setItemA(vehicles[0].key);
      setItemB(vehicles[1].key);
      setSelectedVehicle(vehicles[0]);
    }
  }, [vehicles, itemA, itemB, setSelectedVehicle]);

  const handleCompare = async () => {
    if (!itemA || !itemB || itemA === itemB) {
      showToast('Please select two different vehicles to compare');
      setCompareStatus('⚠️ Please select two different vehicles');
      setComparisonResults(null);
      return;
    }

    setLoading(true);
    try {
      const results = await compareVehicles(itemA, itemB);
      setComparisonResults(results);
      setCompareStatus(`✅ Comparing ${results.vehicle_a.name} vs ${results.vehicle_b.name}`);
    } catch (error) {
      showToast('Failed to compare vehicles');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="compare-selector" aria-label="Vehicle comparison selector">
      <div className="selector-title">
        <i className="fas fa-arrows-left-right" /> Compare Vehicles
      </div>
      <div className="vs-row">
        <div className="vs-col">
          <label htmlFor="carA">
            <i className="fas fa-car" /> Car 1
          </label>
          <select id="carA" value={itemA} onChange={(e) => setItemA(e.target.value)}>
            <option value="">Select vehicle...</option>
            {vehicles.map((vehicle) => (
              <option key={vehicle.key} value={vehicle.key}>
                {vehicle.name} ({vehicle.category})
              </option>
            ))}
          </select>
        </div>
        <div className="vs-divider" aria-hidden="true">
          VS
        </div>
        <div className="vs-col">
          <label htmlFor="carB">
            <i className="fas fa-car" /> Car 2
          </label>
          <select id="carB" value={itemB} onChange={(e) => setItemB(e.target.value)}>
            <option value="">Select vehicle...</option>
            {vehicles.map((vehicle) => (
              <option key={vehicle.key} value={vehicle.key}>
                {vehicle.name} ({vehicle.category})
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="diff-toggle-row">
        <label htmlFor="diffToggle">
          <input
            type="checkbox"
            id="diffToggle"
            checked={showDifferences}
            onChange={(e) => setShowDifferences(e.target.checked)}
          />
          <i className="fas fa-filter" /> Show differences only
        </label>
        <span className="hint">(highlights differing rows)</span>
      </div>
      <button type="button" className="compare-btn" onClick={handleCompare}>
        <i className="fas fa-arrows-left-right" /> Compare now →
      </button>
      <CompareStatusBar />
    </section>
  );
};

function CompareStatusBar() {
  const { compareStatus } = useContext(AppContext);
  return (
    <div className="status-bar" role="status" aria-live="polite">
      {compareStatus || 'Select two vehicles to compare'}
    </div>
  );
}

export default ComparisonSelector;
