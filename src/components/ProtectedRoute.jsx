import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoute({ allowedRole }) {
  // Ambil token berdasarkan role yang diizinkan untuk mengakses rute tersebut
  const token = 
    allowedRole === "siswa" 
      ? localStorage.getItem("siswa_token") 
      : localStorage.getItem("admin_token");

  // Jika token tidak ada, arahkan paksa ke halaman login masing-masing
  if (!token) {
    if (allowedRole === "siswa") {
      return <Navigate to="/siswa/login" replace />;
    }
    if (allowedRole === "admin") {
      return <Navigate to="/admin/login" replace />;
    }
  }

  // Jika token ada, izinkan render komponen di dalamnya (Outlet)
  return <Outlet />;
}