export const formatCurrency = (amount: number, currency: string = 'PKR') =>  
  `${currency} ${amount.toLocaleString()}`;  
  
export const formatDate = (date: string) =>  
  new Date(date).toLocaleString();  
  
export const truncate = (str: string, length: number = 50) =>  
  str.length > length ? str.slice(0, length) + '...' : str;  
  
export const getInitials = (name: string) =>  
  name.split(' ').map(n => n[0]).join('').toUpperCase();
