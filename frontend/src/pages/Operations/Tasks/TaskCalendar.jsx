

"use client";

import React, { useState, useEffect } from "react";
import apiClient from "../../../helpers/apiClient";
import toast from "react-hot-toast";
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const TaskCalendarPage = () => {
  const currentDate = new Date();
  const [currentYear, setCurrentYear] = useState(currentDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(currentDate.getMonth() + 1); // 1–12
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


  useEffect(() => {
    let isMounted = true;

    const fetchTasks = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await apiClient.get(`/operation/tasks/`, {
          params: {
            year: currentYear,
            month: currentMonth,
          },
        });

        if (isMounted) {
      
          const data = Array.isArray(response.data)
            ? response.data
            : response.data?.results ||
              response.data?.data ||
              response.data?.tasks ||
              [];

          setTasks(data);
        }
      } catch (err) {
        console.error("Failed to fetch tasks:", err);
        if (isMounted) {
          setError("Failed to load tasks. Please try again later.");
          toast.error("Could not load tasks");
          setTasks([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchTasks();

    return () => {
      isMounted = false;
    };
  }, [currentYear, currentMonth]);

  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1).getDay();

  const prevMonthPadding = Array(firstDayOfMonth).fill(null);


  const currentDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);


  const totalCellsSoFar = prevMonthPadding.length + currentDays.length;
  const nextMonthPadding = Array(Math.max(0, 42 - totalCellsSoFar)).fill(null);


  const tasksByDay = Array.isArray(tasks)
    ? tasks.reduce((acc, task) => {
        if (!task?.due_date) return acc;
        const due = new Date(task.due_date);
        if (due.getFullYear() !== currentYear || due.getMonth() + 1 !== currentMonth) {
          return acc;
        }
        const day = due.getDate();
        if (!acc[day]) acc[day] = [];
        acc[day].push(task);
        return acc;
      }, {})
    : {};

 
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tasks Calendar</h1>
       
      </div>

      {/* Controls */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={currentMonth}
            onChange={(e) => setCurrentMonth(Number(e.target.value))}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            {months.map((m, idx) => (
              <option key={m} value={idx + 1}>
                {m}
              </option>
            ))}
          </select>

          <select
            value={currentYear}
            onChange={(e) => setCurrentYear(Number(e.target.value))}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            {Array.from({ length: 11 }, (_, i) => currentDate.getFullYear() - 5 + i).map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          <button className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            <CalendarIcon className="h-5 w-5" />
            Calendar View
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export
          </button>

          <button className="inline-flex items-center gap-1 rounded-lg bg-gray-900 px-5 py-2 text-sm font-medium text-white hover:bg-gray-800">
            + Add Task
          </button>
        </div>
      </div>

      {/* Calendar */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 bg-gray-100">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="py-3 text-center text-sm font-semibold text-gray-700">
              {day}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 bg-gray-200">
      
          {prevMonthPadding.map((_, i) => (
            <div key={`prev-${i}`} className="min-h-[110px] bg-gray-50 p-2" />
          ))}

          {/* Current month */}
          {currentDays.map((day) => {
            const dayTasks = tasksByDay[day] || [];
            const hasTasks = dayTasks.length > 0;

            return (
              <div
                key={day}
                className={`min-h-[110px] p-2 transition-colors ${
                  hasTasks
                    ? "bg-blue-50/60 border-l-4 border-blue-500"
                    : "bg-white hover:bg-gray-50"
                }`}
              >
                <div className={`text-sm font-medium ${hasTasks ? "text-blue-800" : "text-gray-900"}`}>
                  {day}
                </div>

                {hasTasks && (
                  <div className="mt-1.5 space-y-1">
                    {dayTasks.slice(0, 3).map((task, idx) => (
                      <div
                        key={task.id || idx}
                        className="truncate rounded bg-blue-100/80 px-2 py-1 text-xs text-blue-800"
                        title={task.name || "Unnamed task"}
                      >
                        {task.name || "Task"}
                      </div>
                    ))}

                    {dayTasks.length > 3 && (
                      <div className="text-xs text-blue-600">+{dayTasks.length - 3} more</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

   
          {nextMonthPadding.map((_, i) => (
            <div key={`next-${i}`} className="min-h-[110px] bg-gray-50 p-2" />
          ))}
        </div>
      </div>


      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
        </div>
      )}

      {error && !loading && (
        <div className="mt-6 rounded-lg bg-red-50 p-4 text-red-800">
          {error}
        </div>
      )}

      {!loading && !error && tasks.length === 0 && (
        <div className="mt-10 text-center text-gray-500">
          No tasks found for {months[currentMonth - 1]} {currentYear}
        </div>
      )}
    </div>
  );
};

export default TaskCalendarPage;