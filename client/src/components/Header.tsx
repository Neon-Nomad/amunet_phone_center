import { useState } from 'react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

const navLinks = [
  { label: 'Platform', href: '#platform' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Testimonials', href: '#testimonials' }
];

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 text-sm">
        <a href="#" className="font-display text-lg font-semibold text-slate-900">
          Amunet AI
        </a>
        <nav className="hidden gap-8 text-sm text-slate-500 lg:flex">
          {navLinks.map((link) => (
            <a key={link.label} href={link.href} className="hover:text-slate-900">
              {link.label}
            </a>
          ))}
        </nav>
          <div className="hidden items-center gap-4 lg:flex">
            <Link to="/login" className="text-slate-500 hover:text-slate-900">
              Login
            </Link>
            <Link
              to="/signup"
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
            >
              Sign up
            </Link>
            <Link
              to="/dashboard"
              className="rounded-full bg-[#6c4bff] px-4 py-2 text-white shadow-lg shadow-[#6c4bff]/20 transition hover:-translate-y-0.5"
            >
              Launch Dashboard
            </Link>
          </div>
        <button
          className="inline-flex items-center rounded-full border border-slate-200 bg-white p-2 text-slate-600 lg:hidden"
          onClick={() => setOpen((value) => !value)}
          aria-label="Toggle navigation"
        >
          {open ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
        </button>
      </div>
      <AnimatePresence>
        {open ? (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="flex flex-col gap-4 border-t border-slate-100 bg-white px-6 py-4 lg:hidden"
          >
            {navLinks.map((link) => (
              <a key={link.label} href={link.href} className="text-slate-600" onClick={() => setOpen(false)}>
                {link.label}
              </a>
            ))}
            <Link to="/login" className="text-slate-600">
              Login
            </Link>
            <Link
              to="/signup"
              className="rounded-full border border-slate-200 px-4 py-2 text-center text-slate-600 shadow-sm shadow-slate-200"
            >
              Sign up
            </Link>
            <Link
              to="/dashboard"
              className="rounded-full bg-[#6c4bff] px-4 py-2 text-center text-white shadow-lg shadow-[#6c4bff]/20"
            >
              Launch Dashboard
            </Link>
          </motion.nav>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
