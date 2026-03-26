import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router";
import LayoutComponents from "../../../components/LayoutComponents";
import apiClient from "../../../helpers/apiClient";
import {
 MdTrendingUp,
 MdSearch,
 MdRefresh,
 MdStar,
 MdInfoOutline
} from "react-icons/md";
import {
 User,
 Briefcase,
 Calendar,
 Award,
 BarChart3,
 ShieldCheck,
 ChevronRight,
 DollarSign,
 Clock,
 ArrowRightLeft,
 X
} from "lucide-react";
import toast from "react-hot-toast";
import { usePermission } from "../../../context/PermissionContext";

const Performance = () => {
 const { hasPermission } = usePermission();
 const [reviews, setReviews] = useState([]);
 const [loading, setLoading] = useState(true);
 const [searchTerm, setSearchTerm] = useState("");
 const [projects, setProjects] = useState([]);
 const [selectedDept, setSelectedDept] = useState(null);

 const [salesStats, setSalesStats] = useState(null);

 useEffect(() => {
 fetchReviews();
 fetchSalesStats();
 fetchProjects();
 }, []);

 const fetchSalesStats = () => {
 apiClient.get("/sales/leads/dashboard_stats/")
 .then(res => setSalesStats(res.data))
 .catch(err => console.error("Sales stats fetch failed", err));
 };

 const fetchProjects = () => {
 apiClient.get("/operation/projects/")
 .then(res => {
 let data = res.data;
 if (data && data.results) {
 data = data.results;
 }
 setProjects(Array.isArray(data) ? data : []);
 })
 .catch(err => console.error("Projects fetch failed", err));
 };

 const fetchReviews = () => {
 setLoading(true);
 apiClient
 .get("/hr/performance/")
 .then((res) => {
 let data = res.data;
 if (data && data.results) {
 data = data.results;
 }
 setReviews(Array.isArray(data) ? data : []);
 })
 .catch((err) => {
 console.error("Failed to load performance reviews:", err);
 toast.error("Failed to load performance reviews");
 setReviews([]);
 })
 .finally(() => setLoading(false));
 };

 const getRatingMetadata = (ratingStr) => {
 const rating = parseFloat(ratingStr) || 0;
 if (rating >= 4.5) return { label: "Elite", color: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50" };
 if (rating >= 3.5) return { label: "Strong", color: "bg-indigo-500", text: "text-indigo-700", bg: "bg-indigo-50" };
 if (rating >= 2.5) return { label: "Standard", color: "bg-amber-500", text: "text-amber-700", bg: "bg-amber-50" };
 return { label: "Growth", color: "bg-rose-500", text: "text-rose-700", bg: "bg-rose-50" };
 };

 const filteredReviews = reviews.filter(r =>
 r.employee?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
 r.review_period?.toLowerCase().includes(searchTerm.toLowerCase())
 );

 const avgRating = reviews.length > 0
 ? (reviews.reduce((sum, r) => sum + (parseFloat(r.rating) || 0), 0) / reviews.length).toFixed(1)
 : "0.0";

 const counts = reviews.reduce((acc, r) => {
 const rating = parseFloat(r.rating) || 0;
 if (rating >= 4.5) acc.elite++;
 else if (rating >= 3.5) acc.strong++;
 return acc;
 }, { elite: 0, strong: 0 });

 const getMedian = (arr) => {
 if (arr.length === 0) return "0.0";
 const mid = Math.floor(arr.length / 2);
 const nums = [...arr].sort((a, b) => a - b);
 return arr.length % 2 !== 0 ? nums[mid].toFixed(1) : ((nums[mid - 1] + nums[mid]) / 2).toFixed(1);
 };

 const medianRating = getMedian(reviews.map(r => parseFloat(r.rating) || 0));

 const deptStats = filteredReviews.reduce((acc, r) => {
 const dName = r.department?.name || "Unassigned";
 if (!acc[dName]) acc[dName] = { sum: 0, count: 0 };
 acc[dName].sum += parseFloat(r.rating) || 0;
 acc[dName].count += 1;
 return acc;
 }, {});

 const projectDeptStats = projects.reduce((acc, p) => {
 const dName = p.department?.name || "Unassigned";
 if (!acc[dName]) acc[dName] = 0;
 acc[dName] += parseFloat(p.profit_loss) || 0;
 return acc;
 }, {});

 const allDeptNames = Array.from(new Set([
 ...Object.keys(deptStats),
 ...Object.keys(projectDeptStats)
 ]));

 const chartData = allDeptNames.map(name => {
 const stats = deptStats[name];
 return {
 name,
 avg: stats ? (stats.sum / stats.count).toFixed(1) : "0.0",
 profit: projectDeptStats[name] || 0
 };
 }).sort((a, b) => b.avg - a.avg || b.profit - a.profit);

 return (
 <div className="space-y-8 animate-in fade-in duration-700 m-6">
 <LayoutComponents
 title="Performance Matrix"
 subtitle="Analytical oversight of organizational talent and impact growth."
 variant="card"
 >
 <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
 <div className="bg-gray-50/50 rounded-3xl p-6 border border-gray-100 hover:shadow-lg transition-all group overflow-hidden relative">
 <div className="absolute -right-2 -top-2 text-gray-100 group-hover:text-black/5 transition-colors">
 <Award size={80} />
 </div>
 <p className="text-gray-600 text-[10px] font-medium uppercase tracking-widest mb-1">Portfolio Rating</p>
 <p className="text-3xl font-medium text-black font-syne transition-transform origin-left">{avgRating}/5.0</p>
 <div className="mt-4 flex items-center gap-2 text-indigo-600">
 <MdTrendingUp className="" />
 <span className="text-[10px] font-medium uppercase text-indigo-600">Median Output: {medianRating}</span>
 </div>
 </div>

 <div className="bg-gray-50/50 rounded-3xl p-6 border border-gray-100 hover:shadow-lg transition-all group overflow-hidden relative">
 <div className="absolute -right-2 -top-2 text-gray-100 group-hover:text-black/5 transition-colors">
 <BarChart3 size={80} />
 </div>
 <p className="text-gray-600 text-[10px] font-medium uppercase tracking-widest mb-1">Total Audits</p>
 <p className="text-3xl font-medium text-black font-syne">{reviews.length}</p>
 <p className="text-[10px] text-gray-500 mt-4 font-medium uppercase tracking-tight">Active Cycle</p>
 </div>

 <div className="bg-emerald-500 rounded-3xl p-6 shadow-2xl shadow-emerald-200/50 group overflow-hidden relative text-white">
 <div className="absolute -right-2 -top-2 text-white/10 group-hover:text-white/20 transition-colors">
 <Award size={80} />
 </div>
 <p className="text-emerald-100 text-[10px] font-medium uppercase tracking-widest mb-1">Elite Talent</p>
 <p className="text-3xl font-medium font-syne">{counts.elite}</p>
 <p className="text-[10px] text-emerald-100/80 mt-4 font-medium uppercase tracking-tight">Rating {">"} 4.5</p>
 </div>

 <div className="bg-black p-6 shadow-2xl shadow-black/20 group overflow-hidden relative text-white px-4 py-3 text-sm rounded-xl font-medium">
 <div className="absolute -right-2 -top-2 text-white/10 group-hover:text-white/20 transition-colors">
 <BarChart3 size={80} />
 </div>
 <p className="text-gray-400 text-[10px] font-medium uppercase tracking-widest mb-1">Strong Impact</p>
 <p className="text-3xl font-medium font-syne">{counts.strong}</p>
 <p className="text-[10px] text-gray-400 mt-4 font-medium uppercase tracking-tight">Rating 3.5 - 4.5</p>
 </div>
 </div>

 {/* Analytic Impact Layer */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
 {/* Departmental Performance Graph */}
 <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-2xl shadow-gray-200/50">
 <div className="flex items-center justify-between mb-8">
 <div>
 <h3 className="text-xl font-medium font-syne text-black uppercase tracking-tighter">Departmental Velocity</h3>
 <p className="text-[10px] text-gray-500 font-medium uppercase tracking-widest mt-1">Cross-unit performance synchronization</p>
 </div>
 <div className="p-3 bg-gray-50 rounded-xl">
 <BarChart3 className="text-black w-6 h-6" />
 </div>
 </div>

 <div className="space-y-6">
 {chartData.length === 0 ? (
 <div className="py-20 text-center text-gray-400 text-xs font-medium uppercase tracking-widest">Awaiting unit metrics...</div>
 ) : (
 chartData.map((data, idx) => (
 <div
 key={data.name}
 className="group cursor-pointer hover:bg-gray-50/50 p-3 rounded-xl transition-all ]"
 onClick={() => setSelectedDept(data.name)}
 >
 <div className="flex justify-between items-center mb-2">
 <div className="flex flex-col">
 <span className="text-[10px] font-medium text-black uppercase tracking-widest">{data.name}</span>
 <span className="text-[9px] text-gray-400 font-medium">Click for details</span>
 </div>
 <div className="flex flex-col items-end">
 <span className="text-[11px] font-syne font-medium text-indigo-600">Performance: {data.avg} / 5.0</span>
 <span className={`text-[10px] font-bold ${data.profit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
 Profit Contribution: ₹{data.profit.toLocaleString()}
 </span>
 </div>
 </div>
 <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden relative">
 <motion.div
 initial={{ width: 0 }}
 animate={{ width: `${(data.avg / 5) * 100}%` }}
 transition={{ duration: 1, delay: idx * 0.1 }}
 className={`absolute top-0 left-0 h-full rounded-full bg-linear-to-r ${idx === 0 ? 'from-black to-gray-800' : 'from-indigo-500 to-indigo-600'}`}
 />
 </div>
 </div>
 ))
 )}
 </div>
 </div>

 {/* Sales Pipeline Insight (Dynamic) */}
 <div className="bg-black p-10 shadow-2xl shadow-black/20 text-white relative overflow-hidden group px-4 py-3 text-sm rounded-xl font-medium">
 <div className="absolute right-0 top-0 opacity-10 group-hover:opacity-20 transition-opacity">
 <MdTrendingUp size={200} />
 </div>
 <div className="relative z-10 flex flex-col h-full">
 <div className="mb-auto">
 <div className="inline-flex px-3 py-1 rounded-full bg-white/10 text-[9px] font-medium uppercase tracking-widest text-emerald-400 mb-6">
 Sales Impact Report
 </div>
 <h3 className="text-2xl font-medium font-syne leading-tight mb-2">Pipeline Accuracy</h3>
 <p className="text-gray-400 text-xs leading-relaxed">
 Sales performance is calibrated based on real-time pipeline reports, conversion velocity, and lead valuation.
 </p>
 </div>

 <div className="mt-8 space-y-6">
 <div className="flex justify-between items-center border-b border-white/10 pb-4">
 <span className="text-[10px] text-gray-500 font-medium uppercase tracking-widest">Active Leads</span>
 <span className="text-xl font-syne font-medium text-white">{salesStats?.total_leads || 0}</span>
 </div>
 <div className="flex justify-between items-center border-b border-white/10 pb-4">
 <span className="text-[10px] text-gray-500 font-medium uppercase tracking-widest">Closed Wins</span>
 <span className="text-xl font-syne font-medium text-emerald-400">
 {salesStats?.leads_by_status?.find(s => s.status === 'closed_won')?.count || 0}
 </span>
 </div>
 <div className="flex justify-between items-center">
 <span className="text-[10px] text-gray-500 font-medium uppercase tracking-widest">Pipeline Value</span>
 <span className="text-xl font-syne font-medium text-white">${(salesStats?.total_value || 0).toLocaleString()}</span>
 </div>
 </div>
 </div>
 </div>
 </div>

 <div className="mt-12 p-8 bg-gray-50 border border-gray-100 rounded-[2.5rem] flex flex-col md:flex-row gap-8 items-start justify-between relative overflow-hidden group">
 <div className="absolute right-0 bottom-0 opacity-5 group-hover:opacity-10 transition-opacity">
 <BarChart3 size={240} />
 </div>
 <div className="space-y-4 max-w-xl relative z-10">
 <div className="flex items-center gap-3 text-black">
 <MdInfoOutline className="text-2xl" />
 <h4 className="font-medium font-syne uppercase tracking-tighter leading-none">Evaluation Protocol v2.5</h4>
 </div>
 <p className="text-xs text-gray-600 font-medium leading-relaxed">
 All performance audits are conducted by authorized lead auditors. Metrics represent a weighted average across technical proficiency, mission impact, and collaborative synchronization.
 Ratings are refreshed every quarter to ensure a dynamic and high-performing ecosystem.
 </p>
 </div>
 <div className="flex gap-4 relative z-10">
 {hasPermission("performance", "edit") && (
 <button
 onClick={fetchReviews}
 className="flex items-center gap-3 bg-white border border-gray-200 text-black text-[10px] uppercase tracking-widest hover:bg-gray-100 transition shadow-xs px-4 py-3 text-sm rounded-xl font-medium"
 >
 <MdRefresh /> Resync Cycle
 </button>
 )}
 <button className="flex items-center gap-3 bg-black text-white text-[10px] uppercase tracking-widest hover:bg-gray-800 transition shadow-xl shadow-black/10 px-4 py-3 text-sm rounded-xl font-medium">
 <ChevronRight size={14} /> Audit History
 </button>
 </div>
 </div>

 {/* Drill-down Modal */}
 <AnimatePresence>
 {selectedDept && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 onClick={() => setSelectedDept(null)}
 className="absolute inset-0 bg-black/40 backdrop-blur-md"
 />
 <motion.div
 initial={{ opacity: 0, scale: 0.95, y: 20 }}
 animate={{ opacity: 1, scale: 1, y: 0 }}
 exit={{ opacity: 0, scale: 0.95, y: 20 }}
 className="bg-white rounded-[3rem] shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden relative z-10 border border-gray-100"
 >
 <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
 <div>
 <div className="inline-flex bg-black text-[9px] uppercase tracking-widest text-white mb-2 px-4 py-3 text-sm rounded-xl font-medium">
 Department Analysis
 </div>
 <h3 className="text-3xl font-medium font-syne text-black uppercase">{selectedDept}</h3>
 </div>
 <button
 onClick={() => setSelectedDept(null)}
 className="p-3 bg-white hover:bg-gray-100 rounded-xl transition-all shadow-sm"
 >
 <X size={24} />
 </button>
 </div>

 <div className="p-8 overflow-y-auto max-h-[calc(90vh-140px)] space-y-8">
 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
 <div className="bg-indigo-50 rounded-3xl p-6 border border-indigo-100">
 <p className="text-indigo-600 text-[9px] font-bold uppercase tracking-widest mb-1">Financial Impact</p>
 <p className={`text-2xl font-medium font-syne ${chartData.find(d => d.name === selectedDept)?.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
 ₹{chartData.find(d => d.name === selectedDept)?.profit?.toLocaleString()}
 </p>
 </div>
 <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100">
 <p className="text-gray-500 text-[9px] font-bold uppercase tracking-widest mb-1">Active Projects</p>
 <p className="text-2xl font-medium font-syne text-black">
 {projects.filter(p => (p.department?.name || "Unassigned") === selectedDept).length}
 </p>
 </div>
 <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100">
 <p className="text-gray-500 text-[9px] font-bold uppercase tracking-widest mb-1">Audit Score</p>
 <p className="text-2xl font-medium font-syne text-black">
 {chartData.find(d => d.name === selectedDept)?.avg} / 5.0
 </p>
 </div>
 </div>

 <div className="space-y-6">
 <h4 className="text-sm font-bold text-black uppercase tracking-widest border-l-4 border-black pl-4">Correlated Projects</h4>
 {projects.filter(p => (p.department?.name || "Unassigned") === selectedDept).length === 0 ? (
 <p className="text-center py-10 text-gray-400 font-medium uppercase text-[10px] tracking-widest">No commercial projects linked to this unit.</p>
 ) : (
 <div className="grid grid-cols-1 gap-4">
 {projects.filter(p => (p.department?.name || "Unassigned") === selectedDept).map(project => (
 <div key={project.id} className="bg-white border border-gray-100 rounded-3xl p-6 hover:shadow-xl transition-all group">
 <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-6">
 <div className="flex-1">
 <h5 className="font-medium text-black mb-1">{project.name}</h5>
 <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-tight text-gray-400">
 <span className="flex items-center gap-1"><Briefcase size={12} /> {project.stage_name || 'Operating'}</span>
 <span className="flex items-center gap-1"><Clock size={12} /> {project.total_hours_spent || 0}h Recorded</span>
 </div>
 </div>

 <div className="grid grid-cols-2 lg:grid-cols-3 gap-8">
 <div>
 <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-1">Budget</p>
 <p className="text-sm font-syne font-medium text-black">{project.currency?.symbol || '₹'}{parseFloat(project.budget || 0).toLocaleString()}</p>
 </div>
 <div>
 <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-1">Actual Cost</p>
 <p className="text-sm font-syne font-medium text-rose-500">{project.currency?.symbol || '₹'}{parseFloat(project.total_actual_cost || 0).toLocaleString()}</p>
 </div>
 <div className="col-span-2 lg:col-span-1 border-t lg:border-t-0 lg:border-l border-gray-100 pt-3 lg:pt-0 lg:pl-6">
 <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-1">Impact</p>
 <p className={`text-sm font-syne font-bold ${project.profit_loss >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
 {project.profit_loss >= 0 ? '+' : ''}₹{project.profit_loss?.toLocaleString()}
 </p>
 </div>
 </div>
 </div>

 <div className="mt-8">
 <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
 <ArrowRightLeft size={12} /> Resource Allocation Breakdown
 </p>
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
 {(project.member_contributions || []).map(member => (
 <div key={member.id} className="bg-gray-50/50 rounded-xl p-4 flex items-center gap-4 border border-gray-100/50 group-hover:bg-white transition-colors">
 <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden">
 {member.profile_picture ? <img src={member.profile_picture} alt="" className="w-full h-full object-cover" /> : member.name?.[0]?.toUpperCase()}
 </div>
 <div className="flex-1">
 <p className="text-xs font-medium text-black leading-tight">{member.name}</p>
 <div className="flex justify-between items-center mt-1">
 <span className="text-[9px] text-gray-500 font-bold">{member.hours}h Logged</span>
 <span className="text-[9px] text-indigo-600 font-bold font-syne">₹{member.cost.toLocaleString()}</span>
 </div>
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 </div>
 </motion.div>
 </div>
 )}
 </AnimatePresence>
 </LayoutComponents>
 </div>
 );
};

export default Performance;
