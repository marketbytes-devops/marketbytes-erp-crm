import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    MdEmail,
    MdNotifications,
    MdSave,
    MdSchedule,
    MdTask,
    MdFolder,
    MdEventNote,
    MdBeachAccess,
    MdArrowForward,
} from "react-icons/md";
import apiClient from "../helpers/apiClient";
import toast from "react-hot-toast";
import Loading from "./Loading";

const NotificationPreferences = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [preferences, setPreferences] = useState(null);

    useEffect(() => {
        fetchPreferences();
    }, []);

    const fetchPreferences = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get("/notifications/preferences/my_preferences/");
            setPreferences(response.data);
        } catch (error) {
            console.error("Failed to fetch preferences:", error);
            toast.error("Failed to load settings");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            await apiClient.patch("/notifications/preferences/update_my_preferences/", preferences);
            toast.success("Settings updated successfully");
        } catch (error) {
            console.error("Failed to save preferences:", error);
            toast.error("Failed to save settings");
        } finally {
            setSaving(false);
        }
    };

    const togglePreference = (key) => {
        setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const updateValue = (key, value) => {
        setPreferences(prev => ({ ...prev, [key]: value }));
    };

    if (loading) return <div className="py-20 flex justify-center"><Loading /></div>;
    if (!preferences) return <div className="py-20 text-center text-gray-500">Failed to load preferences</div>;

    const notificationTypes = [
        { key: "task_assigned", label: "Assignments", icon: MdTask, description: "New task assigned to you" },
        { key: "task_due", label: "Due Reminders", icon: MdSchedule, description: "Approaching deadlines" },
        { key: "project_updates", label: "Project Activity", icon: MdFolder, description: "Updates on your projects" },
        { key: "scrum_reminders", label: "Daily Scrum", icon: MdEventNote, description: "Meeting reminders" },
        { key: "leave_status", label: "HR Updates", icon: MdBeachAccess, description: "Leave & payroll updates" },
    ];

    const Toggle = ({ checked, onChange, disabled }) => (
        <label className={`relative inline-flex items-center cursor-pointer ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}>
            <input type="checkbox" checked={checked} onChange={onChange} disabled={disabled} className="sr-only peer" />
            <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-black"></div>
        </label>
    );

    return (
        <div className="max-w-5xl mx-auto pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div>
                    <h2 className="text-4xl font-black text-gray-900 tracking-tight">Notification Settings</h2>
                    <p className="text-gray-500 mt-2 font-medium">Control how and when we reach out to you.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="group flex items-center gap-3 px-8 py-4 bg-black text-white rounded-[24px] hover:bg-gray-800 transition-all shadow-xl shadow-gray-200 active:scale-95"
                >
                    <MdSave className="w-5 h-5" />
                    <span className="font-bold">{saving ? "Saving Changes..." : "Save Settings"}</span>
                    <MdArrowForward className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Email Hook */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8">
                            <MdEmail className="w-12 h-12 text-blue-50 opacity-10" />
                        </div>
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <div className="p-4 bg-blue-50 rounded-3xl"><MdEmail className="w-6 h-6 text-blue-600" /></div>
                                <h3 className="text-xl font-bold text-gray-900">Email Updates</h3>
                            </div>
                            <Toggle checked={preferences.email_enabled} onChange={() => togglePreference("email_enabled")} />
                        </div>
                        <div className="space-y-1">
                            {notificationTypes.map((type) => (
                                <div key={type.key} className="flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 transition-colors">
                                    <div>
                                        <p className="font-bold text-gray-900 text-sm">{type.label}</p>
                                        <p className="text-xs text-gray-400 font-medium">{type.description}</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={preferences[`email_${type.key}`]}
                                        onChange={() => togglePreference(`email_${type.key}`)}
                                        disabled={!preferences.email_enabled}
                                        className="w-5 h-5 rounded-lg border-gray-300 text-black focus:ring-black accent-black cursor-pointer disabled:opacity-30"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* In-App Hook */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-6">
                    <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8">
                            <MdNotifications className="w-12 h-12 text-purple-50 opacity-10" />
                        </div>
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <div className="p-4 bg-purple-50 rounded-3xl"><MdNotifications className="w-6 h-6 text-purple-600" /></div>
                                <h3 className="text-xl font-bold text-gray-900">Push & In-App</h3>
                            </div>
                            <Toggle checked={preferences.inapp_enabled} onChange={() => togglePreference("inapp_enabled")} />
                        </div>
                        <div className="space-y-1">
                            {notificationTypes.map((type) => (
                                <div key={type.key} className="flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 transition-colors">
                                    <div>
                                        <p className="font-bold text-gray-900 text-sm">{type.label}</p>
                                        <p className="text-xs text-gray-400 font-medium">{type.description}</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={preferences[`inapp_${type.key}`]}
                                        onChange={() => togglePreference(`inapp_${type.key}`)}
                                        disabled={!preferences.inapp_enabled}
                                        className="w-5 h-5 rounded-lg border-gray-300 text-black focus:ring-black accent-black cursor-pointer disabled:opacity-30"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* Reminders / Scheduling */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-2">
                    <div className="bg-black p-10 rounded-[48px] text-white shadow-2xl shadow-gray-200 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent)] pointer-events-none" />
                        <div className="flex flex-col md:flex-row gap-12 relative z-10">
                            <div className="flex-1">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="p-4 bg-white/10 backdrop-blur-md rounded-3xl"><MdSchedule className="w-6 h-6 text-white" /></div>
                                    <h3 className="text-2xl font-black italic uppercase tracking-tighter">Scheduling Engine</h3>
                                </div>
                                <p className="text-gray-400 font-medium mb-8 max-w-md text-sm">Fine-tune your notification windows to stay productive without being overwhelmed.</p>
                            </div>

                            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Task Proximity Alert</label>
                                    <select
                                        value={preferences.task_reminder_before_hours}
                                        onChange={(e) => updateValue("task_reminder_before_hours", parseInt(e.target.value))}
                                        className="w-full bg-white/10 border-none rounded-2xl px-5 py-4 text-white font-bold outline-none focus:ring-2 focus:ring-white/20 transition-all cursor-pointer"
                                    >
                                        {[1, 2, 4, 8, 24, 48, 72].map(h => (
                                            <option key={h} value={h} className="bg-black">{h < 24 ? `${h} hours before` : `${h / 24} day${h / 24 > 1 ? 's' : ''} before`}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Scrum Ritual Timing</label>
                                    <input
                                        type="time"
                                        value={preferences.scrum_reminder_time}
                                        onChange={(e) => updateValue("scrum_reminder_time", e.target.value)}
                                        className="w-full bg-white/10 border-none rounded-2xl px-5 py-4 text-white font-bold outline-none focus:ring-2 focus:ring-white/20 transition-all cursor-pointer"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default NotificationPreferences;
