import React from 'react';
import './Sidebar.css';

export interface SidebarItem {
  id: string;
  label: string;
  icon: JSX.Element;
  onClick: () => void;
}

interface SidebarProps {
  items: SidebarItem[];
}

const Sidebar: React.FC<SidebarProps> = ({ items }) => {
  return (
    <div className="sidebar">
      {items.map(item => (
        <div key={item.id} className="sidebar-item" onClick={item.onClick}>
          <div className="sidebar-item-icon">{item.icon}</div>
          <div className="sidebar-item-label">{item.label}</div>
        </div>
      ))}
    </div>
  );
};

export default Sidebar;
