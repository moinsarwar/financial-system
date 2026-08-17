import React from 'react';

const Filters = ({
  activeFilter,
  setActiveFilter,
  activeSecondary,
  setActiveSecondary,
  searchTerm,
  setSearchTerm,
}) => {
  const filterPills = [
    { id: 'all', icon: 'fa-list', label: 'All' },
    { id: 'ac', icon: 'fa-snowflake', label: 'AC' },
    { id: 'cooler', icon: 'fa-fan', label: 'Cooler' },
    { id: 'cooker', icon: 'fa-fire', label: 'Cooker' },
    { id: 'fridge', icon: 'fa-snowflake', label: 'Fridge' },
    { id: 'washer', icon: 'fa-water', label: 'Washer' },
    { id: 'tv', icon: 'fa-tv', label: 'TV' },
  ];

  const secondaryFilters = [
    { id: 'new', icon: 'fa-box', label: 'New' },
    { id: 'budget', icon: 'fa-coins', label: 'Budget' },
    { id: 'premium', icon: 'fa-gem', label: 'Premium' },
    { id: 'inverter', icon: 'fa-bolt', label: 'Inverter' },
  ];

  return (
    <>
      <input
        className="search-box"
        type="text"
        placeholder="🔍 Search brand, type or model..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        aria-label="Search appliances"
      />

      <div className="filter-pills" role="tablist">
        {filterPills.map((pill) => (
          <button
            key={pill.id}
            type="button"
            className={activeFilter === pill.id ? 'active' : ''}
            data-filter={pill.id}
            role="tab"
            aria-selected={activeFilter === pill.id}
            onClick={() => setActiveFilter(pill.id)}
          >
            <i className={`fas ${pill.icon}`} /> {pill.label}
          </button>
        ))}
      </div>

      <div className="filter-pills" role="tablist">
        {secondaryFilters.map((pill) => (
          <button
            key={pill.id}
            type="button"
            className={`filter-secondary ${activeSecondary === pill.id ? 'active' : ''}`}
            data-filter={pill.id}
            role="tab"
            aria-selected={activeSecondary === pill.id}
            onClick={() => setActiveSecondary(pill.id)}
          >
            <i className={`fas ${pill.icon}`} /> {pill.label}
          </button>
        ))}
      </div>
    </>
  );
};

export default Filters;
