"use client";
/**
 * VUE "Paramètres boutique" — src/components/SettingsView.tsx
 * 
 * Formulaire de configuration enregistré dans la table store_settings :
 * identité et adresse de l'établissement, numéro officiel 767866536,
 * comptes Wave / Orange Money, devise, mentions du ticket de caisse,
 * plus un bouton de réinitialisation des données de démonstration.
 */
import React, { useState } from "react";
import { StoreSettings } from "@/types";
import { Settings, Save, RefreshCw, CheckCircle, Phone, Smartphone, MapPin, Receipt, ShieldCheck } from "lucide-react";

interface SettingsViewProps {
  settings: StoreSettings | null;
  onRefresh: () => void;
}

export function SettingsView({ settings, onRefresh }: SettingsViewProps) {
  const [formData, setFormData] = useState({
    storeName: settings?.storeName || "AGRO SERVICE YARWAYE",
    phone: settings?.phone || "767866536",
    whatsapp: settings?.whatsapp || "767866536",
    email: settings?.email || "contact@yarwaye.sn",
    address: settings?.address || "Malika Qrt Malika / Mer - BP 17000 - Keur Massar, Dakar, Sénégal",
    currency: settings?.currency || "FCFA",
    taxRate: settings?.taxRate || 0,
    receiptHeader: settings?.receiptHeader || "AGRO SERVICE YARWAYE",
    receiptFooter:
      settings?.receiptFooter ||
      "Agriculture • Transformation • Commerce • BTP • Pâtisserie • Restauration. Assistance Wave/OM: 767866536. Merci de votre confiance !",
    waveNumber: settings?.waveNumber || "767866536",
    orangeMoneyNumber: settings?.orangeMoneyNumber || "767866536",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMsg(null);

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setMsg("Paramètres de la boutique enregistrés !");
        onRefresh();
        setTimeout(() => setMsg(null), 3000);
      }
    } catch (e) {
      alert("Erreur de sauvegarde");
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDemoData = async () => {
    if (!confirm("Voulez-vous réinitialiser toutes les données avec le jeu de données d'origine Yarwaye ?")) {
      return;
    }

    setIsResetting(true);
    try {
      const res = await fetch("/api/seed", { method: "POST" });
      if (res.ok) {
        alert("Données réinitialisées avec succès ! La page va se recharger.");
        window.location.reload();
      }
    } catch (e) {
      alert("Erreur lors de la réinitialisation");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Settings className="w-6 h-6 text-emerald-600" />
            Paramètres AGRO SERVICE YARWAYE
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Personnalisez vos coordonnées, vos numéros de paiement Wave / OM ({formData.phone}) et vos reçus
          </p>
        </div>

        {msg && (
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-lg">
            <CheckCircle className="w-4 h-4 text-emerald-600" /> {msg}
          </span>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* General Store Info */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Identité de l'établissement
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nom Commercial de la Boutique
              </label>
              <input
                type="text"
                required
                value={formData.storeName}
                onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Devise Monétaire
              </label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-white"
              >
                <option value="FCFA">Franc CFA (FCFA)</option>
                <option value="USD">Dollar Américain (USD $)</option>
                <option value="EUR">Euro (EUR €)</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Adresse Physique du Magasin
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Contact & Mobile Money */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-teal-600" />
            Coordonnées & Réception Mobile Money
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Téléphone Principal / Assistance Boutique
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 text-xs font-bold font-mono text-emerald-800 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Numéro WhatsApp Commandes
              </label>
              <div className="relative">
                <Smartphone className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 text-xs font-bold font-mono text-slate-800 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Compte Récepteur Wave
              </label>
              <input
                type="text"
                value={formData.waveNumber}
                onChange={(e) => setFormData({ ...formData, waveNumber: e.target.value })}
                className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Compte Récepteur Orange Money
              </label>
              <input
                type="text"
                value={formData.orangeMoneyNumber}
                onChange={(e) => setFormData({ ...formData, orangeMoneyNumber: e.target.value })}
                className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Receipt Slip Customization */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Receipt className="w-4 h-4 text-indigo-600" />
            Personnalisation Ticket de Caisse
          </h2>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                En-tête du ticket
              </label>
              <input
                type="text"
                value={formData.receiptHeader}
                onChange={(e) => setFormData({ ...formData, receiptHeader: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Message de pied de page (Remerciements & contact)
              </label>
              <textarea
                rows={2}
                value={formData.receiptFooter}
                onChange={(e) => setFormData({ ...formData, receiptFooter: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            disabled={isResetting}
            onClick={handleResetDemoData}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-xl transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? "animate-spin" : ""}`} />
            {isResetting ? "Réinitialisation..." : "Recharger données démo"}
          </button>

          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-1.5 px-6 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isSaving ? "Sauvegarde..." : "Enregistrer les modifications"}
          </button>
        </div>
      </form>
    </div>
  );
}
