import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import api from "@/services/api";
import { useToast } from "@/context/ToastContext";
import { useModal } from "@/context/ModalContext";

export default function AdminSettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(null);

  const { showToast } = useToast();
  const { openModal } = useModal();

  // State Terpisah untuk masing-masing kelompok data
  const [settings, setSettings] = useState({
    navbar_text: "", navbar_logo: "",
    hero_title: "", hero_subtitle: "", hero_background: "",
    title_alur: "", title_persyaratan: "",
    footer_about: "", footer_copyright: "",
    contact_address: "", contact_phone: "", contact_email: "", contact_wa: ""
  });
  
  const [alur, setAlur] = useState([]);
  const [persyaratan, setPersyaratan] = useState([]);
  const [informasi, setInformasi] = useState([]);

  // Load Data dari API Publik (Home)
  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const res = await api.get("/public/home");
        const data = res.data;
        
        setSettings({
          navbar_text: data.navbar?.text || "",
          navbar_logo: data.navbar?.logo || "",
          hero_title: data.hero_title || "",
          hero_subtitle: data.hero_subtitle || "",
          hero_background: data.hero_background || "",
          title_alur: data.section_titles?.alur || "",
          title_persyaratan: data.section_titles?.persyaratan || "",
          footer_about: data.footer?.about || "",
          footer_copyright: data.footer?.copyright || "",
          contact_address: data.contact?.address || "",
          contact_phone: data.contact?.phone || "",
          contact_email: data.contact?.email || "",
          contact_wa: data.contact?.whatsapp || "",
        });

        setAlur(data.steps || []);
        setPersyaratan(data.requirements || []);
        setInformasi(data.informations || []);
        
      } catch (error) {
        showToast({ type: "error", title: "Error", description: "Gagal memuat pengaturan web." });
      } finally {
        setIsLoading(false);
      }
    };

    fetchHomeData();
  }, [showToast]);

  // Handler General Input
  const handleSettingChange = (e) => {
    setSettings({ ...settings, [e.target.name]: e.target.value });
  };
  
    // Fungsi Upload Gambar Publik
    const handleImageUpload = async (e, fieldName) => {
      const file = e.target.files[0];
      if (!file) return;
  
      if (file.size > 2 * 1024 * 1024) {
        showToast({ type: "error", title: "Ukuran Terlalu Besar", description: "Maksimal ukuran gambar adalah 2MB." });
        return;
      }
  
      setUploadingImage(fieldName);
      const formData = new FormData();
      formData.append("image", file);
  
      try {
        const res = await api.post("/admin/upload-image", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        // Set URL gambar yang baru di-upload ke state pengaturan
        setSettings(prev => ({ ...prev, [fieldName]: res.data.url }));
        showToast({ type: "success", title: "Berhasil", description: "Gambar berhasil diunggah dan diterapkan." });
      } catch (error) {
        showToast({ type: "error", title: "Gagal", description: error.response?.data?.message || "Gagal mengunggah gambar." });
      } finally {
        setUploadingImage(null);
        e.target.value = ""; // Reset input
      }
    };
  
    // Handler Array
  const handleArrayChange = (setter, index, field, value) => {
    setter(prev => {
      const newArray = [...prev];
      newArray[index] = { ...newArray[index], [field]: value };
      return newArray;
    });
  };

  const removeArrayItem = (setter, index) =>
    setter(prev => prev.filter((_, i) => i !== index)
  );

  const addArrayItem = (setter, emptyItem) =>
    setter(prev => [...prev, emptyItem]
  );

  // Fungsi Simpan
  const handleSave = () => {
    openModal({
      title: "Konfirmasi Simpan",
      content: "Apakah Anda yakin ingin memperbarui seluruh tampilan halaman depan web?",
      confirmText: "Ya, Terapkan Sekarang",
      onConfirm: async () => {
        setIsSaving(true);
        try {
          await api.put("/admin/settings", { settings, alur, persyaratan, informasi });
          showToast({ type: "success", title: "Berhasil", description: "Pengaturan halaman depan berhasil diterapkan." });
        } catch (error) {
          showToast({ type: "error", title: "Gagal", description: "Terjadi kesalahan saat menyimpan pengaturan." });
        } finally {
          setIsSaving(false);
        }
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <svg className="animate-spin h-8 w-8 text-slate-500 mb-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
        <p className="text-sm text-slate-500 font-medium">Memuat pengaturan website...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      
      {/* HEADER PAGE */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-lg sm:text-xl font-bold text-slate-800 border-l-4 sm:border-l-[5px] border-teal-500 pl-3">
            Pengaturan Website
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1 sm:mt-1.5 ml-4">
            Sesuaikan visual, teks, dan informasi pada halaman publik.
          </p>
        </motion.div>

        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="w-full sm:w-auto px-4 py-2.5 sm:px-5 sm:py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs sm:text-sm rounded-lg sm:rounded-xl transition shadow-lg shadow-teal-500/30 flex justify-center items-center gap-2 disabled:opacity-50"
        >
          {isSaving ? "Menyimpan..." : (
            <>
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
              Simpan Perubahan
            </>
          )}
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
              
        {/* ================= BAGIAN 1: NAVBAR & HERO ================= */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 sm:space-y-5">
          <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="font-bold text-sm sm:text-base text-slate-800 mb-4 pb-2 sm:pb-3 border-b flex items-center gap-1.5 sm:gap-2">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              Navigasi & Hero Section
            </h2>
            <div className="space-y-4 sm:space-y-5">
              
              {/* Pengaturan Navbar */}
              <div className="bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-100 space-y-3 sm:space-y-4">
                <p className="text-[10px] sm:text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Identitas Navbar</p>
                <div>
                  <label className="text-[10px] sm:text-[11px] font-bold text-slate-500 mb-1 block uppercase tracking-wider">Teks Brand / Judul</label>
                  <input type="text" name="navbar_text" value={settings.navbar_text} onChange={handleSettingChange} className="w-full p-2 sm:p-2.5 border rounded-lg sm:rounded-xl bg-white focus:ring-2 focus:ring-teal-500 outline-none text-xs sm:text-sm" />
                </div>
                <div>
                  <label className="text-[10px] sm:text-[11px] font-bold text-slate-500 mb-1 block uppercase tracking-wider">Logo Brand (Opsional)</label>
                  <div className="flex gap-2 sm:gap-3 items-center">
                    {settings.navbar_logo && (
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-md sm:rounded-lg bg-white border shrink-0 flex items-center justify-center p-1 overflow-hidden">
                        <img src={settings.navbar_logo} alt="Logo" className="w-full h-full object-contain" />
                      </div>
                    )}
                    <input type="text" name="navbar_logo" value={settings.navbar_logo} onChange={handleSettingChange} placeholder="URL Logo atau Upload File" className="w-full p-2 sm:p-2.5 border rounded-lg sm:rounded-xl bg-white focus:ring-2 focus:ring-teal-500 outline-none text-xs sm:text-[13px] font-mono" />
                    <label className="shrink-0 px-3 py-2 sm:px-4 sm:py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold cursor-pointer transition">
                      {uploadingImage === 'navbar_logo' ? 'Loading...' : 'Upload'}
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'navbar_logo')} disabled={!!uploadingImage} />
                    </label>
                  </div>
                </div>
              </div>

              {/* Pengaturan Hero */}
              <div className="bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-100 space-y-3 sm:space-y-4">
                <p className="text-[10px] sm:text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Hero Section (Layar Utama)</p>
                <div><label className="text-[10px] sm:text-[11px] font-bold text-slate-500 mb-1 block uppercase tracking-wider">Teks Judul Utama</label><input type="text" name="hero_title" value={settings.hero_title} onChange={handleSettingChange} className="w-full p-2 sm:p-2.5 border rounded-lg sm:rounded-xl bg-white focus:ring-2 focus:ring-teal-500 outline-none text-xs sm:text-sm" /></div>
                <div><label className="text-[10px] sm:text-[11px] font-bold text-slate-500 mb-1 block uppercase tracking-wider">Teks Sub-Judul</label><textarea name="hero_subtitle" rows="2" value={settings.hero_subtitle} onChange={handleSettingChange} className="w-full p-2 sm:p-2.5 border rounded-lg sm:rounded-xl bg-white focus:ring-2 focus:ring-teal-500 outline-none text-xs sm:text-sm resize-none" /></div>
                
                {/* Upload Gambar Background */}
                <div>
                  <label className="text-[10px] sm:text-[11px] font-bold text-slate-500 mb-1 block uppercase tracking-wider">Gambar Background (Hero)</label>
                  <div className="flex gap-2 sm:gap-3 items-center">
                    {settings.hero_background && (
                      <div className="w-12 h-8 sm:w-14 sm:h-9 rounded-md sm:rounded-lg bg-slate-200 shrink-0 overflow-hidden border">
                        <img src={settings.hero_background} alt="Hero BG" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <input type="text" name="hero_background" value={settings.hero_background} onChange={handleSettingChange} placeholder="URL Background" className="w-full p-2 sm:p-2.5 border rounded-lg sm:rounded-xl bg-white focus:ring-2 focus:ring-teal-500 outline-none text-xs sm:text-[13px] font-mono" />
                    <label className="shrink-0 px-3 py-2 sm:px-4 sm:py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold cursor-pointer transition">
                      {uploadingImage === 'hero_background' ? 'Loading...' : 'Upload'}
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'hero_background')} disabled={!!uploadingImage} />
                    </label>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 mt-2">
                <label className="text-[10px] sm:text-[11px] font-bold text-slate-500 mb-1 block uppercase tracking-wider mt-2">Judul Section: Alur Pendaftaran</label><input type="text" name="title_alur" value={settings.title_alur} onChange={handleSettingChange} className="w-full p-2 sm:p-2.5 border rounded-lg sm:rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none text-xs sm:text-sm" />
              </div>
              <div>
                <label className="text-[10px] sm:text-[11px] font-bold text-slate-500 mb-1 block uppercase tracking-wider">Judul Section: Persyaratan</label><input type="text" name="title_persyaratan" value={settings.title_persyaratan} onChange={handleSettingChange} className="w-full p-2 sm:p-2.5 border rounded-lg sm:rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none text-xs sm:text-sm" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* ================= BAGIAN 2: FOOTER & KONTAK WA ================= */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-4 sm:space-y-6">
          <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="font-bold text-sm sm:text-base text-slate-800 mb-4 pb-2 sm:pb-3 border-b flex items-center gap-1.5 sm:gap-2">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              Kontak & Footer
            </h2>
            <div className="space-y-3 sm:space-y-4">
              <div><label className="text-[10px] sm:text-[11px] font-bold text-slate-500 mb-1 block uppercase tracking-wider">Nomor WhatsApp (Admin)</label><input type="text" name="contact_wa" value={settings.contact_wa} onChange={handleSettingChange} placeholder="Contoh: 6281234567890" className="w-full p-2.5 border rounded-lg sm:rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none text-xs sm:text-sm" /></div>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div><label className="text-[10px] sm:text-[11px] font-bold text-slate-500 mb-1 block uppercase tracking-wider">Email (Footer)</label><input type="text" name="contact_email" value={settings.contact_email} onChange={handleSettingChange} className="w-full p-2.5 border rounded-lg sm:rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none text-xs sm:text-sm" /></div>
                <div><label className="text-[10px] sm:text-[11px] font-bold text-slate-500 mb-1 block uppercase tracking-wider">Telepon (Footer)</label><input type="text" name="contact_phone" value={settings.contact_phone} onChange={handleSettingChange} className="w-full p-2.5 border rounded-lg sm:rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none text-xs sm:text-sm" /></div>
              </div>
              <div><label className="text-[10px] sm:text-[11px] font-bold text-slate-500 mb-1 block uppercase tracking-wider">Alamat (Footer)</label><input type="text" name="contact_address" value={settings.contact_address} onChange={handleSettingChange} className="w-full p-2.5 border rounded-lg sm:rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none text-xs sm:text-sm" /></div>
              <div><label className="text-[10px] sm:text-[11px] font-bold text-slate-500 mb-1 block uppercase tracking-wider">Tentang (Footer About)</label><textarea name="footer_about" rows="2" value={settings.footer_about} onChange={handleSettingChange} className="w-full p-2.5 border rounded-lg sm:rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none text-xs sm:text-sm resize-y min-h-19" /></div>
              <div><label className="text-[10px] sm:text-[11px] font-bold text-slate-500 mb-1 block uppercase tracking-wider">Teks Hak Cipta (Copyright)</label><input type="text" name="footer_copyright" value={settings.footer_copyright} onChange={handleSettingChange} className="w-full p-2.5 border rounded-lg sm:rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none text-xs sm:text-sm" /></div>
            </div>
          </div>
        </motion.div>

        {/* ================= BAGIAN 3: ALUR PENDAFTARAN ================= */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-2 bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4 border-b pb-2 sm:pb-3">
            <h2 className="font-bold text-sm sm:text-base text-slate-800 flex items-center gap-1.5 sm:gap-2">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
              Tahapan Alur Pendaftaran
            </h2>
            <button onClick={() => addArrayItem(setAlur, { title: "" })} className="text-[10px] sm:text-xs font-bold text-teal-600 hover:text-teal-800 bg-teal-50 hover:bg-teal-100 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg transition">+ Tambah Tahap</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {alur.map((item, idx) => (
              <div key={idx} className="bg-slate-50 border border-slate-200 p-2 sm:p-3 rounded-xl flex gap-2">
                <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-slate-300 text-white flex items-center justify-center text-[10px] sm:text-xs font-bold shrink-0">{idx + 1}</span>
                <textarea rows="2" value={item.title} onChange={(e) => handleArrayChange(setAlur, idx, "title", e.target.value)} className="w-full bg-transparent border-none outline-none text-[11px] sm:text-xs resize-none p-0 leading-snug" placeholder="Keterangan tahap..." />
                <button onClick={() => removeArrayItem(setAlur, idx)} className="text-red-400 hover:text-red-600 shrink-0 self-start p-0.5"><svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ================= BAGIAN 4: PERSYARATAN ================= */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4 border-b pb-2 sm:pb-3">
            <h2 className="font-bold text-sm sm:text-base text-slate-800 flex items-center gap-1.5 sm:gap-2">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Persyaratan
            </h2>
            <button onClick={() => addArrayItem(setPersyaratan, { type: "dokumen", content: "" })} className="text-[10px] sm:text-xs font-bold text-teal-600 bg-teal-50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg transition">+ Tambah</button>
          </div>
          <div className="space-y-2 sm:space-y-3">
            {persyaratan.map((item, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row gap-2 sm:items-center bg-slate-50 p-2 rounded-xl border border-slate-100">
                <select value={item.type} onChange={(e) => handleArrayChange(setPersyaratan, idx, "type", e.target.value)} className="w-full sm:w-28 text-[11px] sm:text-xs p-1.5 sm:p-2 border rounded-lg bg-white outline-none cursor-pointer">
                  <option value="dokumen">Dokumen</option>
                  <option value="ketentuan">Ketentuan</option>
                </select>
                <div className="flex gap-2 w-full">
                  <input type="text" value={item.content} onChange={(e) => handleArrayChange(setPersyaratan, idx, "content", e.target.value)} className="w-full text-xs sm:text-[13px] p-1.5 sm:p-2 border rounded-lg bg-white outline-none" placeholder="Isi syarat..." />
                  <button onClick={() => removeArrayItem(setPersyaratan, idx)} className="p-1.5 sm:p-2 text-red-400 hover:text-red-600 bg-red-50 hover:bg-red-100 rounded-lg shrink-0"><svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ================= BAGIAN 5: INFORMASI TAMBAHAN ================= */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4 border-b pb-2 sm:pb-3">
            <h2 className="font-bold text-sm sm:text-base text-slate-800 flex items-center gap-1.5 sm:gap-2">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Informasi Tambahan
            </h2>
            <button onClick={() => addArrayItem(setInformasi, { icon: "📌", title: "", description: "" })} className="text-[10px] sm:text-xs font-bold text-teal-600 bg-teal-50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg transition">+ Tambah</button>
          </div>
          <div className="space-y-3 sm:space-y-4">
            {informasi.map((item, idx) => (
              <div key={idx} className="bg-slate-50 border border-slate-200 p-3 sm:p-4 rounded-xl flex items-start gap-2.5 sm:gap-3">
                <input type="text" value={item.icon} onChange={(e) => handleArrayChange(setInformasi, idx, "icon", e.target.value)} className="w-10 h-10 sm:w-12 sm:h-12 text-center text-lg sm:text-xl bg-white border rounded-lg sm:rounded-xl outline-none shrink-0" placeholder="Icon" />
                <div className="w-full space-y-1.5 sm:space-y-2">
                  <input type="text" value={item.title} onChange={(e) => handleArrayChange(setInformasi, idx, "title", e.target.value)} className="w-full text-xs sm:text-[13px] font-bold p-1.5 sm:p-2 border rounded-md sm:rounded-lg bg-white outline-none" placeholder="Judul Info..." />
                  <textarea rows="2" value={item.description} onChange={(e) => handleArrayChange(setInformasi, idx, "description", e.target.value)} className="w-full text-[11px] sm:text-xs p-1.5 sm:p-2 border rounded-md sm:rounded-lg bg-white outline-none resize-none" placeholder="Deskripsi..." />
                </div>
                <button onClick={() => removeArrayItem(setInformasi, idx)} className="p-1.5 sm:p-2 text-red-400 hover:text-red-600 bg-white border rounded-md sm:rounded-lg mt-0.5"><svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
              </div>
            ))}
          </div>
        </motion.div>

      </div>
    </div>
  );
}