import React, { useState, useMemo, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addTransaction } from "../features/transactions/transactionSlice";
import { motion, AnimatePresence } from "framer-motion";
import { X, Tag, Search, Loader2, ChevronDown, Calendar, CreditCard, Sparkles } from "lucide-react";
import { CATEGORIES } from "../utils/categories";

const AddTransactionModal = ({ isOpen, onClose, onSuccess }) => {
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.transactions);
  const titleInputRef = useRef(null);
  
  const getTodayDate = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - offset).toISOString().split("T")[0];
  };

  const [searchTerm, setSearchTerm] = useState("");
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    type: "expense",
    category: CATEGORIES[0].id,
    createdAt: getTodayDate(),
  });

  // Focus the first input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => titleInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

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
    e?.preventDefault();
    if (!formData.title || !formData.amount) return;

    let finalTransactionDate;
    const todayLocal = getTodayDate();

    if (formData.createdAt === todayLocal) {
      finalTransactionDate = new Date().toISOString();
    } else {
      const [year, month, day] = formData.createdAt.split('-').map(Number);
      const localPickedDate = new Date(year, month - 1, day, 12, 0, 0);
      finalTransactionDate = localPickedDate.toISOString();
    }

    const finalData = {
      ...formData,
      amount: Number(formData.amount),
      createdAt: finalTransactionDate
    };

    const result = await dispatch(addTransaction(finalData));
    if (result.meta.requestStatus === "fulfilled") {
      onSuccess(); 
      setFormData({ title: "", amount: "", type: "expense", category: CATEGORIES[0].id, createdAt: getTodayDate() });
      onClose();
    }
  };

  const activeColor = formData.type === 'expense' ? 'rose' : 'emerald';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={!loading ? onClose : null}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl"
          />

          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 30 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="glass-effect w-full max-w-md rounded-[2.5rem] p-1 relative z-10 border border-white/10 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] overflow-hidden"
          >
            {/* Syncing Overlay */}
            <AnimatePresence>
              {loading && (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute inset-0 z-[130] bg-slate-900/60 backdrop-blur-2xl flex flex-col items-center justify-center gap-4"
                >
                  <div className="relative">
                    <Loader2 className="animate-spin text-blue-500" size={48} />
                    <div className="absolute inset-0 blur-3xl bg-blue-500/20 animate-pulse" />
                  </div>
                  <p className="text-white text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">Syncing Terminal</p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="p-8 sm:p-10 space-y-8 bg-gradient-to-b from-white/[0.03] to-transparent">
              {/* Header */}
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h2 className="text-3xl font-black text-white tracking-tighter flex items-center gap-2">
                    Add Sin <Sparkles className={`text-${activeColor}-500 transition-colors`} size={20} />
                  </h2>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Dhaka Region Central Ledger</p>
                </div>
                <motion.button 
                  whileHover={{ rotate: 90 }} whileTap={{ scale: 0.8 }}
                  onClick={onClose} 
                  className="p-2 rounded-2xl bg-white/5 text-slate-400 hover:text-white transition-all"
                >
                  <X size={20} />
                </motion.button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-7">
                {/* Type Switcher */}
                <div className="flex p-1.5 bg-black/40 rounded-3xl border border-white/5 relative shadow-inner">
                  {["expense", "income"].map((t) => (
                    <button
                      key={t} type="button"
                      onClick={() => setFormData({ ...formData, type: t })}
                      className={`flex-1 py-3.5 rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest transition-all duration-500 z-10 ${
                        formData.type === t 
                          ? "text-white" 
                          : "text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                  <motion.div 
                    layoutId="activeTab"
                    className={`absolute inset-1.5 w-[calc(50%-6px)] rounded-[1.25rem] shadow-2xl ${
                      formData.type === 'expense' ? 'bg-rose-600 shadow-rose-900/40' : 'bg-emerald-600 shadow-emerald-900/40'
                    }`}
                    animate={{ x: formData.type === 'income' ? '100%' : '0%' }}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                </div>

                {/* Form Body */}
                <div className="space-y-5">
                  <div className="group space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Sin Context</label>
                    <div className="relative group">
                      <Tag className={`absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-${activeColor}-500 transition-colors`} size={18} />
                      <input 
                        ref={titleInputRef} required 
                        className={`w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4.5 pl-14 pr-6 text-sm text-white focus:outline-none focus:border-${activeColor}-500/50 focus:bg-white/[0.07] transition-all placeholder:text-slate-700 font-bold`} 
                        placeholder="e.g. Electric Goods" 
                        value={formData.title} 
                        onChange={(e) => setFormData({...formData, title: e.target.value})} 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div className="group space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Damage Amount</label>
                      <div className="relative">
                        <span className={`absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 font-black group-focus-within:text-${activeColor}-500`}>৳</span>
                        <input 
                          type="number" required
                          className={`w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4.5 pl-12 pr-6 text-sm text-white focus:outline-none focus:border-${activeColor}-500/50 focus:bg-white/[0.07] transition-all font-black`} 
                          placeholder="0.00" 
                          value={formData.amount} 
                          onChange={(e) => setFormData({...formData, amount: e.target.value})} 
                        />
                      </div>
                    </div>
                    <div className="group space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Occurred On</label>
                      <div className="relative">
                        <Calendar className={`absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-${activeColor}-500`} size={18} />
                        <input 
                          type="date"
                          className={`w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4.5 pl-14 pr-6 text-xs text-white focus:outline-none focus:border-${activeColor}-500/50 focus:bg-white/[0.07] transition-all [color-scheme:dark] font-bold`} 
                          value={formData.createdAt} 
                          onChange={(e) => setFormData({...formData, createdAt: e.target.value})} 
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Advanced Classification */}
                <div className="space-y-2 relative">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Classification Domain</label>
                  <motion.div 
                    whileTap={{ scale: 0.98 }}
                    onClick={() => !loading && setShowCategoryDropdown(!showCategoryDropdown)}
                    className="w-full bg-white/[0.03] border border-white/5 rounded-[1.5rem] py-4.5 px-6 flex justify-between items-center cursor-pointer hover:bg-white/[0.07] transition-all shadow-inner border-b-white/10"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-black/40 flex items-center justify-center text-xl shadow-lg border border-white/5">
                        {selectedCategory.icon}
                      </div>
                      <span className="text-sm text-slate-200 font-black uppercase tracking-widest">{selectedCategory.label}</span>
                    </div>
                    <ChevronDown className={`text-slate-600 transition-transform duration-500 ${showCategoryDropdown ? 'rotate-180' : ''}`} size={20} />
                  </motion.div>

                  <AnimatePresence>
                    {showCategoryDropdown && (
                      <motion.div 
                        initial={{ opacity: 0, y: 12, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 12, scale: 0.95 }}
                        className="absolute left-0 right-0 bottom-[110%] mb-4 bg-slate-900 border border-white/10 rounded-[2rem] overflow-hidden z-[120] shadow-[0_24px_48px_rgba(0,0,0,0.6)] backdrop-blur-3xl"
                      >
                        <div className="p-5 border-b border-white/5 bg-white/[0.02]">
                          <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                            <input 
                              autoFocus
                              className="w-full bg-black/40 border-none text-[11px] rounded-2xl pl-12 py-4 text-white outline-none focus:ring-2 focus:ring-blue-500/30 placeholder:text-slate-600 font-bold uppercase tracking-widest" 
                              placeholder="Search Domain..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="max-h-72 overflow-y-auto p-3 custom-scrollbar space-y-1.5">
                          {filteredCategories.length > 0 ? (
                            filteredCategories.map((cat) => (
                              <motion.div 
                                key={cat.id}
                                whileHover={{ x: 5, backgroundColor: "rgba(255,255,255,0.05)" }}
                                onClick={() => {
                                  setFormData({...formData, category: cat.id});
                                  setShowCategoryDropdown(false);
                                  setSearchTerm("");
                                }}
                                className={`px-5 py-4 rounded-2xl cursor-pointer flex items-center gap-4 transition-all ${
                                  formData.category === cat.id ? 'bg-blue-600/20 border border-blue-500/20' : 'border border-transparent'
                                }`}
                              >
                                <span className="text-2xl filter drop-shadow-md">{cat.icon}</span>
                                <span className={`text-[10px] font-black uppercase tracking-[0.15em] ${formData.category === cat.id ? 'text-blue-400' : 'text-slate-400'}`}>
                                  {cat.label}
                                </span>
                              </motion.div>
                            ))
                          ) : (
                            <div className="text-center py-10">
                                <Search size={24} className="mx-auto mb-2 text-slate-700 opacity-20" />
                                <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest">No Domain Found</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <motion.button 
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  type="submit" disabled={loading}
                  className={`w-full py-5 rounded-[2rem] text-xs font-black uppercase tracking-[0.4em] text-white transition-all shadow-2xl border-t border-white/20 ${
                    formData.type === 'expense' 
                      ? 'bg-rose-600 shadow-rose-900/40 hover:bg-rose-500' 
                      : 'bg-emerald-600 shadow-emerald-900/40 hover:bg-emerald-500'
                  }`}
                >
                  {loading ? "Authorizing..." : "Synchronize Ledger"}
                </motion.button>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AddTransactionModal;