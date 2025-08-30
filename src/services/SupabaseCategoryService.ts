import { Category } from '@/types';
import { supabase } from '@/integrations/supabase/client';

class SupabaseCategoryService {
	async getAll(): Promise<Category[]> {
		const { data, error } = await supabase
			.from('categories' as any)
			.select('*')
			.order('name');

		if (error) {
			console.error('Error fetching categories:', error);
			throw error;
		}

		return (data as unknown as Category[]) || [];
	}

	async getById(id: string): Promise<Category | null> {
		const { data, error } = await supabase
			.from('categories' as any)
			.select('*')
			.eq('id', id)
			.single();

		if (error) {
			console.error('Error fetching category:', error);
			return null;
		}

		return data as unknown as Category;
	}

	async getByType(type: 'income' | 'expense'): Promise<Category[]> {
		const { data, error } = await supabase
			.from('categories' as any)
			.select('*')
			.in('type', [type, 'both'])
			.order('name');

		if (error) {
			console.error('Error fetching categories by type:', error);
			throw error;
		}

		return (data as unknown as Category[]) || [];
	}

	async create(category: Omit<Category, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Category> {
		const { data: { user } } = await supabase.auth.getUser();

		if (!user) {
			throw new Error('User not authenticated');
		}

		const { data, error } = await supabase
			.from('categories' as any)
			.insert([{
				...category,
				user_id: user.id
			}])
			.select()
			.single();

		if (error) {
			console.error('Error creating category:', error);
			throw error;
		}

		return data as unknown as Category;
	}

	async update(id: string, updates: Partial<Category>): Promise<Category | null> {
		const { data, error } = await supabase
			.from('categories' as any)
			.update(updates)
			.eq('id', id)
			.select()
			.single();

		if (error) {
			console.error('Error updating category:', error);
			throw error;
		}

		return data as unknown as Category;
	}

	async delete(id: string): Promise<boolean> {
		const { error } = await supabase
			.from('categories' as any)
			.delete()
			.eq('id', id);

		if (error) {
			console.error('Error deleting category:', error);
			throw error;
		}

		return true;
	}
}

export const supabaseCategoryService = new SupabaseCategoryService();