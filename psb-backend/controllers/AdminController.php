<?php
require_once __DIR__ . '/../config/db.php';

class AdminController
{
    private $conn;

    public function __construct()
    {
        global $conn;
        $this->conn = $conn;
    }

    public function getDashboardStats()
    {
        try {
            // 1. Total Semua Pendaftar
            $stmtTotal = $this->conn->query("SELECT COUNT(*) FROM santri");
            $total = $stmtTotal->fetchColumn();

            // 2. Total Diterima
            $stmtDiterima = $this->conn->query("SELECT COUNT(*) FROM santri WHERE status_penerimaan = 'Diterima'");
            $diterima = $stmtDiterima->fetchColumn();

            // 3. Total Menunggu (Baru mendaftar)
            $stmtMenunggu = $this->conn->query("SELECT COUNT(*) FROM santri WHERE status_penerimaan = 'Menunggu'");
            $menunggu = $stmtMenunggu->fetchColumn();

            // 4. Total Proses Seleksi
            $stmtProses = $this->conn->query("SELECT COUNT(*) FROM santri WHERE status_penerimaan = 'Proses Seleksi'");
            $proses = $stmtProses->fetchColumn();

            // 5. Ambil 5 Pendaftar Terakhir untuk Tabel "Aktivitas Terbaru"
            $stmtRecent = $this->conn->query("SELECT id, nomor_pendaftaran, nama_lengkap, asal_sekolah, status_penerimaan, created_at FROM santri ORDER BY created_at DESC LIMIT 5");
            $recent = $stmtRecent->fetchAll(PDO::FETCH_ASSOC);

            http_response_code(200);
            echo json_encode([
                "message" => "Statistik ditarik",
                "data" => [
                    "total_pendaftar" => $total,
                    "total_diterima" => $diterima,
                    "total_menunggu" => $menunggu,
                    "total_proses" => $proses,
                    "recent_registrants" => $recent
                ]
            ]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["message" => "Terjadi kesalahan server: " . $e->getMessage()]);
        }
        exit();
    }

    // Mengambil semua daftar pendaftar
    public function getPendaftarList()
    {
        try {
            $stmt = $this->conn->query("SELECT * FROM santri ORDER BY created_at DESC");
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

            http_response_code(200);
            echo json_encode(["message" => "Data pendaftar ditarik", "data" => $data]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["message" => "Terjadi kesalahan server: " . $e->getMessage()]);
        }
        exit();
    }

    public function getDetailSantri($id)
    {
        try {
            // 1. Data Santri
            $stmtSantri = $this->conn->prepare("SELECT * FROM santri WHERE id = ?");
            $stmtSantri->execute([$id]);
            $santri = $stmtSantri->fetch(PDO::FETCH_ASSOC);

            if (!$santri) {
                http_response_code(404);
                echo json_encode(["message" => "Data santri tidak ditemukan."]);
                exit();
            }

            // 2. Data Orang Tua
            $stmtOrtu = $this->conn->prepare("SELECT * FROM orang_tua WHERE santri_id = ?");
            $stmtOrtu->execute([$id]);
            $orang_tua = ['ayah' => null, 'ibu' => null, 'wali' => null];
            while ($row = $stmtOrtu->fetch(PDO::FETCH_ASSOC)) {
                $orang_tua[strtolower($row['tipe'])] = $row;
            }

            // 3. Data Dokumen
            $stmtDocs = $this->conn->prepare("SELECT jenis_dokumen, file_path, file_type FROM dokumen_santri WHERE santri_id = ?");
            $stmtDocs->execute([$id]);
            $dokumen = [];
            $baseUrl = "http://" . $_SERVER['HTTP_HOST'] . "/psb-backend/uploads/";
            while ($doc = $stmtDocs->fetch(PDO::FETCH_ASSOC)) {
                $doc['file_url'] = $baseUrl . $doc['file_path'];
                $dokumen[$doc['jenis_dokumen']] = $doc;
            }

            $santri['orang_tua'] = $orang_tua;
            $santri['dokumen'] = $dokumen;

            http_response_code(200);
            echo json_encode(["message" => "Detail berhasil ditarik", "data" => $santri]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["message" => "Terjadi kesalahan: " . $e->getMessage()]);
        }
        exit();
    }

