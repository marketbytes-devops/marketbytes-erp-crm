import { useState, useEffect, useCallback, useMemo } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { motion, AnimatePresence } from "framer-motion";
import LayoutComponents from "../../../components/LayoutComponents";
import apiClient from "../../../helpers/apiClient";
import Loading from "../../../components/Loading";
import {
  MdDragIndicator,
  MdEdit,
  MdDelete,
  MdSearch,
  MdFilterList,
  MdRefresh,
  MdLayers,
  MdTrendingUp,
  MdAttachMoney,
  MdTimer,
  MdCheckCircle,
  MdCancel
} from "react-icons/md";
import { FiSearch, FiMoreVertical, FiCalendar, FiUser } from "react-icons/fi";
import toast from "react-hot-toast";

const COLUMNS_ORDER = [
  { id: "new_lead", title: "New Discovery", color: "from-blue-500 to-indigo-600", bg: "bg-blue-50/30", icon: MdSearch },
  { id: "connected", title: "Engaged", color: "from-amber-400 to-orange-500", bg: "bg-amber-50/30", icon: MdRefresh },
  { id: "proposal_sent", title: "Negotiation", color: "from-purple-500 to-pink-600", bg: "bg-purple-50/30", icon: MdLayers },
  { id: "closed_won", title: "Conversion", color: "from-emerald-400 to-teal-600", bg: "bg-emerald-50/30", icon: MdCheckCircle },
  { id: "closed_lost", title: "Dormant", color: "from-slate-400 to-slate-600", bg: "bg-slate-50/30", icon: MdCancel },
];

