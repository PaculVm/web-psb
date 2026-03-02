import { BrowserRouter, Routes, Route } from "react-router-dom";

import MainLayout from "../layouts/MainLayout";
import LicenseError from "../pages/LicenseError";

import HomePage from "../pages/Public/HomePage";
import RegistrationPage from "../pages/Public/RegistrationPage";

import StudentLayout from "../pages/Student/StudentLayout";
import StudentLoginPage from "../pages/Student/StudentLoginPage";
import StudentDashboardPage from "../pages/Student/StudentDashboardPage";
import StudentBiodataPage from "../pages/Student/StudentBiodataPage";
import StudentDocumentsPage from "../pages/Student/StudentDocumentsPage";
import StudentPrintPage from "../pages/Student/StudentPrintPage";

import AdminLoginPage from "../pages/Admin/AdminLoginPage";
import AdminLayout from "../pages/Admin/AdminLayout";
import AdminDashboardPage from "../pages/Admin/AdminDashboardPage";
import AdminValidasiPage from "../pages/Admin/AdminValidasiPage";
import AdminDokumenPage from "../pages/Admin/AdminDokumenPage";
import AdminPendaftarPage from "../pages/Admin/AdminPendaftarPage";
import AdminPengumumanPage from "../pages/Admin/AdminPengumumanPage";
import AdminUsersPage from "../pages/Admin/AdminUsersPage";
import AdminSettingsPage from "../pages/Admin/AdminSettingsPage";

export default function AppRouter() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Routes>

        {/* PUBLIC */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/daftar" element={<RegistrationPage />} />
        </Route>

        {/* STUDENT */}
        <Route path="/siswa/login" element={<StudentLoginPage />} />

        <Route path="/siswa" element={<StudentLayout />}>
          <Route path="dashboard" element={<StudentDashboardPage />} />
          <Route path="biodata" element={<StudentBiodataPage />} />
          <Route path="dokumen" element={<StudentDocumentsPage />} />
          <Route path="cetak" element={<StudentPrintPage />} />
        </Route>

        {/* ADMIN */}
        <Route path="/admin/login" element={<AdminLoginPage />} />

        <Route path="/admin" element={<AdminLayout />}>
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="validasi" element={<AdminValidasiPage />} />
          <Route path="dokumen" element={<AdminDokumenPage />} />
          <Route path="pendaftar" element={<AdminPendaftarPage />} />
          <Route path="pengumuman" element={<AdminPengumumanPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="pengaturan" element={<AdminSettingsPage />} />
        </Route>

        <Route path="license-error" element={<LicenseError />} />
      </Routes>
    </BrowserRouter>
  );
}