    // Memperbarui Status Penerimaan
    public function updateStatusSantri($id)
    {
        $data = json_decode(file_get_contents("php://input"));

        if (!isset($data->status)) {
            http_response_code(400);
            echo json_encode(["message" => "Status harus diisi."]);
            exit();
        }

        try {
            $stmt = $this->conn->prepare("UPDATE santri SET status_penerimaan = ? WHERE id = ?");
            $stmt->execute([$data->status, $id]);

            http_response_code(200);
            echo json_encode(["message" => "Status penerimaan berhasil diperbarui."]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["message" => "Gagal memperbarui status: " . $e->getMessage()]);
        }
        exit();
    }

    // Memperbarui Semua Pengaturan Web Halaman Depan
    public function updateSettings()
    {
        $data = json_decode(file_get_contents("php://input"), true);

        if (!$data) {
            http_response_code(400);
            echo json_encode(["message" => "Format data tidak valid."]);
            exit();
        }

        try {
            $this->conn->beginTransaction();

            // 1. Update Tabel web_settings (Teks General, Footer, WA)
            if (isset($data['settings'])) {
                $stmtSet = $this->conn->prepare("UPDATE web_settings SET setting_value = ? WHERE setting_key = ?");
                foreach ($data['settings'] as $key => $value) {
                    $stmtSet->execute([$value, $key]);
                }
            }

            // 2. Update Tabel web_alur (Hapus lama, Insert baru)
            if (isset($data['alur'])) {
                $this->conn->query("DELETE FROM web_alur");
                if (count($data['alur']) > 0) {
                    $stmtAlur = $this->conn->prepare("INSERT INTO web_alur (title) VALUES (?)");
                    foreach ($data['alur'] as $alur) {
                        $stmtAlur->execute([$alur['title']]);
                    }
                }
            }

            // 3. Update Tabel web_persyaratan
            if (isset($data['persyaratan'])) {
                $this->conn->query("DELETE FROM web_persyaratan");
                if (count($data['persyaratan']) > 0) {
                    $stmtSyarat = $this->conn->prepare("INSERT INTO web_persyaratan (type, content) VALUES (?, ?)");
                    foreach ($data['persyaratan'] as $s) {
                        $stmtSyarat->execute([$s['type'], $s['content']]);
                    }
                }
            }

            // 4. Update Tabel web_informasi
            if (isset($data['informasi'])) {
                $this->conn->query("DELETE FROM web_informasi");
                if (count($data['informasi']) > 0) {
                    $stmtInfo = $this->conn->prepare("INSERT INTO web_informasi (icon, title, description) VALUES (?, ?, ?)");
                    foreach ($data['informasi'] as $i) {
                        $stmtInfo->execute([$i['icon'], $i['title'], $i['description']]);
                    }
                }
            }

            $this->conn->commit();
            http_response_code(200);
            echo json_encode(["message" => "Pengaturan halaman web berhasil diperbarui."]);
        } catch (PDOException $e) {
            $this->conn->rollBack();
            http_response_code(500);
            echo json_encode(["message" => "Gagal menyimpan pengaturan: " . $e->getMessage()]);
        }
        exit();
    }

    // Fitur Unggah Gambar Publik (Logo, Hero, dll)
    public function uploadPublicImage()
    {
        if (!isset($_FILES['image'])) {
            http_response_code(400);
            echo json_encode(["message" => "Tidak ada file gambar yang diunggah."]);
            exit();
        }

        $file = $_FILES['image'];
        $allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];

        if (!in_array($file['type'], $allowedTypes)) {
            http_response_code(400);
            echo json_encode(["message" => "Format gambar tidak didukung (Gunakan JPG, PNG, WEBP, atau SVG)."]);
            exit();
        }

