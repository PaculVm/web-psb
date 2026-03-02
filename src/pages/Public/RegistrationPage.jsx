import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/context/ToastContext";
import api from "@/services/api";
import { motion, AnimatePresence } from "framer-motion";

/* =====================================================
   STYLES
===================================================== */
const inputClass = "w-full p-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none transition-all";
const errorClass = "text-[10px] text-red-500 mt-1 ml-1";

/* =====================================================
   SCHEMA
===================================================== */

const nikSchema = z.string().regex(/^[0-9]{16}$/, "NIK harus 16 digit angka");

const waSchema = z
  .string()
  .regex(/^[0-9]{10,15}$/, "Nomor WA tidak valid")
  .optional()
  .or(z.literal(""));

const registrationSchema = z
  .object({
    /* SANTRI */
    nama_lengkap: z.string().min(1, "Nama wajib diisi"),
    nisn: z.string().min(1, "NISN wajib diisi"),
    tempat_lahir: z.string().min(1, "Tempat lahir wajib diisi"),
    tanggal_lahir: z.string().min(1, "Tanggal lahir wajib diisi"),
    jenis_kelamin: z.string().min(1, "Jenis kelamin wajib dipilih"),
    nik: nikSchema,
    agama: z.string().min(1, "Agama wajib dipilih"),
    pendidikan_terakhir: z.string().min(1, "Pendidikan wajib dipilih"),
    asal_sekolah: z.string().min(1, "Asal sekolah wajib diisi"),
    alamat_lengkap: z.string().min(1, "Alamat wajib diisi"),

    /* AYAH */
    status_ayah: z.string().min(1, "Pilih status ayah"),
    nama_ayah: z.string().optional(),
    nik_ayah: z.string().optional(),
    tempat_lahir_ayah: z.string().optional(),
    tanggal_lahir_ayah: z.string().optional(),
    pendidikan_ayah: z.string().optional(),
    pekerjaan_ayah: z.string().optional(),
    domisili_ayah: z.string().optional(),
    wa_ayah: waSchema,
    penghasilan_ayah: z.string().optional(),
    status_rumah_ayah: z.string().optional(),
    alamat_ayah: z.string().optional(),

    /* IBU */
    status_ibu: z.string().min(1, "Pilih status ibu"),
    nama_ibu: z.string().optional(),
    nik_ibu: z.string().optional(),
    tempat_lahir_ibu: z.string().optional(),
    tanggal_lahir_ibu: z.string().optional(),
    pendidikan_ibu: z.string().optional(),
    pekerjaan_ibu: z.string().optional(),
    domisili_ibu: z.string().optional(),
    wa_ibu: waSchema,
    penghasilan_ibu: z.string().optional(),
    status_rumah_ibu: z.string().optional(),
    alamat_ibu: z.string().optional(),

    /* WALI */
    status_wali: z.string().optional(),
    nama_wali: z.string().optional(),
    nik_wali: z.string().optional(),
    tempat_lahir_wali: z.string().optional(),
    tanggal_lahir_wali: z.string().optional(),
    pendidikan_wali: z.string().optional(),
    pekerjaan_wali: z.string().optional(),
    domisili_wali: z.string().optional(),
    wa_wali: waSchema,
    penghasilan_wali: z.string().optional(),
    status_rumah_wali: z.string().optional(),
    alamat_wali: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.status_ayah === "Masih Hidup") {
      if (!data.nama_ayah) ctx.addIssue({ path: ["nama_ayah"], code: "custom", message: "Nama ayah wajib diisi" });
      if (!data.nik_ayah || !/^[0-9]{16}$/.test(data.nik_ayah)) ctx.addIssue({ path: ["nik_ayah"], code: "custom", message: "NIK ayah wajib 16 digit" });
    }

    if (data.status_ibu === "Masih Hidup") {
      if (!data.nama_ibu) ctx.addIssue({ path: ["nama_ibu"], code: "custom", message: "Nama ibu wajib diisi" });
      if (!data.nik_ibu || !/^[0-9]{16}$/.test(data.nik_ibu)) ctx.addIssue({ path: ["nik_ibu"], code: "custom", message: "NIK ibu wajib 16 digit" });
    }

    if (data.status_ayah === "Meninggal" && data.status_ibu === "Meninggal") {
      if (!data.nama_wali) ctx.addIssue({ path: ["nama_wali"], code: "custom", message: "Nama wali wajib diisi" });
      if (!data.nik_wali || !/^[0-9]{16}$/.test(data.nik_wali)) ctx.addIssue({ path: ["nik_wali"], code: "custom", message: "NIK wali wajib 16 digit" });
    }
  });

