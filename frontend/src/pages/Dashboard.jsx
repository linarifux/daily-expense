import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchTransactions, removeTransaction } from "../features/transactions/transactionSlice";
import { logoutLocal } from "../features/auth/authSlice";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Wallet, TrendingUp, TrendingDown, Plus, LogOut, Trash2, 
  Loader2, Search, Filter, X, Calculator, PieChart as PieIcon,
  CalendarDays, ArrowUpRight, ArrowDownLeft, AlertCircle
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Sector } from "recharts";
import AddTransactionModal from "../components/AddTransactionModal";
import Toast from "../components/Toast";
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
  const [showToast, setShowToast] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [activeIndex, setActiveIndex] = useState(null);

  // MODERN DELETE STATE
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

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

  // NEW: Modern Execution Logic
  const executeDelete = async () => {
    if (!confirmDeleteId) return;
    setDeletingId(confirmDeleteId);
    await dispatch(removeTransaction(confirmDeleteId));
    setDeletingId(null);
    setConfirmDeleteId(null);
    // Optional: show a specific toast for deletion
  };

  const getRowStyle = (catId) => {
    const categoryMap = {
      food: "bg-orange-500/5 border-l-orange-500/40 hover:bg-orange-500/10",
      medical: "bg-rose-500/5 border-l-rose-500/40 hover:bg-rose-500/10",
      tech: "bg-blue-500/5 border-l-blue-500/40 hover:bg-blue-500/10",
      work: "bg-emerald-500/5 border-l-emerald-500/40 hover:bg-emerald-500/10",
      transport: "bg-purple-500/5 border-l-purple-500/40 hover:bg-purple-500/10",
      rent: "bg-amber-500/5 border-l-amber-500/40 hover:bg-amber-500/10",
      shopping: "bg-pink-500/5 border-l-pink-500/40 hover:bg-pink-500/10",
      entertainment: "bg-indigo-500/5 border-l-indigo-500/40 hover:bg-indigo-500/10",
      other: "bg-slate-500/5 border-l-slate-500/40 hover:bg-slate-500/10"
    };
    return categoryMap[catId] || categoryMap.other;
  };

  const getHexColor = (catId) => {
    const hexMap = {
      food: "#f97316", medical: "#f43f5e", tech: "#3b82f6",
      work: "#10b981", transport: "#a855f7", rent: "#f59e0b",
      shopping: "#ec4899", entertainment: "#6366f1", other: "#64748b"
    };
    return hexMap[catId] || "#64748b";
  };

  const { filteredItems, filteredTotals, chartData } = useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));
    
    const filtered = items.filter(item => {
      const itemDate = new Date(item.date);
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

    const categorySums = {};
    const totals = filtered.reduce((acc, curr) => {
      const val = Number(curr.amount);
      if (curr.type === 'income') {
        acc.income += val;
      } else {
        acc.expense += val;
        categorySums[curr.category] = (categorySums[curr.category] || 0) + val;
      }
      return acc;
    }, { income: 0, expense: 0 });

    const formattedChart = Object.keys(categorySums).map(key => ({
      name: CATEGORIES.find(c => c.id === key)?.label || key,
      value: categorySums[key],
      color: getHexColor(key)
    }));

    return { filteredItems: filtered, filteredTotals: totals, chartData: formattedChart };
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

  const renderActiveShape = (props) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
    return (
      <g>
        <Sector
          cx={cx} cy={cy}
          innerRadius={innerRadius - 4}
          outerRadius={outerRadius + 12}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          style={{ filter: `drop-shadow(0 0 12px ${fill}44)` }}
        />
        <text x={cx} y={cy - 12} textAnchor="middle" fill="#94a3b8" fontSize="10px" fontWeight="900" style={{ textTransform: 'uppercase', letterSpacing: '2px' }}>
          {payload.name}
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" fill="#ffffff" fontSize="18px" fontWeight="900">
          {formatBDT(value)}
        </text>
        <text x={cx} y={cy + 32} textAnchor="middle" fill={fill} fontSize="11px" fontWeight="800">
          {(percent * 100).toFixed(1)}% of sins
        </text>
      </g>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-8 space-y-8 pb-24 min-h-screen font-sans bg-[#020617]">
      <Toast show={showToast} message="Ledger updated successfully ৳" onClose={() => setShowToast(false)} />

      {/* --- CONFIRM DELETE MODAL (MODERN REPLACEMENT) --- */}
      <AnimatePresence>
        {confirmDeleteId && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[250] flex items-center justify-center p-6 backdrop-blur-md bg-black/40"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="glass-effect p-8 rounded-[2.5rem] border border-white/10 max-w-sm w-full text-center shadow-2xl shadow-black/50"
            >
              <div className="h-16 w-16 bg-rose-500/20 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl border border-rose-500/20">
                <AlertCircle size={32} />
              </div>
              <h2 className="text-xl font-black text-white uppercase tracking-tighter mb-2">Erase Sin?</h2>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-8 leading-relaxed">
                This transaction will be purged from the Bangladesh Region ledger forever.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setConfirmDeleteId(null)}
                  className="flex-1 py-4 rounded-2xl glass-effect text-slate-300 font-black text-[10px] uppercase tracking-widest hover:bg-white/5 transition-all"
                >
                  Retain
                </button>
                <button 
                  onClick={executeDelete}
                  disabled={deletingId}
                  className="flex-1 py-4 rounded-2xl bg-rose-600 text-white font-black text-[10px] uppercase tracking-widest shadow-xl shadow-rose-900/40 hover:bg-rose-500 transition-all active:scale-95 flex items-center justify-center"
                >
                  {deletingId ? <Loader2 size={14} className="animate-spin" /> : "Purge"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- HEADER SECTION --- */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-white/5 pb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
            <h1 className="text-3xl font-black text-white tracking-tighter">
              BROKE<span className="text-blue-500">.</span>O<span className="text-blue-500">.</span>METER
            </h1>
          </div>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.4em] flex items-center gap-2">
            Terminal v3.0 <span className="h-1.5 w-1.5 bg-slate-700 rounded-full"/> Dhaka Region
          </p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button 
            onClick={handleLogout} 
            className="flex-1 md:flex-none glass-effect px-6 py-3.5 rounded-2xl text-slate-300 hover:text-rose-400 hover:bg-rose-500/10 transition-all border border-white/10 flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest active:scale-95"
          >
            <LogOut size={14} /> Escape
          </button>
          <button 
            onClick={() => setIsModalOpen(true)} 
            className="flex-1 md:flex-none bg-blue-600 px-8 py-3.5 rounded-2xl text-white shadow-[0_10px_30px_rgba(37,99,235,0.3)] hover:bg-blue-500 transition-all border border-blue-400/20 flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest active:scale-95"
          >
            <Plus size={16} /> New Sin
          </button>
        </div>
      </header>

      {/* --- GLOBAL KPI SECTION --- */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatBox title="Net Liquidity" amount={stats.balance} icon={Wallet} color="text-blue-400" bgColor="bg-blue-400/10" />
        <StatBox title="Revenue In" amount={stats.income} icon={ArrowUpRight} color="text-emerald-400" bgColor="bg-emerald-400/10" />
        <StatBox title="Burn Rate" amount={stats.expense} icon={ArrowDownLeft} color="text-rose-400" bgColor="bg-rose-400/10" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* --- LEFT COLUMN: DATA VISUALIZATION --- */}
        <aside className="lg:col-span-5 space-y-6">
          <div className="glass-effect rounded-[3rem] p-10 border border-white/10 relative overflow-hidden group shadow-2xl bg-white/[0.02]">
            <div className="flex items-center justify-between mb-8 relative z-10">
              <div>
                <h3 className="text-[13px] font-black text-white uppercase tracking-[0.3em] mb-1">Expense Density</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Interactive Analysis</p>
              </div>
              <div className="h-10 w-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20 shadow-xl">
                <PieIcon size={18} />
              </div>
            </div>
            
            <div className="h-[360px] w-full relative z-10 flex items-center justify-center">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie 
                      activeIndex={activeIndex}
                      activeShape={renderActiveShape}
                      data={chartData} 
                      innerRadius={90} 
                      outerRadius={115} 
                      paddingAngle={6} 
                      dataKey="value"
                      stroke="none"
                      onMouseEnter={(_, index) => setActiveIndex(index)}
                      onMouseLeave={() => setActiveIndex(null)}
                      animationBegin={0}
                      animationDuration={1200}
                    >
                      {chartData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.color} 
                          fillOpacity={activeIndex === null || activeIndex === index ? 0.9 : 0.2} 
                          style={{ outline: 'none', transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<></>} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full flex flex-col items-center justify-center text-slate-600 gap-4 border-2 border-dashed border-white/5 rounded-[3rem] bg-black/20">
                  <PieIcon size={40} className="opacity-10" />
                  <p className="text-[10px] uppercase font-black tracking-[0.3em]">Awaiting Financial Data</p>
                </div>
              )}

              {activeIndex === null && chartData.length > 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                   <p className="text-[9px] font-black text-slate-500 uppercase tracking-[3px] mb-2">Total Damage</p>
                   <p className="text-2xl font-black text-white">{formatBDT(filteredTotals.expense)}</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
               {chartData.map((item, i) => (
                 <div 
                   key={i} 
                   className={`flex flex-col gap-1 p-3 rounded-[1.5rem] border border-white/5 transition-all ${activeIndex === i ? 'bg-white/[0.08] border-white/10' : 'bg-white/[0.02]'}`}
                   onMouseEnter={() => setActiveIndex(i)}
                   onMouseLeave={() => setActiveIndex(null)}
                 >
                    <div className="flex items-center gap-2">
                       <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                       <span className="text-[10px] font-black text-slate-300 uppercase truncate">{item.name}</span>
                    </div>
                    <div className="flex justify-between items-end">
                       <span className="text-[12px] font-black text-white">{formatBDT(item.value)}</span>
                       <span className="text-[9px] font-bold text-slate-500">{((item.value / filteredTotals.expense) * 100).toFixed(0)}%</span>
                    </div>
                 </div>
               ))}
            </div>
          </div>
        </aside>

        {/* --- RIGHT COLUMN: NAVIGATION & HISTORY --- */}
        <main className="lg:col-span-7 space-y-6">
          <div className="space-y-4">
            <div className="flex gap-2 bg-black/40 p-2 rounded-[2rem] border border-white/5 backdrop-blur-3xl shadow-inner">
                {["Daily", "Weekly", "Monthly", "Yearly"].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => { setActiveTab(tab); setStartDate(""); setEndDate(""); }}
                        className={`flex-1 py-4 rounded-3xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                            activeTab === tab && !startDate && !endDate 
                            ? "bg-white/10 text-white shadow-[0_10px_20px_rgba(255,255,255,0.05)] border border-white/10" 
                            : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                        }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>
            
            <button 
                onClick={() => setShowFilters(true)}
                className={`w-full flex items-center justify-center gap-4 py-5 rounded-[2rem] border transition-all text-[11px] font-black uppercase tracking-[0.3em] ${showFilters ? 'bg-blue-600 text-white border-blue-500 shadow-2xl' : 'glass-effect border-white/10 text-slate-300 hover:border-white/20 hover:text-white'}`}
            >
                <Filter size={18} /> Advanced Parameters
            </button>
          </div>

          <section className="glass-effect rounded-[3rem] border border-white/10 shadow-2xl overflow-hidden flex flex-col min-h-[600px] bg-white/[0.01]">
            <div className="px-10 py-10 space-y-8">
              <div className="flex justify-between items-end">
                <div>
                  <h3 className="text-xl font-black text-white tracking-tighter mb-2 uppercase">
                    {startDate || endDate ? 'Filtered Scope' : `${activeTab} Ledger`}
                  </h3>
                  <div className="flex items-center gap-3 text-slate-400">
                    <CalendarDays size={14} className="text-blue-500" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">{filteredItems.length} Synchronized Records</span>
                  </div>
                </div>
                {showFilters && (
                  <div className="hidden sm:flex gap-6 border-l border-white/10 pl-8 h-12 items-center">
                     <div className="text-right">
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Inflow</p>
                        <p className="text-[12px] font-black text-emerald-400">+{formatBDT(filteredTotals.income)}</p>
                     </div>
                     <div className="text-right border-l border-white/5 pl-6">
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Outflow</p>
                        <p className="text-[12px] font-black text-rose-400">-{formatBDT(filteredTotals.expense)}</p>
                     </div>
                  </div>
                )}
              </div>

              <div className="relative group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-all duration-500" size={18} />
                <input 
                    type="text" 
                    placeholder="Filter by description, vendor, or classification..." 
                    value={searchQuery} 
                    onChange={(e) => setSearchQuery(e.target.value)} 
                    className="w-full bg-black/40 border border-white/10 rounded-3xl py-5 pl-14 pr-6 text-sm text-slate-200 outline-none focus:bg-black/60 focus:border-blue-500/40 transition-all placeholder:text-slate-700 font-bold" 
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-8 space-y-3">
              <AnimatePresence mode="popLayout">
                {filteredItems.map((item) => {
                  const category = CATEGORIES.find(c => c.id === item.category);
                  return (
                    <motion.div 
                      key={item._id} 
                      layout 
                      initial={{ opacity: 0, x: -20 }} 
                      animate={{ opacity: 1, x: 0 }} 
                      exit={{ opacity: 0, scale: 0.95 }} 
                      className={`flex items-center justify-between p-5 rounded-[2rem] border-l-[6px] transition-all group cursor-default shadow-lg ${getRowStyle(item.category)}`}
                    >
                      <div className="flex items-center gap-5">
                        <div className="h-14 w-14 rounded-2xl bg-black/40 flex items-center justify-center text-2xl shadow-inner border border-white/5 group-hover:scale-105 transition-all duration-500">
                          {category?.icon || "💰"}
                        </div>
                        <div>
                          <h5 className="text-[14px] font-black text-white tracking-tight group-hover:text-blue-400 transition-colors">{item.title}</h5>
                          <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.1em] mt-1 flex items-center gap-2">
                            {category?.label} <span className="h-1 w-1 bg-slate-700 rounded-full"/> 
                            {new Date(item.date).toLocaleString('en-BD', { 
                              day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true 
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                            <span className={`text-[15px] font-black tracking-tighter ${item.type === 'expense' ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {item.type === 'expense' ? '-' : '+'}{formatBDT(item.amount)}
                            </span>
                        </div>
                        {/* UPDATE: Delete button triggers custom modal */}
                        <button 
                          onClick={() => setConfirmDeleteId(item._id)} 
                          className="opacity-0 group-hover:opacity-100 p-3 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-2xl transition-all active:scale-75 border border-transparent hover:border-rose-500/20"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              {filteredItems.length === 0 && !loading && (
                <div className="h-80 flex flex-col items-center justify-center text-slate-700 italic border-2 border-white/5 border-dashed rounded-[3rem] m-6">
                  <Calculator size={40} className="mb-4 opacity-10" />
                  <p className="text-[10px] uppercase font-black tracking-[0.4em] opacity-40">Null Dataset Detected</p>
                </div>
              )}
            </div>
          </section>
        </main>
      </div>

      {/* --- ADVANCED FILTER MODAL --- */}
      <AnimatePresence>
          {showFilters && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center p-6 backdrop-blur-[20px] bg-black/80">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 20 }} 
                    animate={{ opacity: 1, scale: 1, y: 0 }} 
                    exit={{ opacity: 0, scale: 0.9, y: 20 }} 
                    className="glass-effect p-12 rounded-[4rem] border border-blue-500/20 max-w-2xl w-full space-y-10 shadow-[0_50px_100px_rgba(0,0,0,0.8)] relative overflow-hidden"
                  >
                      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50" />
                      <button onClick={() => setShowFilters(false)} className="absolute top-10 right-10 p-3 rounded-full hover:bg-white/10 text-slate-400 transition-all"><X size={24}/></button>
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                           <Filter className="text-blue-500" size={20} />
                           <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Filter Parameters</h2>
                        </div>
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">Isolate specific financial sectors</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                          <FilterField label="Classification Domain">
                              <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-[1.5rem] p-5 text-xs text-slate-200 outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all appearance-none cursor-pointer">
                                  <option value="All">Global Ledger Scope</option>
                                  {CATEGORIES.map(cat => <option key={cat.id} value={cat.id}>{cat.label}</option>)}
                              </select>
                          </FilterField>
                          <FilterField label="Temporal Bound (Start)">
                              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-[1.5rem] p-5 text-xs text-slate-200 outline-none focus:border-blue-500/50 [color-scheme:dark] cursor-pointer" />
                          </FilterField>
                          <FilterField label="Temporal Bound (End)">
                              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-[1.5rem] p-5 text-xs text-slate-200 outline-none focus:border-blue-500/50 [color-scheme:dark] cursor-pointer" />
                          </FilterField>
                          <div className="flex items-end pb-1">
                              <button onClick={clearFilters} className="w-full py-5 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95">Purge Parameters</button>
                          </div>
                      </div>
                      <button onClick={() => setShowFilters(false)} className="w-full py-6 bg-blue-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.4em] shadow-[0_20px_40px_rgba(37,99,235,0.3)] hover:bg-blue-500 transition-all active:scale-[0.98]">Synchronize View</button>
                  </motion.div>
              </motion.div>
          )}
      </AnimatePresence>

      <AddTransactionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={() => setShowToast(true)} />
    </div>
  );
};

const StatBox = ({ title, amount, icon: Icon, color, bgColor }) => (
  <div className="glass-effect p-8 rounded-[3rem] border border-white/10 relative overflow-hidden group shadow-xl">
    <div className={`absolute top-0 right-0 h-32 w-32 ${bgColor} blur-[80px] opacity-10 -mr-16 -mt-16 group-hover:opacity-30 transition-all duration-700`} />
    <div className="flex items-center gap-4 mb-6 relative z-10">
      <div className={`p-3.5 rounded-2xl ${bgColor} ${color} border border-white/5 shadow-lg`}>
        <Icon size={20} />
      </div>
      <p className="text-[11px] text-slate-400 uppercase font-black tracking-[0.2em]">{title}</p>
    </div>
    <h2 className="text-3xl font-black text-white relative z-10 tracking-tighter">
      {new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT', minimumFractionDigits: 0 }).format(amount || 0).replace("BDT", "৳")}
    </h2>
  </div>
);

const FilterField = ({ label, children }) => (
  <div className="space-y-3">
    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">{label}</label>
    {children}
  </div>
);

export default Dashboard;