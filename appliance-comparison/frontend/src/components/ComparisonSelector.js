import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { compareAppliances } from '../api/client';

const ComparisonSelector = ({ appliances }) => {
  const {
    setComparisonResults,
    setLoading,
    showToast,
    showDifferences,
    setShowDifferences,
    setCompareStatus,
  } = useContext(AppContext);
  const [itemA, setItemA] = useState('');
  const [itemB, setItemB] = useState('');

  useEffect(() => {
    if (appliances.length >= 2 && !itemA && !itemB) {
      setItemA(appliances[0].key);
      setItemB(appliances[1].key);
    }
  }, [appliances, itemA, itemB]);

  const handleCompare = async () => {
    if (!itemA || !itemB || itemA === itemB) {
      showToast('Please select two different appliances to compare');
      return;
    }

    setLoading(true);
    try {
      const results = await compareAppliances(itemA, itemB);
      setComparisonResults(results);
      setCompareStatus(`Compared ${results.appliance_a.name} vs ${results.appliance_b.name}`);
    } catch (error) {
      showToast('Failed to compare appliances');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="compare-selector" aria-label="Appliance comparison selector">
      <div className="selector-title">
        <i className="fas fa-arrows-left-right" /> Compare Appliances
      </div>
      <div className="vs-row">
        <div className="vs-col">
          <label htmlFor="carA">
            <i className="fas fa-plug" /> Item 1
          </label>
          <select id="carA" value={itemA} onChange={(e) => setItemA(e.target.value)}>
            <option value="">Select appliance...</option>
            {appliances.map((appliance) => (
              <option key={appliance.key} value={appliance.key}>
                {appliance.logo} {appliance.name} ({appliance.category})
              </option>
            ))}
          </select>
        </div>
        <div className="vs-divider" aria-hidden="true">
          VS
        </div>
        <div className="vs-col">
          <label htmlFor="carB">
            <i className="fas fa-plug" /> Item 2
          </label>
          <select id="carB" value={itemB} onChange={(e) => setItemB(e.target.value)}>
            <option value="">Select appliance...</option>
            {appliances.map((appliance) => (
              <option key={appliance.key} value={appliance.key}>
                {appliance.logo} {appliance.name} ({appliance.category})
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
      {compareStatus || 'Select two appliances to compare'}
    </div>
  );
}

export default ComparisonSelector;
