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
    RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Configure axios for deployment
axios.defaults.baseURL = import.meta.env.VITE_API_URL || '';

function App() {
    const [pos, setPos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [plans, setPlans] = useState([]);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [newPo, setNewPo] = useState({
        po_number: '',
        order_date: new Date().toISOString().split('T')[0],
        supplier_name: '',
        location: 'Mumbai',
        items: [{ item_code: '', item_name: '', hsn_code: '', uom: 'Pcs', quantity: 1, rate: 0, weight_per_unit: 0, cbm_per_unit: 0 }]
    });

    useEffect(() => {
        fetchPos();
        fetchOptimization();
    }, []);

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

    const handleAddPo = async () => {
        if (!newPo.po_number || !newPo.supplier_name) return alert("Please fill basic info");
        setLoading(true);
        try {
            // Ensure numeric types are handled correctly
            const formattedPo = {
                ...newPo,
                items: newPo.items.map(item => ({
                    ...item,
                    quantity: parseInt(item.quantity) || 0,
                    weight_per_unit: parseFloat(item.weight_per_unit) || 0,
                    cbm_per_unit: parseFloat(item.cbm_per_unit) || 0
                }))
            };
            await axios.post('/api/purchase-orders', formattedPo);
            setNewPo({
                po_number: '',
                order_date: new Date().toISOString().split('T')[0],
                supplier_name: '',
                location: 'Mumbai',
                items: [{ item_code: '', item_name: '', hsn_code: '', uom: 'Pcs', quantity: 1, rate: 0, weight_per_unit: 0, cbm_per_unit: 0 }]
            });
            fetchPos();
            fetchOptimization();
            alert("PO Created Successfully!");
        } catch (err) {
            console.error("Error saving PO", err);
            alert("Failed to create PO: " + (err.response?.data?.detail || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setLoading(true);
        try {
            const res = await axios.post('/api/purchase-orders/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            alert(res.data.message);
            fetchPos();
            fetchOptimization();
        } catch (err) {
            console.error("Error uploading file", err);
            alert("Upload failed: " + (err.response?.data?.detail || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleSyncERPNext = async () => {
        setLoading(true);
        try {
            const res = await axios.post('/api/erpnext/sync');
            if (res.data.error) {
                alert("ERPNext Error: " + res.data.error);
            } else {
                alert(res.data.message);
                fetchPos();
                fetchOptimization();
            }
        } catch (err) {
            console.error("Error syncing ERPNext", err);
            alert("Failed to sync with ERPNext. Please check your credentials.");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAll = async () => {
        if (!window.confirm("Are you sure you want to delete all POs in the portal? This will not affect ERPNext.")) return;
        setLoading(true);
        try {
            await axios.delete('/api/purchase-orders');
            alert("All POs deleted.");
            fetchPos();
            fetchOptimization();
        } catch (err) {
            console.error("Error deleting POs", err);
            alert("Failed to delete POs.");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateShipment = async (plan) => {
        try {
            await axios.post('/api/shipments', plan);
            fetchPos();
            fetchOptimization();
        } catch (err) {
            console.error("Error creating shipment", err);
        }
    };

    const removeItem = (index) => {
        const items = newPo.items.filter((_, i) => i !== index);
        setNewPo({ ...newPo, items });
    };

    return (
        <div className="min-h-screen flex flex-col">
            {/* Navigation */}
            <nav className="border-b border-white/10 bg-slate-950/50 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-3">
                            <div className="bg-brand-600 p-2 rounded-lg">
                                <Truck className="text-white" size={24} />
                            </div>
                            <span className="text-xl font-bold tracking-tight text-white">Logistics <span className="text-brand-500">AI</span></span>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => setActiveTab('dashboard')}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'dashboard' ? 'bg-brand-500/10 text-brand-400' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                            >
                                <LayoutDashboard size={18} /> Dashboard
                            </button>
                            <button
                                onClick={() => setActiveTab('history')}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'history' ? 'bg-brand-500/10 text-brand-400' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                            >
                                <History size={18} /> Shipments
                            </button>
                            <button className="text-slate-400 hover:text-white p-2">
                                <Settings size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
                {activeTab === 'dashboard' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Left Section: Creation & Queue */}
                        <div className="lg:col-span-4 space-y-6">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="glass-card overflow-hidden"
                            >
                                <div className="p-6 border-b border-white/5 bg-white/5 flex items-center justify-between">
                                    <h2 className="text-lg font-semibold flex items-center gap-2">
                                        <Plus className="text-brand-500" size={20} /> Add Purchase Order
                                    </h2>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleSyncERPNext}
                                            disabled={loading}
                                            className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 p-2 rounded-lg transition-colors"
                                            title="Sync from ERPNext"
                                        >
                                            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                                        </button>
                                        <button
                                            onClick={handleDeleteAll}
                                            disabled={loading}
                                            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 p-2 rounded-lg transition-colors"
                                            title="Clear All POs"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                        <label className="cursor-pointer bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 p-2 rounded-lg transition-colors" title="Bulk Upload (JSON/Excel/PDF)">
                                            <FileUp size={18} />
                                            <input type="file" className="hidden" accept=".json,.xlsx,.xls,.pdf" onChange={handleFileUpload} />
                                        </label>
                                    </div>
                                </div>
                                <div className="p-6 space-y-4">
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Order Number</label>
                                                <input
                                                    type="text" className="input-field w-full" placeholder="PO/HSB/..."
                                                    value={newPo.po_number}
                                                    onChange={(e) => setNewPo({ ...newPo, po_number: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Order Date</label>
                                                <input
                                                    type="date" className="input-field w-full"
                                                    value={newPo.order_date}
                                                    onChange={(e) => setNewPo({ ...newPo, order_date: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5 text-slate-400 uppercase tracking-wider">
                                                <label className="text-xs font-medium">Vendor Name</label>
                                                <input
                                                    type="text" className="input-field w-full" placeholder="Shantilal Enterprises"
                                                    value={newPo.supplier_name}
                                                    onChange={(e) => setNewPo({ ...newPo, supplier_name: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Location</label>
                                                <select className="input-field w-full appearance-none">
                                                    <option>Mumbai</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3 pt-2">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-sm font-medium text-slate-300">Item Details</h3>
                                            <button
                                                onClick={() => setNewPo({ ...newPo, items: [...newPo.items, { item_code: '', item_name: '', hsn_code: '', uom: 'Pcs', quantity: 1, rate: 0, weight_per_unit: 0, cbm_per_unit: 0 }] })}
                                                className="text-xs text-brand-500 hover:text-brand-400 font-semibold flex items-center gap-1"
                                            >
                                                <Plus size={14} /> Add Item
                                            </button>
                                        </div>

                                        <AnimatePresence>
                                            {newPo.items.map((item, idx) => (
                                                <motion.div
                                                    key={idx}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, scale: 0.9 }}
                                                    className="bg-black/20 p-3 rounded-xl border border-white/5 relative group"
                                                >
                                                    {newPo.items.length > 1 && (
                                                        <button
                                                            onClick={() => removeItem(idx)}
                                                            className="absolute -top-2 -right-2 bg-red-500/20 text-red-400 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    )}
                                                    <div className="space-y-2 mb-2">
                                                        <input
                                                            type="text" className="input-field text-xs py-1.5 w-full" placeholder="Item Name (e.g. Tag Pin)"
                                                            value={item.item_name}
                                                            onChange={(e) => {
                                                                const items = [...newPo.items];
                                                                items[idx].item_name = e.target.value;
                                                                setNewPo({ ...newPo, items });
                                                            }}
                                                        />
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <input
                                                                type="text" className="input-field text-xs py-1.5" placeholder="Item Code"
                                                                value={item.item_code}
                                                                onChange={(e) => {
                                                                    const items = [...newPo.items];
                                                                    items[idx].item_code = e.target.value;
                                                                    setNewPo({ ...newPo, items });
                                                                }}
                                                            />
                                                            <input
                                                                type="text" className="input-field text-xs py-1.5" placeholder="HSN Code"
                                                                value={item.hsn_code}
                                                                onChange={(e) => {
                                                                    const items = [...newPo.items];
                                                                    items[idx].hsn_code = e.target.value;
                                                                    setNewPo({ ...newPo, items });
                                                                }}
                                                            />
                                                        </div>
                                                        <div className="grid grid-cols-3 gap-2">
                                                            <input
                                                                type="text" className="input-field text-xs py-1.5" placeholder="UOM"
                                                                value={item.uom}
                                                                onChange={(e) => {
                                                                    const items = [...newPo.items];
                                                                    items[idx].uom = e.target.value;
                                                                    setNewPo({ ...newPo, items });
                                                                }}
                                                            />
                                                            <input
                                                                type="number" className="input-field text-xs py-1.5" placeholder="Qty"
                                                                value={item.quantity}
                                                                onChange={(e) => {
                                                                    const items = [...newPo.items];
                                                                    items[idx].quantity = parseInt(e.target.value) || 0;
                                                                    setNewPo({ ...newPo, items });
                                                                }}
                                                            />
                                                            <input
                                                                type="number" className="input-field text-xs py-1.5" placeholder="Rate"
                                                                value={item.rate}
                                                                onChange={(e) => {
                                                                    const items = [...newPo.items];
                                                                    items[idx].rate = parseFloat(e.target.value) || 0;
                                                                    setNewPo({ ...newPo, items });
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-white/5">
                                                        <div className="flex items-center gap-2 bg-black/10 rounded-lg px-2 border border-white/5">
                                                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Kg/Unit</span>
                                                            <input
                                                                type="number" className="bg-transparent text-xs py-1.5 w-full focus:outline-none" placeholder="0.00"
                                                                value={item.weight_per_unit}
                                                                onChange={(e) => {
                                                                    const items = [...newPo.items];
                                                                    items[idx].weight_per_unit = parseFloat(e.target.value) || 0;
                                                                    setNewPo({ ...newPo, items });
                                                                }}
                                                            />
                                                        </div>
                                                        <div className="flex items-center gap-2 bg-black/10 rounded-lg px-2 border border-white/5">
                                                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">CBM/Unit</span>
                                                            <input
                                                                type="number" className="bg-transparent text-xs py-1.5 w-full focus:outline-none" placeholder="0.00"
                                                                value={item.cbm_per_unit}
                                                                onChange={(e) => {
                                                                    const items = [...newPo.items];
                                                                    items[idx].cbm_per_unit = parseFloat(e.target.value) || 0;
                                                                    setNewPo({ ...newPo, items });
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                    </div>

                                    <button
                                        onClick={handleAddPo}
                                        disabled={loading}
                                        className="btn-primary w-full mt-4 flex items-center justify-center gap-2"
                                    >
                                        {loading ? (
                                            <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                <Plus size={18} /> Create Order
                                            </>
                                        )}
                                    </button>
                                </div>
                            </motion.div>

                            <div className="glass-card">
                                <div className="p-4 border-b border-white/5 flex items-center justify-between">
                                    <h3 className="text-sm font-semibold text-slate-300">Pending Queue</h3>
                                    <span className="text-xs bg-slate-800 px-2 py-0.5 rounded-full text-slate-400">
                                        {pos.filter(p => p.status === 'Pending').length} Orders
                                    </span>
                                </div>
                                <div className="p-2 space-y-1 max-h-[300px] overflow-y-auto">
                                    {pos.filter(p => p.status === 'Pending').map((p) => (
                                        <div key={p.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 group transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-400 group-hover:bg-brand-500/20 group-hover:text-brand-400 transition-colors">
                                                    PO
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium">{p.po_number}</div>
                                                    <div className="text-[10px] text-slate-500 uppercase tracking-wider">{p.supplier_name}</div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xs font-semibold text-brand-400">{p.items?.length || 0} items</div>
                                                <div className="text-[10px] text-slate-600">Mumbai</div>
                                            </div>
                                        </div>
                                    ))}
                                    {pos.filter(p => p.status === 'Pending').length === 0 && (
                                        <div className="text-center py-8 text-slate-600 text-sm italic">
                                            No pending orders
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right Section: AI Analysis & Suggestions */}
                        <div className="lg:col-span-8 space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-2xl font-bold text-white">Consolidation Engine</h1>
                                    <p className="text-slate-400 text-sm">AI optimized shipment planning across Mumbai region</p>
                                </div>
                                <div className="flex gap-3">
                                    <div className="glass-card px-4 py-2 flex items-center gap-3">
                                        <TrendingDown className="text-emerald-400" size={18} />
                                        <div>
                                            <div className="text-[10px] uppercase text-slate-500 font-bold tracking-widest">Est. Savings</div>
                                            <div className="text-sm font-bold text-emerald-400">₹14,500 <span className="text-[10px] font-normal text-slate-400">/mo</span></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {plans.length > 0 ? (
                                <div className="space-y-6">
                                    {plans.map((plan, idx) => (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                            className="glass-card relative overflow-hidden group"
                                        >
                                            {/* Decorative gradient */}
                                            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl -mr-32 -mt-32 transition-colors group-hover:bg-brand-500/15" />

                                            <div className="p-6 md:p-8 relative z-10">
                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                                                            <Calendar size={28} />
                                                        </div>
                                                        <div>
                                                            <div className="text-xs uppercase text-slate-500 font-bold tracking-widest mb-1">Target Dispatch</div>
                                                            <h3 className="text-xl font-bold flex items-center gap-2">
                                                                {new Date(plan.dispatch_date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                                                                <span className={`text-[10px] px-2 py-0.5 rounded-full ${plan.recommendation.includes('Dispatch') ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                                                    {plan.recommendation}
                                                                </span>
                                                            </h3>
                                                        </div>
                                                    </div>

                                                    <div className="flex gap-8">
                                                        <div className="text-center">
                                                            <div className="text-[10px] uppercase text-slate-500 font-bold tracking-widest mb-1">Load Status</div>
                                                            <div className="text-lg font-bold text-white flex items-center gap-2">
                                                                {((plan.total_weight / (plan.vehicle_type === 'Truck' ? 5000 : plan.vehicle_type === 'Pickup' ? 1500 : 750)) * 100).toFixed(0)}%
                                                                <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                                                    <div
                                                                        className="h-full bg-brand-500"
                                                                        style={{ width: `${Math.min(100, (plan.total_weight / (plan.vehicle_type === 'Truck' ? 5000 : plan.vehicle_type === 'Pickup' ? 1500 : 750)) * 100)}%` }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="text-center">
                                                            <div className="text-[10px] uppercase text-slate-500 font-bold tracking-widest mb-1">Vehicle Match</div>
                                                            <div className="text-lg font-bold text-brand-400 flex items-center gap-1">
                                                                <Truck size={18} /> {plan.vehicle_type}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                                                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <Scale size={16} className="text-slate-500" />
                                                            <span className="text-xs text-slate-400">Total Weight</span>
                                                        </div>
                                                        <div className="text-lg font-bold tracking-tight">{plan.total_weight.toLocaleString()} <span className="text-sm font-normal text-slate-500 italic">kg</span></div>
                                                    </div>
                                                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <Box size={16} className="text-slate-500" />
                                                            <span className="text-xs text-slate-400">Total volume</span>
                                                        </div>
                                                        <div className="text-lg font-bold tracking-tight">{plan.total_cbm.toFixed(2)} <span className="text-sm font-normal text-slate-500 italic">CBM</span></div>
                                                    </div>
                                                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <Package size={16} className="text-slate-500" />
                                                            <span className="text-xs text-slate-400">PO Count</span>
                                                        </div>
                                                        <div className="text-lg font-bold tracking-tight">{plan.po_ids?.length || 0} <span className="text-sm font-normal text-slate-500 italic">Orders</span></div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between p-4 bg-brand-500/5 rounded-2xl border border-brand-500/20">
                                                    <div className="flex items-center gap-3">
                                                        <Info size={18} className="text-brand-400" />
                                                        <p className="text-sm text-slate-300">
                                                            <span className="font-bold text-white">Decision:</span> {plan.recommendation}
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => handleCreateShipment(plan)}
                                                        className="bg-brand-500 hover:bg-brand-400 text-white px-6 py-2 rounded-xl text-sm font-bold transition-all shadow-lg shadow-brand-500/20 flex items-center gap-2"
                                                    >
                                                        Execute Plan <ArrowRight size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <div className="glass-card flex flex-col items-center justify-center py-20 text-center px-4">
                                    <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mb-6 border border-white/5">
                                        <Maximize2 size={40} className="text-slate-700 animate-pulse-slow" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-2">Awaiting Optimization Data</h3>
                                    <p className="text-slate-500 max-w-sm">
                                        Enter purchase orders from Mumbai suppliers. The AI engine will automatically group them for Bihar factory shipments.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="glass-card"
                    >
                        <div className="p-6 border-b border-white/10">
                            <h2 className="text-xl font-bold">Consolidated Shipment History</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-xs uppercase text-slate-500 font-bold tracking-wider bg-white/5">
                                        <th className="px-6 py-4">ID</th>
                                        <th className="px-6 py-4">Dispatch Date</th>
                                        <th className="px-6 py-4">Vehicle</th>
                                        <th className="px-6 py-4">Load (KG/CBM)</th>
                                        <th className="px-6 py-4">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {/* This would actually map from a 'shipments' state */}
                                    <tr className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4 text-sm font-medium">SHP-4921</td>
                                        <td className="px-6 py-4 text-sm">2026-02-27</td>
                                        <td className="px-6 py-4 text-sm">Truck</td>
                                        <td className="px-6 py-4 text-sm font-mono text-brand-400">4,200 / 18.5</td>
                                        <td className="px-6 py-4">
                                            <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full w-fit">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Dispatched
                                            </span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}
            </main>

            {/* Footer */}
            <footer className="py-6 border-t border-white/5 mt-auto">
                <div className="max-w-7xl mx-auto px-4 flex justify-between items-center text-[10px] uppercase tracking-widest font-bold text-slate-600">
                    <div>© 2026 Logistics AI Portal • Production Grade MVP</div>
                    <div className="flex gap-4">
                        <a href="#" className="hover:text-slate-400 transition-colors">API Docs</a>
                        <a href="#" className="hover:text-slate-400 transition-colors">Support</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default App;
