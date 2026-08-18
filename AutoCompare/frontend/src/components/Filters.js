import React from 'react';

const Filters = ({
  originFilter,
  setOriginFilter,
  secondaryFilter,
  setSecondaryFilter,
  searchTerm,
  setSearchTerm,
}) => {
  const originPills = [
    { id: 'all', icon: 'fa-list', label: 'All' },
    { id: 'assembled', icon: 'fa-industry', label: 'Assembled PK' },
    { id: 'imported', icon: 'fa-ship', label: 'Imported' },
    { id: 'chinese', icon: 'fa-dragon', label: 'Chinese Brands' },
  ];

  const secondaryPills = [
    { id: 'new', icon: 'fa-car-side', label: 'New' },
    { id: 'used', icon: 'fa-undo-alt', label: 'Used' },
    { id: 'petrol', icon: 'fa-gas-pump', label: 'Petrol' },
    { id: 'diesel', icon: 'fa-oil-can', label: 'Diesel' },
    { id: 'ev', icon: 'fa-bolt', label: 'EV' },
  ];

  return (
    <>
      <input
        className="search-box"
        type="text"
        placeholder="🔍 Search make, model or variant..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        aria-label="Search vehicles"
      />

      <div className="filter-pills" role="tablist">
        {originPills.map((pill) => (
          <button
            key={pill.id}
            type="button"
            className={originFilter === pill.id ? 'active' : ''}
            role="tab"
            aria-selected={originFilter === pill.id}
            onClick={() => setOriginFilter(pill.id)}
          >
            <i className={`fas ${pill.icon}`} /> {pill.label}
          </button>
        ))}
      </div>

      <div className="filter-pills" role="tablist">
        {secondaryPills.map((pill) => (
          <button
            key={pill.id}
            type="button"
            className={`filter-secondary ${secondaryFilter === pill.id ? 'active' : ''}`}
            role="tab"
            aria-selected={secondaryFilter === pill.id}
            onClick={() => setSecondaryFilter(pill.id)}
          >
            <i className={`fas ${pill.icon}`} /> {pill.label}
          </button>
        ))}
      </div>
    </>
  );
};

export default Filters;
