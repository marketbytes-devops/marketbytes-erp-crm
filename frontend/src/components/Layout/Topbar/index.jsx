import { ChevronRight, Logs, User, LogOut, ChevronDown, Search, Bell } from "lucide-react";
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
    <div
      className="flex items-center space-x-3 px-4 py-2 rounded-xl cursor-pointer group hover:bg-linear-to-r hover:from-gray-50 hover:to-indigo-50 transition-all duration-300 relative overflow-hidden"
    >
      <div className="text-right leading-tight hidden sm:block">
        <p className="text-sm font-medium text-gray-900 group-hover:text-black transition-colors">
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
          <img
            src={profileImage}
            alt="Profile"
            className="w-11 h-11 rounded-full object-cover ring-2 ring-gray-200 group-hover:ring-indigo-300 transition-all shadow-sm"
            onError={() => setProfileImage(null)}
          />
        ) : (
          <img
            src={placeholderImage}
            alt="Profile"
            className="w-11 h-11 rounded-full object-cover ring-2 ring-gray-200 group-hover:ring-indigo-300 transition-all shadow-sm"
          />
        )}
        <div>
          <ChevronDown
            size={16}
            className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 text-gray-500 group-hover:text-indigo-600 transition-colors shadow-sm"
          />
        </div>
      </div>

      <span className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/30 to-transparent group-hover:translate-x-full transition-transform duration-700" />
    </div>
  );

  return (
    <div
      className="flex items-center justify-between px-4 sm:px-6 py-3 bg-white shadow-lg backdrop-blur-sm border-b border-gray-100 rounded-b-xl mx-4 sm:mx-6 z-50"
    >
      <div className="flex items-center justify-start">
        <button
          className="p-3 rounded-full transition-all duration-300 hover:text-black bg-black border hover:bg-white text-white group relative overflow-hidden shadow-inner"
          onClick={toggleSidebar}
        >
          <div
            className={`relative z-10 transition-transform duration-300 ${isSidebarOpen ? 'rotate-90' : ''}`}
          >
            {isSidebarOpen ? (
              <Logs className="w-5 h-5 -rotate-90" />
            ) : (
              <ChevronRight className="w-5 h-5" />
            )}
          </div>
          <span className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-full transition-transform duration-700" />
        </button>
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
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            )}
          </form>
        </div>
      </div>
      <div
        className="flex items-center space-x-3 sm:space-x-4"
      >
        {isAuthenticated && (
          <div className="hidden md:flex items-center">
            <WorkTimerController />
          </div>
        )}
        {isAuthenticated && (
          <button
            className="whitespace-nowrap relative p-3 rounded-full hover:bg-gray-100 border border-gray-100 transition-colors group"
            onClick={() => navigate("/notifications")}
          >
            <Bell size={22} className="text-gray-600 group-hover:text-black transition-colors" />
            {notificationCount > 0 && (
              <span
                className="absolute -top-1 -right-1 bg-black text-white text-xs font-medium rounded-full w-5 h-5 flex items-center justify-center shadow-lg"
              >
                {notificationCount > 99 ? "99+" : notificationCount}
              </span>
            )}
          </button>
        )}
        <button
          className="md:hidden p-3 rounded-full hover:bg-gray-100"
          onClick={() => searchInputRef.current?.focus()}
        >
          <Search size={22} className="text-gray-600" />
        </button>
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
          <span
            className="hidden sm:block text-gray-500 font-medium px-4 py-2 rounded-xl bg-gray-50"
          >
            Guest
          </span>
        )}
      </div>
    </div>
  );
};

export default Topbar;