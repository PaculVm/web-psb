<?php
require_once __DIR__ . '/../helpers/cors.php';
require_once __DIR__ . '/../helpers/jwt.php'; 

// Load semua Controller
require_once __DIR__ . '/../controllers/HomeController.php';
require_once __DIR__ . '/../controllers/PendaftaranController.php';
require_once __DIR__ . '/../controllers/AuthAdminController.php';
require_once __DIR__ . '/../controllers/AdminController.php';
require_once __DIR__ . '/../controllers/AuthSiswaController.php';
require_once __DIR__ . '/../controllers/DokumenController.php';

// =====================================
// PENGECEKAN LISENSI APLIKASI
// =====================================
// Pastikan path ini sesuai dengan tempat Anda menyimpan LicenseChecker.php
require_once __DIR__ . '/../controllers/LicenseChecker.php'; 

// Idealnya kunci ini diambil dari file .env atau config, bukan di-hardcode
$clientLicenseKey = "0154c64fbfcf34a2e38134f923c9eeb5"; 
$checker = new LicenseChecker($clientLicenseKey);

// Eksekusi verifikasi. Jika gagal, skrip akan otomatis terhenti di sini.
$checker->verify(); 
// =====================================


// Ambil path URI dan Method
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];

// =====================================
// ENDPOINT PUBLIK
// =====================================
// Menggunakan strpos() agar aman meskipun berada di dalam sub-folder localhost
if (strpos($uri, '/public/home') !== false && $method === 'GET') {
    $controller = new HomeController();
    $controller->getHomeData();
} 
elseif (strpos($uri, '/pendaftaran') !== false && $method === 'POST') {
    $controller = new PendaftaranController();
    $controller->store();
} 
elseif (strpos($uri, '/auth/siswa/login') !== false && $method === 'POST') {
    $controller = new AuthSiswaController();
    $controller->login();
} 
elseif (strpos($uri, '/auth/admin/login') !== false && $method === 'POST') {
    $controller = new AuthAdminController();
    $controller->login();
}

// =====================================
// ENDPOINT PRIVAT (Butuh Token)
// =====================================
elseif (strpos($uri, '/siswa/profile') !== false && $method === 'GET') {
    $userData = validateJWT();
    
    if ($userData->role !== 'siswa') {
        http_response_code(403); 
        echo json_encode(["message" => "Akses ditolak. Rute ini khusus untuk siswa."]);
        exit();
    }

    $controller = new AuthSiswaController();

    if ($method === 'GET') {
        $controller->getProfile($userData);
    } 
    elseif ($method === 'PUT') { 
        $controller->updateProfile($userData);
    }
} 

elseif (strpos($uri, '/siswa/dokumen') !== false) {
    $userData = validateJWT();
    if ($userData->role !== 'siswa') {
        http_response_code(403); 
        exit();
    }

    $controller = new DokumenController();
    if ($method === 'GET') {
        $controller->getDokumen($userData);
    } 
    elseif ($method === 'POST') {
        $controller->uploadDokumen($userData);
    }
}

elseif (strpos($uri, '/admin/') !== false) {
    $userData = validateJWT();
    
    if (!in_array($userData->role, ['admin', 'validator'])) {
        http_response_code(403); 
        echo json_encode(["message" => "Akses ditolak."]);
        exit();
    }

    $adminController = new AdminController();

    // Rute yang sudah ada
    if (strpos($uri, '/admin/dashboard/stats') !== false && $method === 'GET') {
        $adminController->getDashboardStats();
    }
    // RUTE VALIDASI
    elseif (strpos($uri, '/admin/validasi/list') !== false && $method === 'GET') {
        $adminController->getPendaftarList();
    }
    // Gunakan Regex untuk menangkap parameter ID di URL (misal: /admin/validasi/5)
    elseif (preg_match('/\/admin\/validasi\/(\d+)$/', $uri, $matches) && $method === 'GET') {
        $adminController->getDetailSantri($matches[1]);
    }
    // Update status (misal: /admin/validasi/5/status)
    elseif (preg_match('/\/admin\/validasi\/(\d+)\/status$/', $uri, $matches) && $method === 'PUT') {
        $adminController->updateStatusSantri($matches[1]);
    }
    // RUTE SETTINGS
    elseif (strpos($uri, '/admin/settings') !== false && $method === 'PUT') {
        // Hanya Super Admin yang boleh akses pengaturan web (Validator tidak boleh)
        if ($userData->role !== 'admin') {
            http_response_code(403); 
            echo json_encode(["message" => "Akses ditolak. Rute ini khusus Administrator."]);
            exit();
        }
        $adminController->updateSettings();
    }
    // RUTE UPLOAD GAMBAR
    elseif (strpos($uri, '/admin/upload-image') !== false && $method === 'POST') {
        if ($userData->role !== 'admin') {
            http_response_code(403); exit();
        }
        $adminController->uploadPublicImage();
    }
    // UPDATE Data Santri (Khusus Admin Utama)
    elseif (preg_match('/\/admin\/pendaftar\/(\d+)$/', $uri, $matches) && $method === 'PUT') {
        if ($userData->role !== 'admin') { http_response_code(403); exit(); }
        $adminController->updateSantri($matches[1]);
    }
    // DELETE Data Santri (Khusus Admin Utama)
    elseif (preg_match('/\/admin\/pendaftar\/(\d+)$/', $uri, $matches) && $method === 'DELETE') {
        if ($userData->role !== 'admin') { http_response_code(403); exit(); }
        $adminController->deleteSantri($matches[1]);
    }
    // MANAJEMEN PENGGUNA (KHUSUS ADMIN)
    elseif (strpos($uri, '/admin/users') !== false) {
        if ($userData->role !== 'admin') {
            http_response_code(403); 
            echo json_encode(["message" => "Akses ditolak."]);
            exit();
        }

        // GET: Ambil daftar
        if ($method === 'GET') {
            $adminController->getAdmins();
        }
        // POST: Tambah baru
        elseif ($method === 'POST') {
            $adminController->createAdmin();
        }
        // PUT: Update data (membutuhkan ID di URL)
        elseif (preg_match('/\/admin\/users\/(\d+)$/', $uri, $matches) && $method === 'PUT') {
            $adminController->updateAdmin($matches[1]);
        }
        // DELETE: Hapus data (membutuhkan ID di URL)
        elseif (preg_match('/\/admin\/users\/(\d+)$/', $uri, $matches) && $method === 'DELETE') {
            $adminController->deleteAdmin($matches[1], $userData->id);
        }
    }
    // UPDATE PENGUMUMAN
    elseif (strpos($uri, '/admin/pengumuman') !== false && $method === 'PUT') {
        $adminController->updatePengumuman();
    }
    // MANAJEMEN DOKUMEN / UPLOADS
    elseif (strpos($uri, '/admin/dokumen') !== false) {
        if (!in_array($userData->role, ['admin', 'validator'])) {
            http_response_code(403); exit();
        }

        if ($method === 'GET') {
            $adminController->getAllDokumen();
        }
        // Gunakan Regex untuk menangkap ID dokumen yang akan dihapus
        elseif (preg_match('/\/admin\/dokumen\/(\d+)$/', $uri, $matches) && $method === 'DELETE') {
            $adminController->deleteDokumen($matches[1]);
        }
    }
}

// Jika rute tidak ada
else {
    http_response_code(404);
    echo json_encode([
        "message" => "Endpoint tidak ditemukan.",
        "path_yang_dibaca" => $uri 
    ]);
}
?>