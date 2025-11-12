
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Trash2, Edit, Plus, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Category {
  id: number;
  name: string;
  color: string;
  description?: string;
}

interface CategoryManagementProps {
  categories: Category[];
  onCategoriesChange: (categories: Category[]) => void;
  selectedCategory?: string;
  onCategorySelect: (category: string) => void;
}

export function CategoryManagement({ 
  categories, 
  onCategoriesChange, 
  selectedCategory, 
  onCategorySelect 
}: CategoryManagementProps) {
  const { toast } = useToast();
  const [showManagement, setShowManagement] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCategory, setNewCategory] = useState<Omit<Category, 'id'>>({
    name: '',
    color: '#3b82f6',
    description: ''
  });

  const handleAddCategory = () => {
    if (!newCategory.name.trim()) {
      toast({ title: "Category name is required", variant: "destructive" });
      return;
    }

    const categoryWithId = {
      ...newCategory,
      id: Date.now() // Simple ID generation
    };

    const updatedCategories = [...categories, categoryWithId];
    onCategoriesChange(updatedCategories);
    setNewCategory({ name: '', color: '#3b82f6', description: '' });
    setShowAddCategory(false);
    toast({ title: "Category added successfully" });
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setNewCategory({
      name: category.name,
      color: category.color,
      description: category.description || ''
    });
    setShowAddCategory(true);
  };

  const handleUpdateCategory = () => {
    if (!editingCategory || !newCategory.name.trim()) {
      toast({ title: "Category name is required", variant: "destructive" });
      return;
    }

    const updatedCategories = categories.map(cat =>
      cat.id === editingCategory.id
        ? { ...cat, ...newCategory }
        : cat
    );

    onCategoriesChange(updatedCategories);
    setEditingCategory(null);
    setNewCategory({ name: '', color: '#3b82f6', description: '' });
    setShowAddCategory(false);
    toast({ title: "Category updated successfully" });
  };

  const handleDeleteCategory = (id: number) => {
    const updatedCategories = categories.filter(cat => cat.id !== id);
    onCategoriesChange(updatedCategories);
    toast({ title: "Category deleted successfully" });
  };

  const resetForm = () => {
    setNewCategory({ name: '', color: '#3b82f6', description: '' });
    setEditingCategory(null);
    setShowAddCategory(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Category</Label>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowManagement(!showManagement)}
        >
          <Settings className="h-4 w-4 mr-1" />
          Manage Categories
        </Button>
      </div>

      {/* Category Selection */}
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => onCategorySelect(category.name)}
              className={`text-xs px-3 py-1 rounded border flex items-center gap-2 transition-colors ${
                selectedCategory === category.name
                  ? 'ring-2 ring-blue-500 bg-blue-50'
                  : 'hover:bg-gray-50'
              }`}
              style={{ borderColor: category.color + '40' }}
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: category.color }}
              />
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Category Management Panel */}
      {showManagement && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Custom Categories</h4>
                <Button 
                  onClick={() => setShowAddCategory(true)} 
                  size="sm" 
                  variant="outline"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Category
                </Button>
              </div>

              {/* Existing Categories */}
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {categories.map((category) => (
                  <div key={category.id} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: category.color }}
                      />
                      <div>
                        <span className="text-sm font-medium">{category.name}</span>
                        {category.description && (
                          <p className="text-xs text-muted-foreground">{category.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditCategory(category)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteCategory(category.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add/Edit Category Form */}
              {showAddCategory && (
                <div className="space-y-3 border-t pt-3">
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Category name"
                      value={newCategory.name}
                      onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                    />
                    <div className="flex items-center gap-1">
                      <Input
                        type="color"
                        value={newCategory.color}
                        onChange={(e) => setNewCategory(prev => ({ ...prev, color: e.target.value }))}
                        className="w-12 h-8"
                      />
                      <Input
                        value={newCategory.color}
                        onChange={(e) => setNewCategory(prev => ({ ...prev, color: e.target.value }))}
                        className="font-mono text-xs"
                      />
                    </div>
                  </div>
                  <Input
                    placeholder="Description (optional)"
                    value={newCategory.description}
                    onChange={(e) => setNewCategory(prev => ({ ...prev, description: e.target.value }))}
                  />
                  <div className="flex gap-1">
                    {['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'].map((color) => (
                      <button
                        key={color}
                        type="button"
                        className="w-5 h-5 rounded border hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                        onClick={() => setNewCategory(prev => ({ ...prev, color }))}
                      />
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={editingCategory ? handleUpdateCategory : handleAddCategory} 
                      size="sm"
                    >
                      {editingCategory ? 'Update' : 'Add'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={resetForm}
                      size="sm"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
