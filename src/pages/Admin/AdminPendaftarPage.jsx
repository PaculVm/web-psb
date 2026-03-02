import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import api from "@/services/api";
import { useToast } from "@/context/ToastContext";
import { useModal } from "@/context/ModalContext";

// Import Library Export
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function AdminPendaftarPage() {
  const [pendaftar, setPendaftar] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false); // State loading untuk Export
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedIds, setSelectedIds] = useState([]);
  const [viewMode, setViewMode] = useState("list");
  const [editData, setEditData] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const { showToast } = useToast();
  const { openModal } = useModal();

  const fetchList = async () => {
    try {
      const response = await api.get("/admin/validasi/list");
      setPendaftar(response.data.data);
      setFilteredData(response.data.data);
    } catch (error) {
      showToast({ type: "error", title: "Gagal memuat", description: "Tidak dapat menarik daftar pendaftar." });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      setFilteredData(pendaftar.filter(item => 
        item.nama_lengkap.toLowerCase().includes(q) || 
        item.nomor_pendaftaran.toLowerCase().includes(q) ||
        item.nisn?.toLowerCase().includes(q)
      ));
    } else {
      setFilteredData(pendaftar);
    }
    setSelectedIds([]); 
  }, [searchQuery, pendaftar]);

  // =====================================================================
  // LOGIKA CHECKBOX & PENARIKAN DATA LENGKAP UNTUK EXPORT
  // =====================================================================
  const handleSelectAll = (e) => {
    if (e.target.checked) setSelectedIds(filteredData.map(item => item.id));
    else setSelectedIds([]);
  };

  const handleSelectOne = (id) => {
    if (selectedIds.includes(id)) setSelectedIds(selectedIds.filter(itemId => itemId !== id));
    else setSelectedIds([...selectedIds, id]);
  };

  // Fungsi untuk mem-fetch detail lengkap (termasuk ortu) dari ID yang dipilih
  const getDetailedDataForExport = async () => {
    setIsExporting(true);
    const idsToFetch = selectedIds.length > 0 ? selectedIds : filteredData.map(item => item.id);
    const detailedData = [];
    
    try {
      for (const id of idsToFetch) {
        const res = await api.get(`/admin/validasi/${id}`);
        detailedData.push(res.data.data);
      }
      return detailedData;
    } catch (error) {
      showToast({ type: "error", title: "Gagal", description: "Gagal menarik data detail untuk diekspor." });
      return null;
    } finally {
      setIsExporting(false);
    }
  };

  // =====================================================================
  // EXPORT EXCEL (KOLOM MELEBAR)
  // =====================================================================
  const handleExportExcel = async () => {
    const data = await getDetailedDataForExport();
    if (!data) return;

    const excelData = data.map((item, idx) => {
      const ayah = item.orang_tua?.ayah || {};
      const ibu = item.orang_tua?.ibu || {};
      const wali = item.orang_tua?.wali || {};

      return {
        "No": idx + 1,
        "No Pendaftaran": item.nomor_pendaftaran,
        "Status Pendaftaran": item.status_penerimaan,
        "Nama Santri": item.nama_lengkap,
        "NISN": item.nisn || "-",
        "NIK": item.nik || "-",
        "Tempat, Tgl Lahir": `${item.tempat_lahir || "-"}, ${item.tanggal_lahir || "-"}`,
        "Jenis Kelamin": item.jenis_kelamin || "-",
        "Agama": item.agama || "-",
        "Pendidikan Terakhir": item.pendidikan_terakhir || "-",
        "Asal Sekolah": item.asal_sekolah || "-",
        "Alamat Santri": item.alamat_lengkap || "-",

        "Nama Ayah": ayah.nama || "-",
        "Status Ayah": ayah.status_hidup || "-",
        "NIK Ayah": ayah.nik || "-",
        "WA Ayah": ayah.wa || "-",
        "Pekerjaan Ayah": ayah.pekerjaan || "-",
        "Penghasilan Ayah": ayah.penghasilan || "-",
        "Alamat Ayah": ayah.alamat || "-",

        "Nama Ibu": ibu.nama || "-",
        "Status Ibu": ibu.status_hidup || "-",
        "NIK Ibu": ibu.nik || "-",
        "WA Ibu": ibu.wa || "-",
        "Pekerjaan Ibu": ibu.pekerjaan || "-",
        "Penghasilan Ibu": ibu.penghasilan || "-",
        "Alamat Ibu": ibu.alamat || "-",

        "Nama Wali": wali.nama || "-",
        "NIK Wali": wali.nik || "-",
        "WA Wali": wali.wa || "-",
        "Pekerjaan Wali": wali.pekerjaan || "-",
        "Penghasilan Wali": wali.penghasilan || "-",
        "Alamat Wali": wali.alamat || "-",

        "Tanggal Mendaftar": new Date(item.created_at).toLocaleDateString("id-ID")
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Pendaftar");
    XLSX.writeFile(workbook, "Data_Lengkap_Pendaftar.xlsx");
    showToast({ type: "success", title: "Berhasil", description: "File Excel berhasil diunduh." });
  };

  // =====================================================================
  // EXPORT PDF (1 KERTAS FOLIO PER SANTRI)
  // =====================================================================
  const handleExportPDF = async () => {
    const data = await getDetailedDataForExport();
    if (!data) return;

    // Ukuran Kertas Folio / F4: 215.9 x 330.2 mm
    const doc = new jsPDF({ format: [215.9, 330.2], orientation: "portrait" });

    data.forEach((item, index) => {
      if (index > 0) doc.addPage();

      const ayah = item.orang_tua?.ayah || {};
      const ibu = item.orang_tua?.ibu || {};
      const wali = item.orang_tua?.wali || {};

      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text("BIODATA LENGKAP CALON SANTRI", 108, 20, { align: "center" });
      
      doc.setFontSize(12);
      doc.setFont(undefined, 'normal');
      doc.text("Pondok Pesantren Darussalam Panusupan", 108, 26, { align: "center" });
      
      doc.setLineWidth(0.5);
      doc.line(14, 30, 202, 30); 

      // Data Tables Setup...
      // (Kode pembuatan PDF dipertahankan apa adanya karena hanya internal file)
      autoTable(doc, {
        startY: 35,
        head: [['A. DATA PRIBADI SANTRI', '']],
        body: [
          ['Nomor Pendaftaran', `: ${item.nomor_pendaftaran}`],
          ['Status Penerimaan', `: ${item.status_penerimaan}`],
          ['Nama Lengkap', `: ${item.nama_lengkap}`],
          ['NISN / NIK', `: ${item.nisn || "-"} / ${item.nik || "-"}`],
          ['Tempat, Tanggal Lahir', `: ${item.tempat_lahir || "-"}, ${item.tanggal_lahir || "-"}`],
          ['Jenis Kelamin', `: ${item.jenis_kelamin || "-"}`],
          ['Asal Sekolah', `: ${item.asal_sekolah || "-"}`],
          ['Alamat Lengkap', `: ${item.alamat_lengkap || "-"}`],
        ],
        theme: 'grid',
        headStyles: { fillColor: [20, 90, 50], textColor: 255, fontStyle: 'bold' },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } },
        margin: { left: 14, right: 14 }
      });

      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 5,
        head: [['B. DATA AYAH KANDUNG', '']],
        body: [
          ['Nama Lengkap', `: ${ayah.nama || "-"}`],
          ['Status', `: ${ayah.status_hidup || "-"}`],
          ['NIK', `: ${ayah.nik || "-"}`],
          ['No. WhatsApp', `: ${ayah.wa || "-"}`],
          ['Pekerjaan', `: ${ayah.pekerjaan || "-"}`],
          ['Penghasilan per Bulan', `: ${ayah.penghasilan || "-"}`],
          ['Alamat Lengkap', `: ${ayah.alamat || "-"}`],
        ],
        theme: 'grid',
        headStyles: { fillColor: [20, 90, 50], textColor: 255, fontStyle: 'bold' },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } },
        margin: { left: 14, right: 14 }
      });

      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 5,
        head: [['C. DATA IBU KANDUNG', '']],
        body: [
          ['Nama Lengkap', `: ${ibu.nama || "-"}`],
          ['Status', `: ${ibu.status_hidup || "-"}`],
          ['NIK', `: ${ibu.nik || "-"}`],
          ['No. WhatsApp', `: ${ibu.wa || "-"}`],
          ['Pekerjaan', `: ${ibu.pekerjaan || "-"}`],
          ['Penghasilan per Bulan', `: ${ibu.penghasilan || "-"}`],
          ['Alamat Lengkap', `: ${ibu.alamat || "-"}`],
        ],
        theme: 'grid',
        headStyles: { fillColor: [20, 90, 50], textColor: 255, fontStyle: 'bold' },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } },
        margin: { left: 14, right: 14 }
      });

      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 5,
        head: [['D. DATA WALI (OPSIONAL)', '']],
        body: [
          ['Nama Lengkap', `: ${wali.nama || "-"}`],
          ['NIK', `: ${wali.nik || "-"}`],
          ['No. WhatsApp', `: ${wali.wa || "-"}`],
          ['Pekerjaan', `: ${wali.pekerjaan || "-"}`],
          ['Penghasilan per Bulan', `: ${wali.penghasilan || "-"}`],
          ['Alamat Lengkap', `: ${wali.alamat || "-"}`],
        ],
        theme: 'grid',
        headStyles: { fillColor: [20, 90, 50], textColor: 255, fontStyle: 'bold' },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } },
        margin: { left: 14, right: 14 }
      });
      
      const ttY = doc.lastAutoTable.finalY + 15;
      doc.setFontSize(10);
      doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`, 140, ttY);
      doc.text("Panitia Penerimaan Santri Baru", 140, ttY + 5);
      doc.text("( __________________________ )", 140, ttY + 30);
    });

    doc.save("Biodata_Lengkap_Pendaftar.pdf");
    showToast({ type: "success", title: "Berhasil", description: "File PDF Folio berhasil diunduh." });
  };


  // =====================================================================
  // LOGIKA EDIT & HAPUS
  // =====================================================================
  const openEdit = async (id) => {
    try {
      const res = await api.get(`/admin/validasi/${id}`);
      setEditData(res.data.data);
      setViewMode("edit");
    } catch (error) {
      showToast({ type: "error", title: "Error", description: "Gagal menarik detail data santri." });
    }
  };

  const handleInputChange = (e, section, parentSection = null) => {
    const { name, value } = e.target;
    if (parentSection === 'orang_tua') {
      setEditData(prev => ({
        ...prev,
        orang_tua: {
          ...prev.orang_tua,
          [section]: { ...(prev.orang_tua?.[section] || {}), [name]: value }
        }
      }));
    } else {
      setEditData(prev => ({ ...prev, [name]: value }));
    }
  };

  const saveEdit = async () => {
    setIsSaving(true);
    try {
      await api.put(`/admin/pendaftar/${editData.id}`, editData);
      showToast({ type: "success", title: "Berhasil", description: "Data pendaftar berhasil diperbarui." });
      setViewMode("list");
      fetchList();
    } catch (error) {
      showToast({ type: "error", title: "Gagal", description: "Terjadi kesalahan saat menyimpan data." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (id, nama) => {
    openModal({
      title: "Hapus Permanen Data Santri?",
      content: `Anda yakin ingin menghapus seluruh data pendaftaran milik "${nama}"? Semua file dokumen yang diunggah juga akan terhapus.`,
      confirmText: "Ya, Hapus Permanen",
      isDanger: true,
      onConfirm: async () => {
        try {
          await api.delete(`/admin/pendaftar/${id}`);
          showToast({ type: "success", title: "Terhapus", description: "Data santri berhasil dihapus dari sistem." });
          fetchList();
          setSelectedIds(selectedIds.filter(selectedId => selectedId !== id)); 
        } catch (error) {
          showToast({ type: "error", title: "Gagal", description: "Terjadi kesalahan saat menghapus data." });
        }
      }
    });
  };

  // =====================================================================
  // RENDER TAMPILAN: EDIT MODE
  // =====================================================================
  if (viewMode === "edit" && editData) {
    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4 sm:space-y-5 pb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-sm border border-slate-200 gap-3 sm:gap-4 sticky top-14 z-10">
          <div className="flex items-center gap-3">
            <button onClick={() => setViewMode("list")} className="p-2 sm:p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg sm:rounded-xl transition flex items-center gap-1.5 sm:gap-2 font-semibold text-xs sm:text-sm">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg> Kembali
            </button>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-800">Edit Data: {editData.nama_lengkap}</h1>
              <p className="text-[10px] sm:text-xs text-slate-500 font-mono">No. Pendaftaran: {editData.nomor_pendaftaran}</p>
            </div>
          </div>
          <button onClick={saveEdit} disabled={isSaving} className="px-4 py-2 sm:px-5 sm:py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs sm:text-sm rounded-lg sm:rounded-xl transition shadow-md disabled:opacity-50 w-full sm:w-auto">
            {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </div>

        {/* Form Biodata */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="font-bold text-slate-800 mb-3 sm:mb-4 border-b pb-2 text-sm sm:text-base">A. Data Pribadi Santri</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-[11px] sm:text-xs">
            <div><label className="block mb-1 text-slate-500 font-semibold text-[10px] sm:text-[11px] uppercase tracking-wider">Nama Lengkap</label><input type="text" name="nama_lengkap" value={editData.nama_lengkap || ""} onChange={(e) => handleInputChange(e)} className="w-full p-2 sm:p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 focus:bg-white transition" /></div>
            <div><label className="block mb-1 text-slate-500 font-semibold text-[10px] sm:text-[11px] uppercase tracking-wider">NISN</label><input type="text" name="nisn" value={editData.nisn || ""} onChange={(e) => handleInputChange(e)} className="w-full p-2 sm:p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 focus:bg-white transition" /></div>
            <div><label className="block mb-1 text-slate-500 font-semibold text-[10px] sm:text-[11px] uppercase tracking-wider">NIK</label><input type="text" name="nik" value={editData.nik || ""} onChange={(e) => handleInputChange(e)} className="w-full p-2 sm:p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 focus:bg-white transition" /></div>
            <div><label className="block mb-1 text-slate-500 font-semibold text-[10px] sm:text-[11px] uppercase tracking-wider">Tempat Lahir</label><input type="text" name="tempat_lahir" value={editData.tempat_lahir || ""} onChange={(e) => handleInputChange(e)} className="w-full p-2 sm:p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 focus:bg-white transition" /></div>
            <div><label className="block mb-1 text-slate-500 font-semibold text-[10px] sm:text-[11px] uppercase tracking-wider">Tanggal Lahir</label><input type="date" name="tanggal_lahir" value={editData.tanggal_lahir || ""} onChange={(e) => handleInputChange(e)} className="w-full p-2 sm:p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 focus:bg-white transition" /></div>
            <div><label className="block mb-1 text-slate-500 font-semibold text-[10px] sm:text-[11px] uppercase tracking-wider">Jenis Kelamin</label>
              <select name="jenis_kelamin" value={editData.jenis_kelamin || ""} onChange={(e) => handleInputChange(e)} className="w-full p-2 sm:p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 focus:bg-white transition cursor-pointer">
                <option value="Laki-laki">Laki-laki</option><option value="Perempuan">Perempuan</option>
              </select>
            </div>
            <div><label className="block mb-1 text-slate-500 font-semibold text-[10px] sm:text-[11px] uppercase tracking-wider">Asal Sekolah</label><input type="text" name="asal_sekolah" value={editData.asal_sekolah || ""} onChange={(e) => handleInputChange(e)} className="w-full p-2 sm:p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 focus:bg-white transition" /></div>
            <div className="sm:col-span-2"><label className="block mb-1 text-slate-500 font-semibold text-[10px] sm:text-[11px] uppercase tracking-wider">Alamat Lengkap</label><textarea name="alamat_lengkap" rows="2" value={editData.alamat_lengkap || ""} onChange={(e) => handleInputChange(e)} className="w-full p-2 sm:p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 focus:bg-white transition resize-none" /></div>
          </div>
        </div>

        {/* Form Ortu */}
        <div className="grid lg:grid-cols-3 gap-4 sm:gap-5">
          {['ayah', 'ibu', 'wali'].map(ortu => (
            <div key={ortu} className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="font-bold text-slate-800 mb-3 sm:mb-4 border-b pb-2 uppercase tracking-wide text-[11px] sm:text-xs">{ortu === 'wali' ? 'C. Data Wali' : `B. Data ${ortu}`}</h2>
              <div className="space-y-2 sm:space-y-3 text-[11px] sm:text-xs">
                {ortu !== 'wali' && (
                  <div>
                    <label className="block mb-1 text-slate-500 font-semibold text-[10px] sm:text-[11px] uppercase tracking-wider">Status</label>
                    <select name="status_hidup" value={editData.orang_tua?.[ortu]?.status_hidup || ""} onChange={(e) => handleInputChange(e, ortu, 'orang_tua')} className="w-full p-1.5 sm:p-2 border rounded-lg outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 focus:bg-white transition cursor-pointer">
                      <option value="">-- Pilih --</option><option value="Masih Hidup">Masih Hidup</option><option value="Meninggal">Meninggal</option>
                    </select>
                  </div>
                )}
                <div><label className="block mb-1 text-slate-500 font-semibold text-[10px] sm:text-[11px] uppercase tracking-wider">Nama Lengkap</label><input type="text" name="nama" value={editData.orang_tua?.[ortu]?.nama || ""} onChange={(e) => handleInputChange(e, ortu, 'orang_tua')} className="w-full p-1.5 sm:p-2 border rounded-lg outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 focus:bg-white transition" /></div>
                <div><label className="block mb-1 text-slate-500 font-semibold text-[10px] sm:text-[11px] uppercase tracking-wider">NIK</label><input type="text" name="nik" value={editData.orang_tua?.[ortu]?.nik || ""} onChange={(e) => handleInputChange(e, ortu, 'orang_tua')} className="w-full p-1.5 sm:p-2 border rounded-lg outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 focus:bg-white transition" /></div>
                <div><label className="block mb-1 text-slate-500 font-semibold text-[10px] sm:text-[11px] uppercase tracking-wider">Nomor WhatsApp</label><input type="text" name="wa" value={editData.orang_tua?.[ortu]?.wa || ""} onChange={(e) => handleInputChange(e, ortu, 'orang_tua')} className="w-full p-1.5 sm:p-2 border rounded-lg outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 focus:bg-white transition" /></div>
                <div><label className="block mb-1 text-slate-500 font-semibold text-[10px] sm:text-[11px] uppercase tracking-wider">Pekerjaan</label><input type="text" name="pekerjaan" value={editData.orang_tua?.[ortu]?.pekerjaan || ""} onChange={(e) => handleInputChange(e, ortu, 'orang_tua')} className="w-full p-1.5 sm:p-2 border rounded-lg outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 focus:bg-white transition" /></div>
                <div><label className="block mb-1 text-slate-500 font-semibold text-[10px] sm:text-[11px] uppercase tracking-wider">Penghasilan / Bulan</label><input type="text" name="penghasilan" value={editData.orang_tua?.[ortu]?.penghasilan || ""} onChange={(e) => handleInputChange(e, ortu, 'orang_tua')} className="w-full p-1.5 sm:p-2 border rounded-lg outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 focus:bg-white transition" /></div>
                <div><label className="block mb-1 text-slate-500 font-semibold text-[10px] sm:text-[11px] uppercase tracking-wider">Alamat</label><textarea name="alamat" rows="2" value={editData.orang_tua?.[ortu]?.alamat || ""} onChange={(e) => handleInputChange(e, ortu, 'orang_tua')} className="w-full p-1.5 sm:p-2 border rounded-lg outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 focus:bg-white transition resize-none" /></div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  // =====================================================================
  // RENDER TAMPILAN: LIST DATA (DEFAULT)
  // =====================================================================
  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 sm:gap-4 mb-4 sm:mb-5">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-lg sm:text-xl font-bold text-slate-800 border-l-4 sm:border-l-[5px] border-teal-500 pl-3">Manajemen Pendaftar</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1 sm:mt-1.5 ml-4">Ekspor biodata calon santri ke Excel atau PDF Folio.</p>
        </motion.div>
        
        {/* TOMBOL EXPORT DINAMIS */}
        <div className="flex gap-2 w-full sm:w-auto">
          <button 
            onClick={handleExportExcel}
            disabled={isExporting}
            className="flex-1 sm:flex-none px-3 sm:px-4 py-1.5 sm:py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg sm:rounded-xl text-[11px] sm:text-sm font-bold transition flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
          >
            {isExporting ? "Memproses..." : `Excel ${selectedIds.length > 0 ? `(${selectedIds.length})` : '(Semua)'}`}
          </button>
          <button 
            onClick={handleExportPDF}
            disabled={isExporting}
            className="flex-1 sm:flex-none px-3 sm:px-4 py-1.5 sm:py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg sm:rounded-xl text-[11px] sm:text-sm font-bold transition flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
          >
            {isExporting ? "Memproses..." : `PDF ${selectedIds.length > 0 ? `(${selectedIds.length})` : '(Semua)'}`}
          </button>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-3 sm:p-4 rounded-2xl shadow-sm border border-slate-200">
        <div className="relative">
          <svg className="w-4 h-4 sm:w-5 sm:h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input type="text" placeholder="Ketik NISN, Nomor Daftar, atau Nama..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500/20 outline-none text-xs sm:text-sm transition" />
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[10px] sm:text-[11px] uppercase tracking-wider border-b border-slate-200">
                <th className="p-3 sm:p-4 w-10 text-center">
                  <input 
                    type="checkbox" 
                    onChange={handleSelectAll} 
                    checked={filteredData.length > 0 && selectedIds.length === filteredData.length}
                    className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded text-teal-600 focus:ring-teal-500 cursor-pointer" 
                  />
                </th>
                <th className="py-3 sm:py-4 pr-3 sm:pr-4 font-semibold text-center w-10">No</th>
                <th className="p-3 sm:p-4 font-semibold whitespace-nowrap">Reg / NISN</th>
                <th className="p-3 sm:p-4 font-semibold whitespace-nowrap">Nama Lengkap</th>
                <th className="p-3 sm:p-4 font-semibold whitespace-nowrap">Asal Sekolah</th>
                <th className="p-3 sm:p-4 font-semibold text-center whitespace-nowrap">Tindakan Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-[13px]">
              {isLoading ? (
                <tr><td colSpan="6" className="p-6 sm:p-8 text-center text-slate-500 text-xs sm:text-sm">Memuat data pendaftar...</td></tr>
              ) : filteredData.length > 0 ? (
                filteredData.map((item, idx) => (
                  <tr key={item.id} className={`transition ${selectedIds.includes(item.id) ? 'bg-teal-50/50' : 'hover:bg-slate-50/50'}`}>
                    <td className="p-3 sm:p-4 text-center">
                      <input 
                        type="checkbox" 
                        onChange={() => handleSelectOne(item.id)}
                        checked={selectedIds.includes(item.id)}
                        className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
                      />
                    </td>
                    <td className="py-3 sm:py-4 pr-3 sm:pr-4 text-center text-slate-500">{idx + 1}</td>
                    <td className="p-3 sm:p-4 font-mono font-bold text-slate-700 whitespace-nowrap">{item.nomor_pendaftaran}</td>
                    <td className="p-3 sm:p-4 font-bold text-slate-800 whitespace-nowrap">{item.nama_lengkap}</td>
                    <td className="p-3 sm:p-4 text-slate-500 truncate max-w-[150px] sm:max-w-[200px]">{item.asal_sekolah}</td>
                    <td className="p-3 sm:p-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                        <button onClick={() => openEdit(item.id)} className="px-2.5 sm:px-3 py-1 sm:py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-md sm:rounded-lg text-[10px] sm:text-xs font-bold transition flex items-center gap-1">
                          <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg> Edit
                        </button>
                        <button onClick={() => handleDelete(item.id, item.nama_lengkap)} className="px-2.5 sm:px-3 py-1 sm:py-1.5 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-md sm:rounded-lg text-[10px] sm:text-xs font-bold transition flex items-center gap-1">
                          <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg> Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="6" className="p-6 sm:p-8 text-center text-slate-400 text-xs sm:text-sm">Tidak ada data pendaftar.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}