"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { fetchCategories, createCategory, deleteCategory } from "@/lib/api";
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newCat, setNewCat] = useState({ name: "", color: "#4F46E5", icon: "Sparkles" });

  const loadCategories = async () => {
    try {
      const data = await fetchCategories();
      setCategories(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createCategory(newCat);
      setIsAddOpen(false);
      setNewCat({ name: "", color: "#4F46E5", icon: "Sparkles" });
      loadCategories();
    } catch (err) {
      console.error("Failed to add category:", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;
    try {
      await deleteCategory(id);
      loadCategories();
    } catch (err) {
      console.error("Failed to delete category:", err);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Category Master</h1>
          <p className="text-zinc-500 mt-2">Manage service categories dynamically</p>
        </div>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger render={<Button className="bg-zinc-900 text-white hover:bg-zinc-800"><Plus className="h-4 w-4 mr-2" /> Add Category</Button>} />
          <DialogContent className="sm:max-w-[425px] p-6 bg-white rounded-xl shadow-xl border border-zinc-100">
            <DialogTitle className="text-xl font-semibold text-zinc-900">Add New Category</DialogTitle>
            <DialogDescription className="text-zinc-500 mt-1 mb-4">
              Create a new category for your services.
            </DialogDescription>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">Name</label>
                <input
                  type="text"
                  required
                  value={newCat.name}
                  onChange={(e) => setNewCat({ ...newCat, name: e.target.value })}
                  className="w-full p-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  placeholder="e.g. Laser Treatment"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={newCat.color}
                    onChange={(e) => setNewCat({ ...newCat, color: e.target.value })}
                    className="w-10 h-10 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={newCat.color}
                    onChange={(e) => setNewCat({ ...newCat, color: e.target.value })}
                    className="flex-1 p-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  />
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <DialogClose render={<Button type="button" variant="outline">Cancel</Button>} />
                <Button type="submit" className="bg-zinc-900 text-white hover:bg-zinc-800">Save Category</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-12 text-zinc-500">Loading categories...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <div key={cat.id} className="p-6 bg-white border border-zinc-100 rounded-xl shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${cat.color}20`, color: cat.color }}>
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: cat.color }} />
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-900">{cat.name}</h3>
                  <p className="text-sm text-zinc-500">Category</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => handleDelete(cat.id)} className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {categories.length === 0 && (
            <div className="col-span-full text-center py-12 text-zinc-500 bg-zinc-50 rounded-xl border border-dashed border-zinc-200">
              No categories found. Add your first one above.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
