"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Save, X, Activity, DollarSign } from "lucide-react";
import Loading, { Spinner } from "@/components/ui/Loading";
import { toast } from "@/lib/toast";
import { supabase } from "@/lib/supabaseClient";

type Entity = {
  id: string;
  name: string;
  commission_percent: number;
  is_active: boolean;
  created_at: string;
};

export default function CommissionsClient() {
  const [activeTab, setActiveTab] = useState<"referrals" | "companies">("referrals");
  const [companyCategory, setCompanyCategory] = useState<"personal" | "commercial">("personal");
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    commission_percent: "",
    is_active: true
  });

  useEffect(() => {
    fetchEntities();
  }, [activeTab, companyCategory]);

  const tableName = activeTab === "referrals" ? "referrals" : "insurance_companies";
  const entityLabel = activeTab === "referrals" ? "Referral" : "Insurance Company";

  const fetchEntities = async () => {
    try {
      setLoading(true);
      let query = supabase.from(tableName).select("*");
      if (tableName === "insurance_companies") {
        query = query.eq("category", companyCategory);
      }
      const { data, error } = await query.order("name", { ascending: true });
        
      if (error) throw error;
      setEntities(data || []);
    } catch (err: any) {
      toast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (entity?: Entity) => {
    if (entity) {
      setEditingId(entity.id);
      setFormData({
        name: entity.name,
        commission_percent: entity.commission_percent.toString(),
        is_active: entity.is_active
      });
    } else {
      setEditingId(null);
      setFormData({
        name: "",
        commission_percent: "",
        is_active: true
      });
    }
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const percent = parseFloat(formData.commission_percent);
    
    if (!formData.name.trim()) {
      return toast(`${entityLabel} name is required.`, "error");
    }
    if (isNaN(percent) || percent < 0 || percent > 100) {
      return toast("Commission percentage must be between 0 and 100.", "error");
    }

    try {
      setSaving(true);
      const payload: any = {
        name: formData.name.trim(),
        commission_percent: percent,
        is_active: formData.is_active,
        updated_at: new Date().toISOString()
      };

      if (tableName === "insurance_companies") {
        payload.category = companyCategory;
      }

      if (editingId) {
        const { error } = await supabase
          .from(tableName)
          .update(payload)
          .eq("id", editingId);
        
        if (error) {
          if (error.code === '23505') {
            throw new Error(`A ${tableName === 'insurance_companies' ? companyCategory : ''} ${entityLabel.toLowerCase()} with this name already exists.`);
          }
          throw error;
        }
        toast(`${entityLabel} updated successfully!`, "success");
      } else {
        const { error } = await supabase
          .from(tableName)
          .insert(payload);
          
        if (error) {
          if (error.code === '23505') {
            throw new Error(`A ${tableName === 'insurance_companies' ? companyCategory : ''} ${entityLabel.toLowerCase()} with this name already exists.`);
          }
          throw error;
        }
        toast(`${entityLabel} added successfully!`, "success");
      }

      setShowModal(false);
      fetchEntities();
    } catch (err: any) {
      toast(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-gray-100 bg-gray-50/50 p-2 gap-2">
        <button
          onClick={() => setActiveTab("referrals")}
          className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
            activeTab === "referrals"
              ? "bg-white text-emerald-600 shadow-sm border border-gray-200"
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          }`}
        >
          <Activity size={18} />
          Referrals
        </button>
        <button
          onClick={() => setActiveTab("companies")}
          className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
            activeTab === "companies"
              ? "bg-white text-blue-600 shadow-sm border border-gray-200"
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          }`}
        >
          <DollarSign size={18} />
          Insurance Companies
        </button>
      </div>

      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-gray-800">
            {activeTab === "referrals" ? "Referral Sources" : "Master Insurance Companies"}
          </h2>
          <button
            onClick={() => handleOpenModal()}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-emerald-700 transition-colors shadow-sm"
          >
            <Plus size={16} />
            Add {entityLabel}
          </button>
        </div>

        {activeTab === "companies" && (
          <div className="flex border-b border-gray-200 mb-6 gap-2">
            <button
              onClick={() => setCompanyCategory("personal")}
              className={`py-2 px-6 font-bold text-sm border-b-2 transition-colors ${
                companyCategory === "personal"
                  ? "border-emerald-500 text-emerald-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Personal
            </button>
            <button
              onClick={() => setCompanyCategory("commercial")}
              className={`py-2 px-6 font-bold text-sm border-b-2 transition-colors ${
                companyCategory === "commercial"
                  ? "border-emerald-500 text-emerald-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Commercial
            </button>
          </div>
        )}

        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <Spinner className="w-8 h-8 text-emerald-500" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-y border-slate-200">
                  <th className="px-6 py-4 font-semibold">Name</th>
                  <th className="px-6 py-4 font-semibold">Commission %</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {entities.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-400 italic">
                      No {entityLabel.toLowerCase()}s found.
                    </td>
                  </tr>
                ) : (
                  entities.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-800">
                        {item.name}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                          {Number(item.commission_percent).toFixed(2)}%
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider ${
                          item.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {item.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleOpenModal(item)}
                          className="p-2 text-slate-400 hover:text-blue-600 bg-white hover:bg-blue-50 rounded-lg transition-all border border-transparent hover:border-blue-100 shadow-sm"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800">
                {editingId ? `Edit ${entityLabel}` : `Add New ${entityLabel}`}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  {entityLabel} Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={`e.g. ${activeTab === 'referrals' ? 'Partner Agency' : 'Progressive'}`}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all outline-none"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Commission Percentage (%)
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.commission_percent}
                  onChange={(e) => setFormData({ ...formData, commission_percent: e.target.value })}
                  placeholder="e.g. 15.00"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all outline-none"
                />
              </div>

              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <input
                  type="checkbox"
                  id="isActiveToggle"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500 border-gray-300"
                />
                <label htmlFor="isActiveToggle" className="text-sm font-bold text-slate-700 cursor-pointer">
                  Active (Available for selection)
                </label>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-colors flex justify-center items-center gap-2 disabled:opacity-70"
                >
                  {saving ? <Spinner className="w-5 h-5 text-white" /> : <Save size={18} />}
                  {saving ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
