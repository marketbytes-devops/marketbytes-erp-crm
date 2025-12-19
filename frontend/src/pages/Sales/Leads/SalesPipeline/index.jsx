import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { motion } from "framer-motion";
import LayoutComponents from "../../../../components/LayoutComponents/index";
import apiClient from "../../../../helpers/apiClient";
import { MdDragIndicator, MdEdit, MdDelete } from "react-icons/md";

const columnsOrder = [
  { id: "new_lead", title: "New Lead", color: "bg-blue-100" },
  { id: "connected", title: "Connected", color: "bg-yellow-100" },
  { id: "proposal_sent", title: "Proposal Sent", color: "bg-purple-100" },
  { id: "closed_won", title: "Closed Won", color: "bg-green-100" },
  { id: "closed_lost", title: "Closed Lost", color: "bg-red-100" },
  { id: "lost", title: "Lost", color: "bg-gray-100" },
];

const Pipeline = () => {
  const [leads, setLeads] = useState([]);
  const [columns, setColumns] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get("/sales/leads/");
        const data = res.data.results || res.data || [];

        // Group leads by status
        const grouped = {};
        columnsOrder.forEach(col => {
          grouped[col.id] = [];
        });
        data.forEach(lead => {
          if (grouped[lead.status]) {
            grouped[lead.status].push(lead);
          }
        });

        setColumns(grouped);
        setLeads(data);
      } catch (err) {
        console.error("Failed to load leads:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeads();
  }, []);

  const onDragEnd = async (result) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;

    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const leadId = parseInt(draggableId);
    const newStatus = destination.droppableId;

    // Optimistic UI update
    const newColumns = { ...columns };
    const sourceLeads = [...newColumns[source.droppableId]];
    const destLeads = source.droppableId === destination.droppableId ? sourceLeads : [...newColumns[destination.droppableId]];

    const [movedLead] = sourceLeads.splice(source.index, 1);
    movedLead.status = newStatus;
    destLeads.splice(destination.index, 0, movedLead);

    newColumns[source.droppableId] = sourceLeads;
    newColumns[destination.droppableId] = destLeads;

    setColumns(newColumns);

    // Update backend
    try {
      await apiClient.patch(`/api/sales/leads/${leadId}/`, { status: newStatus });
    } catch (err) {
      alert("Failed to update status");
      // Revert on error (optional)
    }
  };

  const getStatusColor = (status) => {
    const col = columnsOrder.find(c => c.id === status);
    return col ? col.color : "bg-gray-100";
  };

  if (loading) {
    return (
      <div className="p-6">
        <LayoutComponents title="Sales Pipeline" subtitle="Visualize your deal flow" variant="card">
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-black border-t-transparent"></div>
          </div>
        </LayoutComponents>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen">
      <LayoutComponents title="Sales Pipeline" subtitle="Drag leads to update status" variant="card">
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="text-2xl font-bold mb-8">Deal Pipeline</h3>

          <DragDropContext onDragEnd={onDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 overflow-x-auto">
              {columnsOrder.map((column) => (
                <div key={column.id} className="flex flex-col">
                  <div className={`px-4 py-3 rounded-t-xl text-sm font-bold text-gray-800 ${column.color}`}>
                    {column.title}
                    <span className="ml-2 text-xs font-normal">({columns[column.id]?.length || 0})</span>
                  </div>
                  <Droppable droppableId={column.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`min-h-96 rounded-b-xl bg-gray-50 p-3 transition-colors ${
                          snapshot.isDraggingOver ? "bg-gray-100" : ""
                        }`}
                      >
                        {columns[column.id]?.map((lead, index) => (
                          <Draggable key={lead.id} draggableId={lead.id.toString()} index={index}>
                            {(provided, snapshot) => (
                              <motion.div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`bg-white rounded-xl shadow-md p-4 mb-3 cursor-grab active:cursor-grabbing transition-all ${
                                  snapshot.isDragging ? "shadow-xl rotate-3 scale-105" : ""
                                }`}
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <h4 className="font-semibold text-gray-900">{lead.client_name || "No Client"}</h4>
                                  <MdDragIndicator className="text-gray-400" />
                                </div>
                                <p className="text-sm text-gray-600 mb-1">{lead.company_name || "No Company"}</p>
                                <p className="text-lg font-bold text-black mb-2">₹{lead.lead_value || 0}</p>
                                <p className="text-xs text-gray-500 mb-2">Agent: {lead.lead_agent_name || "Unassigned"}</p>
                                {lead.follow_up_date && (
                                  <p className="text-xs text-red-600">Follow up: {lead.follow_up_date}</p>
                                )}
                                <div className="flex gap-2 mt-3">
                                  <button className="p-1 hover:bg-indigo-100 rounded text-indigo-600">
                                    <MdEdit className="w-4 h-4" />
                                  </button>
                                  <button className="p-1 hover:bg-red-100 rounded text-red-600">
                                    <MdDelete className="w-4 h-4" />
                                  </button>
                                </div>
                              </motion.div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                        {(!columns[column.id] || columns[column.id].length === 0) && (
                          <div className="text-center text-gray-400 text-sm py-8">
                            No leads here
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>
                </div>
              ))}
            </div>
          </DragDropContext>
        </div>
      </LayoutComponents>
    </div>
  );
};

export default Pipeline;