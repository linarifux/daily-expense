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
        <text x={cx} y={cy - 12} textAnchor="middle" fill="#cbd5e1" fontSize="12px" fontWeight="900" style={{ textTransform: 'uppercase', letterSpacing: '2px' }}>
          {payload.name}
        </text>
        <text x={cx} y={cy + 15} textAnchor="middle" fill="#ffffff" fontSize="20px" fontWeight="900">
          {formatBDT(value)}
        </text>
        <text x={cx} y={cy + 38} textAnchor="middle" fill={fill} fontSize="13px" fontWeight="800">
          {(percent * 100).toFixed(1)}%
        </text>
      </g>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-8 space-y-10 pb-24 min-h-screen font-sans bg-[#020617] selection:bg-blue-500/30">
      <Toast show={showToast} message="Ledger updated successfully ৳" onClose={() => setShowToast(false)} />

      {/* --- CONFIRM DELETE MODAL --- */}
      <AnimatePresence>
        {confirmDeleteId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[250] flex items-center justify-center p-6 backdrop-blur-xl bg-black/60">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="glass-effect p-10 rounded-[3rem] border border-white/10 max-w-md w-full text-center shadow-2xl">
              <div className="h-20 w-20 bg-rose-500/20 text-rose-500 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-rose-500/20">
                <AlertCircle size={40} />
              </div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-3">Confirm Purge</h2>
              <p className="text-slate-300 text-sm font-medium leading-relaxed mb-10">
                Are you sure you want to erase this sin from the Dhaka Region Terminal? This action is irreversible.
              </p>
              <div className="flex gap-4">
                <button onClick={() => setConfirmDeleteId(null)} className="flex-1 py-5 rounded-2xl glass-effect text-slate-200 font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all">Cancel</button>
                <button onClick={executeDelete} disabled={deletingId} className="flex-1 py-5 rounded-2xl bg-rose-600 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-rose-900/40 hover:bg-rose-500 transition-all active:scale-95 flex items-center justify-center">
                  {deletingId ? <Loader2 size={18} className="animate-spin" /> : "Purge Sin"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- HEADER --- */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 border-b border-white/5 pb-10">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <div className="h-4 w-4 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_20px_rgba(16,185,129,0.6)]" />
            <h1 className="text-4xl font-black text-white tracking-tighter">
              BROKE<span className="text-blue-500">.</span>O<span className="text-blue-500">.</span>METER
            </h1>
          </div>
          <p className="text-slate-400 text-xs font-black uppercase tracking-[0.5em] flex items-center gap-3">
            Terminal OS v3.0 <span className="h-2 w-2 bg-slate-800 rounded-full"/> Dhaka Region
          </p>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <button onClick={handleLogout} className="flex-1 md:flex-none glass-effect px-8 py-4 rounded-2xl text-slate-200 hover:text-rose-400 hover:bg-rose-500/10 transition-all border border-white/10 flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest active:scale-95">
            <LogOut size={18} /> Logout
          </button>
          <button onClick={() => setIsModalOpen(true)} className="flex-1 md:flex-none bg-blue-600 px-10 py-4 rounded-2xl text-white shadow-[0_15px_30px_rgba(37,99,235,0.4)] hover:bg-blue-500 transition-all border border-blue-400/20 flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest active:scale-95">
            <Plus size={20} /> Record Sin
          </button>
        </div>
      </header>

      {/* --- KPI SECTION --- */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatBox title="Net Worth" amount={stats.balance} icon={Wallet} color="text-blue-400" bgColor="bg-blue-400/10" />
        <StatBox title="Revenue" amount={stats.income} icon={ArrowUpRight} color="text-emerald-400" bgColor="bg-emerald-400/10" />
        <StatBox title="Expenses" amount={stats.expense} icon={ArrowDownLeft} color="text-rose-400" bgColor="bg-rose-400/10" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* --- VISUALIZATION --- */}
        <aside className="lg:col-span-5 space-y-8">
          <div className="glass-effect rounded-[3.5rem] p-12 border border-white/10 relative overflow-hidden shadow-2xl bg-white/[0.01]">
            <div className="flex items-center justify-between mb-10 relative z-10">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-[0.3em] mb-1">Damage Analysis</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Sector Concentration</p>
              </div>
              <div className="h-14 w-14 rounded-[1.25rem] bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20 shadow-xl">
                <PieIcon size={24} />
              </div>
            </div>
            
            <div className="h-[380px] w-full relative z-10 flex items-center justify-center">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie activeIndex={activeIndex} activeShape={renderActiveShape} data={chartData} innerRadius={100} outerRadius={130} paddingAngle={8} dataKey="value" stroke="none" onMouseEnter={(_, index) => setActiveIndex(index)} onMouseLeave={() => setActiveIndex(null)} animationDuration={1000}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={activeIndex === null || activeIndex === index ? 1 : 0.3} style={{ outline: 'none', transition: 'all 0.5s ease' }} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full flex flex-col items-center justify-center text-slate-500 gap-4 border-2 border-dashed border-white/10 rounded-[3rem]">
                  <PieIcon size={48} className="opacity-10" />
                  <p className="text-xs uppercase font-black tracking-[0.4em]">Terminal Empty</p>
                </div>
              )}
              {activeIndex === null && chartData.length > 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-[4px] mb-3">Total Sin</p>
                   <p className="text-3xl font-black text-white">{formatBDT(filteredTotals.expense)}</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 mt-10">
               {chartData.map((item, i) => (
                 <div key={i} className={`flex flex-col gap-2 p-4 rounded-2xl border border-white/5 transition-all ${activeIndex === i ? 'bg-white/[0.08] border-white/20' : 'bg-white/[0.03]'}`} onMouseEnter={() => setActiveIndex(i)} onMouseLeave={() => setActiveIndex(null)}>
                    <div className="flex items-center gap-3">
                       <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                       <span className="text-[11px] font-black text-slate-200 uppercase truncate">{item.name}</span>
                    </div>
                    <div className="flex justify-between items-end">
                       <span className="text-sm font-black text-white">{formatBDT(item.value)}</span>
                       <span className="text-[10px] font-bold text-slate-500">{((item.value / filteredTotals.expense) * 100).toFixed(0)}%</span>
                    </div>
                 </div>
               ))}
            </div>
          </div>
        </aside>

        {/* --- NAVIGATION & HISTORY --- */}
        <main className="lg:col-span-7 space-y-8">
          <div className="space-y-5">
            <div className="flex gap-3 bg-black/60 p-2.5 rounded-[2.5rem] border border-white/10 backdrop-blur-3xl shadow-inner">
                {["Daily", "Weekly", "Monthly", "Yearly"].map((tab) => (
                    <button key={tab} onClick={() => { setActiveTab(tab); setStartDate(""); setEndDate(""); }} className={`flex-1 py-4.5 rounded-[1.75rem] text-[11px] font-black uppercase tracking-[0.25em] transition-all ${activeTab === tab && !startDate && !endDate ? "bg-white/10 text-white shadow-xl border border-white/10" : "text-slate-500 hover:text-slate-200 hover:bg-white/5"}`}>
                        {tab}
                    </button>
                ))}
            </div>
            <button onClick={() => setShowFilters(true)} className="w-full flex items-center justify-center gap-4 py-6 rounded-[2.5rem] border glass-effect border-white/10 text-slate-200 font-black text-xs uppercase tracking-[0.4em] hover:border-white/30 hover:bg-white/5 transition-all active:scale-95 shadow-2xl">
                <Filter size={20} className="text-blue-500" /> Advanced Parameters
            </button>
          </div>

          <section className="glass-effect rounded-[3.5rem] border border-white/10 shadow-2xl overflow-hidden flex flex-col min-h-[650px] bg-white/[0.01]">
            <div className="px-12 py-12 space-y-10">
              <div className="flex justify-between items-end">
                <div>
                  <h3 className="text-2xl font-black text-white tracking-tighter mb-2 uppercase">
                    {startDate || endDate ? 'Filtered Result' : `${activeTab} History`}
                  </h3>
                  <div className="flex items-center gap-3 text-slate-400">
                    <CalendarDays size={16} className="text-blue-500" />
                    <span className="text-xs font-black uppercase tracking-[0.25em]">{filteredItems.length} Sync Records</span>
                  </div>
                </div>
                {showFilters && (
                  <div className="hidden md:flex gap-8 border-l border-white/10 pl-10 h-14 items-center">
                     <div className="text-right">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Inbound</p>
                        <p className="text-lg font-black text-emerald-400">+{formatBDT(filteredTotals.income)}</p>
                     </div>
                     <div className="text-right border-l border-white/10 pl-8">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Outbound</p>
                        <p className="text-lg font-black text-rose-400">-{formatBDT(filteredTotals.expense)}</p>
                     </div>
                  </div>
                )}
              </div>

              <div className="relative group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-all duration-500" size={22} />
                <input type="text" placeholder="Scan sin description..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-[2rem] py-6 pl-16 pr-8 text-base text-slate-100 outline-none focus:bg-black/80 focus:border-blue-500/50 transition-all placeholder:text-slate-600 font-bold" />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar px-6 pb-12 space-y-4">
              <AnimatePresence mode="popLayout">
                {filteredItems.map((item) => {
                  const category = CATEGORIES.find(c => c.id === item.category);
                  return (
                    <motion.div key={item._id} layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.95 }} className={`flex items-center justify-between p-6 rounded-[2.25rem] border-l-[8px] transition-all group cursor-default shadow-xl ${getRowStyle(item.category)}`}>
                      <div className="flex items-center gap-6">
                        <div className="h-12 w-12 rounded-2xl bg-black/40 flex items-center justify-center text-2xl shadow-inner border border-white/5 group-hover:scale-110 transition-all duration-500">
                          {category?.icon || "💰"}
                        </div>
                        <div>
                          <h5 className="text-md font-black text-white tracking-tight group-hover:text-blue-400 transition-colors uppercase">{item.title}</h5>
                          <p className="text-[11px] text-slate-300 font-black uppercase tracking-[0.15em] mt-1.5 flex items-center gap-3">
                            {category?.label} <span className="h-1.5 w-1.5 bg-slate-700 rounded-full"/> 
                            {new Date(item.date).toLocaleString('en-BD', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-8">
                        <span className={`text-xl font-black tracking-tighter ${item.type === 'expense' ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {item.type === 'expense' ? '-' : '+'}{formatBDT(item.amount)}
                        </span>
                        <button onClick={() => setConfirmDeleteId(item._id)} className="opacity-0 group-hover:opacity-100 p-4 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-2xl transition-all active:scale-75">
                          <Trash2 size={24} />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              {filteredItems.length === 0 && !loading && (
                <div className="h-96 flex flex-col items-center justify-center text-slate-700 border-2 border-white/5 border-dashed rounded-[4rem] m-6">
                  <Calculator size={56} className="mb-6 opacity-10" />
                  <p className="text-sm uppercase font-black tracking-[0.5em] opacity-40">Zero Data Stream</p>
                </div>
              )}
            </div>
          </section>
        </main>
      </div>

      {/* --- FILTER MODAL --- */}
      <AnimatePresence>
          {showFilters && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center p-6 backdrop-blur-[30px] bg-black/80">
                  <motion.div initial={{ opacity: 0, scale: 0.9, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 30 }} className="glass-effect p-16 rounded-[4.5rem] border border-blue-500/20 max-w-3xl w-full space-y-12 shadow-2xl relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-2.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50" />
                      <button onClick={() => setShowFilters(false)} className="absolute top-12 right-12 p-4 rounded-full hover:bg-white/10 text-slate-400 transition-all active:scale-90"><X size={32}/></button>
                      <div>
                        <div className="flex items-center gap-5 mb-3">
                           <Filter className="text-blue-500" size={28} />
                           <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Terminal Settings</h2>
                        </div>
                        <p className="text-xs text-slate-400 font-black uppercase tracking-[0.3em]">Configure data isolation parameters</p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                          <FilterField label="Sector Isolation">
                              <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-[1.75rem] p-6 text-sm text-slate-100 outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all appearance-none cursor-pointer font-bold">
                                  <option value="All">All Sectors</option>
                                  {CATEGORIES.map(cat => <option key={cat.id} value={cat.id}>{cat.label}</option>)}
                              </select>
                          </FilterField>
                          <div className="flex items-end">
                              <button onClick={clearFilters} className="w-full py-6 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-[1.75rem] text-xs font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 border border-rose-500/20">Purge Filters</button>
                          </div>
                          <FilterField label="Temporal Start">
                              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-[1.75rem] p-6 text-sm text-slate-100 outline-none focus:border-blue-500/50 [color-scheme:dark] cursor-pointer font-bold" />
                          </FilterField>
                          <FilterField label="Temporal End">
                              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-[1.75rem] p-6 text-sm text-slate-100 outline-none focus:border-blue-500/50 [color-scheme:dark] cursor-pointer font-bold" />
                          </FilterField>
                      </div>
                      <button onClick={() => setShowFilters(false)} className="w-full py-7 bg-blue-600 text-white rounded-[2.25rem] font-black text-sm uppercase tracking-[0.5em] shadow-[0_20px_50px_rgba(37,99,235,0.4)] hover:bg-blue-500 transition-all active:scale-[0.98]">Update Terminal View</button>
                  </motion.div>
              </motion.div>
          )}
      </AnimatePresence>

      <AddTransactionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={() => setShowToast(true)} />
    </div>
  );
};

const StatBox = ({ title, amount, icon: Icon, color, bgColor }) => (
  <div className="glass-effect p-10 rounded-[3.5rem] border border-white/10 relative overflow-hidden group shadow-2xl transition-all hover:bg-white/[0.03]">
    <div className={`absolute top-0 right-0 h-40 w-40 ${bgColor} blur-[100px] opacity-10 -mr-20 -mt-20 group-hover:opacity-30 transition-all duration-700`} />
    <div className="flex items-center gap-5 mb-8 relative z-10">
      <div className={`p-4 rounded-2xl ${bgColor} ${color} border border-white/5 shadow-2xl`}>
        <Icon size={24} />
      </div>
      <p className="text-xs text-slate-400 uppercase font-black tracking-[0.3em]">{title}</p>
    </div>
    <h2 className="text-4xl font-black text-white relative z-10 tracking-tighter">
      {new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT', minimumFractionDigits: 0 }).format(amount || 0).replace("BDT", "৳")}
    </h2>
  </div>
);

const FilterField = ({ label, children }) => (
  <div className="space-y-4">
    <label className="text-xs font-black text-slate-300 uppercase tracking-widest ml-3">{label}</label>
    {children}
  </div>
);

export default Dashboard;