import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "@/services/api";

export default function Navbar() {
  // State untuk menyimpan data dinamis dari database
  const [navData, setNavData] = useState({
    text: "PSB Online",
    logo: "/logo.png" // Fallback ke logo lokal Anda jika admin belum upload
  });

  useEffect(() => {
    // Ambil data pengaturan dari API saat komponen dimuat
    const fetchNavData = async () => {
      try {
        const res = await api.get("/public/home");
        if (res.data?.navbar) {
          setNavData({
            text: res.data.navbar.text || "PSB Online",
            logo: res.data.navbar.logo || "/logo.png"
          });
        }
      } catch (error) {
        console.error("Gagal memuat pengaturan Navbar:", error);
      }
    };

    fetchNavData();
  }, []);

  return (
    <nav className="fixed w-full z-50 backdrop-blur-md bg-[#145A32]/90 shadow-lg">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">

        <Link to="/" className="flex items-center gap-3">
          {/* Logo Dinamis */}
          <img 
            src={navData.logo} 
            alt="Logo" 
            className="w-10 h-10 object-contain bg-white/10 rounded-full p-0.5" 
          />
          <div>
            {/* Teks Judul Dinamis */}
            <h1 className="text-lg font-bold text-white tracking-wide">
              {navData.text}
            </h1>
            {/* Sub-judul Statis bawaan Anda */}
            <p className="text-xs text-green-200">
              PP Darussalam Panusupan
            </p>
          </div>
        </Link>

        {/* Tombol bawaan Anda */}
        <Link
          to="/admin/login"
          className="bg-yellow-400 hover:bg-yellow-500 text-black px-5 py-2 rounded-lg text-sm font-semibold transition shadow"
        >
          Admin Panel
        </Link>
      </div>
    </nav>
  );
}