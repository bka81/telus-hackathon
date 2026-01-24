import "./App.css";
import { Routes, Route, Navigate } from "react-router-dom";

import Welcome from "./pages/Welcome";
import Breakdown from "./pages/Breakdown";
import Focus from "./pages/Focus";
import Reflect from "./pages/Reflect";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Welcome />} />
      <Route path="/breakdown" element={<Breakdown />} />
      <Route path="/focus" element={<Focus />} />
      <Route path="/reflect" element={<Reflect />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}