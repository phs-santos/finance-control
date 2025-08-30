import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useModuleStore } from '@/store/useModuleStore';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface ModuleSettingsProps {
  onUpdate: () => void;
}

export const ModuleSettings = ({ onUpdate }: ModuleSettingsProps) => {
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const { modules, toggleModule } = useModuleStore();

  if (!isAdmin) {
    return (
      <Card className="glass-card border-glass">
        <CardContent className="pt-6">
          <p className="text-center text-glass-foreground/70">
            Apenas administradores podem gerenciar módulos.
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleToggle = async (moduleId: string) => {
    try {
      const module = modules.find(m => m.module_id === moduleId);
      const newState = !module?.enabled;
      
      await toggleModule(moduleId);
      
      toast({
        title: "Módulo atualizado",
        description: `${module?.name} foi ${newState ? 'ativado' : 'desativado'}`
      });
      
      onUpdate();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao atualizar o módulo",
        variant: "destructive"
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Módulos do Sistema</CardTitle>
        <p className="text-sm text-muted-foreground">
          Ative ou desative módulos conforme suas necessidades
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {modules.map((module) => (
          <div key={module.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium">{module.name}</h4>
                <Badge variant={module.enabled ? 'default' : 'outline'}>
                  {module.enabled ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{module.description}</p>
            </div>
            
            <Switch
              checked={module.enabled}
              onCheckedChange={() => handleToggle(module.module_id)}
              disabled={module.module_id === 'dashboard'} // Dashboard sempre ativo
            />
          </div>
        ))}
        
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium text-sm mb-2">ℹ️ Informações</h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• O Dashboard não pode ser desativado</li>
            <li>• Módulos desativados não aparecerão na navegação</li>
            <li>• As configurações são salvas automaticamente</li>
            <li>• Futuramente poderão ser controlados por plano/cliente</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};