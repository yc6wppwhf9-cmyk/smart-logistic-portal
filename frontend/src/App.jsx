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
    Star
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
            alert(res.data.message || res.data.error);
            fetchData();
        } catch (err) {
            alert("Sync failed.");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAll = async () => {
        if (!window.confirm("Format Portal Database? (ERPNext remains safe)")) return;
        setLoading(true);
        try {
            await axios.delete('/api/purchase-orders');
            fetchData();
        } finally {
            setLoading(false);
        }
    };

    const handleCreateShipment = async (plan) => {
        try {
            await axios.post('/api/shipments', plan);
            fetchData();
            alert("Shipment Planned Successfully!");
        } catch (err) {
            console.error(err);
        }
    };

    if (!isLoggedIn) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-8 w-full max-w-md text-center">
                    <div className="w-16 h-16 bg-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Truck className="text-white" size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2 underline decoration-brand-500 underline-offset-4">HSCVPL PORTAL</h1>
                    <p className="text-slate-400 mb-8 text-xs font-bold uppercase tracking-widest">Enterprise Logistics Intelligence</p>
                    <div className="space-y-4">
                        <button onClick={() => handleLogin('admin')} className="w-full btn-primary flex items-center justify-center gap-2 py-3">
                            <Shield size={20} /> Continue as Company Admin
                        </button>
                        <button onClick={() => handleLogin('supplier')} className="w-full btn-secondary flex items-center justify-center gap-2 py-3">
                            <User size={20} /> Continue as Supplier Partner
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    // Role-based filtering
    const displayPos = userRole === 'admin'
        ? pos
        : pos.filter(p => p.supplier_name === currentSupplierName);

    const filteredPos = displayPos.filter(p =>
        p.po_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.supplier_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
        <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
            {/* Navbar */}
            <nav className="border-b border-white/10 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-3">
                            <div className="bg-brand-600 p-1.5 rounded-lg">
                                <Truck className="text-white" size={20} />
                            </div>
                            <span className="text-lg font-bold tracking-tight text-white hidden sm:block">HSCVPL <span className="text-brand-500">LOGISTICS</span></span>
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
                                    <h1 className="text-2xl font-bold">WELCOME TO HSCVPL, {userRole === 'admin' ? 'ADMINISTRATOR' : currentSupplierName.toUpperCase()}</h1>
                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Precision logistics monitoring for Bihar Factory supply chain</p>
                                </div>
                                <div className="flex gap-4">
                                    {userRole === 'admin' && (
                                        <button onClick={handleSyncERPNext} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold transition-all shadow-lg shadow-emerald-500/20">
                                            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} /> Sync ERP
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
                                        <div className="glass-card p-6">
                                            <h2 className="text-lg font-bold mb-6 flex items-center gap-2 uppercase tracking-tight text-white"><Box className="text-brand-400" size={20} /> RM HEALTH STATUS</h2>
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
                                                        {pos.filter(p => p.status === 'Pending').flatMap(p => p.items).slice(0, 5).map((item, i) => {
                                                            const po = pos.find(p => p.id === item.po_id);
                                                            const grade = performance[po?.supplier_name]?.grade || 'B';
                                                            return (
                                                                <tr key={i} className="hover:bg-white/5 transition-all">
                                                                    <td className="py-3 font-bold">{item.item_name}</td>
                                                                    <td className="py-3 text-center font-mono">{item.quantity} {item.uom}</td>
                                                                    <td className="py-3 text-right">
                                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${grade === 'A' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-500 animate-pulse'}`}>
                                                                            {grade === 'A' ? 'SECURE' : 'CRITICAL'}
                                                                        </span>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                        {pos.filter(p => p.status === 'Pending').length === 0 && (
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
                                    <div className="glass-card p-6 bg-gradient-to-br from-indigo-600/20 to-transparent">
                                        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4">Live Load Monitor</h3>
                                        <div className="space-y-6">
                                            <div>
                                                <div className="flex justify-between text-xs mb-2">
                                                    <span className="text-slate-400 font-bold uppercase">Pending Load</span>
                                                    <span className="text-white font-bold">{pos.reduce((acc, p) => acc + (p.status === 'Pending' ? 1 : 0), 0)} Orders</span>
                                                </div>
                                                <div className="h-2 bg-black/40 rounded-full overflow-hidden">
                                                    <div className="h-full bg-brand-500 w-[65%]" />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                                    <div className="text-2xl font-bold text-emerald-400 whitespace-nowrap">{(pos.filter(p => p.status === 'Pending').length * 280).toLocaleString()} <span className="text-[10px]">%</span></div>
                                                    <div className="text-[10px] text-slate-500 font-bold uppercase">Ready</div>
                                                </div>
                                                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                                    <div className="text-2xl font-bold text-red-400 whitespace-nowrap">{pos.filter(p => p.status === 'Cancelled').length}</div>
                                                    <div className="text-[10px] text-slate-500 font-bold uppercase">Alerts</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {userRole === 'admin' && (
                                        <div className="glass-card p-6 border-l-4 border-amber-500">
                                            <div className="flex gap-4 items-center mb-4">
                                                <AlertTriangle className="text-amber-500" size={24} />
                                                <h3 className="font-bold">AI Suggestion</h3>
                                            </div>
                                            <p className="text-xs text-slate-400 leading-relaxed">
                                                Based on reliability data, <span className="text-white font-bold">Abc Raw Material</span> is the highest rated supplier for Mumbai. We recommend routing current excess capacity through them.
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
                                <h1 className="text-2xl font-bold">Inbound Purchase Orders</h1>
                                <div className="flex gap-4 w-full sm:w-auto">
                                    <div className="relative flex-grow sm:w-64">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                        <input
                                            type="text"
                                            placeholder="Search PO or Vendor..."
                                            className="input-field w-full pl-10"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
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
                                                        {userRole === 'supplier' && p.status !== 'Cancelled' ? (
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
                                                        {p.status === 'Cancelled' ? (
                                                            <span className="text-[10px] bg-red-500/20 text-red-400 px-3 py-1 rounded-full font-bold shadow-sm border border-red-500/10">AUTO-CANCELLED</span>
                                                        ) : (
                                                            <span className={`text-[10px] px-3 py-1 rounded-full font-bold uppercase border ${p.status === 'Pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/10' : 'bg-brand-500/10 text-brand-400 border-brand-500/10'}`}>{p.status}</span>
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
                                    <h1 className="text-2xl font-bold uppercase">HSCVPL CONSOLIDATION ENGINE</h1>
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
                                                <div className="text-xl font-bold text-brand-400">{plan.route || 'TRANSIT → BIHAR'}</div>
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

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                            <div className="text-xs text-slate-500 mb-1 uppercase font-bold tracking-widest">Total Weight</div>
                                            <div className="text-xl font-bold">{plan.total_weight.toLocaleString()} <span className="text-sm font-normal text-slate-500 italic uppercase">kg</span></div>
                                        </div>
                                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                            <div className="text-xs text-slate-500 mb-1 uppercase font-bold tracking-widest">Total Volume</div>
                                            <div className="text-xl font-bold">{plan.total_cbm.toFixed(2)} <span className="text-sm font-normal text-slate-500 italic uppercase">CBM</span></div>
                                        </div>
                                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                            <div className="text-xs text-slate-500 mb-1 uppercase font-bold tracking-widest">Included POs</div>
                                            <div className="text-xl font-bold">{plan.po_ids.length} <span className="text-sm font-normal text-slate-500 italic uppercase">Orders</span></div>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/20 flex flex-col md:flex-row justify-between items-center gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400"><CheckCircle size={18} /></div>
                                            <span className="font-bold text-slate-200">AI PLAN: {plan.recommendation}</span>
                                        </div>
                                        <button onClick={() => handleCreateShipment(plan)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-xl flex items-center gap-2 font-bold transition-all shadow-lg shadow-emerald-500/30">DISPATCH TO BIHAR FACTORY <ArrowRight size={18} /></button>
                                    </div>
                                </div>
                            ))}
                            {plans.length === 0 && <div className="glass-card py-24 text-center text-slate-500 italic">No consolidated shipments available yet. Sync from ERP to begin.</div>}
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
                                        <p className="text-[10px] text-slate-500 italic uppercase font-bold tracking-widest">SECURED BY HSCVPL ENTERPRISE</p>
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

            <footer className="py-6 border-t border-white/5 bg-slate-900/30">
                <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] uppercase tracking-widest font-bold text-slate-500">
                    <div className="flex items-center gap-2">
                        <Truck size={12} className="text-brand-500" />
                        HSCVPL Supply Chain Intelligence © 2026
                    </div>
                    <div className="flex gap-6">
                        <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> AI Engine Online</span>
                        <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Genesis ERP Sync Active</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default App;
