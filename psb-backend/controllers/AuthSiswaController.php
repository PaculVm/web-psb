<?php
require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../config/db.php';

use \Firebase\JWT\JWT;

class AuthSiswaController {
    private $conn;
    private $secret_key = "KUNCI_RAHASIA_PSB_YANG_SANGAT_AMAN_123!!";
    
    public function __construct() {
        global $conn;
        $this->conn = $conn;
    }

    public function login() {
        $data = json_decode(file_get_contents("php://input"));

        if (empty($data->nisn) || empty($data->tanggal_lahir)) {
            http_response_code(400); 
            echo json_encode(["message" => "NISN dan Tanggal Lahir harus diisi."]);
            exit();
        }

        try {
            // Login sekarang merujuk ke tabel santri
            $query = "SELECT id, nomor_pendaftaran, nama_lengkap, nisn FROM santri 
                      WHERE nisn = :nisn AND tanggal_lahir = :tanggal_lahir LIMIT 1";
            $stmt = $this->conn->prepare($query);
            $stmt->execute([
                ':nisn' => $data->nisn,
                ':tanggal_lahir' => $data->tanggal_lahir
            ]);

            if ($stmt->rowCount() > 0) {
                $user = $stmt->fetch();

                $payload = array(
                    "iss" => "http://localhost:8000",
                    "iat" => time(),
                    "exp" => time() + (60 * 60 * 24),
                    "data" => array(
                        "id" => $user->id,
                        "role" => "siswa",
                        "nomor_pendaftaran" => $user->nomor_pendaftaran,
                        "nama_lengkap" => $user->nama_lengkap,
                        "nisn" => $user->nisn
                    )
                );

                $jwt = JWT::encode($payload, $this->secret_key, 'HS256');

                http_response_code(200);
                echo json_encode([
                    "message" => "Login berhasil.",
                    "token" => $jwt,
                    "user" => $user
                ]);
            } else {
                http_response_code(401);
                echo json_encode(["message" => "Login gagal! NISN atau Tanggal Lahir salah."]);
            }
        } catch (PDOException $e) {
            http_response_code(500); 
            echo json_encode(["message" => "Terjadi kesalahan server: " . $e->getMessage()]);
        }
        exit();
    }

