import React from "react";
import Sidebar from "./Sidebar";
import "./OwnerLayout.css"; // optional if you want layout styling

const OwnerLayout = ({ children }) => {
  return (
    <div className="owner-layout-wrapper">
      <Sidebar />

      <div className="owner-content-area">
        {children}
      </div>
    </div>
  );
};

export default OwnerLayout;
