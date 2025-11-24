import { Outlet } from "react-router"
import Topbar from "./Topbar"
import Sidebar from "./Sidebar"

const Layout = () => {
    return (
        <div>
            <Topbar />
            <Outlet />
            <Sidebar />
        </div>
    )
}

export default Layout