import { useState, useEffect } from "react";
import { Outlet } from "react-router";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import apiClient from "../../helpers/apiClient";
import Loading from "../Loading";

const Layout = ({ isAuthenticated, setIsAuthenticated }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 768px)");

    const handleResize = () => {
      if (mediaQuery.matches) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };

    handleResize();
    mediaQuery.addEventListener("change", handleResize);
    return () => mediaQuery.removeEventListener("change", handleResize);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      setLoading(true);
      apiClient
        .get("/auth/profile/")
        .then((response) => {
          setUser({
            username: response.data.username,
            image: response.data.image,
          });
        })
        .catch((error) => {
          console.error("Error fetching user:", error);
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setUser(null);
      setLoading(false);
    }
  }, [isAuthenticated]);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="flex min-h-screen bg-linear-to-br from-blue-50 via-gray-200 to-indigo-100">
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 bg-transparent text-white shadow-inner transition-transform duration-300 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <Sidebar toggleSidebar={toggleSidebar} />
      </aside>
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-30 backdrop-brightness-50 md:hidden"
          onClick={closeSidebar}
        />
      )}
      <div className="flex-1 flex flex-col w-full">
        <header
          className={`fixed top-0 left-0 right-0 z-20 transition-all duration-300 ${isSidebarOpen ? "md:left-72" : "md:left-0"
            }`}
        >
          <Topbar
            toggleSidebar={toggleSidebar}
            isSidebarOpen={isSidebarOpen}
            isAuthenticated={isAuthenticated}
            setIsAuthenticated={setIsAuthenticated}
            user={user}
          />
        </header>
        <main
          className={`flex-1 pt-[75px] transition-all duration-300 ${isSidebarOpen ? "md:ml-72" : "md:ml-0"
            }`}
        >
          {loading ? (
            <div className="flex items-center justify-center min-h-screen">
              <Loading />
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>
    </div>
  );
};

export default Layout;