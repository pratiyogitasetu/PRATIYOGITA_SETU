import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Menu, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const Navbar = () => {
  const { currentUser, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

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
      <div className="fixed top-3 left-1/2 -translate-x-1/2 w-[96%] md:w-[94%] lg:w-[92%] xl:w-[88%] z-50">
        <nav
          className={`w-full px-3 sm:px-4 md:px-5 py-1.5 rounded-2xl transition-all duration-150 flex items-center ${isScrolled
              ? "backdrop-blur-lg bg-white/90 border border-[#0B0A08]/10 shadow-sm"
              : "bg-white/70 border border-[#0B0A08]/6"
            }`}
        >
          <div className={`w-full flex items-center relative transition-all duration-200 ${isScrolled ? "h-8 sm:h-10" : "h-10 sm:h-12"
            }`}>
            {/* Logo */}
            <Link to="/" className="flex items-center flex-shrink-0">
              <img
                src="./logos/py.png"
                alt="Pratiyogita Yogya Logo"
                className={`w-auto object-contain transition-all duration-200 ${isScrolled ? "h-8 sm:h-10" : "h-10 sm:h-12"
                  }`}
              />
            </Link>

            {/* Center - Desktop Menu */}
            <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center">
              <div className="flex items-center space-x-2 lg:space-x-3 xl:space-x-4 whitespace-nowrap">
                <a href="/" className="text-[#0B0A08] hover:text-[#E4572E] font-semibold text-[11px] lg:text-xs xl:text-sm transition-colors">
                  Home
                </a>
                <a href="/about" className="text-[#0B0A08]/80 hover:text-[#E4572E] font-semibold text-[11px] lg:text-xs xl:text-sm transition-colors">
                  About Us
                </a>
                <a href="/contact" className="text-[#0B0A08]/80 hover:text-[#E4572E] font-semibold text-[11px] lg:text-xs xl:text-sm transition-colors">
                  Contact Us
                </a>
              </div>
            </div>

            {/* Right - Auth Links */}
            <div className="hidden md:flex items-center ml-auto flex-shrink-0 gap-3">
              {currentUser ? (
                <>
                  <Link to="/profile" className="flex items-center gap-2 group" title="Go to Profile">
                    <div className="w-8 h-8 rounded-full bg-[#E4572E] text-white flex items-center justify-center font-bold text-sm shadow-[0_0_8px_rgba(228,87,46,0.3)]">
                      {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : currentUser.email.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-[#0B0A08] group-hover:text-[#E4572E] font-semibold text-xs xl:text-sm transition-colors">
                      {currentUser.displayName || currentUser.email.split('@')[0]}
                    </span>
                  </Link>
                  <button
                    onClick={() => logout()}
                    className="px-3 py-1.5 rounded-lg bg-[#E4572E]/10 text-[#E4572E] border border-[#E4572E]/40 hover:bg-[#E4572E] hover:text-white font-semibold text-xs xl:text-sm transition-all"
                  >
                    Log Out
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-[#0B0A08] hover:text-[#E4572E] font-semibold text-xs xl:text-sm transition-colors">
                    Log In
                  </Link>
                  <Link
                    to="/signup"
                    className="px-3 py-1.5 rounded-lg bg-[#E4572E] text-white hover:bg-[#c9421e] font-semibold text-xs xl:text-sm transition-all shadow-[0_0_10px_rgba(228,87,46,0.3)]"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>

            <div className="flex items-center gap-2 ml-auto md:hidden">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="text-[#0B0A08] hover:text-[#E4572E] p-2 focus:outline-none transition-colors"
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
              className="fixed inset-0 bg-black/20 z-[9998] md:hidden"
            />

            <div className="fixed top-14 right-3 w-56 bg-white border border-[#0B0A08]/10 rounded-xl z-[9999] md:hidden p-2 shadow-xl">
              <div className="space-y-0.5">
                <a href="/" onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-lg text-[#0B0A08] hover:bg-[#E4572E]/10 hover:text-[#E4572E] text-sm font-semibold transition-colors">Home</a>
                <a href="/about" onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-lg text-[#0B0A08]/80 hover:bg-[#E4572E]/10 hover:text-[#E4572E] text-sm font-semibold transition-colors">About Us</a>
                <a href="/contact" onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-lg text-[#0B0A08]/80 hover:bg-[#E4572E]/10 hover:text-[#E4572E] text-sm font-semibold transition-colors">Contact Us</a>

                <div className="my-2 border-t border-[#0B0A08]/10" />

                {currentUser ? (
                  <>
                    <Link to="/profile" onClick={() => setIsOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-lg text-[#E4572E] hover:bg-[#E4572E]/10 text-sm font-semibold transition-colors">
                      <div className="w-6 h-6 rounded-full bg-[#E4572E]/15 border border-[#E4572E] text-[#E4572E] flex items-center justify-center font-bold text-xs">
                        {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : currentUser.email.charAt(0).toUpperCase()}
                      </div>
                      <span>{currentUser.displayName || currentUser.email.split('@')[0]}</span>
                    </Link>
                    <button onClick={() => { logout(); setIsOpen(false); }} className="w-full text-left block px-3 py-2 rounded-lg text-[#E4572E] hover:bg-[#E4572E]/10 text-sm font-semibold transition-colors">Log Out</button>
                  </>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-lg text-[#0B0A08] hover:bg-[#E4572E]/10 hover:text-[#E4572E] text-sm font-semibold transition-colors">Log In</Link>
                    <Link to="/signup" onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-lg text-[#E4572E] hover:bg-[#E4572E]/10 text-sm font-semibold transition-colors">Sign Up</Link>
                  </>
                )}
              </div>
            </div>
          </>,
          document.body
        )}
    </>
  );
};

export default Navbar;
