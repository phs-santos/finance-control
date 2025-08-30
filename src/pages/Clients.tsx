import ClientManagement from '@/components/user/ClientManagement';
import { useAuth } from '@/contexts/AuthContext';

const Clients = () => {
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Acesso negado</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Gerenciar Clientes</h1>
        <div className="text-sm text-muted-foreground">
          Adicione novos clientes à plataforma
        </div>
      </div>
      
      <ClientManagement />
    </div>
  );
};

export default Clients;