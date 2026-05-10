import { Navigate, Route, Routes } from "react-router-dom";

import CalculatorPage from "@/features/calculator/CalculatorPage";
import ReportPage from "@/features/reports/ReportPage";

export default function App() {
  return (
    <div className="min-h-screen">
      <Routes>
        <Route path="/" element={<CalculatorPage />} />
        <Route path="/reports/:id" element={<ReportPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
