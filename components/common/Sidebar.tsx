import React from 'react';
import { DashboardIcon, CalendarIcon, ChatIcon, ProfileIcon, ChevronDoubleLeftIcon, ClipboardDocumentListIcon } from './icons';

export type View = 'dashboard' | 'schedule' | 'messages' | 'profile' | 'requests';

export interface NavItemType {
    view: View;
    label: string;
    icon: (props: { className?: string }) => JSX.Element;
}

interface SidebarProps {
  activeView: View;
  setActiveView: (view: View) => void;
  isCollapsed: boolean;
  onToggle: () => void;
  navItems: NavItemType[];
  portalName: string;
}

const NavItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  isCollapsed: boolean;
  onClick: () => void;
}> = ({ icon, label, isActive, isCollapsed, onClick }) => (
  <li
    onClick={onClick}
    className={`flex items-center p-3 rounded-lg cursor-pointer transition-all duration-200 group ${
      isActive
        ? 'bg-indigo-600 text-white shadow-md'
        : 'text-slate-600 hover:bg-indigo-100 hover:text-indigo-700'
    } ${isCollapsed ? 'justify-center' : ''}`}
  >
    {icon}
    <span className={`ml-4 font-medium transition-opacity duration-200 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>{label}</span>
  </li>
);

const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, isCollapsed, onToggle, navItems, portalName }) => {
  return (
    <aside className={`bg-white p-4 shadow-lg flex flex-col transition-all duration-300 ease-in-out z-40 ${isCollapsed ? 'w-20' : 'w-64'}`}>
      <div className={`flex items-center mb-12 ${isCollapsed ? 'justify-center' : 'px-2'}`}>
        <div className="bg-indigo-600 text-white text-xl font-bold rounded-md p-2">ES</div>
        <h1 className={`text-xl font-bold text-slate-800 ml-3 whitespace-nowrap transition-opacity duration-200 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>{portalName}</h1>
      </div>
      <nav className="flex-grow">
        <ul className="space-y-3">
          {navItems.map(item => (
            <NavItem
                key={item.view}
                icon={<item.icon className="w-6 h-6 flex-shrink-0" />}
                label={item.label}
                isActive={activeView === item.view}
                isCollapsed={isCollapsed}
                onClick={() => setActiveView(item.view)}
            />
          ))}
        </ul>
      </nav>
      <div className={`transition-opacity duration-200 ${isCollapsed ? 'opacity-0 h-0 pointer-events-none' : 'opacity-100'}`}>
        <div className="bg-indigo-50 p-4 rounded-lg text-center">
            <h3 className="font-bold text-indigo-800">Need Help?</h3>
            <p className="text-sm text-indigo-700 mt-1">Contact our support team for any issues.</p>
            <button className="mt-3 w-full bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700 active:scale-95 transition-all duration-200">
            Contact Support
            </button>
        </div>
      </div>
       <div className="pt-6 mt-6 border-t border-slate-200">
            <button 
                onClick={onToggle} 
                className="w-full flex items-center p-3 rounded-lg text-slate-600 hover:bg-slate-100"
            >
                <ChevronDoubleLeftIcon className={`w-6 h-6 flex-shrink-0 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
                <span className={`ml-4 font-medium whitespace-nowrap transition-opacity duration-200 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>Collapse</span>
            </button>
        </div>
    </aside>
  );
};

export default Sidebar;