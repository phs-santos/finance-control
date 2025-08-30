import { useState } from "react";
import { Plus, Edit, Trash2, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CategoryForm } from "./CategoryForm";
import { Category } from "@/types";
import { useCategoryStore } from "@/store/useCategoryStore";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

interface CategoryManagementProps {
    onUpdate: () => void;
}

export const CategoryManagement = ({ onUpdate }: CategoryManagementProps) => {
    const [showForm, setShowForm] = useState(false);
    const [editingCategory, setEditingCategory] = useState<
        Category | undefined
    >();

    const { toast } = useToast();
    const { categories, fetchCategories, deleteCategory, isLoading } = useCategoryStore();

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    const handleAddCategory = () => {
        setEditingCategory(undefined);
        setShowForm(true);
    };

    const handleEditCategory = (category: Category) => {
        setEditingCategory(category);
        setShowForm(true);
    };

    const handleDeleteCategory = async (category: Category) => {
        if (
            window.confirm(
                `Tem certeza que deseja excluir a categoria "${category.name}"?`
            )
        ) {
            try {
                await deleteCategory(category.id);
                toast({
                    title: "Sucesso",
                    description: "Categoria excluída com sucesso!",
                });
                onUpdate();
            } catch (error) {
                toast({
                    title: "Erro",
                    description: "Falha ao excluir a categoria",
                    variant: "destructive",
                });
            }
        }
    };

    const refreshData = () => {
        onUpdate();
    };

    const getTypeLabel = (type: Category["type"]) => {
        switch (type) {
            case "income":
                return "Receita";
            case "expense":
                return "Despesa";
            case "both":
                return "Ambos";
            default:
                return type;
        }
    };

    const getTypeVariant = (type: Category["type"]) => {
        switch (type) {
            case "income":
                return "default";
            case "expense":
                return "destructive";
            case "both":
                return "secondary";
            default:
                return "outline";
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold">
                        Gerenciar Categorias
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        {categories.length} categorias criadas
                    </p>
                </div>
                <Button onClick={handleAddCategory} variant="gradient">
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Categoria
                </Button>
            </div>

            {categories.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-8">
                        <Tag className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">
                            Nenhuma categoria encontrada
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Crie sua primeira categoria personalizada
                        </p>
                        <Button onClick={handleAddCategory} variant="outline">
                            <Plus className="h-4 w-4 mr-2" />
                            Criar Categoria
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categories.map((category) => (
                        <Card
                            key={category.id}
                            className="hover:shadow-md transition-shadow"
                        >
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                                            style={{
                                                backgroundColor:
                                                    category.color + "20",
                                                color: category.color,
                                            }}
                                        >
                                            {category.icon}
                                        </div>
                                        <div>
                                            <h4 className="font-medium">
                                                {category.name}
                                            </h4>
                                            <Badge
                                                variant={getTypeVariant(
                                                    category.type
                                                )}
                                                className="text-xs"
                                            >
                                                {getTypeLabel(category.type)}
                                            </Badge>
                                        </div>
                                    </div>

                                    <div className="flex gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() =>
                                                handleEditCategory(category)
                                            }
                                        >
                                            <Edit className="h-3 w-3" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-destructive hover:text-destructive"
                                            onClick={() =>
                                                handleDeleteCategory(category)
                                            }
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <div
                                        className="w-3 h-3 rounded-full"
                                        style={{
                                            backgroundColor: category.color,
                                        }}
                                    />
                                    {category.color.toUpperCase()}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <CategoryForm
                isOpen={showForm}
                onClose={() => setShowForm(false)}
                onSuccess={refreshData}
                category={editingCategory}
            />
        </div>
    );
};
