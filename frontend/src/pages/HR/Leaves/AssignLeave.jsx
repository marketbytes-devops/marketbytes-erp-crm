import { useState, useEffect } from "react";
import { Link } from "react-router";
import { MdArrowBack, MdClose } from "react-icons/md";
import LayoutComponents from "../../../components/LayoutComponents";
import Input from "../../../components/Input";
import apiClient from "../../../helpers/apiClient";

const AssignLeave = () => {
  const [employees, setEmployees] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [showAddTypeModal, setShowAddTypeModal] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    employee: "",
    leave_type: "",
    status: "approved",
    duration: "single",
    date: "",
    half_day_period: "first_half",
    start_date: "",
    end_date: "",
    reason: "",
  });

  useEffect(() => {
    fetchEmployees();
    fetchLeaveTypes();
  }, []);

const fetchEmployees = async () => {
  try {
    const res = await apiClient.get("/auth/users/");
    const data = res.data.results || res.data || [];

    const formatted = data.map(emp => ({
      ...emp,
      name: emp.name || `${emp.first_name || ""} ${emp.last_name || ""}`.trim()
    }));

    formatted.sort((a, b) => a.name.localeCompare(b.name));

    setEmployees(formatted);
  } catch (err) {
    console.error("Failed to load employees:", err);
  }
};

  const fetchLeaveTypes = async () => {
    try {
      const res = await apiClient.get("/hr/leave-types/");
      setLeaveTypes(res.data.results || res.data || []);
    } catch (err) {
      console.error("Failed to load leave types", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    let payload = {
      employee_id: parseInt(form.employee),
      leave_type: parseInt(form.leave_type),
      status: form.status,
      reason: form.reason || "",
    };

    if (form.duration === "half_day") {
      payload.start_date = form.date;
      payload.duration = "half_day";
      payload.half_day_period = form.half_day_period;
    } else if (form.duration === "single") {
      payload.start_date = form.date;
      payload.end_date = form.date;
    } else if (form.duration === "multiple") {
      payload.start_date = form.start_date;
      payload.end_date = form.end_date;
    }

    try {
      await apiClient.post("/hr/leaves/", payload);
      alert("Leave assigned successfully!");
      window.history.back();
    } catch (err) {
      const msg = err.response?.data?.detail || "Failed to assign leave";
      alert(msg);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addLeaveType = async () => {
    if (!newTypeName.trim()) return;
    try {
      const res = await apiClient.post("/hr/leave-types/", { name: newTypeName.trim() });
      setLeaveTypes([...leaveTypes, res.data]);
      setNewTypeName("");
      setShowAddTypeModal(false);
    } catch (err) {
      alert("Failed to add leave type");
    }
  };

  const employeeOptions = employees.map((emp) => ({
    value: emp.id,
    label: `${emp.name} (${emp.employee_id || "No ID"})`,
  }));

  const leaveTypeOptions = leaveTypes.map((type) => ({
    value: type.id,
    label: type.name,
  }));

  const statusOptions = [
    { value: "approved", label: "Approved" },
    { value: "pending", label: "Pending" },
  ];

  return (
    <div className="p-4 md:p-6 max-w-full mx-auto">
      <LayoutComponents
        title="Assign Leave"
        subtitle="Manually assign leave to an employee"
        variant="card"
      >
        <div className="mb-8">
          <Link
            to="/hr/leaves"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
          >
            <MdArrowBack className="w-5 h-5" />
            Back to Leaves
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
            <h3 className="text-lg font-medium text-gray-900 mb-6">Leave Details</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Employee */}
              <Input
                label="Employee"
                type="select"
                required
                value={form.employee}
                onChange={(v) => setForm({ ...form, employee: v })}
                options={[{ value: "", label: "Select Employee" }, ...employeeOptions]}
                placeholder="Select Employee"
              />

              {/* Leave Type */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-black">
                    Leave Type <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAddTypeModal(true)}
                    className="text-sm font-medium text-black hover:text-gray-700 underline"
                  >
                    + Add New Type
                  </button>
                </div>
                <Input
                  type="select"
                  required
                  value={form.leave_type}
                  onChange={(v) => setForm({ ...form, leave_type: v })}
                  options={[{ value: "", label: "Select Leave Type" }, ...leaveTypeOptions]}
                  placeholder="Select Leave Type"
                />
              </div>

              {/* Status */}
              <Input
                label="Status"
                type="select"
                value={form.status}
                onChange={(v) => setForm({ ...form, status: v })}
                options={statusOptions}
              />
            </div>

            {/* Duration Selection */}
            <div className="mt-8">
              <label className="block text-sm font-medium text-black mb-4">Duration</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="duration"
                    value="single"
                    checked={form.duration === "single"}
                    onChange={(e) => setForm({ ...form, duration: e.target.value })}
                    className="w-5 h-5 text-black focus:ring-black"
                  />
                  <span className="font-medium">Single Day</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="duration"
                    value="half_day"
                    checked={form.duration === "half_day"}
                    onChange={(e) => setForm({ ...form, duration: e.target.value })}
                    className="w-5 h-5 text-black focus:ring-black"
                  />
                  <span className="font-medium">Half Day</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="duration"
                    value="multiple"
                    checked={form.duration === "multiple"}
                    onChange={(e) => setForm({ ...form, duration: e.target.value })}
                    className="w-5 h-5 text-black focus:ring-black"
                  />
                  <span className="font-medium">Multiple Days</span>
                </label>
              </div>
            </div>

            {/* Conditional Date Fields */}
            {(form.duration === "single" || form.duration === "half_day") && (
              <div className="mt-8">
                <Input
                  label="Date"
                  type="date"
                  required
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
                {form.duration === "half_day" && (
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-black mb-4">
                      Half Day Period
                    </label>
                    <div className="flex gap-8">
                      <label className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="period"
                          value="first_half"
                          checked={form.half_day_period === "first_half"}
                          onChange={(e) => setForm({ ...form, half_day_period: e.target.value })}
                          className="w-5 h-5 text-black focus:ring-black"
                        />
                        <span className="font-medium">First Half</span>
                      </label>
                      <label className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="period"
                          value="second_half"
                          checked={form.half_day_period === "second_half"}
                          onChange={(e) => setForm({ ...form, half_day_period: e.target.value })}
                          className="w-5 h-5 text-black focus:ring-black"
                        />
                        <span className="font-medium">Second Half</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            )}

            {form.duration === "multiple" && (
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Start Date"
                  type="date"
                  required
                  value={form.start_date}
                  onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                />
                <Input
                  label="End Date"
                  type="date"
                  required
                  value={form.end_date}
                  onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                />
              </div>
            )}

            {/* Reason */}
            <div className="mt-8">
              <Input
                label="Reason for Absence (Optional)"
                type="textarea"
                rows={4}
                placeholder="Provide a reason..."
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-black text-white font-medium rounded-xl hover:bg-gray-900 transition disabled:opacity-50"
            >
              {loading ? "Assigning Leave..." : "Assign Leave"}
            </button>
          </div>
        </form>
      </LayoutComponents>

      {/* Add Leave Type Modal */}
      {showAddTypeModal && (
        <div className="fixed inset-0 backdrop-brightness-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-medium">Add New Leave Type</h3>
              <button
                onClick={() => setShowAddTypeModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <MdClose className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <div className="space-y-5">
              <Input
                label="Leave Type Name"
                type="text"
                placeholder="e.g. Annual Leave, Sick Leave, Compassionate"
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <button
                onClick={() => setShowAddTypeModal(false)}
                className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={addLeaveType}
                className="px-6 py-3 bg-black text-white font-medium rounded-xl hover:bg-gray-900 transition"
              >
                Add Type
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignLeave;