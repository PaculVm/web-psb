import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useToast } from "@/context/ToastContext";
import api from "@/services/api";
import { motion } from "framer-motion";

export default function StudentLoginPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const nisn = String(formData.get("nisn") || "").trim();
    const tanggalLahir = String(formData.get("tanggal_lahir") || "").trim();

    if (!nisn || !tanggalLahir) {
      showToast({ 
        type: "error", 
        title: "Validasi Gagal", 
        description: "NISN dan tanggal lahir wajib diisi." 
      });
      return;
    }

    setIsLoading(true);

    try {
      // Tembak API Backend PHP
      const response = await api.post("/auth/siswa/login", {
        nisn: nisn,
        tanggal_lahir: tanggalLahir
      });

      const { token, user } = response.data;

      // Simpan kredensial ke localStorage
      localStorage.setItem("siswa_token", token);
      localStorage.setItem("siswa_data", JSON.stringify(user));

      showToast({ 
        type: "success", 
        title: "Login Berhasil", 
        description: `Selamat datang, ${user.nama_lengkap}.` 
      });
      
      // Arahkan ke dashboard siswa
      navigate("/siswa/dashboard"); 
      
    } catch (error) {
      showToast({ 
        type: "error", 
        title: "Login Gagal", 
        description: error.response?.data?.message || "Terjadi kesalahan pada server." 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-6 sm:py-10 bg-gray-50/50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm bg-white p-5 sm:p-6 rounded-3xl shadow-2xl border border-gray-100 relative overflow-hidden"
      >
        {/* Dekorasi Garis Atas */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-linear-to-r from-[#0e673b] to-[#f4c430]"></div>

        {/* Header */}
        <div className="text-center mb-5 sm:mb-6 mt-1">
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-[#0e673b]/10 text-[#0e673b] rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
            <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
            </svg>
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-gray-800">Login Calon Santri</h1>
          <p className="text-[11px] sm:text-xs text-gray-500 mt-1 sm:mt-1.5 leading-relaxed">
            Gunakan NISN dan Tanggal Lahir Anda.
          </p>
        </div>

        {/* Form Login */}
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div>
            <label className="block text-[11px] sm:text-xs font-semibold text-gray-700 mb-1">
              Nomor Induk Siswa Nasional (NISN) <span className="text-red-500">*</span>
            </label>
            <input
              name="nisn"
              type="text"
              placeholder="Masukkan 10 digit NISN"
              disabled={isLoading}
              className="w-full p-2.5 sm:p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#0e673b]/20 focus:border-[#0e673b] transition-all outline-none text-xs sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-[11px] sm:text-xs font-semibold text-gray-700 mb-1">
              Tanggal Lahir <span className="text-red-500">*</span>
            </label>
            <input
              name="tanggal_lahir"
              type="date"
              disabled={isLoading}
              className="w-full p-2.5 sm:p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#0e673b]/20 focus:border-[#0e673b] transition-all outline-none text-xs sm:text-sm text-gray-700 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 sm:py-3 bg-[#0e673b] hover:bg-[#0a4d2c] text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2 mt-1 sm:mt-2"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-[13px] sm:text-sm">Memeriksa Data...</span>
              </>
            ) : (
              <span className="text-[13px] sm:text-sm">Masuk Panel Santri</span>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div className="mt-5 sm:mt-6 text-center bg-yellow-50/50 p-2.5 sm:p-3 rounded-xl border border-yellow-100">
          <p className="text-[11px] sm:text-xs text-gray-600">
            Belum mendaftar?{" "}
            <Link to="/daftar" className="font-bold text-[#0e673b] hover:underline">
              Daftar Sekarang
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}