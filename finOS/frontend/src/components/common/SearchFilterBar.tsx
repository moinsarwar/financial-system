import React from 'react';  
  
interface Filter {  
  key: string;  
  label: string;  
  options: string[];  
  value: string;  
  onChange: (value: string) => void;  
}  
  
interface Props {  
  search: string;  
  onSearchChange: (value: string) => void;  
  filters?: Filter[];  
}  
  
export const SearchFilterBar: React.FC<Props> = ({ search, onSearchChange, filters }) => (  
  <div className="flex gap-2 flex-wrap items-center mb-3">  
    <input  
      className="border border-gray-200 rounded-md px-3 py-1 text-sm flex-1 min-w-[160px]"  
      placeholder="Search..."  
      value={search}  
      onChange={(e) => onSearchChange(e.target.value)}  
    />  
    {filters?.map((f) => (  
      <select  
        key={f.key}  
        className="border border-gray-200 rounded-md px-2 py-1 text-sm"  
        value={f.value}  
        onChange={(e) => f.onChange(e.target.value)}  
      >  
        {f.options.map((o) => (  
          <option key={o} value={o}>  
            {o.charAt(0).toUpperCase() + o.slice(1)}  
          </option>  
        ))}  
      </select>  
    ))}  
  </div>  
);
