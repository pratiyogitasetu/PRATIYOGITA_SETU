import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Menu, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

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
      <div className="fixed top-3 left-1/2 -translate-x-1/2 w-[92%] md:w-[80%] lg:w-[70%] z-50">
        <nav
          className={`w-full px-3 sm:px-4 md:px-6 py-1.5 rounded-2xl transition-all duration-150 flex items-center ${
            isScrolled
              ? "backdrop-blur-lg bg-white/10 border border-orange-500 shadow-lg"
              : "bg-transparent border border-transparent"
          }`}
        >
          <div className="w-full flex items-center h-10 sm:h-12 relative">
            <Link to="/" className="flex items-center flex-shrink-0">
              <img
                src="./logos/pm.png"
                alt="Pratiyogita Marg Logo"
                className="h-10 w-auto sm:h-12 object-contain"
              />
            </Link>

            <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center">
              <div className="flex items-center space-x-3 lg:space-x-6 whitespace-nowrap">
                <a href="/" className="text-white hover:text-orange-400 font-semibold text-sm lg:text-base">Home</a>
                <a href={PRATIYOGITA_GYAN_URL} className="text-white hover:text-orange-400 font-semibold text-sm lg:text-base">Pratiyogita Gyan</a>
                <a href={PRATIYOGITA_YOGYA_URL} className="text-white hover:text-orange-400 font-semibold text-sm lg:text-base">Pratiyogita Yogya</a>
                <a href="/about" className="text-white hover:text-orange-400 font-semibold text-sm lg:text-base">About Us</a>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-3 ml-auto flex-shrink-0">
            </div>

            <div className="flex items-center gap-2 ml-auto md:hidden">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="md:hidden text-white p-2 focus:outline-none"
                aria-expanded={isOpen}
                aria-label="Toggle menu"
              >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </nav>
      </div>

      {isOpen &&
        createPortal(
          <>
            <div
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9998] md:hidden"
            />
            <div className="fixed top-16 right-4 bottom-4 w-[82vw] max-w-[320px] bg-gray-900/95 backdrop-blur-md border border-orange-500 rounded-lg shadow-2xl z-[9999] md:hidden p-3 overflow-y-auto flex flex-col">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full text-left px-3 py-2 rounded-md text-white hover:bg-white/10 mb-2 font-semibold"
              >
                ← Back
              </button>
              <div className="space-y-1">
                <a href="/" onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-md text-white hover:bg-white/10 font-semibold">Home</a>
                <a href={PRATIYOGITA_GYAN_URL} onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-md text-white hover:bg-white/10 font-semibold">Pratiyogita Gyan</a>
                <a href={PRATIYOGITA_YOGYA_URL} onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-md text-white hover:bg-white/10 font-semibold">Pratiyogita Yogya</a>
                <a href="/about" onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-md text-white hover:bg-white/10 font-semibold">About Us</a>
              </div>
              <div className="border-t border-orange-500 mt-auto pt-3">
              </div>
            </div>
          </>,
          document.body
        )}
    </>
  );
};

export default Navbar;
