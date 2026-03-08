import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./Components/Navbar/navbar.jsx";
import Footer from "./Components/Footer/footer.jsx";
import HomePage from "./Pages/Home/HomePage.jsx";
import AboutUs from "./Pages/About/AboutUs.jsx";
import GyanPosters from "./Pages/GyanPosters/GyanPosters.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import "./App.css";

function App() {
  return (
    <ThemeProvider>
      <Router>
        {/* Grainy gradient background */}
        <div className="grainy-background-layer"></div>
        <svg xmlns="http://www.w3.org/2000/svg" style={{ display: 'none' }}>
          <filter id="grainy">
            <feTurbulence type="fractalNoise" baseFrequency=".537" numOctaves="4" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
            <feBlend in="SourceGraphic" mode="multiply" />
          </filter>
        </svg>

          <Navbar />
          <Routes>
            <Route
              path="/"
              element={
                <>
                  <HomePage />
                </>
              }
            />

            <Route
              path="/about"
              element={
                <>
                  <AboutUs />
                </>
              }
            />
            <Route
              path="/gyan-posters"
              element={
                <>
                  <GyanPosters />
                </>
              }
            />
            <Route
              path="/contact"
              element={
                <>
                  <div className="pt-24 pb-16 text-center">
                    Contact Us Coming Soon
                  </div>
                </>
              }
            />
            <Route
              path="/login"
              element={
                <>
                  <div className="pt-24 pb-16 text-center">
                    Login Coming Soon
                  </div>
                </>
              }
            />
            <Route
              path="/register"
              element={
                <>
                  <div className="pt-24 pb-16 text-center">
                    Register Coming Soon
                  </div>
                </>
              }
            />
          </Routes>
          <Footer />
        
      </Router>
    </ThemeProvider>
  );
}

export default App;