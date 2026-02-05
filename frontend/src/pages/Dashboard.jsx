import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchTransactions, removeTransaction } from "../features/transactions/transactionSlice";
import { logoutLocal } from "../features/auth/authSlice";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, TrendingUp, TrendingDown, Plus, LogOut, Trash2, Loader2, Search, Filter, X, Calculator } from "lucide-react";
import AddTransactionModal from "../components/AddTransactionModal";
import { CATEGORIES } from "../utils/categories";

const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, stats, loading } = useSelector((state) => state.transactions);
  const { user } = useSelector((state) => state.auth);
  
  const [activeTab, setActiveTab] = useState("Daily");
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    dispatch(fetchTransactions());
  }, [dispatch]);

  const handleLogout = async () => {
    try {
      await api.post("/users/logout");
      dispatch(logoutLocal());
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this transaction?")) {
      setDeletingId(id);
      await dispatch(removeTransaction(id));
      setDeletingId(null);
    }
  };

  /**
   * UPDATED: Category-Based Styling
   * Now assigns specific professional tints based on the transaction category
   */
  const getRowStyle = (catId) => {
    const categoryMap = {
      food: "bg-orange-500/5 border-l-orange-500/40",
      medical: "bg-rose-500/5 border-l-rose-500/40",
      tech: "bg-blue-500/5 border-l-blue-500/40",
      work: "bg-emerald-500/5 border-l-emerald-500/40",
      transport: "bg-purple-500/5 border-l-purple-500/40",
      rent: "bg-amber-500/5 border-l-amber-500/40",
      shopping: "bg-pink-500/5 border-l-pink-500/40",
      entertainment: "bg-indigo-500/5 border-l-indigo-500/40",
      other: "bg-slate-500/5 border-l-slate-500/40"
    };
    return categoryMap[catId] || categoryMap.other;
  };

  // Advanced Filtering + Dynamic Totals Calculation
  const { filteredItems, filteredTotals } = useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));
    
    const filtered = items.filter(item => {
      const itemDate = new Date(item.createdAt);
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
      
      const start = startDate ? new Date(startDate).setHours(0,0,0,0) : null;
      const end = endDate ? new Date(endDate).setHours(23,59,59,999) : null;
      const matchesDateRange = (!start || itemDate >= start) && (!end || itemDate <= end);

      if (!matchesSearch || !matchesCategory || !matchesDateRange) return false;
      if (startDate || endDate) return true;

      if (activeTab === "Daily") return itemDate >= startOfDay;
      if (activeTab === "Weekly") {
        const west = new Date(now.setDate(now.getDate() - now.getDay()));
        return itemDate >= west;
      }
      if (activeTab === "Monthly") {
        return itemDate.getMonth() === new Date().getMonth() && 
               itemDate.getFullYear() === new Date().getFullYear();
      }
      return itemDate.getFullYear() === new Date().getFullYear();
    });

    const totals = filtered.reduce((acc, curr) => {
      if (curr.type === 'income') acc.income += Number(curr.amount);
      else acc.expense += Number(curr.amount);
      return acc;
    }, { income: 0, expense: 0 });

    return { filteredItems: filtered, filteredTotals: totals };
  }, [items, activeTab, searchQuery, selectedCategory, startDate, endDate]);

  const formatBDT = (amount) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency', currency: 'BDT', minimumFractionDigits: 0
    }).format(amount || 0).replace("BDT", "৳");
  };

  const clearFilters = () => {
    setSelectedCategory("All");
    setStartDate("");
    setEndDate("");
    setSearchQuery("");
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Header Section */}
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight">Broke-O-Meter BD</h1>
          <p className="text-slate-500 text-[10px] uppercase tracking-widest">User: {user?.username}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleLogout} className="glass-effect p-2 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors">
            <LogOut size={16} />
          </button>
          <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 p-2 rounded-lg text-white shadow-lg shadow-blue-900/40 hover:bg-blue-500 transition-colors">
            <Plus size={16} />
          </button>
        </div>
      </header>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-effect p-4 rounded-xl">
          <p className="text-[9px] text-slate-500 uppercase font-bold mb-1">Total Balance</p>
          <h2 className="text-sm font-bold text-white">{formatBDT(stats.balance)}</h2>
        </div>
        <div className="glass-effect p-4 rounded-xl border-l-2 border-emerald-500/50">
          <p className="text-[9px] text-emerald-500 uppercase font-bold mb-1">Total Income</p>
          <h2 className="text-sm font-bold text-white">{formatBDT(stats.income)}</h2>
        </div>
        <div className="glass-effect p-4 rounded-xl border-l-2 border-rose-500/50">
          <p className="text-[9px] text-rose-500 uppercase font-bold mb-1">Total Expenses</p>
          <h2 className="text-sm font-bold text-white">{formatBDT(stats.expense)}</h2>
        </div>
      </div>

      <div className="space-y-4">
        {/* Tab Selection */}
        <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 flex gap-1 bg-slate-900/50 p-1 rounded-xl border border-white/5">
                {["Daily", "Weekly", "Monthly", "Yearly"].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => { setActiveTab(tab); setStartDate(""); setEndDate(""); }}
                        className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                            activeTab === tab && !startDate && !endDate ? "bg-white/10 text-blue-400 shadow-sm" : "text-slate-500 hover:text-slate-300"
                        }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>
            <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all text-[10px] font-bold uppercase ${showFilters ? 'bg-blue-600 border-blue-500 text-white' : 'glass-effect border-white/5 text-slate-400'}`}
            >
                <Filter size={12} /> {showFilters ? 'Hide Filters' : 'Advanced Filters'}
            </button>
        </div>

        {/* Filter Panel */}
        <AnimatePresence>
            {showFilters && (
                <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                >
                    <div className="glass-effect p-4 rounded-2xl border border-blue-500/20 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="space-y-1">
                                <label className="text-[9px] text-slate-500 uppercase font-bold ml-1">Category</label>
                                <select 
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-[10px] text-slate-200 focus:outline-none"
                                >
                                    <option value="All">All Categories</option>
                                    {CATEGORIES.map(cat => <option key={cat.id} value={cat.id}>{cat.label}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] text-slate-500 uppercase font-bold ml-1">From</label>
                                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-[10px] text-slate-200 focus:outline-none [color-scheme:dark]" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] text-slate-500 uppercase font-bold ml-1">To</label>
                                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-[10px] text-slate-200 focus:outline-none [color-scheme:dark]" />
                            </div>
                            <div className="flex items-end">
                                <button onClick={clearFilters} className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-bold uppercase flex items-center justify-center gap-2 transition-colors">
                                    <X size={12} /> Reset
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 pt-3 border-t border-white/5">
                            <div className="flex items-center gap-2">
                                <Calculator size={12} className="text-blue-500" />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filter Result:</span>
                            </div>
                            <div className="flex gap-4">
                                <span className="text-[10px] font-bold text-emerald-400">+{formatBDT(filteredTotals.income)}</span>
                                <span className="text-[10px] font-bold text-rose-400">-{formatBDT(filteredTotals.expense)}</span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* Transaction History */}
        <div className="glass-effect rounded-2xl p-2 min-h-[400px]">
          <div className="px-4 py-3 space-y-3 border-b border-white/5 mb-2">
            <div className="flex justify-between items-center">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                {startDate || endDate ? 'Custom Range' : activeTab} Sins
              </h3>
              <span className="text-[9px] text-slate-600 font-mono">{filteredItems.length} entries</span>
            </div>
            <div className="relative group">
              <Search className="absolute left-2.5 top-2.5 text-slate-600 group-focus-within:text-blue-500 transition-colors" size={12} />
              <input type="text" placeholder="Search description..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-black/20 border border-white/5 rounded-lg py-2 pl-8 pr-4 text-[10px] text-slate-300 focus:outline-none focus:border-blue-500/50 transition-all" />
            </div>
          </div>

          <div className="space-y-1">
            <AnimatePresence mode="popLayout">
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => {
                  const category = CATEGORIES.find(c => c.id === item.category);
                  /**
                   * APPLYING CATEGORY COLORS HERE
                   */
                  const dynamicStyle = getRowStyle(item.category); 
                  
                  return (
                    <motion.div key={item._id} layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.95 }} className={`flex items-center justify-between p-2.5 rounded-xl border-l-4 transition-all group ${dynamicStyle}`}>
                      <div className="flex items-center gap-3">
                        <span className="text-xs">{category?.icon || "💰"}</span>
                        <div>
                          <h5 className="text-[11px] font-semibold text-slate-200">{item.title}</h5>
                          <p className="text-[8px] text-slate-400 uppercase font-bold tracking-tight">
                            {category?.label} • {new Date(item.createdAt).toLocaleDateString('en-BD', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-[11px] font-black ${item.type === 'expense' ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {item.type === 'expense' ? '-' : '+'}{formatBDT(item.amount)}
                        </span>
                        <button onClick={() => handleDelete(item._id)} className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-500 transition-all">
                          {deletingId === item._id ? <Loader2 size={10} className="animate-spin" /> : <Trash2 size={10} />}
                        </button>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <p className="text-[10px] text-slate-600 italic uppercase tracking-widest">No matching sins found.</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      <AddTransactionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

export default Dashboard;