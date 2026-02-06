import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  Legend,
  ComposedChart,
  Line
} from "recharts";
import LayoutComponents from "../../../components/LayoutComponents";
import Loading from "../../../components/Loading";
import {
  MdTrendingUp,
  MdPeople,
  MdAttachMoney,
  MdFilterAlt,
  MdFileDownload,
  MdDateRange,
  MdDashboard,
  MdTimeline,
  MdLeaderboard
} from "react-icons/md";
import { FiTrendingUp, FiPieChart, FiBarChart2, FiUsers } from "react-icons/fi";

// Mock Data for Analytics
const PERFORMANCE_STATS = [
  { label: "Total Leads", value: "2,482", growth: "+12.5%", icon: MdPeople, color: "text-blue-600", bg: "bg-blue-50" },
  { label: "Conversion Rate", value: "18.4%", growth: "+2.1%", icon: MdTrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
  { label: "Gross Revenue", value: "₹42.5L", growth: "+8.4%", icon: MdAttachMoney, color: "text-black", bg: "bg-indigo-50" },
  { label: "Avg. Deal Size", value: "₹1.2L", growth: "-1.2%", icon: MdTimeline, color: "text-amber-600", bg: "bg-amber-50" },
];

const REVENUE_TREND = [
  { month: "Jan", revenue: 450000, leads: 120 },
  { month: "Feb", revenue: 520000, leads: 145 },
  { month: "Mar", revenue: 480000, leads: 132 },
  { month: "Apr", revenue: 610000, leads: 168 },
  { month: "May", revenue: 590000, leads: 155 },
  { month: "Jun", revenue: 720000, leads: 190 },
];

const LEAD_SOURCES = [
  { name: "Direct", value: 400, color: "#6366f1" },
  { name: "Social Media", value: 300, color: "#10b981" },
  { name: "Referral", value: 300, color: "#f59e0b" },
  { name: "Organic", value: 200, color: "#ef4444" },
];

const AGENT_PERFORMANCE = [
  { name: "Alex K.", revenue: 1200000, deals: 12, rate: 85 },
  { name: "Sarah M.", revenue: 950000, deals: 9, rate: 72 },
  { name: "Jordan R.", revenue: 1100000, deals: 11, rate: 78 },
  { name: "Casey L.", revenue: 800000, deals: 8, rate: 65 },
];

const PIPELINE_DISTRIBUTION = [
  { stage: "Discovery", count: 45, value: 500000 },
  { stage: "Proposal", count: 32, value: 850000 },
  { stage: "Negotiation", count: 18, value: 1200000 },
  { stage: "Closed Won", count: 12, value: 1500000 },
];

const Reports = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [timeRange, setTimeRange] = useState("Last 6 Months");
  const [isLoading, setIsLoading] = useState(false);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-sm p-4 rounded-2xl shadow-xl border border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm font-bold" style={{ color: entry.color }}>
              {entry.name}: {entry.name.includes("Revenue") ? `₹${(entry.value / 100000).toFixed(1)}L` : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 min-h-screen">
      <LayoutComponents
        title="Sales Analytics"
        subtitle="Data-driven insights and performance tracking"
        variant="table"
      >
        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="flex gap-2 p-1 bg-white border border-gray-100 rounded-2xl shadow-sm">
            {[
              { id: "overview", label: "Overview", icon: MdDashboard },
              { id: "revenue", label: "Revenue", icon: MdTimeline },
              { id: "performance", label: "Performance", icon: MdLeaderboard }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === tab.id
                  ? "bg-black text-white shadow-lg shadow-black/10"
                  : "text-gray-500 hover:text-black hover:bg-gray-50"
                  }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative">
              <MdDateRange className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="pl-11 pr-8 py-2.5 bg-white border border-gray-100 rounded-xl text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-black transition-all appearance-none cursor-pointer"
              >
                <option>Last 30 Days</option>
                <option>Last 3 Months</option>
                <option>Last 6 Months</option>
                <option>Last Year</option>
              </select>
            </div>
            <button className="flex items-center gap-2 px-6 py-2.5 bg-white border border-gray-100 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all active:scale-95 shadow-sm">
              <MdFileDownload className="w-5 h-5" /> Export
            </button>
          </div>
        </div>

        {isLoading ? <Loading /> : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Key Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {PERFORMANCE_STATS.map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white p-6 rounded-4xl border border-gray-100 shadow-sm hover:shadow-xl transition-all group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color} transition-transform group-hover:scale-110`}>
                      <stat.icon className="w-6 h-6" />
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${stat.growth.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                      {stat.growth}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</h3>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
                </motion.div>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {activeTab === "overview" && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="grid grid-cols-1 lg:grid-cols-3 gap-8"
                >
                  {/* Revenue Curve */}
                  <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-center mb-10">
                      <div>
                        <h4 className="text-xl font-bold text-gray-900">Revenue Velocity</h4>
                        <p className="text-sm text-gray-400 font-medium">Tracking monthly gross acquisitions</p>
                      </div>
                      <div className="flex gap-4">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                          <span className="text-[10px] font-bold text-gray-400 uppercase">Revenue</span>
                        </div>
                      </div>
                    </div>
                    <div className="h-[350px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={REVENUE_TREND}>
                          <defs>
                            <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis
                            dataKey="month"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fontWeight: 600, fill: '#94a3b8' }}
                            dy={15}
                          />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fontWeight: 600, fill: '#94a3b8' }}
                            tickFormatter={(value) => `₹${value / 1000}k`}
                          />
                          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#6366f1', strokeWidth: 2 }} />
                          <Area
                            name="Monthly Revenue"
                            type="monotone"
                            dataKey="revenue"
                            stroke="#6366f1"
                            strokeWidth={4}
                            fillOpacity={1}
                            fill="url(#colorRev)"
                            animationDuration={1500}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Lead Sources Pie */}
                  <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col items-center">
                    <div className="w-full text-left mb-8">
                      <h4 className="text-xl font-bold text-gray-900">Conversion Sources</h4>
                      <p className="text-sm text-gray-400 font-medium">Channel effectiveness breakdown</p>
                    </div>
                    <div className="h-[280px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={LEAD_SOURCES}
                            innerRadius={70}
                            outerRadius={100}
                            paddingAngle={8}
                            dataKey="value"
                            animationBegin={200}
                            animationDuration={1500}
                          >
                            {LEAD_SOURCES.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-4 w-full mt-6">
                      {LEAD_SOURCES.map((source, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: source.color }}></div>
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">{source.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "revenue" && (
                <motion.div
                  key="revenue"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="grid grid-cols-1 lg:grid-cols-2 gap-8"
                >
                  {/* Pipeline Funnel */}
                  <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm">
                    <div className="mb-10 text-center">
                      <h4 className="text-2xl font-bold text-gray-900">Pipeline Distribution</h4>
                      <p className="text-sm text-gray-400 font-medium">Capital allocation across sales stages</p>
                    </div>
                    <div className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart layout="vertical" data={PIPELINE_DISTRIBUTION} margin={{ left: 30 }}>
                          <XAxis type="number" hide />
                          <YAxis
                            dataKey="stage"
                            type="category"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 13, fontWeight: 700, fill: '#1e293b' }}
                          />
                          <Tooltip cursor={{ fill: 'transparent' }} content={<CustomTooltip />} />
                          <Bar
                            dataKey="value"
                            radius={[0, 12, 12, 0]}
                            barSize={32}
                            animationDuration={1800}
                          >
                            {PIPELINE_DISTRIBUTION.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e'][index % 4]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Revenue Stacked */}
                  <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm">
                    <div className="mb-10 text-center">
                      <h4 className="text-2xl font-bold text-gray-900">Volume vs Value</h4>
                      <p className="text-sm text-gray-400 font-medium">Correlation between lead acquisition and revenue</p>
                    </div>
                    <div className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={REVENUE_TREND}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600, fill: '#94a3b8' }} />
                          <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600, fill: '#94a3b8' }} />
                          <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600, fill: '#94a3b8' }} />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend />
                          <Bar yAxisId="left" dataKey="leads" name="Lead Count" fill="#cbd5e1" radius={[8, 8, 0, 0]} barSize={24} />
                          <Line yAxisId="right" type="monotone" dataKey="revenue" name="Revenue" stroke="#0f172a" strokeWidth={3} dot={{ r: 6, fill: '#0f172a' }} />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "performance" && (
                <motion.div
                  key="performance"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                >
                  <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden p-10">
                    <div className="flex justify-between items-center mb-10">
                      <div>
                        <h4 className="text-2xl font-bold text-gray-900">Consultant Efficiency</h4>
                        <p className="text-sm text-gray-400 font-medium">Individual performance analysis</p>
                      </div>
                      <button className="flex items-center gap-2 text-xs font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-xl">
                        <FiUsers /> Compare Teams
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                      {AGENT_PERFORMANCE.map((agent, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="p-6 bg-gray-50 rounded-3xl relative overflow-hidden group"
                        >
                          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-indigo-500/10 transition-all"></div>
                          <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-6">
                              <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center font-bold text-black">
                                {agent.name.charAt(0)}
                              </div>
                              <h5 className="font-bold text-gray-900">{agent.name}</h5>
                            </div>
                            <div className="space-y-4">
                              <div className="flex justify-between items-end border-b border-gray-200 pb-2">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Total Revenue</span>
                                <span className="text-sm font-bold text-gray-900 leading-none">₹{(agent.revenue / 100000).toFixed(1)}L</span>
                              </div>
                              <div className="flex justify-between items-end border-b border-gray-200 pb-2">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Closed Deals</span>
                                <span className="text-sm font-bold text-gray-900 leading-none">{agent.deals}</span>
                              </div>
                              <div className="pt-2">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Success Rate</span>
                                  <span className="text-xs font-bold text-emerald-600">{agent.rate}%</span>
                                </div>
                                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                  <motion.div
                                    className="h-full bg-emerald-500"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${agent.rate}%` }}
                                    transition={{ duration: 1.5, delay: 0.5 }}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Notification/Optimization Banner */}
            <div className="bg-black rounded-[2.5rem] p-10 text-white relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-[100px] -ml-48 -mt-48"></div>
              <div className="relative z-10 flex items-center gap-8">
                <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-4xl flex items-center justify-center ring-1 ring-white/20">
                  <FiTrendingUp className="w-10 h-10" />
                </div>
                <div>
                  <h4 className="text-2xl font-bold tracking-tight mb-1">Conversion Intelligence</h4>
                  <p className="text-indigo-100 text-sm max-w-md">Your team's conversion rate is up 12% this month. We recommend focusing on "Social Media" leads for maximum ROI.</p>
                </div>
              </div>
              <button className="relative z-10 px-8 py-4 bg-white text-black rounded-2xl font-bold shadow-2xl shadow-black/20 hover:scale-[1.05] transition-transform active:scale-95 whitespace-nowrap">
                View Recommendations
              </button>
            </div>
          </motion.div>
        )}
      </LayoutComponents>
    </div>
  );
};

export default Reports;
