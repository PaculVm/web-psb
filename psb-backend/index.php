<?php
require_once __DIR__ . '/helpers/cors.php';
require_once __DIR__ . '/vendor/autoload.php';
require_once __DIR__ . '/routes/api.php';


// ===== HANDLE PREFLIGHT =====
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

