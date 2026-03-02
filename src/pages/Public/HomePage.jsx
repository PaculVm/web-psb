import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import api from "@/services/api";

export default function HomePage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get("/public/home")
      .then((res) => setData(res.data))
      .catch((err) => console.error("Gagal memuat data HomePage:", err));
  }, []);

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-10 w-10 text-[#0e673b]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-500 font-medium animate-pulse">Memuat halaman...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen w-full">

      {/* ================= HERO SECTION ================= */}
      <section
        className="relative h-screen flex items-center justify-center text-white text-center"
        style={{
          backgroundImage: `url(${data.hero_background})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-black/60"></div>
        <div className="relative z-10 px-6 max-w-4xl">
          <motion.h1
            initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
            className="text-4xl md:text-5xl font-bold uppercase leading-snug"
          >
            {data.hero_title}
          </motion.h1>
          <p className="mt-4 text-lg text-gray-200">
            {data.hero_subtitle}
          </p>
          <div className="mt-10 flex justify-center gap-4 flex-wrap">
            <Link to="/daftar" className="bg-[#f4c430] hover:bg-yellow-500 text-black font-bold px-8 py-3 rounded-full shadow-lg transition transform hover:-translate-y-1">
              Daftar Sekarang
            </Link>
            <Link to="/siswa/login" className="bg-white/10 backdrop-blur-sm border-2 border-white hover:bg-white hover:text-[#0e673b] px-8 py-3 rounded-full font-bold transition transform hover:-translate-y-1">
              Login Calon Santri
            </Link>
          </div>
        </div>
      </section>

      {/* ================= ALUR SECTION ================= */}
      <section className="bg-white py-20 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-[#0e673b]">{data.section_titles.alur}</h2>
            <div className="w-24 h-1 bg-[#f4c430] mx-auto mt-4 rounded-full"></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            {data.steps.map((step, i) => (
              <motion.div key={step.id} whileHover={{ y: -8 }} className="bg-gray-50 p-8 rounded-2xl border border-gray-100 shadow-sm text-center">
                <div className="w-14 h-14 bg-[#0e673b] text-white flex items-center justify-center rounded-full mx-auto mb-4 font-bold text-xl shadow-md">
                  {i + 1}
                </div>
                <h3 className="font-semibold text-gray-800">{step.title}</h3>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= PERSYARATAN SECTION ================= */}
      <section className="py-20 bg-[#0e673b] relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-white">{data.section_titles.persyaratan}</h2>
            <div className="w-24 h-1 bg-[#f4c430] mx-auto mt-4 rounded-full"></div>
          </div>
          <div className="grid md:grid-cols-2 gap-10">
            {/* Dokumen */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border-l-[6px] border-[#0e673b]">
              <h3 className="font-bold text-xl mb-6 text-[#0e673b] flex items-center gap-2">
                <span>📄</span> Dokumen Fisik
              </h3>
              <ul className="space-y-4">
                {data.requirements.filter((item) => item.type === "dokumen").map((item) => (
                  <li key={item.id} className="flex gap-3 text-gray-700">
                    <span className="text-green-600 font-bold">✓</span> {item.content}
                  </li>
                ))}
              </ul>
            </div>
            {/* Ketentuan */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border-l-[6px] border-[#f4c430]">
              <h3 className="font-bold text-xl mb-6 text-yellow-600 flex items-center gap-2">
                <span>📌</span> Ketentuan Umum
              </h3>
              <ul className="space-y-4">
                {data.requirements.filter((item) => item.type === "ketentuan").map((item) => (
                  <li key={item.id} className="flex gap-3 text-gray-700">
                    <span className="text-[#f4c430] font-bold">✓</span> {item.content}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ================= INFORMASI SECTION (Bg Putih) ================= */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            {data.informations.map((info) => (
              <div key={info.id} className="bg-slate-50 p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition text-center md:text-left">
                <div className="text-4xl mb-4 bg-white w-16 h-16 flex items-center justify-center rounded-xl shadow-sm mx-auto md:mx-0">
                  {info.icon}
                </div>
                <h3 className="font-bold text-lg text-gray-800 mb-2">{info.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{info.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}