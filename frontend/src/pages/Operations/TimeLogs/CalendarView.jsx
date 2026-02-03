import React, { useState } from "react";
import LayoutComponents from "../../../components/LayoutComponents";
import { MdChevronLeft, MdChevronRight } from "react-icons/md";

const formatMonth = (date) =>
  date.toLocaleString("default", { month: "long", year: "numeric" });

const formatDay = (date) =>
  date.toLocaleDateString("default", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

const getWeekRange = (date) => {
  const start = new Date(date);
  start.setDate(start.getDate() - start.getDay());
  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  const fmt = (d) =>
    d.toLocaleDateString("default", { month: "short", day: "numeric" });

  return `${fmt(start)} – ${fmt(end)}, ${start.getFullYear()}`;
};


const getWeekDays = (currentDate) => {
  const start = new Date(currentDate);
  start.setDate(start.getDate() - start.getDay()); // Sunday of current week

  return Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(start.getTime()); // clone date
    d.setDate(d.getDate() + i); // add i days
    const dayName = d.toLocaleDateString("default", { weekday: "short" });
    const month = d.getMonth() + 1; // month number
    const date = d.getDate(); // day number
    return {
      day: `${dayName} ${month}/${date}`,
      dateObj: d,
      hours: "", // can be dynamic
    };
  });
};



/* ---------- DUMMY DATA ---------- */
const dummyWeek = [
  { day: "Sun 2/1", hours: "3 hrs 32 mins" },
  { day: "Mon 2/2", hours: "89 hrs 58 mins" },
  { day: "Tue 2/3", hours: "28 hrs 33 mins" },
  { day: "Wed 2/4", hours: "" },
  { day: "Thu 2/5", hours: "" },
  { day: "Fri 2/6", hours: "" },
  { day: "Sat 2/7", hours: "" },
];

const dummyList = [
  { day: "Sunday", date: "February 1, 2026", hours: "3 hrs 32 mins" },
  { day: "Monday", date: "February 2, 2026", hours: "89 hrs 58 mins" },
  { day: "Tuesday", date: "February 3, 2026", hours: "28 hrs 33 mins" },
];

/* ---------- COMPONENT ---------- */
const CalendarView = () => {
  const [view, setView] = useState("month");
  const [currentDate, setCurrentDate] = useState(new Date(2026, 1, 1));

  const handlePrev = () => {
    const d = new Date(currentDate);

    if (view === "month") d.setMonth(d.getMonth() - 1);
    if (view === "week" || view === "list") d.setDate(d.getDate() - 7);
    if (view === "day") d.setDate(d.getDate() - 1);

    setCurrentDate(d);
  };

  const handleNext = () => {
    const d = new Date(currentDate);

    if (view === "month") d.setMonth(d.getMonth() + 1);
    if (view === "week" || view === "list") d.setDate(d.getDate() + 7);
    if (view === "day") d.setDate(d.getDate() + 1);

    setCurrentDate(d);
  };

  return (
    <div className="p-6">
      <LayoutComponents
        title="Time Logs"
        subtitle="Calendar View"
        variant="table"
      >
        {/* HEADER */}
        <div className="bg-gray-100 rounded-2xl p-6 mb-6 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              className="p-2 bg-black text-white rounded"
            >
              <MdChevronLeft />
            </button>
            <button
              onClick={handleNext}
              className="p-2 bg-black text-white rounded"
            >
              <MdChevronRight />
            </button>
            <button className="ml-2 px-4 py-2 bg-gray-600 text-white rounded">
              today
            </button>
            <span className="ml-6 font-semibold">
              {view === "month" && formatMonth(currentDate)}
              {view === "week" && getWeekRange(currentDate)}
              {view === "list" && getWeekRange(currentDate)}
              {view === "day" && formatDay(currentDate)}
            </span>
          </div>

          <div className="flex bg-black rounded overflow-hidden">
            {["month", "week", "day", "list"].map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-4 py-2 text-sm font-medium ${
                  view === v ? "bg-white text-black" : "bg-black text-white"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* BODY */}
        <div className="bg-white border rounded-2xl overflow-hidden">
          {view === "month" && (
            <MonthView
              date={currentDate} // pass currentDate
              onDayClick={(day) => {
                // handle day click
                setCurrentDate(
                  new Date(
                    currentDate.getFullYear(),
                    currentDate.getMonth(),
                    day,
                  ),
                );
                setView("day");
              }}
            />
          )}

          {view === "week" && <WeekView currentDate={currentDate} />}

          {view === "day" && <DayView currentDate={currentDate} />}

          {view === "list" && <ListView currentDate={currentDate} />}

        </div>
      </LayoutComponents>
    </div>
  );
};

/* ---------- MONTH VIEW ---------- */
const MonthView = ({ date, onDayClick }) => {
  const year = date.getFullYear();
  const month = date.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  return (
    <div>
      {/* DAYS HEADER */}
      <div className="grid grid-cols-7 border-b bg-gray-100">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="p-3 text-center font-medium">
            {d}
          </div>
        ))}
      </div>

      {/* CALENDAR GRID */}
      <div className="grid grid-cols-7">
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} className="border h-24" />
        ))}

        {Array.from({ length: daysInMonth }).map((_, i) => (
          <div
            key={i}
            onClick={() => onDayClick(i + 1)}
            className="border h-24 p-3 cursor-pointer hover:bg-gray-50"
          >
            <div className="font-medium">{i + 1}</div>
            {/* example dummy content */}
            {i === 0 && (
              <div className="mt-2 bg-black text-white text-xs px-2 py-1 inline-block">
                3 hrs 32 mins
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

/* ---------- WEEK VIEW  ---------- */
const WeekView = ({ currentDate }) => {
  const weekDays = getWeekDays(currentDate);

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="border p-3 text-left">all-day</th>
            {weekDays.map((d) => (
              <th key={d.dateObj} className="border p-3 text-center">
                {d.day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border p-3"></td>
            {weekDays.map((d) => (
              <td key={d.dateObj} className="border p-3">
                {d.hours ? (
                  <div className="bg-black text-white text-sm px-3 py-2 rounded">
                    {d.hours}
                  </div>
                ) : (
                  <div className="text-gray-400 text-sm">no hours</div>
                )}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
};



/* ---------- DAY VIEW  ---------- */
const DayView = ({ currentDate }) => (
  <div>
    {/* Dynamic header */}
    <div className="border-b p-4 text-center font-semibold">
      {currentDate.toLocaleDateString("default", { weekday: "long" })} — 0 hrs
    </div>

    {/* Hourly slots */}
    {Array.from({ length: 12 }).map((_, i) => (
      <div key={i} className="border-b px-4 py-6 text-sm text-gray-600">
        {6 + i}:00
      </div>
    ))}
  </div>
);

/* ---------- LIST VIEW ---------- */
const ListView = ({ currentDate }) => {
  const weekDays = getWeekDays(currentDate);

  return (
    <div className="divide-y">
      {weekDays.map((d, i) => (
        <div key={i} className="p-6">
          <div className="flex justify-between mb-2 font-medium">
            <span>{d.dateObj.toLocaleDateString("default", { weekday: "long" })}</span>
            <span>{formatDay(d.dateObj)}</span>
          </div>
          <div className="bg-black text-white px-4 py-2 rounded">
            all-day — {d.hours || "0 hrs"}
          </div>
        </div>
      ))}
    </div>
  );
};


export default CalendarView;
