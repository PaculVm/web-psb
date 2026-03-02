<?php
require_once __DIR__ . '/../config/db.php';

class DokumenController {
    private $conn;

    public function __construct() {
        global $conn;
        $this->conn = $conn;
    }

    // Mengambil daftar dokumen
    public function getDokumen($userData) {
        $santri_id = $userData->id;
        try {
            $stmt = $this->conn->prepare("SELECT jenis_dokumen, file_path, file_type FROM dokumen_santri WHERE santri_id = :santri_id");
            $stmt->execute([':santri_id' => $santri_id]);
            $dokumen = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Sesuaikan "psb-backend" dengan nama folder root localhost Anda
            $baseUrl = "http://" . $_SERVER['HTTP_HOST'] . "/psb-backend/uploads/"; 
            
            foreach($dokumen as &$doc) {
                // file_path sudah berisi "id_nama/file.ext"
                $doc['file_url'] = $baseUrl . $doc['file_path']; 
            }

            http_response_code(200);
            echo json_encode(["message" => "Data dokumen ditarik", "data" => $dokumen]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["message" => "Terjadi kesalahan database: " . $e->getMessage()]);
        }
        exit();
    }

    // Upload & Overwrite file
    public function uploadDokumen($userData) {
        $santri_id = $userData->id;
        
        // BIKIN NAMA FOLDER DARI NAMA SANTRI
        // Bersihkan nama dari spasi & simbol agar aman untuk sistem file server
        $nama_bersih = preg_replace('/[^a-zA-Z0-9]/', '_', strtolower($userData->nama_lengkap));
        // Format: ID_Nama (contoh: 5_budi_santoso) -> Mencegah bentrok jika nama persis sama
        $folder_nama = $santri_id . '_' . $nama_bersih; 

        if (!isset($_POST['jenis_dokumen']) || !isset($_FILES['file'])) {
            http_response_code(400);
            echo json_encode(["message" => "Pilih file dan jenis dokumen terlebih dahulu."]);
            exit();
        }

        $jenis_dokumen = $_POST['jenis_dokumen'];
        $file = $_FILES['file'];

        // Validasi tipe file
        $allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
        if (!in_array($file['type'], $allowedTypes)) {
            http_response_code(400);
            echo json_encode(["message" => "Format ditolak. Gunakan JPG, PNG, atau PDF."]);
            exit();
        }

        // Validasi ukuran (Max 2MB)
        if ($file['size'] > 2 * 1024 * 1024) { 
            http_response_code(400);
            echo json_encode(["message" => "Ukuran file terlalu besar. Maksimal 2MB."]);
            exit();
        }

        $baseUploadDir = __DIR__ . '/../uploads/';
        $studentDir = $baseUploadDir . $folder_nama . '/';

        // Buat folder khusus untuk santri ini jika belum ada
        if (!is_dir($studentDir)) {
            mkdir($studentDir, 0777, true);
        }

        $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
        // Nama file: jenis_dokumen_timestamp.ext
        $fileName = $jenis_dokumen . '_' . time() . '.' . $extension; 
        
        // Data path yang masuk ke DB (misal: 5_budi_santoso/pas_foto_16800.jpg)
        $dbFilePath = $folder_nama . '/' . $fileName; 
        $targetPath = $studentDir . $fileName;

        try {
            // CEK FILE LAMA UNTUK DITIMPA
            $stmtCheck = $this->conn->prepare("SELECT file_path FROM dokumen_santri WHERE santri_id = :santri_id AND jenis_dokumen = :jenis_dokumen");
            $stmtCheck->execute([':santri_id' => $santri_id, ':jenis_dokumen' => $jenis_dokumen]);
            
            if ($stmtCheck->rowCount() > 0) {
                $oldFile = $stmtCheck->fetch(PDO::FETCH_ASSOC)['file_path'];
                // Hapus fisik file lama di server!
                if (file_exists($baseUploadDir . $oldFile)) {
                    unlink($baseUploadDir . $oldFile); 
                }
            }

            // Pindahkan file baru
            if (move_uploaded_file($file['tmp_name'], $targetPath)) {
                
                // Gunakan UPSERT: Insert jika baru, Update jika jenis dokumen sudah ada
                $stmt = $this->conn->prepare("
                    INSERT INTO dokumen_santri (santri_id, jenis_dokumen, file_path, file_type)
                    VALUES (:santri_id, :jenis_dokumen, :file_path, :file_type)
                    ON DUPLICATE KEY UPDATE file_path = VALUES(file_path), file_type = VALUES(file_type)
                ");
                $stmt->execute([
                    ':santri_id' => $santri_id,
                    ':jenis_dokumen' => $jenis_dokumen,
                    ':file_path' => $dbFilePath,
                    ':file_type' => $file['type']
                ]);

                $baseUrl = "http://" . $_SERVER['HTTP_HOST'] . "/psb-backend/uploads/"; 
                
                http_response_code(200);
                echo json_encode([
                    "message" => "Dokumen berhasil diunggah.",
                    "data" => [
                        "jenis_dokumen" => $jenis_dokumen,
                        "file_url" => $baseUrl . $dbFilePath,
                        "file_type" => $file['type']
                    ]
                ]);
            } else {
                http_response_code(500);
                echo json_encode(["message" => "Gagal memindahkan file ke server."]);
            }
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["message" => "Kesalahan server: " . $e->getMessage()]);
        }
        exit();
    }
}
?>