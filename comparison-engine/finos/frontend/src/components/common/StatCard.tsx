import React from 'react';  
  
export const StatCard: React.FC<{ label: string; value: number }> = ({ label, value }) => (  
  <div className="bg-gray-50 border border-gray-200 rounded-md p-3">  
    <div className="text-xs text-gray-400 uppercase font-semibold">{label}</div>  
    <div className="text-2xl font-extrabold">{value}</div>  
  </div>  
);
