import React, { useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addTransaction } from "../features/transactions/transactionSlice";
import { motion, AnimatePresence } from "framer-motion";
import { X, Tag, Search, Loader2, ChevronDown, Calendar } from "lucide-react";
import { CATEGORIES } from "../utils/categories";

const AddTransactionModal = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.transactions);
  
  const getTodayDate = () => new Date().toISOString().split('T')[0];

  const [searchTerm, setSearchTerm] = useState("");
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    type: "expense",
    category: CATEGORIES[0].id,
    createdAt: getTodayDate(),
  });

  // This ensures that if searchTerm is empty, it returns the full list
  const filteredCategories = useMemo(() => {
    if (!searchTerm.trim()) return CATEGORIES;
    return CATEGORIES.filter((cat) =>
      cat.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const selectedCategory = useMemo(() => {
    return CATEGORIES.find(c => c.id === formData.category) || CATEGORIES[0];
  }, [formData.category]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalData = {
      ...formData,
      createdAt: formData.createdAt || new Date().toISOString()
    };

    const result = await dispatch(addTransaction(finalData));
    if (result.meta.requestStatus === "fulfilled") {
      setFormData({ 
        title: "", amount: "", type: "expense", 
        category: CATEGORIES[0].id, createdAt: getTodayDate() 
      });
      setSearchTerm("");
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={!loading ? onClose : null}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
          />

          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="glass-effect w-full max-w-md rounded-[2rem] p-6 sm:p-8 relative z-10 border border-white/10 shadow-2xl"
          >
            {/* Loading Overlay */}
            <AnimatePresence>
              {loading && (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute inset-0 z-50 bg-slate-900/60 backdrop-blur-xl flex flex-col items-center justify-center gap-4"
                >
                  <Loader2 className="animate-spin text-blue-500" size={40} />
                  <p className="text-white text-xs font-black uppercase tracking-[0.3em]">Syncing...</p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-black text-white tracking-tight">New Sin ৳</h2>
              <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Type Switcher */}
              <div className="flex p-1 bg-black/40 rounded-2xl border border-white/5">
                {["expense", "income"].map((t) => (
                  <button
                    key={t} type="button"
                    onClick={() => setFormData({ ...formData, type: t })}
                    className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      formData.type === t 
                        ? (t === 'expense' ? "bg-rose-500 text-white" : "bg-emerald-500 text-white")
                        : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* Inputs */}
              <div className="space-y-4">
                <div className="relative">
                  <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                  <input 
                    required className="w-full bg-white/5 border border-white/5 rounded-2xl py-3.5 pl-12 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all" 
                    placeholder="Description" 
                    value={formData.title} 
                    onChange={(e) => setFormData({...formData, title: e.target.value})} 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 font-black">৳</span>
                    <input 
                      type="number" required
                      className="w-full bg-white/5 border border-white/5 rounded-2xl py-3.5 pl-10 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all" 
                      placeholder="Amount" 
                      value={formData.amount} 
                      onChange={(e) => setFormData({...formData, amount: e.target.value})} 
                    />
                  </div>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                    <input 
                      type="date"
                      className="w-full bg-white/5 border border-white/5 rounded-2xl py-3.5 pl-12 pr-4 text-xs text-white focus:outline-none focus:border-blue-500/50 [color-scheme:dark]" 
                      value={formData.createdAt} 
                      onChange={(e) => setFormData({...formData, createdAt: e.target.value})} 
                    />
                  </div>
                </div>
              </div>

              {/* Classification Select */}
              <div className="space-y-2 relative">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Classification</label>
                <div 
                  onClick={() => !loading && setShowCategoryDropdown(!showCategoryDropdown)}
                  className="w-full bg-white/5 border border-white/5 rounded-2xl py-3.5 px-4 flex justify-between items-center cursor-pointer hover:bg-white/10 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{selectedCategory.icon}</span>
                    <span className="text-sm text-slate-200">{selectedCategory.label}</span>
                  </div>
                  <ChevronDown className={`text-slate-600 transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`} size={18} />
                </div>

                <AnimatePresence>
                  {showCategoryDropdown && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                      className="absolute left-0 right-0 mt-2 bg-slate-900 border border-white/10 rounded-2xl overflow-hidden z-[60] shadow-2xl"
                    >
                      <div className="p-3 border-b border-white/5">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                          <input 
                            autoFocus
                            className="w-full bg-black/40 border-none text-[11px] rounded-xl pl-10 py-2.5 text-white outline-none" 
                            placeholder="Search categories..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="max-h-60 overflow-y-auto p-2 custom-scrollbar">
                        {filteredCategories.length > 0 ? (
                          filteredCategories.map((cat) => (
                            <div 
                              key={cat.id}
                              onClick={() => {
                                setFormData({...formData, category: cat.id});
                                setShowCategoryDropdown(false);
                                setSearchTerm(""); // Clear search so next time it shows all
                              }}
                              className={`px-3 py-3 rounded-xl hover:bg-white/10 cursor-pointer flex items-center gap-3 text-xs transition-colors ${
                                formData.category === cat.id ? 'bg-blue-500/10 text-blue-400' : 'text-slate-400'
                              }`}
                            >
                              <span>{cat.icon}</span>
                              <span className="font-bold">{cat.label}</span>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-4 text-[10px] text-slate-600 uppercase">No results</div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button 
                type="submit" disabled={loading}
                className={`w-full py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] text-white transition-all ${
                  formData.type === 'expense' ? 'bg-rose-600' : 'bg-emerald-600'
                }`}
              >
                Finalize Entry
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AddTransactionModal;