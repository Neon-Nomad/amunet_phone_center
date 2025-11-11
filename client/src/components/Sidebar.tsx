import React from "react";
import { NavLink } from "react-router-dom";
import {
  HomeIcon,
  PhoneIcon,
  CalendarIcon,
  ShareIcon,
  CogIcon,
} from "@heroicons/react/24/outline";

const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-brand-purple text-white flex flex-col">
      <div className="p-8">
        <h1 className="text-2xl font-display text-brand-gold">Amunet AI</h1>
      </div>
      <nav className="flex-1 px-4">
        <ul>
          <li>
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `flex items-center p-4 rounded-lg transition-all duration-200 ${
                  isActive
                    ? "bg-white/10 shadow-glow-subtle"
                    : "hover:bg-white/5"
                }`
              }
            >
              <HomeIcon className="h-6 w-6 mr-4" />
              <span className="font-body">Dashboard</span>
            </NavLink>
          </li>
          <li className="mt-2">
            <NavLink
              to="/calls"
              className={({ isActive }) =>
                `flex items-center p-4 rounded-lg transition-all duration-200 ${
                  isActive
                    ? "bg-white/10 shadow-glow-subtle"
                    : "hover:bg-white/5"
                }`
              }
            >
              <PhoneIcon className="h-6 w-6 mr-4" />
              <span className="font-body">Calls</span>
            </NavLink>
          </li>
          <li className="mt-2">
            <NavLink
              to="/bookings"
              className={({ isActive }) =>
                `flex items-center p-4 rounded-lg transition-all duration-200 ${
                  isActive
                    ? "bg-white/10 shadow-glow-subtle"
                    : "hover:bg-white/5"
                }`
              }
            >
              <CalendarIcon className="h-6 w-6 mr-4" />
              <span className="font-body">Bookings</span>
            </NavLink>
          </li>
          <li className="mt-2">
            <NavLink
              to="/social"
              className={({ isActive }) =>
                `flex items-center p-4 rounded-lg transition-all duration-200 ${
                  isActive
                    ? "bg-white/10 shadow-glow-subtle"
                    : "hover:bg-white/5"
                }`
              }
            >
              <ShareIcon className="h-6 w-6 mr-4" />
              <span className="font-body">Social Media</span>
            </NavLink>
          </li>
        </ul>
      </nav>
      <div className="p-4">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center p-4 rounded-lg transition-all duration-200 ${
              isActive ? "bg-white/10 shadow-glow-subtle" : "hover:bg-white/5"
            }`
          }
        >
          <CogIcon className="h-6 w-6 mr-4" />
          <span className="font-body">Settings</span>
        </NavLink>
      </div>
    </aside>
  );
};

export default Sidebar;
