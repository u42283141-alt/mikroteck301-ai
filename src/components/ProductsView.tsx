import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Sparkles,
  Tag,
  DollarSign,
  AlertCircle,
  Eye
} from 'lucide-react';
import type { Product } from '../types';

export const ProductsView: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'in_stock' | 'out_of_stock'>('all');

  // Modal create/edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Équipement Wi-Fi');
  const [priceAriary, setPriceAriary] = useState<number>(85000);
  const [description, setDescription] = useState('');
  const [inStock, setInStock] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const loadProducts = async () => {
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (err: any) {
      console.error('Erreur chargement produits:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const openCreateModal = () => {
    setEditingProduct(null);
    setName('');
    setCategory('Équipement Wi-Fi');
    setPriceAriary(100000);
    setDescription('');
    setInStock(true);
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setCategory(p.category);
    setPriceAriary(p.priceAriary);
    setDescription(p.description);
    setInStock(p.inStock);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !priceAriary) return;

    setIsSubmitting(true);
    try {
      if (editingProduct) {
        const res = await fetch(`/api/products/${encodeURIComponent(editingProduct.id)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            category: category.trim(),
            priceAriary: Number(priceAriary),
            description: description.trim(),
            inStock,
          }),
        });
        if (res.ok) {
          setNotification(`Produit "${name}" mis à jour avec succès.`);
        }
      } else {
        const res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            category: category.trim(),
            priceAriary: Number(priceAriary),
            description: description.trim(),
            inStock,
          }),
        });
        if (res.ok) {
          setNotification(`Nouveau produit "${name}" ajouté.`);
        }
      }

      setIsModalOpen(false);
      await loadProducts();
      setTimeout(() => setNotification(null), 3000);
    } catch (err: any) {
      console.error('Erreur enregistrement:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, prodName: string) => {
    if (!confirm(`Confirmez-vous la suppression de "${prodName}" ?`)) return;

    try {
      const res = await fetch(`/api/products/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setNotification(`Produit "${prodName}" supprimé.`);
        await loadProducts();
        setTimeout(() => setNotification(null), 3000);
      }
    } catch (err: any) {
      console.error('Erreur suppression:', err);
    }
  };

  const toggleStock = async (p: Product) => {
    try {
      const res = await fetch(`/api/products/${encodeURIComponent(p.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inStock: !p.inStock }),
      });
      if (res.ok) {
        await loadProducts();
      }
    } catch (err: any) {
      console.error('Erreur bascule stock:', err);
    }
  };

  const filteredProducts = products.filter((p) => {
    if (filter === 'in_stock') return p.inStock;
    if (filter === 'out_of_stock') return !p.inStock;
    return true;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#14141d] to-[#0e0e14] border border-[#22222d] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-red-600/20 text-red-400 border border-red-500/30 flex items-center justify-center">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Catalogue & Tarifs MIKROTECK 301</h2>
            <p className="text-xs text-zinc-400">
              Les prix ci-dessous sont injectés en temps réel dans le moteur Gemini. Aucun prix n'est codé en dur.
            </p>
          </div>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-lg shadow-red-950/40 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Ajouter un équipement
        </button>
      </div>

      {notification && (
        <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800/40 text-emerald-300 text-xs font-medium flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400" />
          {notification}
        </div>
      )}

      {/* Dynamic Catalog Explanation Banner */}
      <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-start gap-3 text-xs text-zinc-300">
        <Sparkles className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-white">Source Unique de Vérité pour le Bot :</span> Dès que vous modifiez un tarif ou signalez une rupture de stock, l'assistant Gemini adapte ses réponses instantanément sans qu'aucune reprogrammation ne soit nécessaire.
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
        {[
          { id: 'all', label: `Tous (${products.length})` },
          { id: 'in_stock', label: `En stock (${products.filter((p) => p.inStock).length})` },
          { id: 'out_of_stock', label: `Rupture (${products.filter((p) => !p.inStock).length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id as any)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
              filter === tab.id
                ? 'bg-red-600 text-white font-semibold'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Products Grid / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-xs text-zinc-500">
            Chargement du catalogue...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="col-span-full py-12 text-center text-xs text-zinc-500">
            Aucun produit dans cette catégorie.
          </div>
        ) : (
          filteredProducts.map((p) => (
            <div
              key={p.id}
              className="p-5 rounded-2xl bg-[#121218] border border-[#22222d] flex flex-col justify-between space-y-4 hover:border-zinc-700 transition-colors"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[11px] font-semibold text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded-md border border-zinc-700/50">
                    {p.category}
                  </span>
                  <button
                    onClick={() => toggleStock(p)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                      p.inStock
                        ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/40'
                        : 'bg-rose-950/60 text-rose-400 border-rose-800/40'
                    }`}
                  >
                    {p.inStock ? 'EN STOCK' : 'RUPTURE'}
                  </button>
                </div>

                <h3 className="text-base font-bold text-white mt-2.5">{p.name}</h3>
                <p className="text-xs text-zinc-400 line-clamp-2 mt-1 leading-relaxed">
                  {p.description}
                </p>
              </div>

              <div>
                <div className="pt-3 border-t border-zinc-800/80 flex items-baseline justify-between">
                  <span className="text-xs text-zinc-500">Prix officiel :</span>
                  <span className="text-lg font-black text-red-400 font-mono">
                    {p.priceAriary.toLocaleString('fr-FR')} Ar
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 mt-3 pt-2">
                  <button
                    onClick={() => openEditModal(p)}
                    className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
                    title="Modifier ce produit"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(p.id, p.name)}
                    className="p-1.5 rounded-lg bg-zinc-800 hover:bg-rose-950/60 text-zinc-400 hover:text-rose-400 transition-colors"
                    title="Supprimer ce produit"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit / Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-[#14141c] border border-zinc-800 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-white">
                {editingProduct ? 'Modifier l\'équipement' : 'Ajouter un nouvel équipement'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Nom du produit / Pack</label>
                <input
                  type="text"
                  required
                  placeholder="ex: Tenda AC5 AC1200"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-red-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Catégorie</label>
                  <input
                    type="text"
                    required
                    placeholder="Routeur Wi-Fi, Pont CPE..."
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-red-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Prix en Ariary (Ar)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="500"
                    placeholder="85000"
                    value={priceAriary}
                    onChange={(e) => setPriceAriary(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono text-white focus:outline-none focus:border-red-600"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Description & Portée</label>
                <textarea
                  rows={3}
                  placeholder="Détails techniques, portée en km, bandes de fréquences..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-red-600"
                />
              </div>

              <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-white">Disponible en stock</div>
                  <div className="text-[10px] text-zinc-400">Si décoché, l'IA indiquera une rupture</div>
                </div>
                <input
                  type="checkbox"
                  checked={inStock}
                  onChange={(e) => setInStock(e.target.checked)}
                  className="w-4 h-4 accent-red-600 rounded cursor-pointer"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-md disabled:opacity-50"
                >
                  {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
