import { useState } from 'react';
import { GoalList } from '@/components/goals/GoalList';
import { GoalSummary } from '@/components/goals/GoalSummary';

const Goals = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const refreshData = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Metas Financeiras</h1>
        <div className="text-sm text-muted-foreground">
          Defina e acompanhe seus objetivos
        </div>
      </div>
      
      <GoalSummary />
      <GoalList onUpdate={refreshData} />
    </div>
  );
};

export default Goals;