const Pipeline = () => {
  const [leads, setLeads] = useState([]);
  const [agents, setAgents] = useState([]);
  const [columns, setColumns] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterAgent, setFilterAgent] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [leadsRes, agentsRes] = await Promise.all([
        apiClient.get("/sales/leads/"),
        apiClient.get("/auth/users/"),
      ]);

      const leadsData = leadsRes.data.results || leadsRes.data || [];
      const agentsData = agentsRes.data.results || agentsRes.data || [];

      setLeads(leadsData);
      setAgents(agentsData);
      groupLeads(leadsData, search, filterAgent);
    } catch (err) {
      toast.error("Failed to load pipeline data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, filterAgent]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const stats = useMemo(() => {
    const totalValue = leads.reduce((sum, l) => sum + (parseFloat(l.lead_value) || 0), 0);
    const wonValue = leads.filter(l => l.status === 'closed_won').reduce((sum, l) => sum + (parseFloat(l.lead_value) || 0), 0);
    return [
      { label: "Pipeline Depth", value: `₹${(totalValue / 100000).toFixed(1)}L`, sub: `${leads.length} Total Leads`, icon: MdAttachMoney, color: "text-blue-600", bg: "bg-blue-50" },
      { label: "Win Projection", value: `₹${(wonValue / 100000).toFixed(1)}L`, sub: `${leads.filter(l => l.status === 'closed_won').length} Conversions`, icon: MdTrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
      { label: "Active Deals", value: leads.filter(l => !['closed_won', 'closed_lost'].includes(l.status)).length, sub: "In-Progress Stages", icon: MdTimer, color: "text-amber-600", bg: "bg-amber-50" },
      { label: "Lead Velocity", value: "+12.4%", sub: "Vs Last Month", icon: MdLayers, color: "text-purple-600", bg: "bg-purple-50" },
    ];
  }, [leads]);

  const groupLeads = (data, searchTerm, agentId) => {
    let filtered = [...data];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(l => l.client_name?.toLowerCase().includes(term) || l.company_name?.toLowerCase().includes(term));
    }
    if (agentId) filtered = filtered.filter((l) => l.lead_agent === parseInt(agentId));

    const grouped = {};
    COLUMNS_ORDER.forEach((col) => {
      grouped[col.id] = filtered.filter((l) => l.status === col.id);
    });
    setColumns(grouped);
  };

  const onDragEnd = async (result) => {
    if (!result.destination) return;
    const { source, destination, draggableId } = result;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const leadId = parseInt(draggableId);
    const newStatus = destination.droppableId;

    const newColumns = { ...columns };
    const sourceLeads = [...newColumns[source.droppableId]];
    const destLeads = source.droppableId === destination.droppableId ? sourceLeads : [...newColumns[destination.droppableId]];

    const [movedLead] = sourceLeads.splice(source.index, 1);
    const updatedLead = { ...movedLead, status: newStatus };
    destLeads.splice(destination.index, 0, updatedLead);

    newColumns[source.droppableId] = sourceLeads;
    newColumns[destination.droppableId] = destLeads;
    setColumns(newColumns);

    try {
      await apiClient.patch(`/sales/leads/${leadId}/`, { status: newStatus });
      toast.success("Stage updated successfully");
    } catch (err) {
      toast.error("Failed to migrate record");
      fetchData();
    }
  };

  const getAgentName = (id) => {
    const agent = agents.find(a => a.id === id);
    return agent ? (agent.name || `${agent.first_name} ${agent.last_name}`) : "Unassigned";
  };

  if (loading && leads.length === 0) return <Loading />;

  return (
    <div className="p-6 min-h-screen bg-[#f8fafc]">
      <LayoutComponents
        title="Revenue Pipeline"
        subtitle="Manage leads through high-conversion stages"
        variant="table"
      >
        {/* Analytics Header */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-6 rounded-4xl border border-gray-100 shadow-sm group hover:shadow-xl transition-all"
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color} transition-transform group-hover:scale-110`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
              <p className="text-xs font-bold text-gray-400 mt-2 flex items-center gap-1">
                <span className={stat.value.toString().startsWith('+') ? 'text-emerald-600' : 'text-gray-400'}>{stat.sub}</span>
              </p>
            </motion.div>
          ))}
        </div>

        {/* Global Toolbar */}
        <div className="flex flex-col lg:flex-row justify-between items-center gap-6 mb-10 bg-white p-5 rounded-4xl border border-gray-100 shadow-sm">
          <div className="flex flex-col md:flex-row items-center gap-4 flex-1 w-full">
            <div className="relative flex-1 w-full max-w-md group">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors w-5 h-5" />
              <input
                type="text"
                placeholder="Locate opportunities..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50/50 border-none rounded-2xl focus:ring-2 focus:ring-black outline-none transition-all font-medium text-sm"
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <select
                  value={filterAgent}
                  onChange={(e) => setFilterAgent(e.target.value)}
                  className="w-full pl-11 pr-8 py-3.5 bg-gray-50/50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-black font-medium text-sm appearance-none cursor-pointer"
                >
                  <option value="">Consolidated View</option>
                  {agents.map(a => (
                    <option key={a.id} value={a.id}>{a.name || `${a.first_name} ${a.last_name}`}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={fetchData}
                className="p-3.5 bg-white hover:bg-black hover:text-white rounded-2xl transition-all text-gray-600 border border-gray-100 shadow-sm active:scale-95 group"
                title="Sync Records"
              >
                <MdRefresh className={`w-5 h-5 ${loading ? 'animate-spin' : ''} group-hover:rotate-180 transition-transform duration-500`} />
              </button>
            </div>
          </div>
        </div>

        {/* Board View */}
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-8 overflow-x-auto pb-8 snap-x scrollbar-thin scrollbar-thumb-indigo-100 scrollbar-track-transparent min-h-[600px] h-[calc(100vh-450px)]">
            {COLUMNS_ORDER.map((column) => (
              <div key={column.id} className="flex flex-col min-w-[340px] w-[340px] snap-center">
                {/* Stage Header */}
                <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 mb-6 relative overflow-hidden group">
                  <div className={`absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b ${column.color}`}></div>
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl bg-gradient-to-br ${column.color} text-white shadow-lg shadow-indigo-500/10`}>
                        <column.icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-sm">{column.title}</h3>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{columns[column.id]?.length || 0} Records</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-gray-900">₹{columns[column.id]?.reduce((sum, l) => sum + (parseFloat(l.lead_value) || 0), 0).toLocaleString()}</p>
                      <p className="text-[9px] font-bold text-gray-400">STAGE VALUE</p>
                    </div>
                  </div>
                </div>

                {/* Droppable Stage */}
                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 rounded-[2.5rem] p-3 transition-all duration-300 ${snapshot.isDraggingOver ? "bg-slate-200/50 scale-[0.98]" : column.bg
                        } border-2 border-dashed ${snapshot.isDraggingOver ? "border-indigo-400/30" : "border-transparent"
                        } overflow-y-auto custom-scrollbar`}
                    >
                      <AnimatePresence mode="popLayout">
                        {columns[column.id]?.map((lead, index) => (
                          <Draggable key={lead.id} draggableId={lead.id.toString()} index={index}>
                            {(provided, snapshot) => (
                              <motion.div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className={`bg-white rounded-3xl border border-gray-100 p-5 mb-4 shadow-sm hover:shadow-xl transition-all group relative ${snapshot.isDragging ? "shadow-2xl ring-4 ring-indigo-500/10 -rotate-2 scale-105 z-50 cursor-grabbing" : "cursor-grab"
                                  }`}
                              >
                                <div className="flex justify-between items-start mb-4">
                                  <div className="flex-1 pr-4">
                                    <h4 className="font-bold text-gray-900 leading-tight group-hover:text-indigo-600 transition-colors">
                                      {lead.client_name || "Confidential Client"}
                                    </h4>
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                                        {lead.company_name || "Independent"}
                                      </span>
                                    </div>
                                  </div>
                                  <MdDragIndicator className="text-gray-300 w-5 h-5 group-hover:text-indigo-200" />
                                </div>

                                <div className="space-y-4">
                                  <div className="flex items-center justify-between">
                                    <div className="text-xl font-black text-slate-900 tracking-tight">
                                      ₹{parseFloat(lead.lead_value || 0).toLocaleString()}
                                    </div>
                                    <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 border border-slate-100 rounded-lg">
                                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Active</span>
                                    </div>
                                  </div>

                                  <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                    <div className="flex items-center gap-2">
                                      <div className="w-7 h-7 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-600 shadow-sm">
                                        {getAgentName(lead.lead_agent).charAt(0)}
                                      </div>
                                      <span className="text-[11px] font-bold text-slate-600">
                                        {getAgentName(lead.lead_agent)}
                                      </span>
                                    </div>

                                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-indigo-600 transition-colors">
                                        <MdEdit className="w-4 h-4" />
                                      </button>
                                      <button className="p-2 hover:bg-rose-50 rounded-xl text-slate-400 hover:text-rose-600 transition-colors">
                                        <MdDelete className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>

                                  {lead.follow_up_date && (
                                    <div className="flex items-center gap-2 px-3 py-2 bg-rose-50/50 border border-rose-100 rounded-xl">
                                      <FiCalendar className="w-3 h-3 text-rose-500" />
                                      <p className="text-[10px] text-rose-600 font-bold uppercase tracking-wider">
                                        Follow up: {lead.follow_up_date}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </Draggable>
                        ))}
                      </AnimatePresence>
                      {provided.placeholder}

                      {(!columns[column.id] || columns[column.id].length === 0) && !snapshot.isDraggingOver && (
                        <div className="flex flex-col items-center justify-center py-24 opacity-20 filter grayscale select-none">
                          <MdLayers className="w-12 h-12 mb-3" />
                          <p className="text-xs font-bold uppercase tracking-widest">Stage Inactive</p>
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      </LayoutComponents>
    </div>
  );
};

export default Pipeline;