    public function getProfile($userData) {
        $id = $userData->id;

        try {
            // 1. Ambil Data Santri
            $stmtSantri = $this->conn->prepare("SELECT * FROM santri WHERE id = :id LIMIT 1");
            $stmtSantri->execute([':id' => $id]);
            
            if ($stmtSantri->rowCount() === 0) {
                http_response_code(404);
                echo json_encode(["message" => "Data siswa tidak ditemukan."]);
                exit();
            }
            
            // Format Array (FETCH_ASSOC) untuk digabungkan menjadi output JSON
            $santri = $stmtSantri->fetch(PDO::FETCH_ASSOC);

            // 2. Ambil Data Orang Tua
            $stmtOrtu = $this->conn->prepare("SELECT * FROM orang_tua WHERE santri_id = :id");
            $stmtOrtu->execute([':id' => $id]);
            
            $orang_tua = [
                'ayah' => null,
                'ibu' => null,
                'wali' => null
            ];

            while ($row = $stmtOrtu->fetch(PDO::FETCH_ASSOC)) {
                $tipe = strtolower($row['tipe']); // menjadi 'ayah', 'ibu', 'wali'
                $orang_tua[$tipe] = $row;
            }

            // Gabungkan datanya dalam 1 response
            $response_data = array_merge($santri, ['orang_tua' => $orang_tua]);

            http_response_code(200);
            echo json_encode([
                "message" => "Data profil berhasil ditarik.",
                "data" => $response_data
            ]);

        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["message" => "Terjadi kesalahan server: " . $e->getMessage()]);
        }
        exit();
    }

    public function updateProfile($userData) {
        $id = $userData->id;
        $data = json_decode(file_get_contents("php://input"));

        try {
            $this->conn->beginTransaction();

            // 1. Update Data Santri (NISN & Tanggal Lahir tidak di-update demi keamanan login)
            $querySantri = "UPDATE santri SET 
                nama_lengkap = :nama_lengkap, tempat_lahir = :tempat_lahir, 
                jenis_kelamin = :jenis_kelamin, nik = :nik, agama = :agama, 
                pendidikan_terakhir = :pendidikan_terakhir, asal_sekolah = :asal_sekolah, 
                alamat_lengkap = :alamat_lengkap
                WHERE id = :id";
                
            $stmtS = $this->conn->prepare($querySantri);
            $stmtS->execute([
                ':nama_lengkap' => $data->nama_lengkap,
                ':tempat_lahir' => $data->tempat_lahir,
                ':jenis_kelamin' => $data->jenis_kelamin,
                ':nik' => $data->nik,
                ':agama' => $data->agama,
                ':pendidikan_terakhir' => $data->pendidikan_terakhir,
                ':asal_sekolah' => $data->asal_sekolah,
                ':alamat_lengkap' => $data->alamat_lengkap,
                ':id' => $id
            ]);

            // 2. Update Data Orang Tua 
            // Cara teraman untuk data relasional dinamis: Hapus yang lama, masukkan yang baru
            $stmtDelete = $this->conn->prepare("DELETE FROM orang_tua WHERE santri_id = :id");
            $stmtDelete->execute([':id' => $id]);

            $queryOrtu = "INSERT INTO orang_tua (
                santri_id, tipe, status_hidup, nama, nik, tempat_lahir, tanggal_lahir, 
                pendidikan, pekerjaan, domisili, wa, penghasilan, status_rumah, alamat
            ) VALUES (
                :santri_id, :tipe, :status_hidup, :nama, :nik, :tempat_lahir, :tanggal_lahir, 
                :pendidikan, :pekerjaan, :domisili, :wa, :penghasilan, :status_rumah, :alamat
            )";
            $stmtO = $this->conn->prepare($queryOrtu);

            $insertOrtu = function($tipe, $ortuData) use ($stmtO, $id) {
                if (!$ortuData) return;
                $stmtO->execute([
                    ':santri_id' => $id,
                    ':tipe' => $tipe,
                    ':status_hidup' => $ortuData->status_hidup ?? null,
                    ':nama' => $ortuData->nama ?? null,
                    ':nik' => $ortuData->nik ?? null,
                    ':tempat_lahir' => $ortuData->tempat_lahir ?? null,
                    ':tanggal_lahir' => !empty($ortuData->tanggal_lahir) ? $ortuData->tanggal_lahir : null,
                    ':pendidikan' => $ortuData->pendidikan ?? null,
                    ':pekerjaan' => $ortuData->pekerjaan ?? null,
                    ':domisili' => $ortuData->domisili ?? null,
                    ':wa' => $ortuData->wa ?? null,
                    ':penghasilan' => $ortuData->penghasilan ?? null,
                    ':status_rumah' => $ortuData->status_rumah ?? null,
                    ':alamat' => $ortuData->alamat ?? null
                ]);
            };

            // Masukkan kembali data Ayah, Ibu, Wali dari payload
            $ortu = $data->orang_tua;
            if (isset($ortu->ayah)) $insertOrtu('Ayah', $ortu->ayah);
            if (isset($ortu->ibu)) $insertOrtu('Ibu', $ortu->ibu);
            if (isset($ortu->wali)) $insertOrtu('Wali', $ortu->wali);

            $this->conn->commit();

            http_response_code(200);
            echo json_encode(["message" => "Biodata berhasil diperbarui."]);

        } catch (PDOException $e) {
            $this->conn->rollBack();
            http_response_code(500);
            echo json_encode(["message" => "Terjadi kesalahan saat menyimpan data: " . $e->getMessage()]);
        }
        exit();
    }
}
?>