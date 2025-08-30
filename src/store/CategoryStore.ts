import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Category } from "@/types";

type CategoryStoreState = {
    categories: Category[];
    setCategories: (categories: Category[]) => void;
    addCategory: (category: Category) => void;
    updateCategory: (category: Category) => void;
    removeCategory: (id: string) => void;
};

export const useCategoryStore = create<CategoryStoreState>()(
    persist(
        (set) => ({
            categories: [],
            setCategories: (categories) => set({ categories }),
            addCategory: (category) =>
                set((state) => ({
                    categories: [...state.categories, category],
                })),
            updateCategory: (category) =>
                set((state) => ({
                    categories: state.categories.map((c) =>
                        c.id === category.id ? category : c
                    ),
                })),
            removeCategory: (id) =>
                set((state) => ({
                    categories: state.categories.filter((c) => c.id !== id),
                })),
        }),
        {
            name: "categories-storage", // chave no localStorage
        }
    )
);
