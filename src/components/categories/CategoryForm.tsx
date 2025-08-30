import { useState } from "react";
import { Plus, X, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Category } from "@/types";
import { useCategoryStore } from "@/store/useCategoryStore";
import { useToast } from "@/hooks/use-toast";

interface CategoryFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    category?: Category;
}

const EMOJI_OPTIONS = [
    "💰",
    "💻",
    "📈",
    "🍽️",
    "🚗",
    "🏠",
    "🎉",
    "🏥",
    "📚",
    "🛒",
    "⚡",
    "🎵",
    "👕",
    "🏋️",
    "✈️",
    "🎬",
    "📱",
    "🔧",
    "🌟",
    "💡",
];

const COLOR_OPTIONS = [
    "#10B981",
    "#3B82F6",
    "#8B5CF6",
    "#F59E0B",
    "#EF4444",
    "#06B6D4",
    "#EC4899",
    "#84CC16",
    "#F97316",
    "#6366F1",
];

export const CategoryForm = ({
    isOpen,
    onClose,
    onSuccess,
    category,
}: CategoryFormProps) => {
    const [name, setName] = useState(category?.name || "");
    const [icon, setIcon] = useState(category?.icon || "📋");
    const [color, setColor] = useState(category?.color || "#10B981");
    const [type, setType] = useState<"income" | "expense" | "both">(
        category?.type || "expense"
    );
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { toast } = useToast();
    const { createCategory, updateCategory } = useCategoryStore();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            toast({
                title: "Erro",
                description: "Nome da categoria é obrigatório",
                variant: "destructive",
            });
            return;
        }

        setIsSubmitting(true);

        try {
            const categoryData = {
                name: name.trim(),
                icon,
                color,
                type,
            };

            if (category) {
                await updateCategory(category.id, categoryData);
                toast({
                    title: "Sucesso",
                    description: "Categoria atualizada com sucesso!",
                });
            } else {
                await createCategory(categoryData);
                toast({
                    title: "Sucesso",
                    description: "Categoria criada com sucesso!",
                });
            }

            onSuccess();
            onClose();
            resetForm();
        } catch (error) {
            toast({
                title: "Erro",
                description: "Falha ao salvar a categoria",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setName("");
        setIcon("📋");
        setColor("#10B981");
        setType("expense");
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-lg font-semibold">
                        {category ? "Editar Categoria" : "Nova Categoria"}
                    </CardTitle>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Name */}
                        <div className="space-y-2">
                            <Label htmlFor="name">Nome *</Label>
                            <Input
                                id="name"
                                placeholder="Nome da categoria"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>

                        {/* Type */}
                        <div className="space-y-2">
                            <Label>Tipo *</Label>
                            <Select
                                value={type}
                                onValueChange={(
                                    value: "income" | "expense" | "both"
                                ) => setType(value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione o tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="income">
                                        Receita
                                    </SelectItem>
                                    <SelectItem value="expense">
                                        Despesa
                                    </SelectItem>
                                    <SelectItem value="both">Ambos</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Icon Selection */}
                        <div className="space-y-2">
                            <Label>Ícone</Label>
                            <div className="flex items-center gap-2 mb-2">
                                <div
                                    className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                                    style={{
                                        backgroundColor: color + "20",
                                        color: color,
                                    }}
                                >
                                    {icon}
                                </div>
                                <span className="text-sm text-muted-foreground">
                                    Prévia
                                </span>
                            </div>
                            <div className="grid grid-cols-10 gap-1 p-2 border border-border rounded-lg max-h-24 overflow-y-auto">
                                {EMOJI_OPTIONS.map((emoji) => (
                                    <button
                                        key={emoji}
                                        type="button"
                                        onClick={() => setIcon(emoji)}
                                        className={`w-8 h-8 rounded flex items-center justify-center text-lg hover:bg-accent transition-colors ${
                                            icon === emoji
                                                ? "bg-primary text-primary-foreground"
                                                : ""
                                        }`}
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Color Selection */}
                        <div className="space-y-2">
                            <Label>Cor</Label>
                            <div className="grid grid-cols-10 gap-1 p-2 border border-border rounded-lg">
                                {COLOR_OPTIONS.map((colorOption) => (
                                    <button
                                        key={colorOption}
                                        type="button"
                                        onClick={() => setColor(colorOption)}
                                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                                            color === colorOption
                                                ? "border-foreground scale-110"
                                                : "border-border hover:scale-105"
                                        }`}
                                        style={{ backgroundColor: colorOption }}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClose}
                                className="flex-1"
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                variant="gradient"
                                disabled={isSubmitting}
                                className="flex-1"
                            >
                                {isSubmitting
                                    ? "Salvando..."
                                    : category
                                    ? "Atualizar"
                                    : "Criar"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};
