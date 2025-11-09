import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-dark py-12 text-white/60">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 md:flex-row md:items-center md:justify-between">
        <p className="font-display text-lg text-white">Amunet AI</p>
        <nav className="flex flex-wrap gap-6 text-sm">
          <a href="#" className="hover:text-white">
            Privacy
          </a>
          <a href="#" className="hover:text-white">
            Terms
          </a>
          <Link to="/contact" className="hover:text-white">
            Contact
          </Link>
        </nav>
        <p className="text-xs text-white/40">© {new Date().getFullYear()} Neon Nomad Systems. All rights reserved.</p>
      </div>
    </footer>
  );
}
