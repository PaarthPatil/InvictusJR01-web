import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";
import ProtectedRoute from "./ProtectedRoute";
import LoginPage from "../pages/LoginPage";
import DashboardPage from "../pages/DashboardPage";
import ComponentsPage from "../pages/ComponentsPage";
import AddComponentPage from "../pages/AddComponentPage";
import PcbsPage from "../pages/PcbsPage";
import CreatePcbPage from "../pages/CreatePcbPage";
import ProductionPage from "../pages/ProductionPage";
import AnalyticsPage from "../pages/AnalyticsPage";
import ImportExportPage from "../pages/ImportExportPage";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/components" element={<ComponentsPage />} />
          <Route path="/components/add" element={<AddComponentPage />} />
          <Route path="/pcbs" element={<PcbsPage />} />
          <Route path="/pcbs/create" element={<CreatePcbPage />} />
          <Route path="/production" element={<ProductionPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/import-export" element={<ImportExportPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default AppRoutes;
