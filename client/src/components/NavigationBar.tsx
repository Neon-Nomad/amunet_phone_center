import React, { useState } from "react";
import DarkModeToggle from "./DarkModeToggle";
import HamburgerMenu from "./HamburgerMenu";

const NavigationBar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 w-full bg-white dark:bg-gray-800 shadow-md z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <div className="text-2xl font-bold text-purple-600 dark:text-yellow-500">
            Amunet AI
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <a href="#/" className="text-gray-800 dark:text-gray-100">
              Home
            </a>
            <a href="#/approach" className="text-gray-800 dark:text-gray-100">
              Approach
            </a>
            <a href="#/docs" className="text-gray-800 dark:text-gray-100">
              Docs
            </a>
            <a href="#/dashboard" className="text-gray-800 dark:text-gray-100">
              Dashboard
            </a>
            <a href="#/contact" className="text-gray-800 dark:text-gray-100">
              Contact
            </a>
            <a href="#/admin" className="text-gray-800 dark:text-gray-100">
              Admin
            </a>
            <DarkModeToggle />
          </div>
          <div className="md:hidden">
            <HamburgerMenu isOpen={isMenuOpen} setIsOpen={setIsMenuOpen} />
          </div>
        </div>
      </div>
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <a
              href="#/"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-800 dark:text-gray-100"
            >
              Home
            </a>
            <a
              href="#/approach"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-800 dark:text-gray-100"
            >
              Approach
            </a>
            <a
              href="#/docs"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-800 dark:text-gray-100"
            >
              Docs
            </a>
            <a
              href="#/dashboard"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-800 dark:text-gray-100"
            >
              Dashboard
            </a>
            <a
              href="#/contact"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-800 dark:text-gray-100"
            >
              Contact
            </a>
            <a
              href="#/admin"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-800 dark:text-gray-100"
            >
              Admin
            </a>
          </div>
          <div className="px-4 py-3">
            <DarkModeToggle />
          </div>
        </div>
      )}
    </nav>
  );
};

export default NavigationBar;
