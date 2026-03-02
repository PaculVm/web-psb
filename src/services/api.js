import axios from "axios";

const api = axios.create({
  baseURL: "http://daftar.darussalampanusupan.net/psb-backend/api.php", 
});

// ==========================================
// 1. REQUEST INTERCEPTOR (Kirim Token)
// ==========================================
api.interceptors.request.use(
  (config) => {
    if (config.url.startsWith("/admin")) {
      const adminToken = localStorage.getItem("admin_token");
      if (adminToken) config.headers.Authorization = `Bearer ${adminToken}`;
    } else if (config.url.startsWith("/siswa")) {
      const siswaToken = localStorage.getItem("siswa_token");
      if (siswaToken) config.headers.Authorization = `Bearer ${siswaToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ==========================================
// 2. RESPONSE INTERCEPTOR (Validasi Keamanan & Lisensi)
// ==========================================
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // -----------------------------------------------------------------
    // A. PENGECEKAN LISENSI APLIKASI TERKUNCI (403 Forbidden)
    // -----------------------------------------------------------------
    if (error.response && error.response.status === 403 && error.response.data?.kode_error === 'LISENSI_TIDAK_VALID') {
      
      // Hapus seluruh sesi login (Admin & Siswa) untuk keamanan ekstra
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_data");
      localStorage.removeItem("siswa_token");
      localStorage.removeItem("siswa_data");

      // Arahkan paksa pengguna ke halaman error lisensi
      // Pengecekan ini mencegah infinite loop jika mereka sudah berada di halaman error
      if (window.location.pathname !== '/license-error') {
        window.location.href = '/license-error';
      }
      
      // Hentikan eksekusi promise agar komponen tidak mencoba memproses data yang gagal
      return Promise.reject(error);
    }


    // -----------------------------------------------------------------
    // B. PENGECEKAN SESI KEDALUWARSA (401 Unauthorized)
    // -----------------------------------------------------------------
    if (error.response && error.response.status === 401) {
      
      const isApiAdmin = error.config.url.startsWith("/admin");
      const isApiSiswa = error.config.url.startsWith("/siswa");

      if (isApiAdmin) {
        localStorage.removeItem("admin_token");
        localStorage.removeItem("admin_data");
        // Hapus paksa state dan arahkan ulang via window.location agar memory bersih
        window.location.href = "/admin/login?session=expired"; 
      } 
      else if (isApiSiswa) {
        localStorage.removeItem("siswa_token");
        localStorage.removeItem("siswa_data");
        window.location.href = "/siswa/login?session=expired";
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;