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

  const executeDelete = async () => {
    if (!confirmDeleteId) return;
    setDeletingId(confirmDeleteId);
    await dispatch(removeTransaction(confirmDeleteId));
    setDeletingId(null);
    setConfirmDeleteId(null);
  };

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
          outerRadius={outerRadius + 8}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          style={{ filter: `drop-shadow(0 0 12px ${fill}44)` }}
        />
        <text x={cx} y={cy - 12} textAnchor="middle" fill="#cbd5e1" fontSize="12px" fontWeight="900" style={{ textTransform: 'uppercase', letterSpacing: '2px' }}>
          {payload.name}
        </text>
        <text x={cx} y={cy + 15} textAnchor="middle" fill="#ffffff" fontSize="18px" fontWeight="900">
          {formatBDT(value)}
        </text>
        <text x={cx} y={cy + 38} textAnchor="middle" fill={fill} fontSize="12px" fontWeight="800">
          {(percent * 100).toFixed(1)}%
        </text>
      </g>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-8 space-y-6 md:space-y-10 pb-24 min-h-screen font-sans bg-[#020617] selection:bg-blue-500/30">
      <Toast show={showToast} message="Ledger updated successfully ৳" onClose={() => setShowToast(false)} />

      {/* --- CONFIRM DELETE MODAL --- */}
      <AnimatePresence>
        {confirmDeleteId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[250] flex items-center justify-center p-4 backdrop-blur-xl bg-black/60">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="glass-effect p-6 md:p-10 rounded-[2.5rem] md:rounded-[3rem] border border-white/10 max-w-md w-full text-center shadow-2xl">
              <div className="h-16 w-16 md:h-20 md:w-20 bg-rose-500/20 text-rose-500 rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-rose-500/20">
                <AlertCircle size={32} />
              </div>
              <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter mb-3">Confirm Purge</h2>
              <p className="text-slate-300 text-xs md:text-sm font-medium leading-relaxed mb-8 md:mb-10">
                Are you sure you want to erase this sin from the Dhaka Region Terminal? This action is irreversible.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                <button onClick={() => setConfirmDeleteId(null)} className="order-2 sm:order-1 flex-1 py-4 md:py-5 rounded-2xl glass-effect text-slate-200 font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all">Cancel</button>
                <button onClick={executeDelete} disabled={deletingId} className="order-1 sm:order-2 flex-1 py-4 md:py-5 rounded-2xl bg-rose-600 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-rose-900/40 hover:bg-rose-500 transition-all active:scale-95 flex items-center justify-center">
                  {deletingId ? <Loader2 size={18} className="animate-spin" /> : "Purge Sin"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- HEADER --- */}
      <header className="flex flex-col md:flex-row justify-between items-center text-center md:text-left gap-6 border-b border-white/5 pb-8 md:pb-10">
        <div className="flex flex-col items-center md:items-start">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-3 w-3 md:h-4 md:w-4 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_20px_rgba(16,185,129,0.6)]" />
            <h1 className="text-2xl md:text-4xl font-black text-white tracking-tighter uppercase">
              BROKE<span className="text-blue-500">.</span>O<span className="text-blue-500">.</span>METER
            </h1>
          </div>
          <p className="text-slate-400 text-[10px] md:text-xs font-black uppercase tracking-[0.3em] md:tracking-[0.5em] flex items-center gap-2 md:gap-3">
            v3.0 <span className="h-1.5 w-1.5 md:h-2 md:w-2 bg-slate-800 rounded-full"/> Dhaka Terminal
          </p>
        </div>
        
        <div className="flex items-center gap-3 md:gap-4 w-full md:w-auto">
          <button onClick={handleLogout} className="flex-1 md:flex-none glass-effect px-4 md:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl text-slate-200 hover:text-rose-400 border border-white/10 flex items-center justify-center gap-2 md:gap-3 font-black text-[10px] md:text-xs uppercase tracking-widest active:scale-95 transition-all">
            <LogOut size={16} /> Logout
          </button>
          <button onClick={() => setIsModalOpen(true)} className="flex-1 md:flex-none bg-blue-600 px-4 md:px-10 py-3 md:py-4 rounded-xl md:rounded-2xl text-white shadow-[0_10px_20px_rgba(37,99,235,0.3)] border border-blue-400/20 flex items-center justify-center gap-2 md:gap-3 font-black text-[10px] md:text-xs uppercase tracking-widest active:scale-95 transition-all">
            <Plus size={18} /> Record Sin
          </button>
        </div>
      </header>

      {/* --- KPI SECTION --- */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
        <StatBox title="Net Worth" amount={stats.balance} icon={Wallet} color="text-blue-400" bgColor="bg-blue-400/10" />
        <StatBox title="Revenue" amount={stats.income} icon={ArrowUpRight} color="text-emerald-400" bgColor="bg-emerald-400/10" />
        <StatBox title="Expenses" amount={stats.expense} icon={ArrowDownLeft} color="text-rose-400" bgColor="bg-rose-400/10" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-10 items-start">
        {/* --- VISUALIZATION --- */}
        <aside className="lg:col-span-5 order-2 lg:order-1 space-y-6 md:space-y-8">
          <div className="glass-effect rounded-[2.5rem] md:rounded-[3.5rem] p-6 md:p-12 border border-white/10 relative shadow-2xl bg-white/[0.01]">
            <div className="flex items-center justify-between mb-8 md:mb-10 relative z-10">
              <div>
                <h3 className="text-xs md:text-sm font-black text-white uppercase tracking-[0.2em] md:tracking-[0.3em] mb-1">Damage Analysis</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Sector Density</p>
              </div>
              <div className="h-10 w-10 md:h-14 md:w-14 rounded-xl md:rounded-[1.25rem] bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20 shadow-xl">
                <PieIcon size={18} />
              </div>
            </div>
            
            <div className="h-[280px] md:h-[380px] w-full relative z-10 flex items-center justify-center">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie activeIndex={activeIndex} activeShape={renderActiveShape} data={chartData} innerRadius="65%" outerRadius="85%" paddingAngle={6} dataKey="value" stroke="none" onMouseEnter={(_, index) => setActiveIndex(index)} onMouseLeave={() => setActiveIndex(null)} animationDuration={1000}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={activeIndex === null || activeIndex === index ? 1 : 0.3} style={{ outline: 'none' }} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full flex flex-col items-center justify-center text-slate-500 gap-4 border-2 border-dashed border-white/10 rounded-[2.5rem]">
                  <PieIcon size={32} className="opacity-10" />
                  <p className="text-[10px] uppercase font-black tracking-[0.3em]">No Data</p>
                </div>
              )}
              {activeIndex === null && chartData.length > 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                   <p className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-[3px] mb-2">Total</p>
                   <p className="text-xl md:text-3xl font-black text-white">{formatBDT(filteredTotals.expense)}</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 md:gap-4 mt-8 md:mt-10">
               {chartData.map((item, i) => (
                 <div key={i} className={`flex flex-col gap-1 md:gap-2 p-3 md:p-4 rounded-xl md:rounded-2xl border border-white/5 transition-all ${activeIndex === i ? 'bg-white/[0.08] border-white/20' : 'bg-white/[0.03]'}`}>
                    <div className="flex items-center gap-2">
                       <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                       <span className="text-[9px] md:text-[11px] font-black text-slate-200 uppercase truncate">{item.name}</span>
                    </div>
                    <div className="flex justify-between items-end">
                       <span className="text-xs md:text-sm font-black text-white">{formatBDT(item.value)}</span>
                       <span className="text-[8px] md:text-[10px] font-bold text-slate-500">{((item.value / filteredTotals.expense) * 100).toFixed(0)}%</span>
                    </div>
                 </div>
               ))}
            </div>
          </div>
        </aside>

        {/* --- NAVIGATION & HISTORY --- */}
        <main className="lg:col-span-7 order-1 lg:order-2 space-y-6 md:space-y-8">
          <div className="space-y-4 md:space-y-5">
            <div className="flex flex-wrap gap-2 bg-black/60 p-1.5 rounded-2xl md:rounded-[2.5rem] border border-white/10 backdrop-blur-3xl shadow-inner">
                {["Daily", "Weekly", "Monthly", "Yearly"].map((tab) => (
                    <button key={tab} onClick={() => { setActiveTab(tab); setStartDate(""); setEndDate(""); }} className={`flex-1 min-w-[70px] py-3 md:py-4.5 rounded-xl md:rounded-[1.75rem] text-[9px] md:text-[11px] font-black uppercase tracking-[0.15em] md:tracking-[0.25em] transition-all ${activeTab === tab && !startDate && !endDate ? "bg-white/10 text-white shadow-xl border border-white/10" : "text-slate-500 hover:text-slate-200"}`}>
                        {tab}
                    </button>
                ))}
            </div>
            <button onClick={() => setShowFilters(true)} className="w-full flex items-center justify-center gap-3 py-4 md:py-6 rounded-2xl md:rounded-[2.5rem] border glass-effect border-white/10 text-slate-200 font-black text-[10px] md:text-xs uppercase tracking-[0.3em] md:tracking-[0.4em] active:scale-95 shadow-2xl">
                <Filter size={16} className="text-blue-500" /> Filter Terminal
            </button>
          </div>

          <section className="glass-effect rounded-[2.5rem] md:rounded-[3.5rem] border border-white/10 shadow-2xl overflow-hidden flex flex-col min-h-[500px] md:min-h-[650px] bg-white/[0.01]">
            <div className="px-6 md:px-12 py-8 md:py-12 space-y-8 md:space-y-10">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
                <div>
                  <h3 className="text-xl md:text-2xl font-black text-white tracking-tighter mb-1 md:mb-2 uppercase">
                    {startDate || endDate ? 'Filtered Result' : `${activeTab} History`}
                  </h3>
                  <div className="flex items-center gap-2 text-slate-400">
                    <CalendarDays size={14} className="text-blue-500" />
                    <span className="text-[10px] md:text-xs font-black uppercase tracking-widest">{filteredItems.length} Syncs</span>
                  </div>
                </div>
                {showFilters && (
                  <div className="flex gap-6 md:gap-8 border-l border-white/10 pl-6 md:pl-10 items-center">
                     <div className="text-right">
                        <p className="text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">In</p>
                        <p className="text-sm md:text-lg font-black text-emerald-400">+{formatBDT(filteredTotals.income)}</p>
                     </div>
                     <div className="text-right border-l border-white/10 pl-6 md:pl-8">
                        <p className="text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Out</p>
                        <p className="text-sm md:text-lg font-black text-rose-400">-{formatBDT(filteredTotals.expense)}</p>
                     </div>
                  </div>
                )}
              </div>

              <div className="relative group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-all duration-500" size={18} />
                <input type="text" placeholder="Scan sin description..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl md:rounded-[2rem] py-4 md:py-6 pl-14 md:pl-16 pr-6 text-sm md:text-base text-slate-100 outline-none focus:bg-black/80 transition-all placeholder:text-slate-700 font-bold" />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar px-4 md:px-6 pb-12 space-y-3">
              <AnimatePresence mode="popLayout">
                {filteredItems.map((item) => {
                  const category = CATEGORIES.find(c => c.id === item.category);
                  return (
                    <motion.div key={item._id} layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.95 }} className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 md:p-6 rounded-2xl md:rounded-[2.25rem] border-l-[6px] md:border-l-[8px] gap-4 transition-all group shadow-xl ${getRowStyle(item.category)}`}>
                      <div className="flex items-center gap-4 md:gap-6">
                        <div className="h-12 w-12 md:h-16 md:w-16 rounded-xl md:rounded-2xl bg-black/40 flex items-center justify-center text-xl md:text-3xl border border-white/5">
                          {category?.icon || "💰"}
                        </div>
                        <div>
                          <h5 className="text-sm md:text-lg font-black text-white tracking-tight uppercase truncate max-w-[150px] md:max-w-none">{item.title}</h5>
                          <p className="text-[9px] md:text-[11px] text-slate-300 font-black uppercase tracking-widest mt-1">
                            {category?.label} • {new Date(item.date).toLocaleString('en-BD', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between w-full sm:w-auto gap-4 md:gap-8">
                        <span className={`text-lg md:text-xl font-black tracking-tighter ${item.type === 'expense' ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {item.type === 'expense' ? '-' : '+'}{formatBDT(item.amount)}
                        </span>
                        <button onClick={() => setConfirmDeleteId(item._id)} className="p-3 text-slate-400 hover:text-rose-400 sm:opacity-0 group-hover:opacity-100 transition-all">
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </section>
        </main>
      </div>

      {/* --- FILTER MODAL --- */}
      <AnimatePresence>
          {showFilters && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center p-4 backdrop-blur-[20px] bg-black/80">
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="glass-effect p-8 md:p-16 rounded-[3rem] md:rounded-[4.5rem] border border-blue-500/20 max-w-2xl w-full space-y-8 md:space-y-12 shadow-2xl relative">
                      <button onClick={() => setShowFilters(false)} className="absolute top-8 right-8 p-3 rounded-full hover:bg-white/10 text-slate-400"><X size={24}/></button>
                      <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                         <Filter className="text-blue-500" size={24} /> Settings
                      </h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-10">
                          <FilterField label="Sector">
                              <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-2xl p-5 text-sm text-slate-100 outline-none">
                                  <option value="All">All Sectors</option>
                                  {CATEGORIES.map(cat => <option key={cat.id} value={cat.id}>{cat.label}</option>)}
                              </select>
                          </FilterField>
                          <div className="flex items-end">
                              <button onClick={clearFilters} className="w-full py-5 bg-rose-500/10 text-rose-500 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all">Clear Filters</button>
                          </div>
                          <FilterField label="Start Date">
                              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-2xl p-5 text-sm text-slate-100 [color-scheme:dark]" />
                          </FilterField>
                          <FilterField label="End Date">
                              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-2xl p-5 text-sm text-slate-100 [color-scheme:dark]" />
                          </FilterField>
                      </div>
                      <button onClick={() => setShowFilters(false)} className="w-full py-6 bg-blue-600 text-white rounded-3xl font-black text-xs uppercase tracking-[0.4em] active:scale-[0.98] shadow-lg">Synchronize</button>
                  </motion.div>
              </motion.div>
          )}
      </AnimatePresence>

      <AddTransactionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={() => setShowToast(true)} />
    </div>
  );
};

const StatBox = ({ title, amount, icon: Icon, color, bgColor }) => (
  <div className="glass-effect p-6 md:p-10 rounded-3xl md:rounded-[3.5rem] border border-white/10 relative overflow-hidden group shadow-2xl transition-all">
    <div className={`absolute top-0 right-0 h-32 w-32 md:h-40 md:w-40 ${bgColor} blur-[80px] md:blur-[100px] opacity-10 -mr-16 -mt-16 group-hover:opacity-30 transition-all duration-700`} />
    <div className="flex items-center gap-4 mb-6 relative z-10">
      <div className={`p-3 md:p-4 rounded-xl md:rounded-2xl ${bgColor} ${color} border border-white/5`}>
        <Icon size={20} />
      </div>
      <p className="text-[10px] md:text-xs text-slate-400 uppercase font-black tracking-widest">{title}</p>
    </div>
    <h2 className="text-2xl md:text-4xl font-black text-white relative z-10 tracking-tighter">
      {new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT', minimumFractionDigits: 0 }).format(amount || 0).replace("BDT", "৳")}
    </h2>
  </div>
);

const FilterField = ({ label, children }) => (
  <div className="space-y-3">
    <label className="text-[10px] md:text-xs font-black text-slate-300 uppercase tracking-widest ml-2">{label}</label>
    {children}
  </div>
);

export default Dashboard;