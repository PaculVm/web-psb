import { useEffect, useState } from "react";
import { Outlet, useLocation, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import FloatingWA from "../components/FloatingWA.jsx";
import api from "@/services/api";

export default function MainLayout() {
  const location = useLocation();
  
  // Deteksi apakah saat ini sedang berada di halaman pendaftaran
  const isPendaftaran = location.pathname === "/daftar";

  // State dengan nilai default (fallback jika API gagal/loading)
  const [footerData, setFooterData] = useState({
    about: "Sistem Penerimaan Santri Baru berbasis digital yang modern, transparan dan profesional.",
    contact: {
      address: "Cilongok, Banyumas",
      phone: "0812-3456-7890",
      email: "info@madarussalam.sch.id"
    },
    copyright: `© ${new Date().getFullYear()} PP Darussalam Panusupan`
  });

  useEffect(() => {
    // Ambil data dinamis dari database
    api.get("/public/home")
      .then((res) => {
        if (res.data) {
          setFooterData({
            about: res.data.footer?.about || footerData.about,
            contact: res.data.contact || footerData.contact,
            copyright: res.data.footer?.copyright || footerData.copyright
          });
        }
      })
      .catch((err) => console.error("Gagal memuat data footer:", err));
  }, []);

  return (
    // Tambahkan flex dan min-h-screen agar layout penuh dan footer turun ke bawah
    <div className="relative font-sans bg-gray-50 text-gray-800 flex flex-col min-h-screen overflow-x-hidden">

      {/* Global Texture */}
      <div className="absolute inset-0 opacity-5 bg-[url('/pattern.png')] bg-repeat pointer-events-none"></div>

      <Navbar />

      {/* flex-grow akan mendorong footer ke area paling bawah jika konten utama pendek */}
      <main className="grow pt-20 relative z-10 flex flex-col">
        <Outlet />
      </main>

      {/* Floating WA (Logika disembunyikan di /daftar sudah ada di dalam komponennya sendiri) */}
      <FloatingWA />

      {/* Tampilkan Footer HANYA jika bukan di halaman pendaftaran */}
      {!isPendaftaran && (
        <footer className="bg-[#0f3f26] text-white mt-auto relative z-20">
          <div className="max-w-7xl mx-auto px-6 py-14 grid md:grid-cols-3 gap-10">
            <div>
              <h2 className="text-xl font-bold mb-3 text-[#f4c430]">PSB Darussalam Panusupan</h2>
              <p className="text-sm text-green-100/80 leading-relaxed">
                {footerData.about}
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-4 text-white">Informasi Kontak</h3>
              <ul className="space-y-3 text-sm text-green-100/80">
                <li className="flex items-start gap-3">
                  <span className="text-[#f4c430]">📍</span> 
                  <span>{footerData.contact.address}</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-[#f4c430]">📞</span> 
                  <span>{footerData.contact.phone}</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-[#f4c430]">✉️</span> 
                  <span>{footerData.contact.email}</span>
                </li>
              </ul>
            </div>

            <div className="flex flex-col justify-center items-start md:items-end">
              <Link
                to="/daftar"
                className="inline-block bg-[#f4c430] text-[#0f3f26] px-8 py-3.5 rounded-xl text-sm font-bold hover:bg-yellow-500 transition-all text-center shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                Daftar Sekarang
              </Link>
            </div>
          </div>

          <div className="border-t border-green-800/50 text-center py-5 text-xs text-green-300/60 font-medium tracking-wide">
            {footerData.copyright}
          </div>
        </footer>
      )}
    </div>
  );
}