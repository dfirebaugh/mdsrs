import React from 'react';
import Sidebar, { SidebarItem } from './Sidebar';
import MainArea from './MainArea';
import Explorer from './Explorer';

import "./MainLayout.css"

interface props {
  sidebarItems: SidebarItem[]
  isExplorerVisible: boolean;
  explorerContent?: React.ReactNode;
  mainAreaContent?: React.ReactNode;
  gridTemplateColumns: ".1fr .1fr 10fr" | ".1fr 11fr";
}

const MainLayout: React.FC<props> = ({ gridTemplateColumns, isExplorerVisible, sidebarItems, mainAreaContent, explorerContent }) => {
  return (
    <div className={`main-layout`}>
      <div className="app-content" style={{ gridTemplateColumns }}>
        <Sidebar items={sidebarItems} />
        {isExplorerVisible && <>
          <Explorer>
            {explorerContent}
          </Explorer>
        </>
        }
        <MainArea>
          {mainAreaContent}
        </MainArea>
      </div>
    </div>
  );
};

export default MainLayout;
