
import "./App.css";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import MindMapEditor from "./pages/MindMapEditor";
import MindMapViewer from "./pages/MindMapViewer";
import ExamCatalog from "./pages/ExamCatalog";
import AboutUs from "./pages/AboutUs";
import { Toaster } from "@/components/ui/sonner";

/** Grainy background — only rendered on non-mindmap pages */
const GrainyBackground = () => {
  const location = useLocation();
  const isMindMapPage = location.pathname === "/editor";

  if (isMindMapPage) return null;

  return (
    <>
      <div className="animated-background"></div>
      <svg xmlns="http://www.w3.org/2000/svg" style={{ display: 'none' }}>
        <filter id="grainy">
          <feTurbulence type="fractalNoise" baseFrequency=".537" numOctaves="4" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
          <feBlend in="SourceGraphic" mode="multiply" />
        </filter>
      </svg>
    </>
  );
};

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <GrainyBackground />
      <Routes>
        <Route path="/" element={<Navigate to="/explore" replace />} />
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="/signup" element={<Navigate to="/" replace />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/editor" element={<MindMapEditor />} />
        <Route path="/explore" element={<ExamCatalog />} />
        <Route path="/view" element={<MindMapViewer />} />
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App;

