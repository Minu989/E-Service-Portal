import React, { useState, useEffect, useRef } from 'react';
import { Notification } from '../../shared/types'; // UPDATED: TechnicianProfile is no longer needed here
import { BellIcon, SearchIcon, ChevronDownIcon, LogoutIcon } from './icons';
import { UserProfile } from '@/contexts/AuthContext'; // NEW: Import UserProfile type

// UPDATED: The props interface is changed to accept the dynamic userProfile
interface HeaderProps {
  userProfile: UserProfile | null;
  notifications: Notification[];
  onClearNotifications: () => void;
  onLogout: () => void;
  setActiveView: (view: 'dashboard' | 'schedule' | 'messages' | 'profile') => void;
}

const Header: React.FC<HeaderProps> = ({ userProfile, notifications, onClearNotifications, onLogout, setActiveView }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const hasUnread = notifications.some(n => !n.read);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // NEW: If userProfile is not available yet, render nothing to avoid errors.
  if (!userProfile) {
    return null;
  }

  return (
    <header className="bg-white/70 backdrop-blur-md sticky top-0 z-30 border-b border-slate-200/80 px-6 py-4 flex items-center justify-between flex-shrink-0">
      <div>
        {/* UPDATED: Use the user's actual name */}
        <h2 className="text-2xl font-bold text-slate-800">Welcome back, {userProfile.fullName.split(' ')[0]}!</h2>
        <p className="text-slate-500">Here's what's happening today.</p>
      </div>
      <div className="flex items-center space-x-6">
        <div className="relative">
          <SearchIcon className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search jobs..."
            className="bg-white border border-slate-200 rounded-full py-2 pl-10 pr-4 w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
        </div>
        <div className="relative" ref={notificationsRef}>
            <button onClick={() => setIsNotificationsOpen(!isNotificationsOpen)} className="relative p-2 rounded-full hover:bg-slate-100 transition-colors">
                <BellIcon className="w-6 h-6 text-slate-600" />
                {hasUnread && <span className="absolute top-1 right-1 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white"></span>}
            </button>
            {isNotificationsOpen && (
                 <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl z-20 animate-scale-in">
                    <div className="p-3 font-semibold text-slate-800 border-b">Notifications</div>
                    <div className="py-1 max-h-80 overflow-y-auto">
                        {notifications.map(notif => (
                            <div key={notif.id} className={`p-3 text-sm flex items-start hover:bg-slate-50 ${!notif.read ? 'bg-indigo-50' : ''}`}>
                                {!notif.read && <span className="w-2 h-2 bg-indigo-500 rounded-full mr-3 mt-1.5 flex-shrink-0"></span>}
                                <div className={notif.read ? 'pl-5' : ''}>
                                    <p className="text-slate-700">{notif.message}</p>
                                    <p className="text-xs text-slate-400 mt-1">{notif.timestamp}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    {hasUnread && (
                        <div className="p-2 border-t">
                            <button onClick={() => { onClearNotifications(); setIsNotificationsOpen(false); }} className="w-full text-center text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-md py-1.5">
                                Mark all as read
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
        <div className="relative" ref={dropdownRef}>
          <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="flex items-center p-2 rounded-lg hover:bg-slate-100 transition-colors">
            {/* UPDATED: Use dynamic avatarUrl and fullName */}
            <img src={userProfile.avatarUrl} alt={userProfile.fullName} className="w-12 h-12 rounded-full border-2 border-indigo-500" />
            <div className="ml-3 text-left">
              <p className="font-semibold text-slate-800">{userProfile.fullName}</p>
              {/* UPDATED: Use dynamic skills array */}
              <p className="text-sm text-slate-500 truncate w-32" title={userProfile.skills?.join(', ')}>{userProfile.skills?.join(', ')}</p>
            </div>
            <ChevronDownIcon className={`w-5 h-5 text-slate-500 ml-2 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl z-20 animate-scale-in py-1">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveView('profile');
                  setIsDropdownOpen(false);
                }}
                className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
              >
                Profile
              </a>
              <button
                onClick={onLogout}
                className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <LogoutIcon className="w-5 h-5 mr-2" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
