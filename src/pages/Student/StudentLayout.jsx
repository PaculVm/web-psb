import { useState, useEffect } from "react";
import { NavLink, Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/context/ToastContext";
import { useModal } from "@/context/ModalContext";
import { motion, AnimatePresence } from "framer-motion";
import { useIdleTimeout } from "@/hooks/useIdleTimeout";

// Daftar Menu Navigasi
const navItems = [
  { 
    to: "/siswa/dashboard", 
    label: "Dashboard",
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  },
  { 
    to: "/siswa/biodata", 
    label: "Biodata Santri",
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  },
  { 
    to: "/siswa/dokumen", 
    label: "Unggah Dokumen",
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  },
  { 
    to: "/siswa/cetak", 
    label: "Cetak Dokumen",
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
  },
];

export default function StudentLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  
  // 2. Panggil hook useModal
  const { openModal } = useModal(); 
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  const handleIdle = () => {
    localStorage.removeItem("siswa_token");
    localStorage.removeItem("siswa_data");
    showToast({ 
      type: "error", 
      title: "Sesi Berakhir", 
      description: "Sesi Anda berakhir karena tidak aktif selama 10 menit. Silakan login kembali." 
    });
    navigate("/siswa/login");
  };

  useIdleTimeout(handleIdle, 600000);

  // 3. Ubah fungsi handleLogout untuk memanggil Modal Konfirmasi
  const handleLogout = () => {
    openModal({
      title: "Konfirmasi Keluar",
      content: "Apakah Anda yakin ingin keluar dari panel santri? Anda harus login kembali menggunakan NISN dan Tanggal Lahir untuk mengakses panel ini.",
      confirmText: "Ya, Keluar Akun",
      cancelText: "Batal",
      isDanger: true, // Membuat tombol berwarna merah
      onConfirm: () => {
        localStorage.removeItem("siswa_token");
        localStorage.removeItem("siswa_data");
        showToast({ type: "success", title: "Berhasil Keluar", description: "Anda telah keluar dari sistem." });
        navigate("/");
      }
    });
  };

  // Komponen Isi Sidebar (Agar bisa dipakai ulang untuk Desktop Statis & Mobile Drawer)
  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white p-5">
      <div className="space-y-1 px-2 mb-6">
        <div className="text-xs font-bold uppercase tracking-widest text-[#f4c430]">Panel Santri</div>
        <div className="text-sm font-semibold text-gray-800">Informasi Data Pendaftaran</div>
      </div>

      <nav className="space-y-2 grow overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              [
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-[#0e673b] text-white shadow-md"
                  : "text-gray-600 hover:bg-teal-50 hover:text-[#0e673b]",
              ].join(" ")
            }
          >
            <svg className="w-5 h-5 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {item.icon}
            </svg>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="pt-4 mt-4 border-t border-gray-100 space-y-3 shrink-0">
        {/* Tombol Keluar ini hanya muncul di mode Sidebar Overlay (Mobile/Tablet) */}
        <button 
          onClick={handleLogout}
          className="lg:hidden w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors text-left"
        >
          <svg className="w-5 h-5 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Keluar Akun
        </button>
        
        <Link to="/" className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-xs font-medium text-gray-500 hover:text-[#0e673b] hover:bg-gray-50 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Kembali ke Web
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      
      {/* ================= NAVBAR DASHBOARD ================= */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* KIRI: Hamburger (Tablet/md) + Logo */}
          <div className="flex items-center gap-3">
            {/* Hamburger Kiri: Muncul saat Tablet (md), Sembunyi saat Mobile (<sm) atau Desktop (lg) */}
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="hidden md:block lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#0e673b] text-white rounded-lg flex items-center justify-center font-bold text-lg shadow-sm">
                S
              </div>
              <div className="hidden sm:block">
                <h1 className="text-sm font-bold text-gray-800 leading-tight">Panel Santri</h1>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">SPMB Digital</p>
              </div>
            </div>
          </div>

          {/* KANAN: Link, Logout, Hamburger (Mobile) */}
          <div className="flex items-center gap-2 sm:gap-4">
            
            {/* Link & Logout hanya muncul di Desktop & Tablet (Sembunyi di Mobile/md kebawah) */}
            <button 
              onClick={handleLogout}
              className="hidden md:flex items-center gap-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg transition-colors"
            >
              Keluar
            </button>

            {/* Hamburger Kanan: Hanya muncul saat Mobile (<md), digantikan Logout saat layar membesar */}
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="block md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

        </div>
      </header>

      {/* ================= DRAWER OVERLAY (MOBILE & TABLET) ================= */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            {/* Backdrop Gelap */}
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/50 z-50 lg:hidden"
            />
            {/* Panel Drawer dari Kiri */}
            <motion.div 
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="fixed inset-y-0 left-0 w-[260px] bg-white shadow-2xl z-50 lg:hidden flex flex-col"
            >
              <div className="flex justify-end p-4 pb-0">
                <button onClick={() => setIsSidebarOpen(false)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <SidebarContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ================= MAIN WRAPPER ================= */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 flex items-start gap-8">
        
        {/* ================= SIDEBAR DESKTOP (Statis) ================= */}
        <aside className="hidden lg:block w-[260px] shrink-0 sticky top-24 h-[calc(100vh-8rem)] rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <SidebarContent />
        </aside>

        {/* ================= KONTEN UTAMA ================= */}
        <section className="flex-1 w-full min-w-0">
          <Outlet />
        </section>

      </div>
    </div>
  );
}