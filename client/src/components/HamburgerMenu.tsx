import React from "react";

interface HamburgerMenuProps {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const HamburgerMenu: React.FC<HamburgerMenuProps> = ({ isOpen, setIsOpen }) => {
  return (
    <div
      className={`fixed top-0 right-0 h-full bg-white shadow-lg z-40 transition-transform transform ${isOpen ? "translate-x-0" : "translate-x-full"} w-64`}
    >
      <div className="p-5">
        <h2 className="text-lg font-bold">Menu</h2>
        <ul className="mt-4">
          <li>
            <a href="/" className="block py-2">
              Home
            </a>
          </li>
          <li>
            <a href="/auth" className="block py-2">
              Auth
            </a>
          </li>
          <li>
            <a href="/approach" className="block py-2">
              Approach
            </a>
          </li>
          <li>
            <a href="/docs" className="block py-2">
              Docs
            </a>
          </li>
          <li>
            <a href="/dashboard" className="block py-2">
              Dashboard
            </a>
          </li>
          <li>
            <a href="/contact" className="block py-2">
              Contact
            </a>
          </li>
          <li>
            <a href="/admin" className="block py-2">
              Admin
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default HamburgerMenu;