        // Folder khusus aset publik
        $uploadDir = __DIR__ . '/../uploads/images/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }

        $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
        $fileName = 'public_' . time() . '_' . rand(1000, 9999) . '.' . $extension;
        $targetPath = $uploadDir . $fileName;

        if (move_uploaded_file($file['tmp_name'], $targetPath)) {
            $baseUrl = "http://" . $_SERVER['HTTP_HOST'] . "/psb-backend/uploads/images/";
            http_response_code(200);
            echo json_encode([
                "message" => "Gambar berhasil diunggah.",
                "url" => $baseUrl . $fileName
            ]);
        } else {
            http_response_code(500);
            echo json_encode(["message" => "Gagal menyimpan gambar di server."]);
        }
        exit();
    }

    // Memperbarui Data Lengkap Santri (Oleh Admin)
    public function updateSantri($id)
    {
        $data = json_decode(file_get_contents("php://input"));

        try {
            $this->conn->beginTransaction();

            // 1. Update Data Utama Santri
            $querySantri = "UPDATE santri SET 
                nama_lengkap = :nama, nisn = :nisn, nik = :nik, tempat_lahir = :tempat, 
                tanggal_lahir = :tanggal, jenis_kelamin = :jk, agama = :agama, 
                asal_sekolah = :asal, pendidikan_terakhir = :pendidikan, alamat_lengkap = :alamat
                WHERE id = :id";

            $stmtS = $this->conn->prepare($querySantri);
            $stmtS->execute([
                ':nama' => $data->nama_lengkap,
                ':nisn' => $data->nisn,
                ':nik' => $data->nik,
                ':tempat' => $data->tempat_lahir,
                ':tanggal' => $data->tanggal_lahir,
                ':jk' => $data->jenis_kelamin,
                ':agama' => $data->agama,
                ':asal' => $data->asal_sekolah,
                ':pendidikan' => $data->pendidikan_terakhir,
                ':alamat' => $data->alamat_lengkap,
                ':id' => $id
            ]);

            // 2. Update Orang Tua (Hapus lama, masukkan baru agar aman)
            $stmtDelete = $this->conn->prepare("DELETE FROM orang_tua WHERE santri_id = :id");
            $stmtDelete->execute([':id' => $id]);

            $queryOrtu = "INSERT INTO orang_tua (santri_id, tipe, status_hidup, nama, nik, wa, pekerjaan, penghasilan, alamat) 
                          VALUES (:santri_id, :tipe, :status_hidup, :nama, :nik, :wa, :pekerjaan, :penghasilan, :alamat)";
            $stmtO = $this->conn->prepare($queryOrtu);

            $insertOrtu = function ($tipe, $ortuData) use ($stmtO, $id) {
                if (!$ortuData) return;
                $stmtO->execute([
                    ':santri_id' => $id,
                    ':tipe' => $tipe,
                    ':status_hidup' => $ortuData->status_hidup ?? null,
                    ':nama' => $ortuData->nama ?? null,
                    ':nik' => $ortuData->nik ?? null,
                    ':wa' => $ortuData->wa ?? null,
                    ':pekerjaan' => $ortuData->pekerjaan ?? null,
                    ':penghasilan' => $ortuData->penghasilan ?? null,
                    ':alamat' => $ortuData->alamat ?? null
                ]);
            };

            if (isset($data->orang_tua->ayah)) $insertOrtu('Ayah', $data->orang_tua->ayah);
            if (isset($data->orang_tua->ibu)) $insertOrtu('Ibu', $data->orang_tua->ibu);
            if (isset($data->orang_tua->wali)) $insertOrtu('Wali', $data->orang_tua->wali);

            $this->conn->commit();
            http_response_code(200);
            echo json_encode(["message" => "Data pendaftar berhasil diperbarui."]);
        } catch (PDOException $e) {
            $this->conn->rollBack();
            http_response_code(500);
            echo json_encode(["message" => "Gagal menyimpan data: " . $e->getMessage()]);
        }
        exit();
    }

    // Menghapus Santri Secara Permanen
    public function deleteSantri($id)
    {
        try {
            // Hapus file fisik dokumen sebelum menghapus data dari DB
            $stmtDocs = $this->conn->prepare("SELECT file_path FROM dokumen_santri WHERE santri_id = ?");
            $stmtDocs->execute([$id]);
            $baseUploadDir = __DIR__ . '/../uploads/';

            while ($doc = $stmtDocs->fetch(PDO::FETCH_ASSOC)) {
                $filePath = $baseUploadDir . $doc['file_path'];
                if (file_exists($filePath)) {
                    unlink($filePath); // Hapus file dari server
                }
            }

            // Coba hapus folder santri jika kosong (format: id_namasantri)
            // Pencarian sederhana berdasarkan ID
            $folders = glob($baseUploadDir . $id . '_*');
            if (!empty($folders) && is_dir($folders[0])) {
                @rmdir($folders[0]); // Hanya terhapus jika foldernya sudah kosong
            }

            // Hapus data dari database (Karena ON DELETE CASCADE, tabel orang_tua & dokumen_santri otomatis terhapus)
            $stmt = $this->conn->prepare("DELETE FROM santri WHERE id = ?");
            $stmt->execute([$id]);

            http_response_code(200);
            echo json_encode(["message" => "Data pendaftar berhasil dihapus secara permanen."]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["message" => "Terjadi kesalahan saat menghapus: " . $e->getMessage()]);
        }
        exit();
    }

    // ==========================================
    // MANAJEMEN PENGGUNA (ADMIN / VALIDATOR)
    // ==========================================
    public function getAdmins()
    {
        try {
            $stmt = $this->conn->query("SELECT id, username, nama_lengkap, role, created_at FROM admins ORDER BY created_at DESC");
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
            http_response_code(200);
            echo json_encode(["message" => "Data admin ditarik", "data" => $data]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["message" => "Terjadi kesalahan: " . $e->getMessage()]);
        }
        exit();
    }

    public function createAdmin()
    {
        $data = json_decode(file_get_contents("php://input"));
        if (empty($data->username) || empty($data->password) || empty($data->nama_lengkap) || empty($data->role)) {
            http_response_code(400);
            echo json_encode(["message" => "Semua kolom wajib diisi."]);
            exit();
        }

        try {
            // Hash password menggunakan BCRYPT bawaan PHP
            $hashedPassword = password_hash($data->password, PASSWORD_BCRYPT);

            $stmt = $this->conn->prepare("INSERT INTO admins (username, password, nama_lengkap, role) VALUES (?, ?, ?, ?)");
            $stmt->execute([$data->username, $hashedPassword, $data->nama_lengkap, $data->role]);

            http_response_code(201);
            echo json_encode(["message" => "Pengguna baru berhasil ditambahkan."]);
        } catch (PDOException $e) {
            http_response_code(500);
            // Tangani error duplikat username (karena kolom username UNIQUE)
            if ($e->getCode() == 23000) {
                echo json_encode(["message" => "Username sudah digunakan, pilih yang lain."]);
            } else {
                echo json_encode(["message" => "Gagal menambah data: " . $e->getMessage()]);
            }
        }
        exit();
    }

    public function updateAdmin($id)
    {
        $data = json_decode(file_get_contents("php://input"));

        try {
            if (!empty($data->password)) {
                // Jika password diisi, update beserta password barunya
                $hashedPassword = password_hash($data->password, PASSWORD_BCRYPT);
                $stmt = $this->conn->prepare("UPDATE admins SET username = ?, password = ?, nama_lengkap = ?, role = ? WHERE id = ?");
                $stmt->execute([$data->username, $hashedPassword, $data->nama_lengkap, $data->role, $id]);
            } else {
                // Jika password kosong, jangan update kolom password
                $stmt = $this->conn->prepare("UPDATE admins SET username = ?, nama_lengkap = ?, role = ? WHERE id = ?");
                $stmt->execute([$data->username, $data->nama_lengkap, $data->role, $id]);
            }

            http_response_code(200);
            echo json_encode(["message" => "Data pengguna berhasil diperbarui."]);
        } catch (PDOException $e) {
            http_response_code(500);
            if ($e->getCode() == 23000) {
                echo json_encode(["message" => "Username sudah digunakan oleh akun lain."]);
            } else {
                echo json_encode(["message" => "Gagal memperbarui data: " . $e->getMessage()]);
            }
        }
        exit();
    }

    public function deleteAdmin($id, $currentUserId)
    {
        // Cegah admin menghapus dirinya sendiri
        if ($id == $currentUserId) {
            http_response_code(400);
            echo json_encode(["message" => "Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif."]);
            exit();
        }

        try {
            $stmt = $this->conn->prepare("DELETE FROM admins WHERE id = ?");
            $stmt->execute([$id]);
            http_response_code(200);
            echo json_encode(["message" => "Pengguna berhasil dihapus."]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["message" => "Gagal menghapus pengguna: " . $e->getMessage()]);
        }
        exit();
    }

    // ==========================================
    // PENGUMUMAN DASHBOARD SANTRI
    // ==========================================
    public function updatePengumuman()
    {
        $data = json_decode(file_get_contents("php://input"));

        if (!isset($data->pengumuman)) {
            http_response_code(400);
            echo json_encode(["message" => "Teks pengumuman tidak valid."]);
            exit();
        }

        try {
            $stmt = $this->conn->prepare("UPDATE web_settings SET setting_value = ? WHERE setting_key = 'pengumuman_santri'");
            $stmt->execute([$data->pengumuman]);

            http_response_code(200);
            echo json_encode(["message" => "Pengumuman berhasil diperbarui dan disiarkan ke santri."]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["message" => "Gagal memperbarui pengumuman: " . $e->getMessage()]);
        }
        exit();
    }

    // ==========================================
    // MANAJEMEN DOKUMEN FISIK BERKAS
    // ==========================================
    public function getAllDokumen() {
        try {
            $query = "SELECT d.id as doc_id, d.santri_id, d.jenis_dokumen, d.file_path, d.file_type, d.uploaded_at, 
                             s.nama_lengkap, s.nomor_pendaftaran 
                      FROM dokumen_santri d 
                      JOIN santri s ON d.santri_id = s.id 
                      ORDER BY d.uploaded_at DESC";
            
            $stmt = $this->conn->query($query);
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Tambahkan Base URL agar frontend bisa langsung mengunduh/melihat file
            $baseUrl = "http://" . $_SERVER['HTTP_HOST'] . "/psb-backend/uploads/";
            foreach($data as &$row) {
                $row['file_url'] = $baseUrl . $row['file_path'];
            }

            http_response_code(200);
            echo json_encode(["message" => "Data dokumen ditarik", "data" => $data]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["message" => "Gagal menarik data dokumen: " . $e->getMessage()]);
        }
        exit();
    }

    public function deleteDokumen($doc_id) {
        try {
            // 1. Cari path file fisik terlebih dahulu
            $stmt = $this->conn->prepare("SELECT file_path FROM dokumen_santri WHERE id = ?");
            $stmt->execute([$doc_id]);
            $doc = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($doc) {
                $filePath = __DIR__ . '/../uploads/' . $doc['file_path'];
                
                // 2. Hapus file fisik dari server jika ada
                if (file_exists($filePath)) {
                    unlink($filePath); 
                }
                
                // 3. Hapus record dari database
                $stmtDel = $this->conn->prepare("DELETE FROM dokumen_santri WHERE id = ?");
                $stmtDel->execute([$doc_id]);

                http_response_code(200);
                echo json_encode(["message" => "Dokumen beserta file fisiknya berhasil dihapus."]);
            } else {
                http_response_code(404);
                echo json_encode(["message" => "Dokumen tidak ditemukan."]);
            }
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["message" => "Terjadi kesalahan saat menghapus dokumen: " . $e->getMessage()]);
        }
        exit();
    }
}
