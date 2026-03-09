import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Menu, X, ChevronDown } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const PRATIYOGITA_YOGYA_URL =
  import.meta.env.VITE_PRATIYOGITA_YOGYA_URL || "https://yogya.psetu.com";
const PRATIYOGITA_MARG_URL =
  import.meta.env.VITE_PRATIYOGITA_MARG_URL || "https://marg.psetu.com";
const PRATIYOGITA_GYAN_URL =
  import.meta.env.VITE_PRATIYOGITA_GYAN_URL || "https://gyan.psetu.com";
const PRATIYOGITA_SETU_URL =
  import.meta.env.VITE_PRATIYOGITA_SETU_URL || "https://psetu.com";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  // Add scroll event listener for blur effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  // Lock body scroll when mobile menu is open
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
    <div className="fixed top-3 left-1/2 -translate-x-1/2 w-[92%] md:w-[90%] lg:w-[88%] xl:w-[78%] z-50">
      <nav
        className={`w-full px-3 sm:px-4 md:px-6 py-1.5 rounded-2xl transition-all duration-150 flex items-center ${
          isScrolled
            ? "backdrop-blur-lg bg-[#2B1E17]/80 border border-[#E4572E]"
            : "bg-transparent border border-transparent"
        }`}
      >
          <div className="w-full flex items-center h-8 sm:h-10 relative">
          {/* Logo */}
          <Link to="/" className="flex items-center flex-shrink-0">
            <img
              src="/logos/ps.png"
              alt="Pratiyogita Setu Logo"
              className="h-8 w-auto sm:h-10 object-contain"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src =
                  "https://placehold.co/64x64/indigo/white?text=PS";
              }}
            />
          </Link>

          {/* Center - Desktop Menu */}
          <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center">
            <div className="flex items-center space-x-2 lg:space-x-3 xl:space-x-5 whitespace-nowrap">
              <Link to="/" className="text-[#FBF6EE] hover:text-[#E4572E] font-semibold text-xs lg:text-sm xl:text-base transition-colors">
                Home
              </Link>
              <div className="relative group">
                <button
                  type="button"
                  className="flex items-center gap-1 text-[#E8D8C3] group-hover:text-[#E4572E] font-semibold text-xs lg:text-sm xl:text-base transition-colors"
                >
                  Platforms
                  <ChevronDown size={16} className="transition-transform group-hover:rotate-180" />
                </button>
                <div className="absolute left-1/2 top-full z-20 hidden min-w-[220px] -translate-x-1/2 pt-3 group-hover:block">
                  <div className="rounded-xl border border-[#E4572E]/40 bg-[#2B1E17]/95 p-2 shadow-2xl backdrop-blur-md">
                    <a href={PRATIYOGITA_SETU_URL} className="block rounded-lg px-3 py-2 text-sm font-semibold text-[#E8D8C3] transition-colors hover:bg-[#E4572E]/15 hover:text-[#FBF6EE]">
                      Pratiyogita Setu
                    </a>
                    <a href={`${PRATIYOGITA_YOGYA_URL}/check-eligibility`} className="block rounded-lg px-3 py-2 text-sm font-semibold text-[#E8D8C3] transition-colors hover:bg-[#E4572E]/15 hover:text-[#FBF6EE]">
                      Pratiyogita Yogya
                    </a>
                    <a href={`${PRATIYOGITA_MARG_URL}/explore`} className="block rounded-lg px-3 py-2 text-sm font-semibold text-[#E8D8C3] transition-colors hover:bg-[#E4572E]/15 hover:text-[#FBF6EE]">
                      Pratiyogita Marg
                    </a>
                    <a href={PRATIYOGITA_GYAN_URL} className="block rounded-lg px-3 py-2 text-sm font-semibold text-[#E8D8C3] transition-colors hover:bg-[#E4572E]/15 hover:text-[#FBF6EE]">
                      Pratiyogita Gyan
                    </a>
                  </div>
                </div>
              </div>
              <Link to="/gyan-posters" className="relative text-[#E8D8C3] hover:text-[#E4572E] font-semibold text-xs lg:text-sm xl:text-base transition-colors">
                Gyan Posters
                <span className="absolute -top-2.5 -right-7 bg-[#E4572E] text-[#FBF6EE] text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none animate-pulse">NEW</span>
              </Link>
              <Link to="/about" className="text-[#E8D8C3] hover:text-[#E4572E] font-semibold text-xs lg:text-sm xl:text-base transition-colors">
                About Us
              </Link>
            </div>
          </div>

          {/* Right - Desktop Auth Actions */}
          <div className="hidden md:flex items-center gap-3 ml-auto flex-shrink-0">
            <Link to="/login" className="text-[#E8D8C3] hover:text-[#E4572E] font-semibold text-sm transition-colors">
              Log In
            </Link>
            <Link
              to="/register"
              className="bg-[#E4572E] text-[#FBF6EE] px-3 py-1.5 rounded-lg hover:bg-[#cf4a23] font-semibold text-sm transition-colors"
            >
              Try for Free
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 ml-auto md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden text-[#FBF6EE] hover:text-[#E4572E] p-2 focus:outline-none transition-colors"
              aria-expanded={isOpen}
              aria-label="Toggle menu"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

      </nav>
    </div>

    {/* Mobile Menu Drawer - rendered via portal to escape stacking context */}
    {isOpen &&
      createPortal(
        <>
          <div
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-[#2B1E17]/60 backdrop-blur-sm z-[9998] md:hidden"
          />

          <div className="fixed top-16 right-4 bottom-4 w-[82vw] max-w-[320px] bg-[#2B1E17]/95 backdrop-blur-md border border-[#E4572E] rounded-xl z-[9999] md:hidden p-3 overflow-y-auto flex flex-col">
            <button
              onClick={() => setIsOpen(false)}
              className="w-full text-left px-3 py-2 rounded-md text-[#E8D8C3] hover:bg-[#E4572E]/15 hover:text-[#FBF6EE] mb-2 font-semibold transition-colors"
            >
              ← Back
            </button>

            <div className="space-y-1">
              <Link
                to="/"
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2 rounded-md text-[#FBF6EE] hover:bg-[#E4572E]/15 font-semibold transition-colors"
              >
                Home
              </Link>
              <a
                href={PRATIYOGITA_SETU_URL}
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2 rounded-md text-[#E8D8C3] hover:bg-[#E4572E]/15 hover:text-[#FBF6EE] font-semibold transition-colors"
              >
                Pratiyogita Setu
              </a>
              <a
                href={`${PRATIYOGITA_YOGYA_URL}/check-eligibility`}
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2 rounded-md text-[#E8D8C3] hover:bg-[#E4572E]/15 hover:text-[#FBF6EE] font-semibold transition-colors"
              >
                Pratiyogita Yogya
              </a>
              <a
                href={`${PRATIYOGITA_MARG_URL}/explore`}
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2 rounded-md text-[#E8D8C3] hover:bg-[#E4572E]/15 hover:text-[#FBF6EE] font-semibold transition-colors"
              >
                Pratiyogita Marg
              </a>
              <a
                href={PRATIYOGITA_GYAN_URL}
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2 rounded-md text-[#E8D8C3] hover:bg-[#E4572E]/15 hover:text-[#FBF6EE] font-semibold transition-colors"
              >
                Pratiyogita Gyan
              </a>
              <Link
                to="/gyan-posters"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-[#E8D8C3] hover:bg-[#E4572E]/15 hover:text-[#FBF6EE] font-semibold transition-colors"
              >
                Gyan Posters
                <span className="bg-[#E4572E] text-[#FBF6EE] text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none animate-pulse">NEW</span>
              </Link>
              <Link
                to="/about"
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2 rounded-md text-[#E8D8C3] hover:bg-[#E4572E]/15 hover:text-[#FBF6EE] font-semibold transition-colors"
              >
                About Us
              </Link>
            </div>

            <div className="border-t border-[#E4572E]/40 mt-auto pt-3">
              <Link
                to="/login"
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2 text-[#E8D8C3] hover:bg-[#E4572E]/15 hover:text-[#FBF6EE] rounded-md text-center font-semibold transition-colors"
              >
                Log In
              </Link>
              <div className="pt-2">
                <Link
                  to="/register"
                  onClick={() => setIsOpen(false)}
                  className="block w-full bg-[#E4572E] text-[#FBF6EE] px-4 py-2 rounded-lg hover:bg-[#cf4a23] transition-colors text-center font-semibold"
                >
                  Try for Free
                </Link>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
};

export default Navbar;