/* =====================================================
   COMPONENT
===================================================== */

export default function RegistrationPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [step, setStep] = useState(0);

  const {
    register,
    handleSubmit,
    watch,
    trigger,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registrationSchema),
    mode: "onBlur",
  });

  const statusAyah = watch("status_ayah");
  const statusIbu = watch("status_ibu");
  const isBothParentsPassed = statusAyah === "Meninggal" && statusIbu === "Meninggal";

  /* AUTO CLEAR FIELDS */
  useEffect(() => {
    if (statusAyah !== "Masih Hidup") {
      ["nama_ayah", "nik_ayah", "wa_ayah"].forEach(field => setValue(field, ""));
    }
  }, [statusAyah, setValue]);

  useEffect(() => {
    if (statusIbu !== "Masih Hidup") {
      ["nama_ibu", "nik_ibu", "wa_ibu"].forEach(field => setValue(field, ""));
    }
  }, [statusIbu, setValue]);

  const stepFields = [
    ["nama_lengkap", "nisn", "tempat_lahir", "tanggal_lahir", "jenis_kelamin", "nik", "agama", "pendidikan_terakhir", "asal_sekolah", "alamat_lengkap"],
    ["status_ayah", "nama_ayah", "nik_ayah", "status_ibu", "nama_ibu", "nik_ibu"],
    ["status_wali", "nama_wali", "nik_wali"],
  ];

  const handleNext = async () => {
    const fieldsToValidate = stepFields[step];
    const valid = await trigger(fieldsToValidate);
    if (valid) setStep((prev) => prev + 1);
  };

  const handleBack = () => setStep((prev) => prev - 1);

  const onSubmit = async (data) => {
    try {
      const payload = {
        santri: {
          nama_lengkap: data.nama_lengkap,
          nisn: data.nisn,
          tempat_lahir: data.tempat_lahir,
          tanggal_lahir: data.tanggal_lahir,
          jenis_kelamin: data.jenis_kelamin,
          nik: data.nik,
          agama: data.agama,
          pendidikan_terakhir: data.pendidikan_terakhir,
          asal_sekolah: data.asal_sekolah,
          alamat_lengkap: data.alamat_lengkap,
        },
        ayah: {
          status: data.status_ayah,
          ...(data.status_ayah === "Masih Hidup" && {
            nama: data.nama_ayah,
            nik: data.nik_ayah,
            tempat_lahir: data.tempat_lahir_ayah,
            tanggal_lahir: data.tanggal_lahir_ayah,
            pendidikan: data.pendidikan_ayah,
            pekerjaan: data.pekerjaan_ayah,
            domisili: data.domisili_ayah,
            wa: data.wa_ayah,
            penghasilan: data.penghasilan_ayah,
            status_rumah: data.status_rumah_ayah,
            alamat: data.alamat_ayah
          })
        },
        ibu: {
          status: data.status_ibu,
          ...(data.status_ibu === "Masih Hidup" && {
            nama: data.nama_ibu,
            nik: data.nik_ibu,
            tempat_lahir: data.tempat_lahir_ibu,
            tanggal_lahir: data.tanggal_lahir_ibu,
            pendidikan: data.pendidikan_ibu,
            pekerjaan: data.pekerjaan_ibu,
            domisili: data.domisili_ibu,
            wa: data.wa_ibu,
            penghasilan: data.penghasilan_ibu,
            status_rumah: data.status_rumah_ibu,
            alamat: data.alamat_ibu
          })
        },
        wali: isBothParentsPassed ? {
          status: data.status_wali,
          nama: data.nama_wali,
          nik: data.nik_wali,
          tempat_lahir: data.tempat_lahir_wali,
          tanggal_lahir: data.tanggal_lahir_wali,
          pendidikan: data.pendidikan_wali,
          pekerjaan: data.pekerjaan_wali,
          domisili: data.domisili_wali,
          wa: data.wa_wali,
          penghasilan: data.penghasilan_wali,
          status_rumah: data.status_rumah_wali,
          alamat: data.alamat_wali
        } : null,
      };

      const response = await api.post("/pendaftaran", payload);
      showToast({ type: "success", title: "Berhasil", description: `No: ${response.data.nomor_pendaftaran}` });
      navigate("/siswa/login");
    } catch (error) {
      showToast({ type: "error", title: "Gagal", description: error.response?.data?.message || "Kesalahan server." });
    }
  };

  return (
    <div className="max-w-4xl lg:max-w-7xl mx-auto space-y-6 pb-12 pt-12 px-4">
      <h1 className="text-2xl font-bold text-[#0e673b] border-l-[6px] border-[#f4c430] pl-4">
        Formulir Pendaftaran Santri Baru
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        {/* ================= STEP 1: DATA SANTRI ================= */}
        {step === 0 && (
          <section className="space-y-4 bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <h2 className="font-semibold text-teal-700 text-sm">A. Data Calon Santri</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <input placeholder="Nama Lengkap" className={inputClass} {...register("nama_lengkap")} />
                {errors.nama_lengkap && <p className={errorClass}>{errors.nama_lengkap.message}</p>}
              </div>
              <div>
                <input placeholder="NISN" className={inputClass} {...register("nisn")} />
                {errors.nisn && <p className={errorClass}>{errors.nisn.message}</p>}
              </div>
              <input placeholder="Tempat Lahir" className={inputClass} {...register("tempat_lahir")} />
              <input type="date" className={inputClass} {...register("tanggal_lahir")} />
              <select className={inputClass} {...register("jenis_kelamin")}>
                <option value="">Jenis Kelamin</option>
                <option>Laki-laki</option>
                <option>Perempuan</option>
              </select>
              <input placeholder="NIK (16 digit)" maxLength={16} className={inputClass} {...register("nik")} />
              <select className={inputClass} {...register("agama")}>
                <option value="">Agama</option>
                <option>Islam</option>
                <option>Kristen</option>
                <option>Katolik</option>
                <option>Hindu</option>
                <option>Budha</option>
              </select>
              <select className={inputClass} {...register("pendidikan_terakhir")}>
                <option value="">Pendidikan Terakhir</option>
                <option>SD/MI</option>
                <option>SMP/MTs</option>
                <option>SMA/MA</option>
                <option>Tidak Sekolah</option>
              </select>
              <div className="md:col-span-2">
                <input placeholder="Asal Sekolah" className={inputClass} {...register("asal_sekolah")} />
              </div>
              <div className="md:col-span-2">
                <textarea placeholder="Alamat Lengkap Santri" rows={2} className={`${inputClass} resize-none`} {...register("alamat_lengkap")} />
              </div>
            </div>
          </section>
        )}

        {/* ================= STEP 2: DATA ORANG TUA ================= */}
        {step === 1 && (
          <section className="space-y-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="font-semibold text-amber-700 text-sm">B. Data Orang Tua</h2>

            {/* DATA AYAH */}
            <div className="space-y-4 border rounded-xl p-5 bg-amber-50/30">
              <h3 className="text-sm font-semibold text-amber-800">1. Data Ayah</h3>
              <select className={inputClass} {...register("status_ayah")}>
                <option value="">-- Pilih Status Ayah --</option>
                <option value="Masih Hidup">Masih Hidup</option>
                <option value="Meninggal">Meninggal</option>
              </select>
              <AnimatePresence>
                {statusAyah === "Masih Hidup" && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 pt-2 overflow-hidden">
                    {/* Nama Lengkap & NIK sekarang berdampingan karena sama-sama mengambil 1 kolom di layar md */}
                    <div>
                      <input placeholder="Nama Lengkap Ayah" className={inputClass} {...register("nama_ayah")} />
                      {errors.nama_ayah && <p className={errorClass}>{errors.nama_ayah.message}</p>}
                    </div>
                    <div>
                      <input placeholder="NIK Ayah (16 digit)" maxLength={16} className={inputClass} {...register("nik_ayah")} />
                      {errors.nik_ayah && <p className={errorClass}>{errors.nik_ayah.message}</p>}
                    </div>

                    <input placeholder="Tempat Lahir" className={inputClass} {...register("tempat_lahir_ayah")} />
                    <input type="date" className={inputClass} {...register("tanggal_lahir_ayah")} />
                    
                    <select className={inputClass} {...register("pendidikan_ayah")}>
                      <option value="">Pendidikan</option>
                      <option>SD/MI</option><option>SMP/MTs</option><option>SMA/MA</option><option>S1</option><option>S2</option><option>S3</option><option>Tidak Sekolah</option>
                    </select>
                    <input placeholder="Pekerjaan" className={inputClass} {...register("pekerjaan_ayah")} />
                    
                    <select className={inputClass} {...register("domisili_ayah")}>
                      <option value="">Domisili</option>
                      <option>Dalam Negeri</option><option>Luar Negeri</option>
                    </select>
                    <input placeholder="No WA (08xxx)" className={inputClass} {...register("wa_ayah")} />
                    
                    <select className={inputClass} {...register("penghasilan_ayah")}>
                      <option value="">Penghasilan /Bulan</option>
                      <option>{"< 1 Juta"}</option><option>1 - 3 Juta</option><option>{"> 3 Juta"}</option>
                    </select>
                    <select className={inputClass} {...register("status_rumah_ayah")}>
                      <option value="">Status Rumah</option>
                      <option>Milik Sendiri</option><option>Sewa/Kontrak</option>
                    </select>
                    
                    <div className="md:col-span-2">
                      <textarea placeholder="Alamat Ayah" rows={2} className={`${inputClass} resize-none`} {...register("alamat_ayah")} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* DATA IBU (Sama dengan Ayah) */}
            <div className="space-y-4 border rounded-xl p-5 bg-pink-50/30">
              <h3 className="text-sm font-semibold text-pink-800">2. Data Ibu</h3>
              <select className={inputClass} {...register("status_ibu")}>
                <option value="">-- Pilih Status Ibu --</option>
                <option value="Masih Hidup">Masih Hidup</option>
                <option value="Meninggal">Meninggal</option>
              </select>

              <AnimatePresence>
                {statusIbu === "Masih Hidup" && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 pt-2 overflow-hidden">
                    {/* Nama Lengkap & NIK sekarang berdampingan karena sama-sama mengambil 1 kolom di layar md */}
                    <div>
                      <input placeholder="Nama Lengkap Ibu" className={inputClass} {...register("nama_Ibu")} />
                      {errors.nama_Ibu && <p className={errorClass}>{errors.nama_Ibu.message}</p>}
                    </div>
                    <div>
                      <input placeholder="NIK Ibu (16 digit)" maxLength={16} className={inputClass} {...register("nik_Ibu")} />
                      {errors.nik_Ibu && <p className={errorClass}>{errors.nik_Ibu.message}</p>}
                    </div>

                    <input placeholder="Tempat Lahir" className={inputClass} {...register("tempat_lahir_Ibu")} />
                    <input type="date" className={inputClass} {...register("tanggal_lahir_Ibu")} />
                    
                    <select className={inputClass} {...register("pendidikan_Ibu")}>
                      <option value="">Pendidikan</option>
                      <option>SD/MI</option><option>SMP/MTs</option><option>SMA/MA</option><option>S1</option><option>S2</option><option>S3</option><option>Tidak Sekolah</option>
                    </select>
                    <input placeholder="Pekerjaan" className={inputClass} {...register("pekerjaan_Ibu")} />
                    
                    <select className={inputClass} {...register("domisili_Ibu")}>
                      <option value="">Domisili</option>
                      <option>Dalam Negeri</option><option>Luar Negeri</option>
                    </select>
                    <input placeholder="No WA (08xxx)" className={inputClass} {...register("wa_Ibu")} />
                    
                    <select className={inputClass} {...register("penghasilan_Ibu")}>
                      <option value="">Penghasilan /Bulan</option>
                      <option>{"< 1 Juta"}</option><option>1 - 3 Juta</option><option>{"> 3 Juta"}</option>
                    </select>
                    <select className={inputClass} {...register("status_rumah_Ibu")}>
                      <option value="">Status Rumah</option>
                      <option>Milik Sendiri</option><option>Sewa/Kontrak</option>
                    </select>
                    
                    <div className="md:col-span-2">
                      <textarea placeholder="Alamat Ibu" rows={2} className={`${inputClass} resize-none`} {...register("alamat_Ibu")} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>
        )}

        {/* ================= STEP 3: DATA WALI ================= */}
        {step === 2 && (
          <section className="space-y-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="font-semibold text-emerald-700 text-sm">C. Data Wali</h2>
            {isBothParentsPassed ? (
              <div className="space-y-4 border rounded-xl p-5 bg-emerald-50/30">
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="md:col-span-2">
                    <input placeholder="Nama Wali" className={inputClass} {...register("nama_wali")} />
                  </div>
                  <input placeholder="NIK Wali" maxLength={16} className={inputClass} {...register("nik_wali")} />
                  <input placeholder="Pekerjaan Wali" className={inputClass} {...register("pekerjaan_wali")} />
                  <input placeholder="No WA Wali" className={inputClass} {...register("wa_wali")} />
                  <select className={inputClass} {...register("penghasilan_wali")}>
                    <option value="">Penghasilan /Bulan</option>
                    <option>{"< 1 Juta"}</option><option>1 - 3 Juta</option>
                  </select>
                  <div className="md:col-span-2">
                    <textarea placeholder="Alamat Wali" rows={2} className={`${inputClass} resize-none`} {...register("alamat_wali")} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-10 bg-gray-50 rounded-xl text-center border-2 border-dashed">
                <p className="text-gray-500 text-sm font-medium">Data wali tidak diperlukan.</p>
                <p className="text-gray-400 text-[10px]">Silahkan langsung klik "Kirim Pendaftaran"</p>
              </div>
            )}
          </section>
        )}

        {/* ================= NAVIGASI ================= */}
        <div className="flex justify-between items-center pt-6">
          <button type="button" disabled={step === 0} onClick={handleBack} className="px-6 py-2 text-xs font-medium border rounded-full hover:bg-gray-50 disabled:opacity-30 transition-all">
            Kembali
          </button>

          {step < 2 ? (
            <button type="button" onClick={handleNext} className="px-8 py-2 text-xs font-medium bg-teal-600 text-white rounded-full hover:bg-teal-700 shadow-md transition-all">
              Lanjut
            </button>
          ) : (
            <button type="submit" disabled={isSubmitting} className="px-8 py-2 text-xs font-medium bg-[#0e673b] text-white rounded-full hover:bg-[#0a4d2c] shadow-md transition-all disabled:bg-gray-400">
              {isSubmitting ? "Memproses..." : "Kirim Pendaftaran"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}