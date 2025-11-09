import { useState } from 'react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

const navLinks = [
  { label: 'Platform', href: '#platform' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Testimonials', href: '#testimonials' }
];

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-dark/80 backdrop-blur border-b border-white/5">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 text-sm">
        <a href="#" className="font-display text-lg font-semibold text-white">
          Amunet AI
        </a>
        <nav className="hidden gap-8 text-sm text-white/80 lg:flex">
          {navLinks.map((link) => (
            <a key={link.label} href={link.href} className="hover:text-white">
              {link.label}
            </a>
          ))}
        </nav>
        <div className="hidden items-center gap-4 lg:flex">
          <a href="/login" className="text-white/70 hover:text-white">
            Login
          </a>
          <a
            href="/dashboard"
            className="rounded-full bg-primary px-4 py-2 text-white shadow-lg shadow-primary/20 transition hover:-translate-y-0.5"
          >
            Launch Dashboard
          </a>
        </div>
        <button
          className="inline-flex items-center rounded-full border border-white/20 p-2 text-white lg:hidden"
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
            className="flex flex-col gap-4 border-t border-white/5 bg-dark/95 px-6 py-4 lg:hidden"
          >
            {navLinks.map((link) => (
              <a key={link.label} href={link.href} className="text-white/80" onClick={() => setOpen(false)}>
                {link.label}
              </a>
            ))}
            <a href="/login" className="text-white/70">
              Login
            </a>
            <a href="/dashboard" className="rounded-full bg-primary px-4 py-2 text-center text-white">
              Launch Dashboard
            </a>
          </motion.nav>
        ) : null}
      </AnimatePresence>
    </header>
  );
}