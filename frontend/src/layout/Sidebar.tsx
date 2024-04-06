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
  const lastItem = items[items.length - 1];
  const initialItems = items.slice(0, -1);

  return (
    <div className="sidebar">
      <div className="sidebar-items-wrapper">
        {initialItems.map(item => (
          <div key={item.id} className="sidebar-item" onClick={item.onClick}>
            <div className="sidebar-item-icon">{item.icon}</div>
            <div className="sidebar-item-label">{item.label}</div>
          </div>
        ))}
      </div>
      <div key={lastItem.id} className="sidebar-item" onClick={lastItem.onClick}>
        <div className="sidebar-item-icon">{lastItem.icon}</div>
        <div className="sidebar-item-label">{lastItem.label}</div>
      </div>
    </div>
  );
};
export default Sidebar;
