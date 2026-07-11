import React, { useState } from 'react';  
import { useQuery } from '@tanstack/react-query';  
import { getActivity, Activity } from '../api/activity';  
import { useAuth } from '../contexts/AuthContext';  
import { Table } from '../components/common/Table';  
import { SearchFilterBar } from '../components/common/SearchFilterBar';  
import { can } from '../utils/permissions';  
  
export const Activity: React.FC = () => {  
  const { user } = useAuth();  
  const [search, setSearch] = useState('');  
  const [eventType, setEventType] = useState('all');  
  const { data, isLoading } = useQuery({  
    queryKey: ['activity', { search, eventType }],  
    queryFn: () =>  
      getActivity({  
        search: search || undefined,  
        event_type: eventType === 'all' ? undefined : eventType,  
        limit: 200,  
      }),  
    enabled: can(user?.role, 'activity.read_all'),  
  });  
  
  const columns = [  
    { key: 'time', header: 'Time' },  
    { key: 'actor_user_id', header: 'User ID' },  
    { key: 'event', header: 'Event' },  
    { key: 'subject_type', header: 'Subject Type' },  
    { key: 'subject_id', header: 'Subject ID' },  
    { key: 'details', header: 'Details' },  
    { key: 'department', header: 'Dept' },  
  ];  
  
  if (!can(user?.role, 'activity.read_all')) {  
    return (  
      <div className="p-8 text-center text-gray-500">  
        Activity log is available for operations users only.  
      </div>  
    );  
  }  
  
  return (  
    <div>  
      <SearchFilterBar  
        search={search}  
        onSearchChange={setSearch}  
        filters={[  
          {  
            key: 'eventType',  
            label: 'Type',  
            options: ['all', 'auth', 'client', 'application', 'claim', 'document', 'product'],  
            value: eventType,  
            onChange: setEventType,  
          },  
        ]}  
      />  
      <Table columns={columns} data={data || []} loading={isLoading} />  
    </div>  
  );  
};
