import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { UserPlus } from 'lucide-react';

const ClientManagement = () => {
  const { createClient } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateClient = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const fullName = formData.get('fullName') as string;
    
    const { error } = await createClient(email, password, fullName);
    
    if (!error) {
      // Reset form
      e.currentTarget.reset();
    }
    
    setIsSubmitting(false);
  };

  return (
    <Card className="glass-card border-glass">
      <CardHeader>
        <div className="flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-glass-accent" />
          <CardTitle className="text-glass-foreground">
            Gerenciar Clientes
          </CardTitle>
        </div>
        <CardDescription className="text-glass-foreground/70">
          Crie novos clientes que podem acessar a plataforma
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleCreateClient} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="client-name" className="text-glass-foreground">
              Nome Completo
            </Label>
            <Input
              id="client-name"
              name="fullName"
              type="text"
              placeholder="Nome do cliente"
              required
              className="glass-input"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="client-email" className="text-glass-foreground">
              Email
            </Label>
            <Input
              id="client-email"
              name="email"
              type="email"
              placeholder="email@cliente.com"
              required
              className="glass-input"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="client-password" className="text-glass-foreground">
              Senha Temporária
            </Label>
            <Input
              id="client-password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              minLength={6}
              className="glass-input"
            />
          </div>
          <Button 
            type="submit" 
            className="w-full glass-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Criando...' : 'Criar Cliente'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ClientManagement;