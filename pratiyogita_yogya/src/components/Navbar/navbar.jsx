import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Menu, X, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";

const PRATIYOGITA_SETU_URL =
  import.meta.env.VITE_PRATIYOGITA_SETU_URL || "https://psetu.com/";
const PRATIYOGITA_YOGYA_URL =
  import.meta.env.VITE_PRATIYOGITA_YOGYA_URL || "https://yogya.psetu.com/";
const PRATIYOGITA_GYAN_URL =
  import.meta.env.VITE_PRATIYOGITA_GYAN_URL || "https://gyan.psetu.com/";
const PRATIYOGITA_MARG_URL =
  import.meta.env.VITE_PRATIYOGITA_MARG_URL || "https://marg.psetu.com/";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Add scroll event listener for blur effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
              ? "backdrop-blur-lg bg-[#2B1E17]/80 border border-[#E4572E]"
              : "bg-transparent border border-transparent"
          }`}
      >
        <div className="w-full flex items-center h-10 sm:h-12 relative">
          {/* Logo and Brand */}
          <Link to="/" className="flex items-center space-x-2 flex-shrink-0">
            <img
              src="./logos/py.png"
              alt="Pratiyogita Yogya Logo"
              className="h-10 w-auto sm:h-12 object-contain"
            />
          </Link>

          {/* Center - Desktop Menu */}
          <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center">
            <div className="flex items-center space-x-3 lg:space-x-6 whitespace-nowrap">
            <a href="/" className="text-[#FBF6EE] hover:text-[#E4572E] font-semibold text-sm lg:text-base transition-colors">
              Home
            </a>
            <a
              href={PRATIYOGITA_SETU_URL}
              className="text-[#E8D8C3] hover:text-[#E4572E] font-semibold text-sm lg:text-base transition-colors"
            >
              Pratiyogita Setu
            </a>
            <a
              href={PRATIYOGITA_YOGYA_URL}
              className="text-[#E8D8C3] hover:text-[#E4572E] font-semibold text-sm lg:text-base transition-colors"
            >
              Pratiyogita Yogya
            </a>
            <a
              href={PRATIYOGITA_GYAN_URL}
              className="text-[#E8D8C3] hover:text-[#E4572E] font-semibold text-sm lg:text-base transition-colors"
            >
              Pratiyogita Gyan
            </a>
            <a
              href={PRATIYOGITA_MARG_URL}
              className="text-[#E8D8C3] hover:text-[#E4572E] font-semibold text-sm lg:text-base transition-colors"
            >
              Pratiyogita Marg
            </a>
            <a href="/about" className="text-[#E8D8C3] hover:text-[#E4572E] font-semibold text-sm lg:text-base transition-colors">
              About Us
            </a>


            </div>
          </div>

          {/* Right - Desktop placeholder (auth removed) */}
          <div className="hidden md:flex items-center gap-3 ml-auto flex-shrink-0">
          </div>

          <div className="flex items-center gap-2 ml-auto md:hidden">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden text-[#FBF6EE] p-2 focus:outline-none"
              aria-expanded={isOpen}
              aria-label="Toggle menu"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Drawer - rendered via portal to escape stacking context */}
      </nav>
    </div>

    {isOpen &&
      createPortal(
        <>
          <div
            onClick={() => {
              setIsOpen(false);
              setIsDropdownOpen(false);
            }}
            className="fixed inset-0 bg-[#2B1E17]/60 backdrop-blur-sm z-[9998] md:hidden"
          />

          <div className="fixed top-16 right-4 bottom-4 w-[82vw] max-w-[320px] bg-[#2B1E17]/95 backdrop-blur-md border border-[#E4572E] rounded-xl z-[9999] md:hidden p-3 overflow-y-auto flex flex-col">
            <button
              onClick={() => {
                setIsOpen(false);
                setIsDropdownOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-md text-[#E8D8C3] hover:bg-[#E4572E]/15 hover:text-[#FBF6EE] mb-2 font-semibold transition-colors"
            >
              ← Back
            </button>

            <div className="space-y-1">
              <a href="/" onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-md text-[#FBF6EE] hover:bg-[#E4572E]/15 font-semibold transition-colors">Home</a>
              <a href={PRATIYOGITA_SETU_URL} onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-md text-[#E8D8C3] hover:bg-[#E4572E]/15 hover:text-[#FBF6EE] font-semibold transition-colors">Pratiyogita Setu</a>
              <a href={PRATIYOGITA_YOGYA_URL} onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-md text-[#E8D8C3] hover:bg-[#E4572E]/15 hover:text-[#FBF6EE] font-semibold transition-colors">Pratiyogita Yogya</a>
              <a href={PRATIYOGITA_GYAN_URL} onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-md text-[#E8D8C3] hover:bg-[#E4572E]/15 hover:text-[#FBF6EE] font-semibold transition-colors">Pratiyogita Gyan</a>
              <a href={PRATIYOGITA_MARG_URL} onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-md text-[#E8D8C3] hover:bg-[#E4572E]/15 hover:text-[#FBF6EE] font-semibold transition-colors">Pratiyogita Marg</a>
              <a href="/about" onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-md text-[#E8D8C3] hover:bg-[#E4572E]/15 hover:text-[#FBF6EE] font-semibold transition-colors">About Us</a>
            </div>

            <div className="border-t border-[#E4572E]/40 mt-auto pt-3">
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
};

export default Navbar;
