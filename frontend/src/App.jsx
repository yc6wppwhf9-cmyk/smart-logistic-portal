import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Package,
    Truck,
    Calendar,
    Plus,
    CheckCircle,
    AlertCircle,
    Info,
    LayoutDashboard,
    History,
    Settings,
    ArrowRight,
    TrendingDown,
    ChevronDown,
    Trash2,
    Box,
    Scale,
    Maximize2,
    FileUp,
    RefreshCw,
    LogOut,
    User,
    Shield,
    Clock,
    Filter,
    Search,
    AlertTriangle,
    Award,
    Star,
    Key,
    EyeOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Configure axios for deployment
axios.defaults.baseURL = import.meta.env.VITE_API_URL || '';

function App() {
    const [pos, setPos] = useState([]);
    const [performance, setPerformance] = useState({});
    const [loading, setLoading] = useState(false);
    const [plans, setPlans] = useState([]);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [userRole, setUserRole] = useState(localStorage.getItem('userRole') || 'admin'); // 'admin' or 'supplier'
    const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('userRole'));
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

    // Simulate current supplier name if logged in as supplier
    const [currentSupplierName, setCurrentSupplierName] = useState("Abc Raw Material");

    const [newPo, setNewPo] = useState({
        po_number: '',
        order_date: new Date().toISOString().split('T')[0],
        supplier_name: '',
        location: 'Mumbai',
        items: [{ item_code: '', item_name: '', hsn_code: '', uom: 'Pcs', quantity: 1, rate: 0, weight_per_unit: 0, cbm_per_unit: 0 }]
    });

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    useEffect(() => {
        if (isLoggedIn) {
            fetchData();

            const timer = setInterval(() => {
                fetchData();
            }, 60000);
            return () => clearInterval(timer);
        }
    }, [isLoggedIn]);

    const fetchData = () => {
        fetchPos();
        fetchOptimization();
        fetchPerformance();
    };

    const fetchPos = async () => {
        try {
            const res = await axios.get('/api/purchase-orders');
            setPos(res.data);
        } catch (err) {
            console.error("Error fetching POs", err);
        }
    };

    const fetchOptimization = async () => {
        try {
            const res = await axios.post('/api/optimize');
            setPlans(res.data);
        } catch (err) {
            console.error("Error optimizing", err);
        }
    };

    const fetchPerformance = async () => {
        try {
            const res = await axios.get('/api/suppliers/performance');
            setPerformance(res.data);
        } catch (err) {
            console.error("Error fetching performance", err);
        }
    };

    const handleLogin = (role) => {
        setUserRole(role);
        setIsLoggedIn(true);
        localStorage.setItem('userRole', role);
    };

    const handleLogout = () => {
        setIsLoggedIn(false);
        localStorage.removeItem('userRole');
    };

    const handleUpdateStatus = async (poId, status) => {
        try {
            setLoading(true);
            const res = await axios.patch(`/api/purchase-orders/${poId}/status`, { status });
            alert(res.data.message);
            fetchData();
        } catch (err) {
            alert("Status update failed: " + (err.response?.data?.detail || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateDeliveryDate = async (poId, date) => {
        try {
            setLoading(true);
            const res = await axios.patch(`/api/purchase-orders/${poId}/delivery-date`, { expected_delivery_date: date });
            alert(res.data.message);
            fetchData();
        } catch (err) {
            alert("Update failed: " + (err.response?.data?.detail || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleSyncERPNext = async () => {
        setLoading(true);
        try {
            const res = await axios.post('/api/erpnext/sync');
            alert("ORDER SYNC: " + (res.data.message || "Refresh Complete"));
            fetchData();
        } catch (err) {
            alert("Sync failed.");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAll = async () => {
        if (!window.confirm("Format Portal Database? (Source data remains safe)")) return;
        setLoading(true);
        try {
            await axios.delete('/api/purchase-orders');
            fetchData();
        } finally {
            setLoading(false);
        }
    };

    const handleCreateShipment = async (plan) => {
        setLoading(true);
        try {
            const res = await axios.post('/api/shipments', plan);
            await fetchData();
            alert("✅ SHIPMENT DISPATCHED: All POs consolidated and synced.");
        } catch (err) {
            console.error(err);
            let detail = err.response?.data?.detail || err.message;
            if (typeof detail === 'object') {
                detail = JSON.stringify(detail);
            }
            alert(`❌ Dispatch Error: ${detail}`);
        } finally {
            setLoading(false);
        }
    };

    const loginScreen = (
        <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-black relative overflow-hidden font-sans transition-colors duration-300">
            {/* Background Logo Watermark */}
            <div className="absolute inset-0 pointer-events-none z-0 flex items-center justify-center opacity-10">
                <img src="/hs_logo.png" alt="High Spirit Watermark" className="w-[80vw] md:w-[50vw] max-w-4xl object-contain mix-blend-multiply dark:invert dark:mix-blend-screen" />
            </div>

            <div className="z-10 w-full max-w-[1200px] flex flex-col md:flex-row items-center justify-between p-8 md:p-12 gap-12">
                <div className="flex-1 text-slate-800 dark:text-white">
                    <div className="mb-12">
                        <img src="/priority_logo.png" alt="Priority Logo" className="w-48 md:w-64 max-w-full dark:invert" />
                    </div>

                    <h2 className="text-3xl md:text-4xl font-bold mb-2 tracking-tight">Powering Smarter Supply Chains for</h2>
                    <h2 className="text-4xl md:text-5xl font-black text-[#8DC63F] mb-10 tracking-tight">High Spirit Ventures</h2>

                    <div className="space-y-4 mb-12">
                        {[
                            { text: "Intelligent Inbound Routing. Every Time.", icon: <CheckCircle size={20} className="text-[#8DC63F]" /> },
                            { text: "Seamless Visibility. Stronger Operations.", icon: <CheckCircle size={20} className="text-[#8DC63F]" /> },
                            { text: "Automated Consolidation. Lower Freight Costs.", icon: <CheckCircle size={20} className="text-[#8DC63F]" /> },
                            { text: "Built for Scale, Speed & Reliability.", icon: <CheckCircle size={20} className="text-[#8DC63F]" /> }
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-3 text-lg font-medium text-slate-700 dark:text-gray-200">
                                {item.icon}
                                {item.text}
                            </div>
                        ))}
                    </div>

                    <p className="text-xs md:text-sm text-slate-500 dark:text-gray-400 font-medium max-w-xl">
                        Delivering deep operational insights and AI-driven logistics optimization to power the factory floor network.
                    </p>
                </div>

                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="w-full max-w-[450px] bg-white dark:bg-[#111111] rounded-2xl p-8 md:p-10 shadow-2xl text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold flex items-center justify-center gap-2 mb-2">
                            Welcome Back <span role="img" aria-label="wave">👋</span>
                        </h2>
                        <p className="text-sm text-slate-500 font-medium flex items-center justify-center gap-2">
                            <Key size={16} className="text-[#8DC63F]" /> Please enter your credentials to sign in!
                        </p>
                    </div>

                    <div className="space-y-5">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">User Name</label>
                            <input
                                type="text"
                                id="logistos_username"
                                placeholder="E.g., admin or supplier"
                                className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-black focus:outline-none focus:border-[#8DC63F] focus:ring-1 focus:ring-[#8DC63F] transition-all text-slate-800 dark:text-slate-100"
                            />
                            <p className="text-xs text-slate-500 mt-1">Hint: Type 'admin' or 'supplier' to test login.</p>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Password</label>
                            <div className="relative">
                                <input
                                    type="password"
                                    placeholder="Password"
                                    className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-black focus:outline-none focus:border-[#8DC63F] focus:ring-1 focus:ring-[#8DC63F] transition-all pr-10 text-slate-800 dark:text-slate-100"
                                />
                                <EyeOff size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer" />
                            </div>
                        </div>

                        <div className="flex items-center justify-between mt-6 mb-6">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-[#8DC63F] focus:ring-[#8DC63F]" />
                                <span className="text-sm font-medium text-slate-600">Remember Me</span>
                            </label>
                            <a href="#" className="text-sm font-bold text-[#6D9A2D] hover:underline">Forgot Password?</a>
                        </div>

                        <button
                            onClick={() => {
                                const val = document.getElementById('logistos_username')?.value.toLowerCase();
                                if (val === 'admin') handleLogin('admin');
                                else handleLogin('supplier');
                            }}
                            className="w-full bg-[#6D9A2D] hover:bg-[#5a8025] text-white font-bold py-3.5 rounded-lg transition-colors shadow-lg shadow-[#6D9A2D]/30"
                        >
                            Sign In
                        </button>

                        <div className="text-center mt-6 text-sm font-medium text-slate-600">
                            Don't have an account yet? <a href="#" className="text-[#6D9A2D] font-bold hover:underline">Sign up</a>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );

    if (!isLoggedIn) return loginScreen;

    // Role-based filtering
    const displayPos = userRole === 'admin'
        ? pos
        : pos.filter(p => p.supplier_name === currentSupplierName && !['Consolidated', 'Dispatch'].includes(p.status));

    const filteredPos = displayPos.filter(p => {
        const matchesSearch = p.po_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.supplier_name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDate = dateFilter ? p.order_date === dateFilter : true;
        return matchesSearch && matchesDate;
    });

    const getGradeBadge = (name) => {
        const p = performance[name];
        if (!p) return null;
        const colors = { emerald: 'text-emerald-400 bg-emerald-400/10', amber: 'text-amber-400 bg-amber-400/10', red: 'text-red-400 bg-red-400/10' };
        return (
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${colors[p.color]}`}>
                <Award size={10} /> Grade {p.grade}
            </span>
        );
    };

    return (
        <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 relative transition-colors duration-300">
            {/* Background Logo Watermark */}
            <div className="absolute inset-0 pointer-events-none z-0 flex items-center justify-center opacity-10">
                <img src="/hs_logo.png" alt="High Spirit Logo Watermark" className="w-[80vw] md:w-[50vw] max-w-4xl object-contain mix-blend-multiply dark:invert dark:mix-blend-screen" />
            </div>

            {/* Navbar */}
            <nav className="border-b border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-900/50 backdrop-blur-xl sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-3">
                            <img src="/priority_logo.png" alt="Priority Logo" className="h-8 object-contain dark:invert" />
                        </div>
                        <div className="flex items-center space-x-2 sm:space-x-4">
                            <button onClick={() => setActiveTab('dashboard')} className={`nav-link flex items-center gap-2 ${activeTab === 'dashboard' && 'bg-white/5 text-white'}`}><LayoutDashboard size={18} /> <span className="hidden md:block">DASHBOARD</span></button>
                            <button onClick={() => setActiveTab('orders')} className={`nav-link flex items-center gap-2 ${activeTab === 'orders' && 'bg-white/5 text-white'}`}><Package size={18} /> <span className="hidden md:block">ORDERS</span></button>
                            {userRole === 'admin' && <button onClick={() => setActiveTab('shipments')} className={`nav-link flex items-center gap-2 ${activeTab === 'shipments' && 'bg-white/5 text-white'}`}><History size={18} /> <span className="hidden md:block">CONSOLIDATION</span></button>}
                            <button onClick={() => setActiveTab('settings')} className={`nav-link flex items-center gap-2 ${activeTab === 'settings' && 'bg-white/5 text-white'}`}><Settings size={18} /> <span className="hidden md:block">SETTINGS</span></button>
                            <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-400 transition-colors" title="Logout"><LogOut size={20} /></button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
                <AnimatePresence mode="wait">
                    {activeTab === 'dashboard' && (
                        <motion.div key="dashboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                            {/* Summary Header */}
                            <div className="flex flex-col md:flex-row justify-between gap-6">
                                <div>
                                    <h1 className="text-2xl font-bold">WELCOME TO PRIOR1TY, {userRole === 'admin' ? 'ADMINISTRATOR' : currentSupplierName.toUpperCase()}</h1>
                                    <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Precision logistics monitoring for Prior1ty supply chain network</p>
                                </div>
                                <div className="flex gap-4">
                                    {userRole === 'admin' && (
                                        <button onClick={handleSyncERPNext} className="bg-brand-600 hover:bg-brand-500 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-bold transition-all shadow-xl shadow-brand-500/20 active:scale-95">
                                            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} /> Sync
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2 space-y-6">
                                    {userRole === 'admin' && (
                                        <div className="glass-card p-6">
                                            <h2 className="text-lg font-bold mb-6 flex items-center justify-between">
                                                <div className="flex items-center gap-2"><Star className="text-amber-500" size={20} /> Supplier Performance Ranking</div>
                                                <span className="text-xs text-slate-500">Based on On-time Delivery</span>
                                            </h2>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {Object.values(performance).length > 0 ? Object.values(performance).sort((a, b) => b.score - a.score).map(p => (
                                                    <div key={p.supplier_name} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between">
                                                        <div>
                                                            <div className="text-sm font-bold">{p.supplier_name}</div>
                                                            <div className="text-xs text-slate-500">Reliability: {p.reliability}</div>
                                                        </div>
                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 ${p.grade === 'A' ? 'text-emerald-400 border-emerald-400/30' : p.grade === 'B' ? 'text-amber-400 border-amber-400/30' : 'text-red-400 border-red-400/30'}`}>
                                                            {p.grade}
                                                        </div>
                                                    </div>
                                                )) : <div className="col-span-2 text-center py-4 text-slate-600 italic">Historical data needed for grading</div>}
                                            </div>
                                        </div>
                                    )}

                                    {userRole === 'admin' && (
                                        <div className="glass-card p-6 border-b-4 border-brand-500/20">
                                            <h2 className="text-lg font-bold mb-6 flex items-center gap-2 uppercase tracking-tight text-white"><Box className="text-brand-400" size={20} /> SUPPLY PIPELINE MONITOR</h2>
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-xs">
                                                    <thead>
                                                        <tr className="text-slate-500 border-b border-white/5 uppercase font-bold tracking-widest text-[10px]">
                                                            <th className="py-3 text-left">MATERIAL NAME</th>
                                                            <th className="py-3 text-center">QTY</th>
                                                            <th className="py-3 text-right">SUPPLY STATUS</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-white/5">
                                                        {pos.filter(p => ['Open', 'Confirmed'].includes(p.status)).flatMap(p => p.items).slice(0, 5).map((item, i) => {
                                                            const po = pos.find(p => p.id === item.po_id);
                                                            const grade = performance[po?.supplier_name]?.grade || 'B';
                                                            return (
                                                                <tr key={i} className="hover:bg-white/5 transition-all">
                                                                    <td className="py-3 font-bold">{item.item_name}</td>
                                                                    <td className="py-3 text-center font-mono">{item.quantity} {item.uom}</td>
                                                                    <td className="py-3 text-right">
                                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${po?.status === 'Dispatch' ? 'bg-emerald-500/10 text-emerald-400' :
                                                                            po?.status === 'Open' ? 'bg-amber-500/10 text-amber-500' :
                                                                                'bg-brand-500/10 text-brand-400'
                                                                            }`}>
                                                                            {po?.status || 'OPEN'}
                                                                        </span>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                        {pos.filter(p => ['Open', 'Confirmed'].includes(p.status)).length === 0 && (
                                                            <tr><td colSpan="3" className="py-8 text-center text-slate-500 italic uppercase">All materials are secured</td></tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}

                                    <div className="glass-card p-6">
                                        <h2 className="text-lg font-bold mb-6 flex items-center gap-2"><Clock className="text-brand-500" size={20} /> Recent Activity Timeline</h2>
                                        <div className="space-y-4">
                                            {displayPos.slice(0, 5).map(p => (
                                                <div key={p.id} className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-brand-500/30 transition-all group">
                                                    <div className={`status-signal ${p.status === 'Cancelled' ? 'status-signal-red' : p.status === 'Consolidated' ? 'status-signal-blue' : p.date_change_count >= 2 ? 'status-signal-yellow' : 'status-signal-green'}`} />
                                                    <div className="flex-grow">
                                                        <div className="font-bold flex items-center gap-2">
                                                            {p.po_number}
                                                            {userRole === 'admin' && getGradeBadge(p.supplier_name)}
                                                        </div>
                                                        <div className="text-xs text-slate-400">{p.supplier_name}</div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-xs font-bold text-brand-400">ETA: {p.expected_delivery_date || 'TBD'}</div>
                                                        <div className="text-[10px] text-slate-500 uppercase tracking-widest">{p.status}</div>
                                                    </div>
                                                </div>
                                            ))}
                                            {displayPos.length === 0 && <div className="text-center py-12 text-slate-500">No active POs found</div>}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="glass-card p-6 border border-white/5">
                                        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300 mb-4">Live Load Monitor</h3>
                                        <div className="space-y-6">
                                            <div>
                                                <div className="flex justify-between text-xs mb-2">
                                                    <span className="text-slate-400 font-bold uppercase">Ready to Dispatch</span>
                                                    <span className="text-white font-bold">{pos.filter(p => ['Completed', 'Dispatch'].includes(p.status)).length} / {pos.filter(p => p.status !== 'Cancelled').length} Orders</span>
                                                </div>
                                                <div className="h-1.5 bg-black/40 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-brand-500 transition-all duration-1000"
                                                        style={{ width: `${(pos.filter(p => ['Completed', 'Dispatch'].includes(p.status)).length / (pos.filter(p => p.status !== 'Cancelled').length || 1)) * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                                    <div className="text-2xl font-bold text-emerald-400 whitespace-nowrap">
                                                        {Math.round((pos.filter(p => ['Completed', 'Dispatch'].includes(p.status)).length / (pos.filter(p => p.status !== 'Cancelled').length || 1)) * 100) || 0}
                                                        <span className="text-[10px] ml-1">%</span>
                                                    </div>
                                                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Ready</div>
                                                </div>
                                                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                                    <div className="text-2xl font-bold text-red-500 whitespace-nowrap">
                                                        {pos.filter(p => p.status === 'Cancelled').length}
                                                    </div>
                                                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Alerts</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {userRole === 'admin' && (
                                        <div className="glass-card p-6 border border-brand-500/30">
                                            <div className="flex gap-4 items-center mb-4">
                                                <Info className="text-slate-300" size={20} />
                                                <h3 className="font-bold uppercase tracking-tight text-sm text-slate-100">Strategic Insight</h3>
                                            </div>
                                            <p className="text-xs text-slate-400 leading-relaxed">
                                                Performance analytics indicate <span className="text-white font-bold">Abc Raw Material</span> as the optimal logistics partner for current Mumbai transit lanes.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'orders' && (
                        <motion.div key="orders" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-6">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <h1 className="text-2xl font-bold tracking-tighter uppercase">Inbound Logistics Pipeline</h1>
                                <div className="flex gap-4 w-full sm:w-auto">
                                    <div className="relative flex-grow sm:w-64">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                        <input
                                            type="text"
                                            placeholder="Search PO or Vendor..."
                                            className="input-field w-full sm:w-64 pl-10"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                    <div className="relative">
                                        <input 
                                            type="date" 
                                            title="Filter by Order Date"
                                            className="input-field w-full sm:w-auto"
                                            value={dateFilter}
                                            onChange={(e) => setDateFilter(e.target.value)}
                                        />
                                    </div>
                                    {userRole === 'admin' && (
                                        <div className="flex gap-2">
                                            <button className="bg-white/5 hover:bg-white/10 p-2 rounded-lg border border-white/10" title="Filter View">
                                                <Filter size={18} />
                                            </button>
                                            <button onClick={handleDeleteAll} className="bg-red-500/10 hover:bg-red-500/20 text-red-500 p-2 rounded-lg border border-red-500/10 transition-colors" title="Format Database">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="glass-card overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-white/5 text-[10px] uppercase font-bold text-slate-500 tracking-widest">
                                                <th className="px-6 py-4">Status</th>
                                                <th className="px-6 py-4">PO Number</th>
                                                {userRole === 'admin' && <th className="px-6 py-4">Supplier & Grade</th>}
                                                <th className="px-6 py-4">Order Date</th>
                                                <th className="px-6 py-4">Expected Delivery</th>
                                                <th className="px-6 py-4">Changes</th>
                                                <th className="px-6 py-4">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {filteredPos.map(p => (
                                                <tr key={p.id} className="hover:bg-white/5 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className={`status-signal ${p.status === 'Cancelled' ? 'status-signal-red' : p.status === 'Consolidated' ? 'status-signal-blue' : p.date_change_count >= 2 ? 'status-signal-yellow' : 'status-signal-green'}`} />
                                                    </td>
                                                    <td className="px-6 py-4 font-bold">{p.po_number}</td>
                                                    {userRole === 'admin' && (
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-sm">{p.supplier_name}</span>
                                                                {getGradeBadge(p.supplier_name)}
                                                            </div>
                                                        </td>
                                                    )}
                                                    <td className="px-6 py-4 text-sm font-mono text-slate-400">{p.order_date}</td>
                                                    <td className="px-6 py-4">
                                                        {userRole === 'supplier' && !['Cancelled', 'Dispatch', 'Partially Shipped', 'Consolidated'].includes(p.status) ? (
                                                            <div className="flex items-center gap-2">
                                                                <input
                                                                    type="date"
                                                                    className="bg-brand-500/10 border border-brand-500/20 rounded-lg px-2 py-1 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none text-white"
                                                                    value={p.expected_delivery_date || ''}
                                                                    onChange={(e) => handleUpdateDeliveryDate(p.id, e.target.value)}
                                                                />
                                                                <Clock size={14} className="text-slate-500" />
                                                            </div>
                                                        ) : (
                                                            <span className="text-sm font-semibold text-brand-400">{p.expected_delivery_date || 'Awaiting Input'}</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                                                <div className={`h-full transition-all ${p.date_change_count >= 3 ? 'bg-red-500' : 'bg-brand-400'}`} style={{ width: `${(p.date_change_count / 3) * 100}%` }} />
                                                            </div>
                                                            <span className={`text-[10px] font-bold ${p.date_change_count >= 3 ? 'text-red-400' : 'text-slate-500'}`}>{p.date_change_count}/3</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {['Cancelled', 'Dispatch', 'Partially Shipped', 'Consolidated'].includes(p.status) ? (
                                                            <span className={`text-[10px] px-3 py-1 rounded-full font-bold uppercase border shadow-sm ${p.status === 'Cancelled' ? 'bg-red-500/20 text-red-500 border-red-500/20' : p.status === 'Partially Shipped' ? 'bg-amber-500/20 text-amber-500 border-amber-500/20' : 'bg-brand-500/20 text-brand-400 border-brand-500/20'}`}>
                                                                {p.status} {p.status === 'Cancelled' && p.date_change_count >= 3 && '- Auto'}
                                                                {p.status === 'Dispatch' && <CheckCircle size={10} className="inline ml-1" />}
                                                                {p.status === 'Partially Shipped' && <AlertTriangle size={10} className="inline ml-1" />}
                                                            </span>
                                                        ) : (
                                                            userRole === 'supplier' ? (
                                                                <select
                                                                    className="bg-brand-500/10 border border-brand-500/20 rounded-lg px-2 py-1 text-[10px] font-bold uppercase focus:ring-2 focus:ring-brand-500 focus:outline-none text-brand-400 cursor-pointer"
                                                                    value={p.status}
                                                                    onChange={(e) => handleUpdateStatus(p.id, e.target.value)}
                                                                >
                                                                    <option value="Open">Open</option>
                                                                    <option value="Confirmed">Confirmed</option>
                                                                    <option value="In Production">In Production</option>
                                                                    <option value="Completed">Completed</option>
                                                                    <option value="Dispatch">Dispatch</option>
                                                                    <option value="Partially Shipped">Partially Shipped</option>
                                                                    <option value="Cancelled">Cancel Order</option>
                                                                </select>
                                                            ) : (
                                                                <span className={`text-[10px] px-3 py-1 rounded-full font-bold uppercase border ${p.status === 'Open' ? 'bg-amber-500/10 text-amber-500 border-amber-500/10' : p.date_change_count > 2 ? 'bg-red-500/10 text-red-500 border-red-500/10' : 'bg-brand-500/10 text-brand-400 border-brand-500/10'}`}>{p.status}</span>
                                                            )
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'shipments' && userRole === 'admin' && (
                        <motion.div key="shipments" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h1 className="text-2xl font-bold uppercase">PRIOR1TY CONSOLIDATION ENGINE</h1>
                                    <p className="text-slate-400 text-sm">Automated grouping of regional POs into high-utilization vehicle loads</p>
                                </div>
                                <div className="bg-brand-500/10 px-4 py-2 rounded-xl text-brand-400 font-bold border border-brand-500/20 flex items-center gap-2">
                                    <TrendingDown size={18} /> Cost Efficiency: +24%
                                </div>
                            </div>

                            {plans.map((plan, idx) => (
                                <div key={idx} className="glass-card p-8 border-l-4 border-brand-500 group relative">
                                    <div className="absolute top-0 right-0 p-4 opacity-50 group-hover:opacity-100 transition-opacity">
                                        <Maximize2 size={20} className="text-slate-600" />
                                    </div>
                                    <div className="flex flex-col md:flex-row justify-between gap-8 mb-8">
                                        <div className="flex items-center gap-6">
                                            <div className="w-16 h-16 bg-brand-500/10 rounded-2xl flex items-center justify-center text-brand-400 shadow-inner"><Calendar size={32} /></div>
                                            <div>
                                                <div className="text-xs font-bold uppercase text-slate-500 tracking-widest mb-1">Route Suggestion</div>
                                                <div className="text-xl font-bold text-brand-400">{plan.route || 'TRANSIT → DESTINATION'}</div>
                                                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">REGION: {plan.location || 'Unknown'}</div>
                                            </div>
                                        </div>
                                        <div className="flex gap-12">
                                            <div className="text-center">
                                                <div className="text-xs font-bold text-slate-500 mb-1 uppercase tracking-tighter">Utilization</div>
                                                <div className="text-2xl font-bold text-emerald-400">88%</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-xs font-bold text-slate-500 mb-1 uppercase tracking-tighter">Vehicle Type</div>
                                                <div className="text-2xl font-bold text-white flex items-center gap-2"><Truck size={24} className="text-brand-500" /> {plan.vehicle_type}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                            <div className="text-xs text-slate-500 mb-1 uppercase font-bold tracking-widest">Total Weight</div>
                                            <div className="text-xl font-bold">{(plan.total_weight || 0).toLocaleString()} <span className="text-xs font-normal text-slate-500 italic uppercase">kg</span></div>
                                        </div>
                                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                            <div className="text-xs text-slate-500 mb-1 uppercase font-bold tracking-widest">Total Volume</div>
                                            <div className="text-xl font-bold">{(plan.total_cbm || 0).toFixed(2)} <span className="text-xs font-normal text-slate-500 italic uppercase">CBM</span></div>
                                        </div>
                                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5 group-hover:border-brand-500/30 transition-all">
                                            <div className="text-xs text-slate-500 mb-1 uppercase font-bold tracking-widest">Included POs</div>
                                            <div className="text-xl font-bold flex items-center gap-2">
                                                {plan.po_ids?.length || 0}
                                                <div className="text-[8px] flex flex-wrap gap-1">
                                                    {(plan.po_ids || []).map(id => {
                                                        const po = pos.find(p => p.id === id);
                                                        const poStr = po?.po_number?.toString() || '';
                                                        return (
                                                            <span key={id} className="bg-brand-500/20 px-1 rounded text-brand-400">
                                                                {poStr ? poStr.split('-').pop() : id}
                                                            </span>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                            <div className="text-xs text-slate-500 mb-1 uppercase font-bold tracking-widest">Dispatch Date</div>
                                            <div className="text-xl font-bold text-brand-400">{plan.dispatch_date}</div>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-brand-500/5 rounded-2xl border border-brand-500/10 flex flex-col md:flex-row justify-between items-center gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400"><CheckCircle size={18} /></div>
                                            <span className="font-bold text-slate-200 text-sm tracking-tight capitalize">Optimized Route: {(plan.recommendation || '').replace('AI PLAN: ', '')}</span>
                                        </div>
                                        <button
                                            onClick={() => handleCreateShipment(plan)}
                                            disabled={loading}
                                            className={`bg-brand-600 hover:bg-brand-500 text-white px-10 py-3.5 rounded-xl flex items-center gap-2 font-black tracking-tighter transition-all shadow-2xl shadow-brand-500/40 ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:-translate-y-0.5 active:translate-y-0'}`}
                                        >
                                            {loading ? <RefreshCw className="animate-spin" size={18} /> : `DISPATCH ${plan.location ? plan.location.toUpperCase() : 'LINE'} TO FACTORY`}
                                            <ArrowRight size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {plans.length === 0 && <div className="glass-card py-24 text-center text-slate-500 italic">No consolidated shipments available yet. Sync to begin.</div>}
                        </motion.div>
                    )}

                    {activeTab === 'settings' && (
                        <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto space-y-8">
                            <h1 className="text-2xl font-bold">System Settings</h1>
                            <div className="glass-card p-6 space-y-8">
                                <div className="space-y-4">
                                    <h3 className="font-bold flex items-center gap-2 text-brand-400 uppercase tracking-widest text-xs"><Box size={18} /> Display Preferences</h3>
                                    <div className="p-6 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between">
                                        <div>
                                            <div className="text-sm font-bold uppercase tracking-tight">Active Theme: {theme.toUpperCase()}</div>
                                            <p className="text-xs text-slate-500">Toggle between professional dark and high-clarity light mode</p>
                                        </div>
                                        <div className="flex bg-black/40 p-1 rounded-xl border border-white/10">
                                            <button onClick={() => setTheme('dark')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${theme === 'dark' ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20' : 'text-slate-500 hover:text-white'}`}>DARK</button>
                                            <button onClick={() => setTheme('light')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${theme === 'light' ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20' : 'text-slate-500 hover:text-white'}`}>LIGHT</button>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="font-bold flex items-center gap-2 text-brand-400 uppercase tracking-widest text-xs"><Shield size={18} /> Identity & Access</h3>
                                    <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                                        <div className="flex justify-between items-center mb-4">
                                            <div>
                                                <div className="text-sm font-bold flex items-center gap-2 uppercase tracking-tight">
                                                    {userRole === 'admin' ? <Shield size={14} className="text-brand-500" /> : <User size={14} className="text-brand-500" />}
                                                    {userRole} SESSION ACTIVE
                                                </div>
                                                {userRole === 'supplier' && <p className="text-xs text-slate-500 mt-1">Authenticated as {currentSupplierName}</p>}
                                            </div>
                                            <button onClick={handleLogout} className="text-xs bg-red-500/10 text-red-500 px-3 py-1.5 rounded-lg border border-red-500/20 font-bold hover:bg-red-500/20 transition-all uppercase">Sign Out</button>
                                        </div>
                                        <p className="text-[10px] text-slate-500 italic uppercase font-bold tracking-widest">SECURED BY PRIOR1TY ENTERPRISE</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="font-bold flex items-center gap-2 text-red-500 relative">
                                        <Trash2 size={18} /> Danger Zone
                                        <span className="absolute -top-1 -right-1 flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                        </span>
                                    </h3>
                                    <div className="p-6 bg-red-500/5 rounded-2xl border border-red-500/10">
                                        <p className="text-sm text-slate-400 mb-6">Wipe the local Logistics database. This will not delete data from ERPNext, but will clear all history and performance grades on this portal.</p>
                                        <button onClick={handleDeleteAll} className="bg-red-500 hover:bg-red-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-red-500/20">Purge Local Environment</button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            <footer className="py-6 border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-slate-900/30">
                <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] uppercase tracking-widest font-bold text-slate-500">
                    <div className="flex items-center gap-2">
                        <Truck size={12} className="text-brand-500" />
                        Prior1ty Supply Chain Intelligence © 2026
                    </div>
                    <div className="flex gap-6 text-slate-400">
                        <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" /> System Nodes Healthy</span>
                        <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-brand-500" /> Sync Active</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default App;
