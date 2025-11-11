import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-transparent py-12 text-slate-600">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 md:flex-row md:items-center md:justify-between">
        <p className="font-display text-lg text-slate-900">Amunet AI</p>
        <nav className="flex flex-wrap gap-6 text-sm">
          <a href="#" className="hover:text-slate-900">
            Privacy
          </a>
          <a href="#" className="hover:text-slate-900">
            Terms
          </a>
          <Link to="/contact" className="hover:text-slate-900">
            Contact
          </Link>
        </nav>
        <p className="text-xs text-slate-500">© {new Date().getFullYear()} Neon Nomad Systems. All rights reserved.</p>
      </div>
    </footer>
  );
}
