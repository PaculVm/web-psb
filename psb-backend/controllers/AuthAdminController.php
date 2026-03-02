<?php
require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../config/db.php';

use \Firebase\JWT\JWT;

class AuthAdminController {
    private $conn;
    // Gunakan kunci rahasia yang sama dengan AuthSiswaController
    private $secret_key = "KUNCI_RAHASIA_PSB_YANG_SANGAT_AMAN_123!!"; 
    
    public function __construct() {
        global $conn;
        $this->conn = $conn;
    }

    public function login() {
        $data = json_decode(file_get_contents("php://input"));

        if (empty($data->username) || empty($data->password)) {
            http_response_code(400); 
            echo json_encode(["message" => "Username dan password wajib diisi."]);
            exit();
        }

        try {
            $query = "SELECT id, username, password, nama_lengkap, role FROM admins WHERE username = :username LIMIT 1";
            $stmt = $this->conn->prepare($query);
            $stmt->execute([':username' => $data->username]);

            if ($stmt->rowCount() > 0) {
                $admin = $stmt->fetch(PDO::FETCH_ASSOC);

                // Verifikasi Hash Password
                if (password_verify($data->password, $admin['password'])) {
                    
                    // Buat Payload JWT
                    $payload = array(
                        "iss" => "http://localhost:8000",
                        "iat" => time(),
                        "exp" => time() + (60 * 60 * 24), // 1 Hari
                        "data" => array(
                            "id" => $admin['id'],
                            "role" => $admin['role'], // 'admin' atau 'validator'
                            "nama_lengkap" => $admin['nama_lengkap'],
                            "username" => $admin['username']
                        )
                    );

                    $jwt = JWT::encode($payload, $this->secret_key, 'HS256');

                    // Hapus password dari response untuk keamanan
                    unset($admin['password']);

                    http_response_code(200);
                    echo json_encode([
                        "message" => "Login berhasil.",
                        "token" => $jwt,
                        "user" => $admin
                    ]);
                } else {
                    http_response_code(401);
                    echo json_encode(["message" => "Password yang Anda masukkan salah."]);
                }
            } else {
                http_response_code(404);
                echo json_encode(["message" => "Username tidak ditemukan."]);
            }
        } catch (PDOException $e) {
            http_response_code(500); 
            echo json_encode(["message" => "Terjadi kesalahan server: " . $e->getMessage()]);
        }
        exit();
    }
}
?>