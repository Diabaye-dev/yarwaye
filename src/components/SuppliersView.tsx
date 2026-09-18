"use client";

/* ============================================================================
 *  FICHIER : src/components/SuppliersView.tsx
 *  LANGAGE : TypeScript + JSX (React)
 *  RÔLE    : L'écran "Fournisseurs" — gestion des partenaires
 *            d'approvisionnement (coopératives, minoteries, cimenteries...).
 *
 *  Chaque carte affiche : raison sociale, interlocuteur, téléphone cliquable,
 *  email, adresse, catégories de marchandises et conditions de paiement.
 *  Création / modification via SupplierModal, suppression immédiate.
 * ==========================================================================*/

import React, { useState } from "react";
import { Supplier, StoreSettings } from "@/types";
import {
  Truck,
  Search,
  Plus,
  Phone,
  Mail,
  MapPin,
  Tag,
  Edit2,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { SupplierModal } from "./SupplierModal";

interface SuppliersViewProps {
  suppliers: Supplier[];
  settings: StoreSettings | null;
  onRefresh: () => void;
  onSupplierDeleted: (id: number) => void;
}

export function SuppliersView({ suppliers, settings, onRefresh, onSupplierDeleted }: SuppliersViewProps) {
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const filtered = suppliers.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      (s.contactPerson && s.contactPerson.toLowerCase().includes(q)) ||
      s.phone.includes(q) ||
      (s.categories && s.categories.toLowerCase().includes(q))
    );
  });

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Supprimer le fournisseur "${name}" ?`)) return;
    try {
      const res = await fetch(`/api/suppliers/${id}`, { method: "DELETE" });
      if (res.ok) {
        onSupplierDeleted(id);
      }
    } catch (e) {
      alert("Erreur de suppression");
    }
  };

  return (
    <div className="space-y-6">
      <SupplierModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingSupplier(null);
        }}
        supplier={editingSupplier}
        onSaved={() => {
          onRefresh();
          setIsModalOpen(false);
          setEditingSupplier(null);
        }}
      />

      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Truck className="w-6 h-6 text-amber-600" />
            Fournisseurs & Approvisionnement Yarwaye
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Partenaires importateurs et centrales de distribution partenaires
          </p>
        </div>

        <button
          onClick={() => {
            setEditingSupplier(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" /> Nouveau Fournisseur
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un fournisseur par nom, contact, marchandises fournies..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Grid of Suppliers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((supplier) => (
          <div
            key={supplier.id}
            className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">{supplier.name}</h3>
                  {supplier.contactPerson && (
                    <p className="text-xs text-slate-500 mt-0.5">Contact: {supplier.contactPerson}</p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setEditingSupplier(supplier);
                      setIsModalOpen(true);
                    }}
                    title="Modifier"
                    className="p-1.5 text-slate-400 hover:text-amber-600 rounded-lg hover:bg-amber-50"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(supplier.id, supplier.name)}
                    title="Supprimer"
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="mt-3 space-y-1.5 text-xs">
                <div className="flex items-center gap-2 text-slate-700">
                  <Phone className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <a href={`tel:${supplier.phone}`} className="font-mono hover:underline">
                    {supplier.phone}
                  </a>
                </div>
                {supplier.email && (
                  <div className="flex items-center gap-2 text-slate-500">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{supplier.email}</span>
                  </div>
                )}
                {supplier.address && (
                  <div className="flex items-center gap-2 text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{supplier.address}</span>
                  </div>
                )}
              </div>

              {supplier.categories && (
                <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                  <Tag className="w-3 h-3 text-slate-400" />
                  <span className="text-[11px] font-medium bg-amber-50 text-amber-800 px-2 py-0.5 rounded-md border border-amber-200/50">
                    {supplier.categories}
                  </span>
                </div>
              )}

              {supplier.notes && (
                <p className="mt-3 text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg italic">
                  "{supplier.notes}"
                </p>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
              <a
                href={`tel:${supplier.phone}`}
                className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 hover:text-amber-800"
              >
                Appeler le fournisseur <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-2xl border border-dashed border-slate-300">
            <Truck className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p className="text-sm">Aucun fournisseur trouvé.</p>
          </div>
        )}
      </div>
    </div>
  );
}
