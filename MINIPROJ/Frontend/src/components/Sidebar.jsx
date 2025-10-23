import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Upload, History, QrCode, Home } from "lucide-react";
import logo from "../assets/l-removebg-preview (1).png";
import "../App.css";

function Sidebar() {
  const location = useLocation();

  return (
    <nav className="sidebar">
      <img src={logo} alt="AirBridge logo" className="logo" />
      <ul>
        <li className={location.pathname === "/" ? "active" : ""}>
          <Link to="/"><Home size={18} /> Home</Link>
        </li>
        <li className={location.pathname === "/upload" ? "active" : ""}>
          <Link to="/upload"><Upload size={18} /> Upload</Link>
        </li>
        <li className={location.pathname === "/result" ? "active" : ""}>
          <Link to="/result"><QrCode size={18} /> Result</Link>
        </li>
        <li className={location.pathname === "/history" ? "active" : ""}>
          <Link to="/history"><History size={18} /> History</Link>
        </li>
      </ul>
    </nav>
  );
}

export default Sidebar;
