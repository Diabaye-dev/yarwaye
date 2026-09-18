"use client";

/* ============================================================================
 *  FICHIER : src/components/UserSwitchModal.tsx
 *  LANGAGE : TypeScript + JSX (React)
 *  RÔLE    : Modale de GESTION DE SESSION (changer d'utilisateur).
 *            Deux onglets :
 *              - "Changer de compte"  → liste du personnel (propriétaire,
 *                gérante, caissier) avec changement instantané via loginAs()
 *              - "Nouveau membre"     → inscription d'un employé (registerUser)
 *            Utilise le contexte d'authentification (useAuth).
 * ==========================================================================*/

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { X, UserCheck, Shield, PlusCircle, Check } from "lucide-react";

interface UserSwitchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UserSwitchModal({ isOpen, onClose }: UserSwitchModalProps) {
  const { user, usersList, loginAs, registerUser } = useAuth();
  const [tab, setTab] = useState<"switch" | "register">("switch");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "cashier",
    phone: "767866536",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [msg, setMsg] = useState("");

  if (!isOpen) return null;

  const handleSelect = async (userId: number) => {
    await loginAs(userId);
    onClose();
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMsg("");
    const ok = await registerUser(formData);
    setIsSubmitting(false);
    if (ok) {
      setMsg("Utilisateur créé avec succès !");
      setTimeout(() => {
        onClose();
      }, 700);
    } else {
      setMsg("Erreur lors de la création.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-400" />
            <h2 className="font-bold text-base">Session & Utilisateurs Yarwaye</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50">
          <button
            onClick={() => setTab("switch")}
            className={`flex-1 py-3 text-xs font-semibold text-center transition-colors border-b-2 ${
              tab === "switch"
                ? "border-emerald-600 text-emerald-700 bg-white"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Changer de compte ({usersList.length})
          </button>
          <button
            onClick={() => setTab("register")}
            className={`flex-1 py-3 text-xs font-semibold text-center transition-colors border-b-2 ${
              tab === "register"
                ? "border-emerald-600 text-emerald-700 bg-white"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            + Nouveau membre
          </button>
        </div>

        <div className="p-6">
          {tab === "switch" ? (
            <div className="space-y-3">
              <p className="text-xs text-slate-500 mb-2">
                Sélectionnez un profil pour tester les autorisations et sessions :
              </p>
              {usersList.map((u) => {
                const isCurrent = user?.id === u.id;
                return (
                  <button
                    key={u.id}
                    onClick={() => handleSelect(u.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                      isCurrent
                        ? "border-emerald-600 bg-emerald-50/70 shadow-xs"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center font-bold text-slate-700 text-sm">
                        {u.avatar ? (
                          <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" />
                        ) : (
                          u.name.charAt(0)
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-slate-900 flex items-center gap-2">
                          {u.name}
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                              u.role === "owner"
                                ? "bg-amber-100 text-amber-800 border border-amber-200"
                                : u.role === "manager"
                                ? "bg-blue-100 text-blue-800 border border-blue-200"
                                : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            }`}
                          >
                            {u.role === "owner" ? "Propriétaire Yarwaye" : u.role === "manager" ? "Gérant" : "Caissier"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">{u.email} • Tél: {u.phone || "767866536"}</p>
                      </div>
                    </div>
                    {isCurrent && (
                      <span className="p-1.5 rounded-full bg-emerald-600 text-white">
                        <Check className="w-4 h-4" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3">
              {msg && <p className="text-xs p-2 rounded bg-emerald-50 text-emerald-700">{msg}</p>}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nom complet</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Babacar Diop"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="babacar@yarwaye.com"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Rôle</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-white"
                  >
                    <option value="cashier">Caissier</option>
                    <option value="manager">Gestionnaire</option>
                    <option value="owner">Propriétaire</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Téléphone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="767866536"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs transition-colors shadow-sm"
                >
                  {isSubmitting ? "Création..." : "Ajouter au personnel"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
