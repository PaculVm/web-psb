<?php
require_once __DIR__ . '/../config/db.php';

class PendaftaranController {
    private $conn;

    public function __construct() {
        global $conn;
        $this->conn = $conn;
    }

    public function store() {
        $data = json_decode(file_get_contents("php://input"));

        if (!isset($data->santri)) {
            http_response_code(400);
            echo json_encode(["message" => "Data pendaftaran tidak lengkap."]);
            exit();
        }

        try {
            // Memulai Transaksi Database
            $this->conn->beginTransaction();

            // 1. Generate Nomor Pendaftaran
            $date_prefix = date("Ymd");
            $stmt_count = $this->conn->query("SELECT COUNT(*) FROM santri WHERE nomor_pendaftaran LIKE 'PSB-$date_prefix-%'");
            $count = $stmt_count->fetchColumn() + 1;
            $nomor_pendaftaran = "PSB-" . $date_prefix . "-" . str_pad($count, 3, "0", STR_PAD_LEFT);

            // 2. Insert ke Tabel Santri
            $s = $data->santri;
            $querySantri = "INSERT INTO santri (
                nomor_pendaftaran, nama_lengkap, nisn, tempat_lahir, tanggal_lahir, 
                jenis_kelamin, nik, agama, pendidikan_terakhir, asal_sekolah, alamat_lengkap
            ) VALUES (
                :nomor_pendaftaran, :nama_lengkap, :nisn, :tempat_lahir, :tanggal_lahir, 
                :jenis_kelamin, :nik, :agama, :pendidikan_terakhir, :asal_sekolah, :alamat_lengkap
            )";

            $stmtS = $this->conn->prepare($querySantri);
            $stmtS->execute([
                ':nomor_pendaftaran' => $nomor_pendaftaran,
                ':nama_lengkap' => $s->nama_lengkap,
                ':nisn' => $s->nisn,
                ':tempat_lahir' => $s->tempat_lahir,
                ':tanggal_lahir' => $s->tanggal_lahir,
                ':jenis_kelamin' => $s->jenis_kelamin,
                ':nik' => $s->nik,
                ':agama' => $s->agama,
                ':pendidikan_terakhir' => $s->pendidikan_terakhir,
                ':asal_sekolah' => $s->asal_sekolah,
                ':alamat_lengkap' => $s->alamat_lengkap
            ]);

            // Dapatkan ID Santri yang baru saja disimpan
            $santri_id = $this->conn->lastInsertId();

            // 3. Siapkan Query untuk Insert Orang Tua
            $queryOrtu = "INSERT INTO orang_tua (
                santri_id, tipe, status_hidup, nama, nik, tempat_lahir, tanggal_lahir, 
                pendidikan, pekerjaan, domisili, wa, penghasilan, status_rumah, alamat
            ) VALUES (
                :santri_id, :tipe, :status_hidup, :nama, :nik, :tempat_lahir, :tanggal_lahir, 
                :pendidikan, :pekerjaan, :domisili, :wa, :penghasilan, :status_rumah, :alamat
            )";
            $stmtO = $this->conn->prepare($queryOrtu);

            // Fungsi Helper untuk Insert per Tipe (Ayah/Ibu/Wali)
            $insertOrtu = function($tipe, $ortuData) use ($stmtO, $santri_id) {
                if (!$ortuData) return;
                $stmtO->execute([
                    ':santri_id' => $santri_id,
                    ':tipe' => $tipe,
                    ':status_hidup' => $ortuData->status ?? null,
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

            // Insert Ayah, Ibu, dan Wali
            if (isset($data->ayah)) $insertOrtu('Ayah', $data->ayah);
            if (isset($data->ibu)) $insertOrtu('Ibu', $data->ibu);
            if (isset($data->wali)) $insertOrtu('Wali', $data->wali);

            // Simpan permanen jika semua operasi di atas sukses
            $this->conn->commit();

            http_response_code(201);
            echo json_encode([
                "message" => "Pendaftaran berhasil.",
                "nomor_pendaftaran" => $nomor_pendaftaran
            ]);

        } catch (PDOException $e) {
            // Batalkan semua insert jika ada salah satu yang error
            $this->conn->rollBack();
            http_response_code(500);
            echo json_encode(["message" => "Terjadi kesalahan saat menyimpan data: " . $e->getMessage()]);
        }
        exit();
    }
}
?>