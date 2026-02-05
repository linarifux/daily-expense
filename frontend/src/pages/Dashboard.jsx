import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchTransactions,
  removeTransaction,
} from "../features/transactions/transactionSlice";
import { logoutLocal } from "../features/auth/authSlice";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as ReTooltip,
} from "recharts";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Plus,
  LogOut,
  Trash2,
  Loader2,
  Search,
  Filter,
  X,
  Calculator,
  ArrowUpRight,
  ArrowDownLeft,
  LayoutDashboard,
  History,
  PieChartIcon,
  Calendar as CalIcon,
  SortAsc,
} from "lucide-react";
import AddTransactionModal from "../components/AddTransactionModal";
import { CATEGORIES } from "../utils/categories";
import { twMerge } from "tailwind-merge";
import { clsx } from "clsx";

const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, stats, loading } = useSelector((state) => state.transactions);
  const { user } = useSelector((state) => state.auth);

  // Core UI States
  const [activeTab, setActiveTab] = useState("Daily");
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  // Advanced Filter States
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortOrder, setSortOrder] = useState("newest"); // newest, oldest, highest, lowest

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
    if (window.confirm("Erase this sin from existence?")) {
      setDeletingId(id);
      await dispatch(removeTransaction(id));
      setDeletingId(null);
    }
  };

  const getRowStyle = (catId) => {
    const categoryMap = {
      food: "border-l-orange-500 bg-orange-500/[0.03]",
      medical: "border-l-rose-500 bg-rose-500/[0.03]",
      tech: "border-l-blue-500 bg-blue-500/[0.03]",
      work: "border-l-emerald-500 bg-emerald-500/[0.03]",
      transport: "border-l-purple-500 bg-purple-500/[0.03]",
      rent: "border-l-amber-500 bg-amber-500/[0.03]",
      shopping: "border-l-pink-500 bg-pink-500/[0.03]",
      entertainment: "border-l-indigo-500 bg-indigo-500/[0.03]",
      other: "border-l-slate-500 bg-slate-500/[0.03]",
    };
    return categoryMap[catId] || categoryMap.other;
  };

  // --- ROBUST FILTERING & SORTING LOGIC ---
  const { filteredItems, filteredTotals, chartData } = useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));

    let filtered = items.filter((item) => {
      const itemDate = new Date(item.createdAt);
      
      // 1. Search Logic
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
      
      // 2. Category Logic
      const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
      
      // 3. Custom Date Range Logic (Overrides Tabs if active)
      const start = startDate ? new Date(startDate).setHours(0, 0, 0, 0) : null;
      const end = endDate ? new Date(endDate).setHours(23, 59, 59, 999) : null;
      const matchesCustomDate = (!start || itemDate >= start) && (!end || itemDate <= end);

      if (!matchesSearch || !matchesCategory || !matchesCustomDate) return false;

      // 4. Tab Logic (Only applies if no custom date range is set)
      if (startDate || endDate) return true;
      if (activeTab === "Daily") return itemDate >= startOfDay;
      if (activeTab === "Weekly") {
        const sunday = new Date();
        sunday.setDate(now.getDate() - now.getDay());
        return itemDate >= sunday;
      }
      if (activeTab === "Monthly") return itemDate.getMonth() === new Date().getMonth();
      
      return true; // "All" tab or Yearly
    });

    // 5. Sorting Logic
    filtered.sort((a, b) => {
      if (sortOrder === "newest") return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortOrder === "oldest") return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortOrder === "highest") return b.amount - a.amount;
      if (sortOrder === "lowest") return a.amount - b.amount;
      return 0;
    });

    // 6. Calculate Dynamic Totals for Filtered View
    const totals = filtered.reduce((acc, curr) => {
      if (curr.type === 'income') acc.income += Number(curr.amount);
      else acc.expense += Number(curr.amount);
      return acc;
    }, { income: 0, expense: 0 });

    const chart = CATEGORIES.map((cat) => ({
      name: cat.label,
      value: filtered
        .filter((i) => i.category === cat.id && i.type === "expense")
        .reduce((a, b) => a + Number(b.amount), 0),
      color: getRowStyle(cat.id).split(" ")[0].replace("border-l-", ""),
    })).filter((c) => c.value > 0);

    return { filteredItems: filtered, filteredTotals: totals, chartData: chart };
  }, [items, activeTab, searchQuery, selectedCategory, startDate, endDate, sortOrder]);

  const formatBDT = (amount) =>
    new Intl.NumberFormat("en-BD", {
      style: "currency",
      currency: "BDT",
      minimumFractionDigits: 0,
    }).format(amount || 0).replace("BDT", "৳");

  const resetFilters = () => {
    setSelectedCategory("All");
    setStartDate("");
    setEndDate("");
    setSearchQuery("");
    setSortOrder("newest");
  };

  return (
    <div className="min-h-screen w-full bg-[#020617] text-slate-200 flex items-center justify-center p-0 md:p-6 lg:p-8 font-sans overflow-x-hidden">
      <div className="fixed inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-purple-600/10 blur-[120px] animate-pulse delay-1000" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-[1200px] h-full md:h-[850px] flex flex-col md:flex-row gap-0 md:gap-6 lg:gap-8 bg-slate-900/40 backdrop-blur-3xl md:rounded-[3rem] border border-white/5 shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden"
      >
        {/* SIDEBAR */}
        <aside className="w-full md:w-[320px] lg:w-[380px] bg-white/[0.02] border-r border-white/5 p-8 flex flex-col justify-between overflow-y-auto custom-scrollbar">
          <div className="space-y-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-black text-xl shadow-lg shadow-blue-500/20 uppercase">
                  {user?.username?.[0]}
                </div>
                <div>
                  <h3 className="font-bold text-white leading-none tracking-tight">Naim On Web</h3>
                  <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Premium Member</span>
                </div>
              </div>
              <button onClick={handleLogout} className="p-2.5 rounded-xl hover:bg-rose-500/10 text-slate-500 hover:text-rose-500 transition-all"><LogOut size={20} /></button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-slate-500">
                <LayoutDashboard size={14} /><span className="text-[10px] font-black uppercase tracking-[0.2em]">Live Survival Fund</span>
              </div>
              <h1 className="text-5xl font-black text-white tracking-tighter drop-shadow-sm">{formatBDT(stats.balance)}</h1>
              <div className="flex gap-2">
                <div className="flex-1 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/10 flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-500"><ArrowUpRight size={14} /></div>
                  <span className="text-[11px] font-black text-emerald-500">{formatBDT(stats.income)}</span>
                </div>
                <div className="flex-1 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/10 flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-500"><ArrowDownLeft size={14} /></div>
                  <span className="text-[11px] font-black text-rose-500">{formatBDT(stats.expense)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-6 pt-4">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2">
                <PieChartIcon size={12} className="text-blue-500" /> Expense Breakdown
              </h4>
              <div className="h-64 w-full relative group">
                <div className="absolute inset-0 bg-blue-500/5 blur-[50px] rounded-full scale-75" />
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <defs>
                      {chartData.map((entry, index) => (
                        <linearGradient id={`grad-${index}`} key={index} x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor={entry.color} stopOpacity={0.8} />
                          <stop offset="100%" stopColor={entry.color} stopOpacity={0.4} />
                        </linearGradient>
                      ))}
                    </defs>
                    <Pie data={chartData} innerRadius={72} outerRadius={92} paddingAngle={10} dataKey="value" stroke="none" cornerRadius={6}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={`url(#grad-${index})`} className="focus:outline-none" />
                      ))}
                    </Pie>
                    <ReTooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '16px', fontSize: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[9px] uppercase font-black text-slate-500 mb-1">Damage</span>
                  <span className="text-xl font-black text-white">{formatBDT(filteredTotals.expense)}</span>
                </div>
              </div>
            </div>
          </div>

          <button onClick={() => setIsModalOpen(true)} className="mt-8 w-full py-5 rounded-[1.5rem] bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-[0.2em] text-[11px] shadow-xl shadow-blue-600/30 transition-all flex items-center justify-center gap-3">
            <Plus size={18} /> Add New Entry
          </button>
        </aside>

        {/* MAIN HISTORY AREA */}
        <main className="flex-1 p-6 md:p-10 flex flex-col min-h-0 relative">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-black text-white tracking-tight">Recent <span className="text-blue-500">History</span></h2>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={twMerge(clsx(
                "p-3 rounded-2xl border transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest",
                showFilters ? "bg-blue-600 border-blue-500 text-white shadow-lg" : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"
              ))}
            >
              <Filter size={16} /> Filters
            </button>
          </div>

          {/* ADVANCED FILTER PANEL */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0, marginBottom: 0 }}
                animate={{ height: 'auto', opacity: 1, marginBottom: 24 }}
                exit={{ height: 0, opacity: 0, marginBottom: 0 }}
                className="overflow-hidden bg-white/[0.03] rounded-3xl border border-white/5"
              >
                <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-500 uppercase ml-1">Sort By</label>
                    <select 
                      value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}
                      className="w-full bg-black/40 border border-white/5 rounded-xl px-3 py-2 text-[11px] text-slate-200 outline-none focus:border-blue-500/50"
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="highest">Highest Amount</option>
                      <option value="lowest">Lowest Amount</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-500 uppercase ml-1">Category</label>
                    <select 
                      value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full bg-black/40 border border-white/5 rounded-xl px-3 py-2 text-[11px] text-slate-200 outline-none focus:border-blue-500/50"
                    >
                      <option value="All">All Categories</option>
                      {CATEGORIES.map(cat => <option key={cat.id} value={cat.id}>{cat.label}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-500 uppercase ml-1 flex items-center gap-1"><CalIcon size={8}/> From</label>
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-xl px-3 py-2 text-[11px] text-slate-200 outline-none [color-scheme:dark]" />
                  </div>
                  <div className="flex items-end">
                    <button onClick={resetFilters} className="w-full py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2">
                      <X size={12} /> Clear All
                    </button>
                  </div>
                </div>
                
                {/* Result Sumary Bar */}
                <div className="px-6 py-3 bg-white/5 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Calculator size={12} className="text-blue-500" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filter Result:</span>
                    </div>
                    <div className="flex gap-4">
                        <span className="text-[11px] font-black text-emerald-400">+{formatBDT(filteredTotals.income)}</span>
                        <span className="text-[11px] font-black text-rose-400">-{formatBDT(filteredTotals.expense)}</span>
                    </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* SEARCH & TABS */}
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex p-1 bg-black/40 rounded-2xl border border-white/5">
              {["Daily", "Weekly", "Monthly", "All"].map((t) => (
                <button
                  key={t} onClick={() => { setActiveTab(t); setStartDate(""); setEndDate(""); }}
                  className={twMerge(clsx(
                    "flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                    activeTab === t && !startDate ? "bg-white/10 text-blue-400 shadow-inner" : "text-slate-500 hover:text-slate-300",
                  ))}
                >{t}</button>
              ))}
            </div>
            <div className="relative group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500 transition-colors" size={18}/>
              <input
                type="text" placeholder="Search by description..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-sm text-white focus:outline-none focus:border-blue-500/30 focus:bg-white/[0.05] transition-all"
              />
            </div>
          </div>

          {/* LIST CONTAINER */}
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 -mr-2">
            <div className="space-y-3">
              <AnimatePresence mode="popLayout" initial={false}>
                {filteredItems.length > 0 ? (
                  filteredItems.map((item) => {
                    const category = CATEGORIES.find((c) => c.id === item.category);
                    return (
                      <motion.div
                        key={item._id} layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className={twMerge(clsx(
                          "flex items-center justify-between p-4 rounded-3xl border-l-[6px] transition-all group hover:bg-white/[0.06]",
                          getRowStyle(item.category),
                        ))}
                      >
                        <div className="flex items-center gap-5">
                          <div className="h-12 w-12 rounded-2xl bg-slate-950/50 flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition-transform">
                            {category?.icon}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">{item.title}</h4>
                            <p className="text-[10px] uppercase font-black text-slate-500 tracking-tighter">
                              {category?.label} • {new Date(item.createdAt).toLocaleDateString("en-BD", { day: "2-digit", month: "short" })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <span className={clsx("text-sm font-black font-mono tracking-tighter", item.type === "expense" ? "text-rose-400" : "text-emerald-400")}>
                            {item.type === "expense" ? "-" : "+"}{formatBDT(item.amount)}
                          </span>
                          <button onClick={() => handleDelete(item._id)} className="opacity-0 group-hover:opacity-100 p-2.5 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all transform hover:rotate-12">
                            {deletingId === item._id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                          </button>
                        </div>
                      </motion.div>
                    );
                  })
                ) : (
                  <div className="h-full flex flex-col items-center justify-center py-20 text-slate-600">
                    <History size={40} className="mb-4 opacity-20" /><p className="text-xs uppercase font-black tracking-widest italic">No matching sins found</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </main>
      </motion.div>

      <AddTransactionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

export default Dashboard;