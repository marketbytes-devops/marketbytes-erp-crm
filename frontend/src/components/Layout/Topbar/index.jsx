import { ChevronRight, Logs, User, LogOut, ChevronDown, Search, Bell } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import apiClient from "../../../helpers/apiClient";
import placeholderImage from "../../../assets/images/placeholder-profile.webp";
import Dropdown from "../../Dropdown";
import WorkTimerController from "../../Ui/WorkTimerController";

const Topbar = ({
  toggleSidebar,
  isSidebarOpen,
  isAuthenticated,
  setIsAuthenticated,
  user,
}) => {
  const [profileImage, setProfileImage] = useState(null);
  const [displayName, setDisplayName] = useState("User");
  const [displayUsername, setDisplayUsername] = useState("guest");
  const [searchQuery, setSearchQuery] = useState("");
  const [notificationCount] = useState(3);
  const navigate = useNavigate();
  const searchInputRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setDisplayName("Guest");
      setDisplayUsername("");
      setProfileImage(null);
      return;
    }

    if (user?.name && user.name !== "null" && user.name !== "undefined") {
      setDisplayName(user.name);
    }
    if (user?.username && user.username !== "null" && user.username !== "undefined") {
      setDisplayUsername(`@${user.username}`);
    }
    if (user?.image) {
      setProfileImage(user.image);
    }

    const fetchProfile = async () => {
      try {
        const res = await apiClient.get("/auth/profile/", { responseType: "json" });
        const data = res.data;

        if (data.name && data.name !== "null" && data.name !== "undefined") {
          setDisplayName(data.name);
        }
        if (data.username && data.username !== "null" && data.username !== "undefined") {
          setDisplayUsername(`@${data.username}`);
        }
        if (data.image) {
          setProfileImage(data.image);
        }
      } catch (err) {
        console.log("Profile fetch error:", err);
      }
    };

    fetchProfile();
  }, [isAuthenticated, user]);

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setIsAuthenticated(false);
    navigate("/login");
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const profileTrigger = (
    <motion.div
      className="flex items-center space-x-3 px-4 py-2 rounded-xl cursor-pointer group hover:bg-linear-to-r hover:from-gray-50 hover:to-indigo-50 transition-all duration-300 relative overflow-hidden"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="text-right leading-tight hidden sm:block">
        <p className="text-sm font-semibold text-gray-900 group-hover:text-black transition-colors">
          {displayName}
        </p>
        {displayUsername && (
          <p className="text-xs text-gray-500 group-hover:text-gray-600 transition-colors">
            {displayUsername}
          </p>
        )}
      </div>

      <div className="relative">
        {profileImage ? (
          <motion.img
            src={profileImage}
            alt="Profile"
            className="w-11 h-11 rounded-full object-cover ring-2 ring-gray-200 group-hover:ring-indigo-300 transition-all shadow-sm"
            onError={() => setProfileImage(null)}
            whileHover={{ scale: 1.05 }}
          />
        ) : (
          <motion.img
            src={placeholderImage}
            alt="Profile"
            className="w-11 h-11 rounded-full object-cover ring-2 ring-gray-200 group-hover:ring-indigo-300 transition-all shadow-sm"
            whileHover={{ scale: 1.05 }}
          />
        )}
        <motion.div
          animate={{ y: [0, -2, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        >
          <ChevronDown
            size={16}
            className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 text-gray-500 group-hover:text-indigo-600 transition-colors shadow-sm"
          />
        </motion.div>
      </div>

      <span className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/30 to-transparent group-hover:translate-x-full transition-transform duration-700" />
    </motion.div>
  );

  return (
    <motion.div
      className="flex items-center justify-between px-4 sm:px-6 py-3 bg-white shadow-lg backdrop-blur-sm border-b border-gray-100 rounded-b-xl mx-4 sm:mx-6 z-50"
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="flex items-center justify-start">
        <motion.button
          className="p-3 rounded-full transition-all duration-300 hover:text-black bg-black border hover:bg-white text-white group relative overflow-hidden shadow-inner"
          onClick={toggleSidebar}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <motion.div
            initial={false}
            animate={{ rotate: isSidebarOpen ? 90 : 0 }}
            transition={{ duration: 0.3, type: "spring", stiffness: 200 }}
            className="relative z-10"
          >
            {isSidebarOpen ? (
              <Logs className="w-5 h-5 -rotate-90" />
            ) : (
              <ChevronRight className="w-5 h-5" />
            )}
          </motion.div>
          <span className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-full transition-transform duration-700" />
        </motion.button>
        <div className="hidden md:flex flex-1 max-w-xl mx-6">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-full px-4 py-3 pl-11 pr-4 text-sm bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all placeholder-gray-400"
            />
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            {searchQuery && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ×
              </motion.button>
            )}
          </form>
        </div>
      </div>
      <motion.div
        className="flex items-center space-x-3 sm:space-x-4"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
      >
        {isAuthenticated && (
          <div className="hidden md:flex items-center">
            <WorkTimerController />
          </div>
        )}
        {isAuthenticated && (
          <motion.button
            className="relative p-3 rounded-full hover:bg-gray-100 border border-gray-100 transition-colors group"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/notifications")}
          >
            <Bell size={22} className="text-gray-600 group-hover:text-black transition-colors" />
            {notificationCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 bg-black text-white text-xs font-medium rounded-full w-5 h-5 flex items-center justify-center shadow-lg"
              >
                {notificationCount > 99 ? "99+" : notificationCount}
              </motion.span>
            )}
          </motion.button>
        )}
        <motion.button
          className="md:hidden p-3 rounded-full hover:bg-gray-100"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => searchInputRef.current?.focus()}
        >
          <Search size={22} className="text-gray-600" />
        </motion.button>
        {isAuthenticated ? (
          <Dropdown trigger={profileTrigger} align="right" dropdownId="topbar-profile">
            <Dropdown.Item icon={User} onClick={() => navigate("/profile")}>
              Account Settings
            </Dropdown.Item>
            <Dropdown.Item icon={LogOut} onClick={handleLogout}>
              Sign Out
            </Dropdown.Item>
          </Dropdown>
        ) : (
          <motion.span
            className="hidden sm:block text-gray-500 font-medium px-4 py-2 rounded-xl bg-gray-50"
            whileHover={{ scale: 1.05 }}
          >
            Guest
          </motion.span>
        )}
      </motion.div>
    </motion.div>
  );
};

export default Topbar;