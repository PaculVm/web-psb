<?php
require_once __DIR__ . '/../config/db.php';

class HomeController {
    private $conn;

    public function __construct() {
        global $conn;
        $this->conn = $conn;
    }

    public function getHomeData() {
        try {
            // 1. Ambil Pengaturan Umum (Settings)
            $stmtSettings = $this->conn->query("SELECT setting_key, setting_value FROM web_settings");
            $settings = [];
            while($row = $stmtSettings->fetch(PDO::FETCH_ASSOC)) {
                $settings[$row['setting_key']] = $row['setting_value'];
            }

            // 2. Ambil Data Alur
            $stmtAlur = $this->conn->query("SELECT id, title FROM web_alur ORDER BY id ASC");
            $alur = $stmtAlur->fetchAll(PDO::FETCH_ASSOC);

            // 3. Ambil Data Persyaratan
            $stmtSyarat = $this->conn->query("SELECT id, type, content FROM web_persyaratan ORDER BY id ASC");
            $syarat = $stmtSyarat->fetchAll(PDO::FETCH_ASSOC);

            // 4. Ambil Data Informasi Tambahan
            $stmtInfo = $this->conn->query("SELECT id, icon, title, description FROM web_informasi ORDER BY id ASC");
            $info = $stmtInfo->fetchAll(PDO::FETCH_ASSOC);

            // 5. Susun format JSON
            $homeData = [
                "navbar" => [
                    "text" => $settings['navbar_text'] ?? 'PSB Online',
                    "logo" => $settings['navbar_logo'] ?? ''
                ],
                "pengumuman_santri" => $settings['pengumuman_santri'] ?? '',
                "hero_background" => $settings['hero_background'] ?? '',
                "hero_title" => $settings['hero_title'] ?? '',
                "hero_subtitle" => $settings['hero_subtitle'] ?? '',
                "section_titles" => [
                    "alur" => $settings['title_alur'] ?? 'Alur Pendaftaran',
                    "persyaratan" => $settings['title_persyaratan'] ?? 'Persyaratan',
                    "kontak" => $settings['title_kontak'] ?? 'Kontak'
                ],
                "steps" => $alur,
                "requirements" => $syarat,
                "informations" => $info,
                "contact" => [
                    "description" => $settings['contact_desc'] ?? '',
                    "address" => $settings['contact_address'] ?? '',
                    "phone" => $settings['contact_phone'] ?? '',
                    "email" => $settings['contact_email'] ?? '',
                    "whatsapp" => $settings['contact_wa'] ?? ''
                ],
                "footer" => [
                    "about" => $settings['footer_about'] ?? 'Pesantren unggulan pencetak generasi Rabbani.',
                    "copyright" => $settings['footer_copyright'] ?? '© 2026 Hak Cipta Dilindungi.'
                ]
            ];

            http_response_code(200);
            echo json_encode($homeData);

        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["message" => "Gagal memuat data halaman utama: " . $e->getMessage()]);
        }
        exit();
    }
    
}
?>