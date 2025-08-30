import { useState } from 'react';
import { ModuleSettings } from '@/components/settings/ModuleSettings';
import { useAuth } from '@/contexts/AuthContext';

const Settings = () => {
  const { isAdmin } = useAuth();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const refreshData = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Configurações</h1>
        <div className="text-sm text-muted-foreground">
          Personalize seu aplicativo
        </div>
      </div>
      
      {isAdmin && <ModuleSettings onUpdate={refreshData} />}
    </div>
  );
};

export default Settings;