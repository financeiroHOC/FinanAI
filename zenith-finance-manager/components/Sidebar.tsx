import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { NAVIGATION_ITEMS } from '../constants';
import { SidebarItem, NavItem as NavItemType, NavHeader, NavSubItem } from '../types';
import { ChartBarSquareIcon, ChevronDownIcon, ChevronRightIcon } from './icons';

interface SidebarProps {
  isSidebarVisible: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ isSidebarVisible }) => {
  const [openSection, setOpenSection] = useState<string | null>(null); 
  const location = useLocation();

  const toggleSection = (sectionName: string) => {
    setOpenSection(prevOpenSection => prevOpenSection === sectionName ? null : sectionName);
  };

  const isParentOrChildActive = (item: NavItemType): boolean => {
    if (location.pathname === item.path && (item.exact !== false || item.path === '/')) return true;
    if (!item.exact && item.path !== '/' && location.pathname.startsWith(item.path)) return true; 
    
    if (item.subItems) {
      return item.subItems.some(subItem => location.pathname === subItem.path || (subItem.path !== '/' && location.pathname.startsWith(subItem.path) && subItem.path.length > 1));
    }
    return false;
  };


  return (
    <div
      className={`bg-white dark:bg-neutral-850 text-neutral-800 dark:text-neutral-200 flex flex-col min-h-screen border-r border-neutral-200/80 dark:border-neutral-700/60
                  transition-all duration-300 ease-in-out
                  ${isSidebarVisible ? 'w-64' : 'w-0 overflow-hidden'}`}
    >
      {isSidebarVisible && (
        <>
          <div className="p-6 flex items-center space-x-3 border-b border-neutral-200/80 dark:border-neutral-700/60 h-[70px] flex-shrink-0">
            <ChartBarSquareIcon className="h-9 w-9 text-primary-DEFAULT" />
            <h1 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100 whitespace-nowrap">ZenithFinance</h1>
          </div>
          <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
            {NAVIGATION_ITEMS.map((item, index) => {
              if (item.type === 'header') { 
                return (
                  <div key={index} className="px-3 pt-4 pb-1 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider whitespace-nowrap">
                    {item.name}
                  </div>
                );
              }

              const navItem = item as NavItemType;
              // NavLink's isActive is more reliable for exact matching
              // const isActive = isParentOrChildActive(navItem); 

              return (
                <NavLink
                  key={navItem.name}
                  to={navItem.path}
                  end={navItem.exact !== false} 
                  className={({ isActive }) => // Use NavLink's isActive for precise matching
                    `flex items-center space-x-3.5 px-3.5 py-3 rounded-xl text-sm font-medium whitespace-nowrap
                     border-l-4 transition-all duration-200 ease-in-out group
                     ${isActive
                       ? 'bg-gradient-to-r from-primary to-primary-dark text-white border-white dark:border-primary-light shadow-lg'
                       : 'text-neutral-600 dark:text-neutral-300 border-transparent hover:bg-primary-light/15 dark:hover:bg-primary-dark/25 hover:text-primary-dark dark:hover:text-primary-light'}`
                  }
                >
                  {({isActive}) => ( // Render prop to access isActive for icon styling
                    <>
                      <navItem.icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-neutral-500 dark:text-neutral-400 group-hover:text-primary-dark dark:group-hover:text-primary-light transition-colors'}`} />
                      <span>{navItem.name}</span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
          <div className="p-5 mt-auto border-t border-neutral-200/80 dark:border-neutral-700/60 flex-shrink-0">
            <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center whitespace-nowrap">&copy; {new Date().getFullYear()} ZenithFinance. Todos os direitos reservados.</p>
          </div>
        </>
      )}
    </div>
  );
};