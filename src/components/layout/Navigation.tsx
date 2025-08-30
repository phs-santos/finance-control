import { Home, Plus, BarChart3, Settings, Tag, Target, LogOut, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useModuleStore } from "@/store/useModuleStore";
import { useAuth } from "@/contexts/AuthContext";

interface NavigationProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
    onAddTransaction: () => void;
    onAddRecurringTransaction: () => void;
}

export const Navigation = ({ activeTab, onTabChange, onAddTransaction, onAddRecurringTransaction }: NavigationProps) => {
    const { signOut, isAdmin, user } = useAuth();
    const { getEnabled } = useModuleStore();
    const enabledModules = getEnabled();

    const baseTabs = [
        { id: "dashboard", icon: Home, label: "Início" },
        { id: "transactions", icon: BarChart3, label: "Histórico" },
        { id: "categories", icon: Tag, label: "Categorias" },
        { id: "goals", icon: Target, label: "Metas" },
    ];

    // Add admin-only tabs
    const adminTabs = isAdmin ? [{ id: "clients", icon: Users, label: "Clientes" }] : [];
    const tabs = [...baseTabs, ...adminTabs, { id: "settings", icon: Settings, label: "Config" }];

    return (
        <>
            {/* Mobile Bottom Navigation */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
                <div className="flex items-center justify-around py-2 px-4">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => onTabChange(tab.id)}
                                className={`flex flex-col items-center p-2 rounded-lg transition-colors ${activeTab === tab.id
                                    ? "text-primary bg-primary/10"
                                    : "text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                <Icon className="h-5 w-5" />
                                <span className="text-xs mt-1">
                                    {tab.label}
                                </span>
                            </button>
                        );
                    })}

                    {/* Floating Add Button */}
                    <Button onClick={onAddTransaction} variant="gradient" size="icon" className="relative -top-4 rounded-full h-14 w-14 shadow-lg">
                        <Plus className="h-6 w-6" />
                    </Button>

                    <Button onClick={onAddRecurringTransaction} variant="gradient" size="icon" className="relative -top-4 rounded-full h-14 w-14 shadow-lg">
                        <Plus className="h-6 w-6" />
                    </Button>
                </div>
            </div>

            {/* Desktop Sidebar Navigation */}
            <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
                <div className="flex flex-col flex-grow pt-5 bg-card border-r border-border overflow-y-auto">
                    <div className="flex items-center flex-shrink-0 px-4">
                        <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                            Controle Financeiro
                        </h1>
                    </div>

                    <div className="px-4 mt-4">
                        <div className="glass-card p-3 border-glass">
                            <p className="text-sm text-glass-foreground font-medium">
                                {user?.email}
                            </p>
                            <p className="text-xs text-glass-foreground/70">
                                {isAdmin ? "Administrador" : "Cliente"}
                            </p>
                        </div>
                    </div>

                    <div className="mt-8 flex-grow flex flex-col">
                        <nav className="flex-1 px-2 space-y-1">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => onTabChange(tab.id)}
                                        className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full text-left transition-colors ${activeTab === tab.id
                                            ? "bg-primary text-primary-foreground"
                                            : "text-foreground hover:bg-accent hover:text-accent-foreground"
                                            }`}
                                    >
                                        <Icon className="mr-3 h-5 w-5" />
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </nav>

                        <div className="p-4 space-y-2">
                            <Button onClick={onAddTransaction} variant="gradient" className="w-full" size="lg">
                                <Plus className="mr-2 h-4 w-4" />
                                Nova Transação
                            </Button>

                            <Button onClick={onAddRecurringTransaction} variant="gradient" className="w-full" size="lg">
                                <Plus className="mr-2 h-4 w-4" />
                                Nova Transação Recorrente
                            </Button>

                            <Button onClick={signOut} variant="outline" className="w-full glass-button" size="sm">
                                <LogOut className="mr-2 h-4 w-4" />
                                Sair
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
