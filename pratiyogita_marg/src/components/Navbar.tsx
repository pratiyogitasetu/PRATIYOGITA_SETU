import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Menu, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const PRATIYOGITA_SETU_URL =
  import.meta.env.VITE_PRATIYOGITA_SETU_URL || "https://psetu.com/";
const PRATIYOGITA_GYAN_URL =
  import.meta.env.VITE_PRATIYOGITA_GYAN_URL || "https://gyan.psetu.com/";
const PRATIYOGITA_YOGYA_URL =
  import.meta.env.VITE_PRATIYOGITA_YOGYA_URL || "https://yogya.psetu.com/";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      <div className="fixed top-3 left-1/2 -translate-x-1/2 w-[96%] md:w-[94%] lg:w-[92%] xl:w-[88%] z-50">
        <nav
          className={`w-full px-3 sm:px-4 md:px-5 py-1.5 rounded-2xl transition-all duration-150 flex items-center ${
            isScrolled
              ? "backdrop-blur-lg bg-white/10 border border-orange-500 shadow-lg"
              : "bg-transparent border border-transparent"
          }`}
        >
          <div className="w-full flex items-center h-8 sm:h-10 relative">
            <Link to="/" className="flex items-center flex-shrink-0">
              <img
                src="./logos/pm.png"
                alt="Pratiyogita Marg Logo"
                className="h-8 w-auto sm:h-10 object-contain"
              />
            </Link>

            <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center">
              <div className="flex items-center space-x-2 lg:space-x-3 xl:space-x-4 whitespace-nowrap">
                <a href="/" className="text-white hover:text-orange-400 font-semibold text-[11px] lg:text-xs xl:text-sm transition-colors">Home</a>
                <a href={PRATIYOGITA_SETU_URL} className="text-white/80 hover:text-orange-400 font-semibold text-[11px] lg:text-xs xl:text-sm transition-colors">Pratiyogita Setu</a>
                <a href={PRATIYOGITA_YOGYA_URL} className="text-white/80 hover:text-orange-400 font-semibold text-[11px] lg:text-xs xl:text-sm transition-colors">Pratiyogita Yogya</a>
                <a href={PRATIYOGITA_GYAN_URL} className="text-white/80 hover:text-orange-400 font-semibold text-[11px] lg:text-xs xl:text-sm transition-colors">Pratiyogita Gyan</a>
                <a href="/about" className="text-white/80 hover:text-orange-400 font-semibold text-[11px] lg:text-xs xl:text-sm transition-colors">About Us</a>
                <a href="/contact" className="text-white/80 hover:text-orange-400 font-semibold text-[11px] lg:text-xs xl:text-sm transition-colors">Contact Us</a>
              </div>
            </div>

            <div className="hidden md:flex items-center ml-auto flex-shrink-0" />

            <div className="flex items-center gap-2 ml-auto md:hidden">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="text-white hover:text-orange-400 p-2 focus:outline-none transition-colors"
                aria-expanded={isOpen}
                aria-label="Toggle menu"
              >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </nav>
      </div>

      {/* Mobile Menu */}
      {isOpen &&
        createPortal(
          <>
            <div
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/30 z-[9998] md:hidden"
            />
            <div className="fixed top-14 right-3 w-56 bg-gray-900 border border-orange-500/60 rounded-xl z-[9999] md:hidden p-2 shadow-xl">
              <div className="space-y-0.5">
                <a href="/" onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-lg text-white hover:bg-white/10 text-sm font-semibold transition-colors">Home</a>
                <a href={PRATIYOGITA_SETU_URL} onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-lg text-white/80 hover:bg-white/10 hover:text-white text-sm font-semibold transition-colors">Pratiyogita Setu</a>
                <a href={PRATIYOGITA_YOGYA_URL} onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-lg text-white/80 hover:bg-white/10 hover:text-white text-sm font-semibold transition-colors">Pratiyogita Yogya</a>
                <a href={PRATIYOGITA_GYAN_URL} onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-lg text-white/80 hover:bg-white/10 hover:text-white text-sm font-semibold transition-colors">Pratiyogita Gyan</a>
                <a href="/about" onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-lg text-white/80 hover:bg-white/10 hover:text-white text-sm font-semibold transition-colors">About Us</a>
                <a href="/contact" onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-lg text-white/80 hover:bg-white/10 hover:text-white text-sm font-semibold transition-colors">Contact Us</a>
              </div>
            </div>
          </>,
          document.body
        )}
    </>
  );
};

export default Navbar;
