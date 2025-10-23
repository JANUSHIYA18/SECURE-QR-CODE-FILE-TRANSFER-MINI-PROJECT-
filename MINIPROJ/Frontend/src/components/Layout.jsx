import React from "react";
import Sidebar from "./Sidebar";
import "../App.css";

function Layout({ children }) {
  return (
    <div className="layout">
      <Sidebar />
      <main className="content">{children}</main>
    </div>
  );
}

export default Layout;
