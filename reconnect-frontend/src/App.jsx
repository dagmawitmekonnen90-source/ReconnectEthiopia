import { Routes, Route } from "react-router-dom";

import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import MissingPersons from "./pages/MissingPersons";
import MissingPersonDetails from "./pages/MissingPersonDetails";
import ReportMissing from "./pages/ReportMissing";
import ReportSighting from "./pages/ReportSighting";

import AdminDashboard from "./pages/AdminDashboard";
import AdminMissingPersons from "./pages/AdminMissingPersons";
import AdminSightings from "./pages/AdminSightings";
import AdminUsers from "./pages/AdminUsers";
import AdminCaseEvents from "./pages/AdminCaseEvents";
import AdminAccounts from "./pages/AdminAccounts";
import AdminInstitutions from "./pages/AdminInstitutions";

import InstitutionRegister from "./pages/InstitutionRegister";
import InstitutionDashboard from "./pages/InstitutionDashboard";

import AdminRoute from "./components/AdminRoute";
import ProtectedRoute from "./components/ProtectedRoute";

import "./App.css";

function App() {
  return (
    <Routes>

      {/* ================= PUBLIC PAGES ================= */}

      <Route
        path="/"
        element={<LandingPage />}
      />

      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/register"
        element={<Register />}
      />

      {/* Explore Missing Persons — public */}
      <Route
        path="/missing-persons"
        element={<MissingPersons />}
      />

      {/* Individual Missing Person Details — public */}
      <Route
        path="/missing-persons/:id"
        element={<MissingPersonDetails />}
      />

      {/* Dashboard requires login */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* Report Missing requires login */}
      <Route
        path="/report-missing"
        element={
          <ProtectedRoute>
            <ReportMissing />
          </ProtectedRoute>
        }
      />

      {/* Report Sighting requires login */}
      <Route
        path="/report-sighting"
        element={
          <ProtectedRoute>
            <ReportSighting />
          </ProtectedRoute>
        }
      />

      {/* Institution pages — login required */}
      <Route
        path="/institutions/register"
        element={
          <ProtectedRoute>
            <InstitutionRegister />
          </ProtectedRoute>
        }
      />

      <Route
        path="/institutions/dashboard"
        element={
          <ProtectedRoute>
            <InstitutionDashboard />
          </ProtectedRoute>
        }
      />


      {/* ================= ADMIN PAGES ================= */}

      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        }
      />

      <Route
        path="/admin/missing-persons"
        element={
          <AdminRoute>
            <AdminMissingPersons />
          </AdminRoute>
        }
      />

      <Route
        path="/admin/sightings"
        element={
          <AdminRoute>
            <AdminSightings />
          </AdminRoute>
        }
      />

      <Route
        path="/admin/users"
        element={
          <AdminRoute>
            <AdminUsers />
          </AdminRoute>
        }
      />

      <Route
        path="/admin/case-events"
        element={
          <AdminRoute>
            <AdminCaseEvents />
          </AdminRoute>
        }
      />

      <Route
        path="/admin/accounts"
        element={
          <AdminRoute>
            <AdminAccounts />
          </AdminRoute>
        }
      />

      <Route
        path="/admin/institutions"
        element={
          <AdminRoute>
            <AdminInstitutions />
          </AdminRoute>
        }
      />

      {/* ================= INSTITUTION PAGES ================= */}

      <Route
        path="/institutions/register"
        element={
          <ProtectedRoute>
            <InstitutionRegister />
          </ProtectedRoute>
        }
      />

      <Route
        path="/institutions/dashboard"
        element={
          <ProtectedRoute>
            <InstitutionDashboard />
          </ProtectedRoute>
        }
      />

    </Routes>
  );
}

export default App;