import { useState } from 'react';
import { CategoryManagement } from '@/components/categories/CategoryManagement';

const Categories = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const refreshData = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Gerenciar Categorias</h1>
        <div className="text-sm text-muted-foreground">
          Personalize suas categorias
        </div>
      </div>
      
      <CategoryManagement onUpdate={refreshData} />
    </div>
  );
};

export default Categories;