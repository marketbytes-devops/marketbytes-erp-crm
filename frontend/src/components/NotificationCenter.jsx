import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    MdNotifications,
    MdClose,
    MdCheckCircle,
    MdWarning,
    MdInfo,
    MdError,
    MdDelete,
    MdDoneAll,
    MdSettings,
    MdOutlineNotificationsNone,
} from "react-icons/md";
import { Link } from "react-router-dom";
import apiClient from "../helpers/apiClient";
import toast from "react-hot-toast";

const NotificationCenter = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState("all"); 
    const containerRef = useRef(null);

    useEffect(() => {
        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (isOpen) {
            fetchNotifications();
        }
    }, [isOpen, filter]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const fetchUnreadCount = async () => {
        try {
            const response = await apiClient.get("/notifications/notifications/unread_count/");
            setUnreadCount(response.data.unread_count);
        } catch (error) {
            console.error("Failed to fetch unread count:", error);
        }
    };

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            let url = "/notifications/notifications/my_notifications/";
            if (filter === "unread") url += "?is_read=false";
            if (filter === "read") url += "?is_read=true";

            const response = await apiClient.get(url);
            setNotifications(response.data);
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
            toast.error("Failed to load notifications");
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id) => {
        try {
            await apiClient.post(`/notifications/notifications/${id}/mark_read/`);
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, is_read: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            toast.error("Failed to mark as read");
        }
    };

    const markAllAsRead = async () => {
        try {
            await apiClient.post("/notifications/notifications/mark_all_read/");
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
            toast.success("All notifications marked as read");
        } catch (error) {
            toast.error("Failed to mark all as read");
        }
    };

    const clearAll = async () => {
        if (!window.confirm("Clear all read notifications?")) return;
        try {
            await apiClient.delete("/notifications/notifications/clear_all/");
            setNotifications(prev => prev.filter(n => !n.is_read));
            toast.success("Read notifications cleared");
        } catch (error) {
            toast.error("Failed to clear notifications");
        }
    };

    const deleteNotification = async (id) => {
        try {
            await apiClient.delete(`/notifications/notifications/${id}/`);
            setNotifications(prev => prev.filter(n => n.id !== id));
            toast.success("Notification deleted");
        } catch (error) {
            toast.error("Failed to delete notification");
        }
    };

    const getIcon = (type, priority) => {
        const iconClass = "w-5 h-5";
        if (priority === "urgent") return <div className="p-2 bg-red-100 rounded-lg"><MdError className={`${iconClass} text-red-600`} /></div>;
        if (priority === "high") return <div className="p-2 bg-orange-100 rounded-lg"><MdWarning className={`${iconClass} text-orange-600`} /></div>;

        switch (type) {
            case "task_assigned":
                return <div className="p-2 bg-blue-100 rounded-lg"><MdInfo className={`${iconClass} text-blue-600`} /></div>;
            case "task_due":
                return <div className="p-2 bg-indigo-100 rounded-lg"><MdInfo className={`${iconClass} text-indigo-600`} /></div>;
            case "task_overdue":
                return <div className="p-2 bg-rose-100 rounded-lg"><MdWarning className={`${iconClass} text-rose-600`} /></div>;
            case "leave_approved":
                return <div className="p-2 bg-emerald-100 rounded-lg"><MdCheckCircle className={`${iconClass} text-emerald-600`} /></div>;
            case "leave_rejected":
                return <div className="p-2 bg-pink-100 rounded-lg"><MdError className={`${iconClass} text-pink-600`} /></div>;
            default:
                return <div className="p-2 bg-slate-100 rounded-lg"><MdInfo className={`${iconClass} text-slate-600`} /></div>;
        }
    };

    return (
        <div className="relative" ref={containerRef}>
            {/* Trigger Bell */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`relative p-3 rounded-full transition-all duration-300 group ${isOpen ? "bg-black text-white" : "hover:bg-gray-100 text-gray-600"
                    }`}
            >
                <MdNotifications className={`w-6 h-6 transition-transform duration-300 ${isOpen ? "scale-110" : "group-hover:rotate-12"}`} />
                <AnimatePresence>
                    {unreadCount > 0 && (
                        <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center border-2 border-white"
                        >
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </motion.span>
                    )}
                </AnimatePresence>
            </button>

            {/* Dropdown Card */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="absolute right-0 mt-4 w-[420px] max-h-[600px] bg-white rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-gray-100 overflow-hidden z-[100] flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-6 pb-2">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 tracking-tight">Notifications</h3>
                                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mt-0.5">
                                        {unreadCount} unread messages
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={markAllAsRead}
                                        className="p-2.5 bg-gray-50 text-gray-600 hover:bg-black hover:text-white rounded-2xl transition-all shadow-sm"
                                        title="Mark all as read"
                                    >
                                        <MdDoneAll size={18} />
                                    </button>
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="p-2.5 bg-gray-50 text-gray-600 hover:bg-red-50 hover:text-red-500 rounded-2xl transition-all shadow-sm"
                                    >
                                        <MdClose size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Tabs */}
                            <div className="flex bg-gray-100 p-1 rounded-2xl mb-4">
                                {["all", "unread", "read"].map((t) => (
                                    <button
                                        key={t}
                                        onClick={() => setFilter(t)}
                                        className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all capitalize ${filter === t ? "bg-white text-black shadow-sm" : "text-gray-500 hover:text-gray-700"
                                            }`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto px-4 pb-6 custom-scrollbar space-y-2">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-20">
                                    <div className="w-10 h-10 border-4 border-gray-100 border-t-black rounded-full animate-spin"></div>
                                    <p className="text-xs font-medium text-gray-400 mt-4 uppercase tracking-widest">Updating...</p>
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 text-center">
                                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                                        <MdOutlineNotificationsNone className="w-10 h-10 text-gray-300" />
                                    </div>
                                    <h4 className="text-gray-900 font-bold">Nothing here</h4>
                                    <p className="text-sm text-gray-500 mt-1 max-w-[200px]">We'll notify you when something important happens.</p>
                                </div>
                            ) : (
                                notifications.map((n, i) => (
                                    <motion.div
                                        key={n.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.03 }}
                                        className={`group relative p-4 rounded-3xl transition-all border ${!n.is_read
                                                ? "bg-white border-blue-50 shadow-sm shadow-blue-50"
                                                : "bg-gray-50/50 border-transparent hover:bg-gray-50 hover:border-gray-100"
                                            }`}
                                    >
                                        <div className="flex gap-4">
                                            <div className="shrink-0">
                                                {getIcon(n.notification_type, n.priority)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between">
                                                    <h4 className={`text-sm font-bold leading-tight ${!n.is_read ? 'text-gray-900' : 'text-gray-600'}`}>
                                                        {n.title}
                                                    </h4>
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter shrink-0 ml-2">
                                                        {n.time_ago}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-500 mt-1.5 leading-relaxed line-clamp-2">
                                                    {n.message}
                                                </p>

                                                {(n.link_url || !n.is_read) && (
                                                    <div className="flex items-center gap-4 mt-3">
                                                        {n.link_url && (
                                                            <Link
                                                                to={n.link_url}
                                                                onClick={() => { markAsRead(n.id); setIsOpen(false); }}
                                                                className="text-xs font-bold text-black border-b-2 border-black/10 hover:border-black transition-all"
                                                            >
                                                                {n.link_text || "View Details"}
                                                            </Link>
                                                        )}
                                                        {!n.is_read && (
                                                            <button
                                                                onClick={() => markAsRead(n.id)}
                                                                className="text-[10px] uppercase tracking-widest font-black text-blue-600 hover:text-blue-700"
                                                            >
                                                                Mark as read
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => deleteNotification(n.id)}
                                                className="opacity-0 group-hover:opacity-100 p-2 text-gray-300 hover:text-red-500 transition-all absolute top-2 right-2"
                                            >
                                                <MdDelete size={16} />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 bg-gray-50/50 border-t border-gray-50 flex items-center justify-between">
                            <button
                                onClick={clearAll}
                                className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-red-500 hover:bg-red-50 rounded-xl transition-all"
                            >
                                <MdDelete size={14} />
                                Clear read items
                            </button>
                            <Link
                                to="/profile?tab=notifications"
                                onClick={() => setIsOpen(false)}
                                className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-200 rounded-xl transition-all"
                            >
                                <MdSettings size={14} />
                                Preferences
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NotificationCenter;
