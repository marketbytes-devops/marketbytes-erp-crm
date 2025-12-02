import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import LayoutComponents from "../../../components/LayoutComponents";
import apiClient from "../../../helpers/apiClient";
import { MdDownload, MdCalendarMonth, MdRefresh } from "react-icons/md";
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import Input from "../../../components/Input";
import Dropdown from "../../../components/Dropdown";

const Attendance = () => {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [attendances, setAttendances] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(false);

  const months = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ];

  useEffect(() => {
    setLoading(true);
    apiClient
      .get("/hr/attendance/", { params: { month, year } })
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : [];
        setAttendances(data);

        const present = data.filter((a) => a.status === "present").length;
        const late = data.filter((a) => a.status === "late").length;
        const absent = data.filter((a) => a.status === "absent").length;
        const half = data.filter((a) => a.status === "half_day").length;
        const leave = data.filter((a) => a.status === "leave").length;
        const holiday = data.filter((a) => a.status === "holiday").length;

        setSummary({ present, late, absent, half, leave, holiday });
      })
      .catch((err) => {
        console.error("Failed to fetch attendance:", err);
        setAttendances([]);
        setSummary({ present: 0, late: 0, absent: 0, half: 0, leave: 0, holiday: 0 });
      })
      .finally(() => setLoading(false));
  }, [month, year]);

  const days = eachDayOfInterval({
    start: startOfMonth(new Date(year, month - 1)),
    end: endOfMonth(new Date(year, month - 1)),
  });

  const employeesMap = attendances.reduce((acc, att) => {
    const empId = att.employee?.id || att.employee_id || "unknown";
    const empName = att.employee?.name || "Unknown Employee";
    if (!acc[empId]) {
      acc[empId] = { employee: { id: empId, name: empName }, records: [] };
    }
    acc[empId].records.push(att);
    return acc;
  }, {});

  const employeeList = Object.values(employeesMap);

  const getStatusForDate = (records, date) => {
    const formattedDate = format(date, "yyyy-MM-dd");
    return records.find(
      (r) =>
        r.date === formattedDate ||
        format(new Date(r.date), "yyyy-MM-dd") === formattedDate
    );
  };

  return (
    <div className="p-6">
      <LayoutComponents title="Attendance" subtitle="Monthly attendance overview" variant="card">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-6 mb-8">
          {[
            { label: "Present", value: summary.present || 0, color: "bg-green-500" },
            { label: "Late", value: summary.late || 0, color: "bg-yellow-500" },
            { label: "Absent", value: summary.absent || 0, color: "bg-red-500" },
            { label: "Half Day", value: summary.half || 0, color: "bg-purple-500" },
            { label: "Leave", value: summary.leave || 0, color: "bg-blue-500" },
            { label: "Holiday", value: summary.holiday || 0, color: "bg-gray-500" },
          ].map((item, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.05 }}
              className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
            >
              <p className="text-gray-600 text-sm">{item.label}</p>
              <p className="text-4xl font-bold mt-3">{item.value}</p>
            </motion.div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex flex-wrap gap-4 justify-between items-center">
            <div className="flex flex-wrap gap-4 items-center">
              <Input
                type="select"
                value={month}
                onChange={setMonth}
                options={months}
                placeholder="Select month"
                className="w-48"
              />
              <Input
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                placeholder="Year"
                className="w-32"
                min="2000"
                max="2100"
              />

              <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-3 px-6 py-3.5 bg-black text-white rounded-xl hover:bg-gray-900 transition font-medium"
              >
                <MdRefresh className="w-5 h-5" />
                Refresh
              </button>
            </div>
            <Dropdown
              trigger={
                <button className="flex items-center gap-3 px-6 py-3.5 border border-gray-300 rounded-xl hover:bg-gray-50 transition font-medium">
                  <MdDownload className="w-5 h-5" /> Export
                </button>
              }
              dropdownId="export-attendance"
              align="right"
            >
              <Dropdown.Item onClick={() => alert("Export as CSV")}>
                Export as CSV
              </Dropdown.Item>
              <Dropdown.Item onClick={() => alert("Export as Excel")}>
                Export as Excel
              </Dropdown.Item>
              <Dropdown.Item onClick={() => alert("Export as PDF")}>
                Export as PDF
              </Dropdown.Item>
            </Dropdown>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-16 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-black border-t-transparent"></div>
            </div>
          ) : employeeList.length === 0 ? (
            <div className="p-16 text-center text-gray-500">
              <MdCalendarMonth className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-xl font-medium">No attendance records</p>
              <p className="text-sm mt-2">Try selecting a different month/year</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-max">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-5 text-left text-sm font-bold text-gray-700 sticky left-0 bg-gray-50 z-10">
                      Employee
                    </th>
                    {days.map((d) => (
                      <th
                        key={d.toString()}
                        className="px-3 py-5 text-xs font-medium text-gray-600 text-center w-40"
                      >
                        {format(d, "d")}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {employeeList.map((emp, i) => (
                    <tr key={emp.employee.id || i} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-5 text-sm font-medium text-gray-900 sticky left-0 bg-white z-10">
                        {emp.employee.name}
                      </td>
                      {days.map((d) => {
                        const record = getStatusForDate(emp.records, d);
                        const status = record?.status;
                        const bg =
                          status === "present"
                            ? "bg-green-100 text-green-800"
                            : status === "late"
                            ? "bg-yellow-100 text-yellow-800"
                            : status === "absent"
                            ? "bg-red-100 text-red-800"
                            : status === "half_day"
                            ? "bg-purple-100 text-purple-800"
                            : status === "leave"
                            ? "bg-blue-100 text-blue-800"
                            : status === "holiday"
                            ? "bg-gray-100 text-gray-800"
                            : "bg-gray-50";

                        return (
                          <td
                            key={d.toString()}
                            className={`px-3 py-5 text-xs text-center rounded-full mx-auto w-9 h-9 font-medium ${bg}`}
                          >
                            {status ? status[0].toUpperCase() : "-"}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </LayoutComponents>
    </div>
  );
};

export default Attendance;