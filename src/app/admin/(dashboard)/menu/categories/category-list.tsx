/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useTransition, useState } from "react";
import { MenuCategory } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCategory, updateCategory, toggleCategoryStatus, deleteCategory } from "./actions";
import { Pencil, Trash2, Plus, AlertTriangle } from "lucide-react";

type CategoryListProps = {
  categories: any[];
};

export function CategoryList({ categories }: CategoryListProps) {
  const [isPending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState<MenuCategory | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleCreate(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await createCategory(formData);
      if (res.error) setError(res.error);
      else setIsAdding(false);
    });
  }

  function handleUpdate(formData: FormData) {
    if (!isEditing) return;
    setError(null);
    startTransition(async () => {
      const res = await updateCategory(isEditing.id, formData);
      if (res.error) setError(res.error);
      else setIsEditing(null);
    });
  }

  function handleToggle(id: string, currentStatus: boolean) {
    startTransition(async () => {
      await toggleCategoryStatus(id, currentStatus);
    });
  }

  function handleDelete(id: string, itemCount: number) {
    if (itemCount > 0) {
      alert("Cannot delete category containing menu items.");
      return;
    }
    if (confirm("Are you sure you want to delete this category?")) {
      startTransition(async () => {
        const res = await deleteCategory(id);
        if (res.error) alert(res.error);
      });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Categories</h2>
          <p className="text-muted-foreground text-sm">Manage your menu categories.</p>
        </div>
        <Button onClick={() => { setIsAdding(true); setIsEditing(null); setError(null); }} disabled={isAdding}>
          <Plus className="mr-2 h-4 w-4" /> Add Category
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-md text-sm flex items-center">
          <AlertTriangle className="h-4 w-4 mr-2" /> {error}
        </div>
      )}

      {(isAdding || isEditing) && (
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h3 className="font-semibold mb-4">{isEditing ? "Edit Category" : "New Category"}</h3>
          <form action={isEditing ? handleUpdate : handleCreate} className="space-y-4 max-w-md">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" defaultValue={isEditing?.name || ""} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input id="description" name="description" defaultValue={isEditing?.description || ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="displayOrder">Display Order</Label>
              <Input id="displayOrder" name="displayOrder" type="number" defaultValue={isEditing?.displayOrder || 0} required />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="isActive" name="isActive" value="true" defaultChecked={isEditing ? isEditing.isActive : true} className="w-4 h-4 rounded border-gray-300 text-primary" />
              <Label htmlFor="isActive">Active</Label>
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={isPending}>{isPending ? "Saving..." : "Save Category"}</Button>
              <Button type="button" variant="outline" onClick={() => { setIsAdding(false); setIsEditing(null); }} disabled={isPending}>Cancel</Button>
            </div>
          </form>
        </div>
      )}

      {!isAdding && !isEditing && categories.length === 0 && (
        <div className="text-center p-12 border rounded-xl bg-white">
          <p className="text-muted-foreground mb-4">No categories yet.</p>
          <Button onClick={() => setIsAdding(true)}>Create your first category</Button>
        </div>
      )}

      {categories.length > 0 && !isAdding && !isEditing && (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b text-gray-500 font-medium">
              <tr>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Items</th>
                <th className="px-6 py-4">Order</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {categories.map(cat => (
                <tr key={cat.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4 font-medium">{cat.name}</td>
                  <td className="px-6 py-4">{cat._count.items}</td>
                  <td className="px-6 py-4">{cat.displayOrder}</td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => handleToggle(cat.id, cat.isActive)}
                      disabled={isPending}
                      className={`px-2.5 py-1 text-xs font-medium rounded-full ${cat.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}
                    >
                      {cat.isActive ? "Active" : "Hidden"}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => setIsEditing(cat)} disabled={isPending}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(cat.id, cat._count.items)} disabled={isPending}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
