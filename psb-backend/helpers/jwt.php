<?php
require_once __DIR__ . '/../vendor/autoload.php';

use \Firebase\JWT\JWT;
use \Firebase\JWT\Key;

function validateJWT() {
    // Cari header Authorization (kompatibel untuk Apache dan Nginx)
    $headers = apache_request_headers();
    $authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';

    if (!$authHeader && isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
    }

    // Ekstrak token dengan format "Bearer <token>"
    if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
        $token = $matches[1];
        
        // HARUS SAMA dengan secret_key di AuthSiswaController.php saat login
        $secret_key = "KUNCI_RAHASIA_PSB_YANG_SANGAT_AMAN_123!!"; 

        try {
            // Decode token. Jika kedaluwarsa atau diubah, akan melempar Exception
            $decoded = JWT::decode($token, new Key($secret_key, 'HS256'));
            
            // Kembalikan objek data (id, nisn, role, dll) yang kita set saat login
            return $decoded->data; 
            
        } catch (Exception $e) {
            http_response_code(401);
            echo json_encode([
                "message" => "Sesi Anda telah habis atau tidak valid. Silakan login kembali.",
                "error" => $e->getMessage()
            ]);
            exit();
        }
    } else {
        http_response_code(401);
        echo json_encode(["message" => "Akses ditolak. Token autentikasi tidak ditemukan."]);
        exit();
    }
}
?>