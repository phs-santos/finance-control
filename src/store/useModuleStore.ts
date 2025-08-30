import { create } from "zustand";
import { ModuleConfig } from "@/types";
import { supabase } from "@/integrations/supabase/client";

interface ModuleStore {
    modules: ModuleConfig[];
    isLoading: boolean;
    error: string | null;

    // Actions
    fetchModules: () => Promise<void>;
    toggleModule: (moduleId: string) => Promise<void>;

    // Selectors
    getEnabled: () => ModuleConfig[];
}

export const useModuleStore = create<ModuleStore>((set, get) => ({
    modules: [],
    isLoading: false,
    error: null,

    fetchModules: async () => {
        set({ isLoading: true, error: null });
        try {
            const { data, error } = await supabase
                .from("module_configs")
                .select("*")
                .order("name");

            if (error) throw error;
            set({ modules: data || [], isLoading: false });
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
        }
    },

    toggleModule: async (moduleId) => {
        set({ isLoading: true, error: null });
        try {
            const { modules } = get();
            const module = modules.find((m) => m.module_id === moduleId);
            if (!module) throw new Error("Module not found");

            const { data, error } = await supabase
                .from("module_configs")
                .update({ enabled: !module.enabled })
                .eq("id", module.id)
                .select()
                .single();

            if (error) throw error;

            set({
                modules: modules.map((m) => (m.id === module.id ? data : m)),
                isLoading: false,
            });
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
        }
    },

    getEnabled: () => {
        const { modules } = get();
        return modules.filter((m) => m.enabled);
    },
}));
