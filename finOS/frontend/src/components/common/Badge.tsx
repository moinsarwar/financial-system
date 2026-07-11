import React from 'react';  
import clsx from 'clsx';  
  
const badgeMap: Record<string, string> = {  
  lead: 'badge-lead',  
  applicant: 'badge-applicant',  
  customer: 'badge-customer',  
  'in-progress': 'badge-in-progress',  
  approved: 'badge-approved',  
  rejected: 'badge-rejected',  
  active: 'badge-active',  
  expired: 'badge-expired',  
  closed: 'badge-closed',  
  pending: 'badge-pending',  
  verified: 'badge-verified',  
  paid: 'badge-paid',  
  partial: 'badge-partial',  
  fraud: 'badge-fraud',  
  declined: 'badge-declined',  
  completed: 'badge-completed',  
  gold: 'badge-gold',  
};  
  
export const Badge: React.FC<{ type?: string; children: React.ReactNode }> = ({  
  type = 'in-progress',  
  children,  
}) => {  
  return <span className={clsx('badge', badgeMap[type] || 'badge-in-progress')}>{children}</span>;  
};
