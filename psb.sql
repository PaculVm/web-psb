-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Feb 24, 2026 at 05:28 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.1.25

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `psb`
--

-- --------------------------------------------------------

--
-- Table structure for table `admins`
--

CREATE TABLE `admins` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `nama_lengkap` varchar(100) NOT NULL,
  `role` enum('admin','validator') NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `admins`
--

INSERT INTO `admins` (`id`, `username`, `password`, `nama_lengkap`, `role`, `created_at`) VALUES
(1, 'superadmin', '$2y$10$/ViHyrNgO7AwqqFa9C/NfedIwuZiJ0zG0Ik2nmzLRNKkpGsIoJxHO', 'Admin Utama', 'admin', '2026-02-23 21:14:12'),
(2, 'validator1', '$2y$10$IyCpcdoP9muFFgG2DR7ZGuN3AimgzpUJBIoIERJWud1P.yyHWA3uG', 'Admin Verifikator', 'validator', '2026-02-23 21:14:12');

-- --------------------------------------------------------

--
-- Table structure for table `dokumen_santri`
--

CREATE TABLE `dokumen_santri` (
  `id` int(11) NOT NULL,
  `santri_id` int(11) NOT NULL,
  `jenis_dokumen` varchar(50) NOT NULL,
  `file_path` varchar(255) NOT NULL,
  `file_type` varchar(50) DEFAULT NULL,
  `uploaded_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `orang_tua`
--

CREATE TABLE `orang_tua` (
  `id` int(11) NOT NULL,
  `santri_id` int(11) NOT NULL,
  `tipe` enum('Ayah','Ibu','Wali') NOT NULL,
  `status_hidup` varchar(20) DEFAULT NULL,
  `nama` varchar(100) DEFAULT NULL,
  `nik` varchar(16) DEFAULT NULL,
  `tempat_lahir` varchar(50) DEFAULT NULL,
  `tanggal_lahir` date DEFAULT NULL,
  `pendidikan` varchar(30) DEFAULT NULL,
  `pekerjaan` varchar(50) DEFAULT NULL,
  `domisili` varchar(50) DEFAULT NULL,
  `wa` varchar(20) DEFAULT NULL,
  `penghasilan` varchar(30) DEFAULT NULL,
  `status_rumah` varchar(30) DEFAULT NULL,
  `alamat` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `orang_tua`
--

INSERT INTO `orang_tua` (`id`, `santri_id`, `tipe`, `status_hidup`, `nama`, `nik`, `tempat_lahir`, `tanggal_lahir`, `pendidikan`, `pekerjaan`, `domisili`, `wa`, `penghasilan`, `status_rumah`, `alamat`) VALUES
(1, 1, 'Ayah', 'Meninggal', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(2, 1, 'Ibu', 'Meninggal', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(3, 1, 'Wali', NULL, 'Wali', '1234567890123456', NULL, NULL, NULL, 'Kerja', NULL, '081123456789', '< 1 Juta', NULL, 'Alamat');

-- --------------------------------------------------------

--
-- Table structure for table `santri`
--

CREATE TABLE `santri` (
  `id` int(11) NOT NULL,
  `nomor_pendaftaran` varchar(20) NOT NULL,
  `nama_lengkap` varchar(100) NOT NULL,
  `nisn` varchar(20) NOT NULL,
  `tempat_lahir` varchar(50) NOT NULL,
  `tanggal_lahir` date NOT NULL,
  `jenis_kelamin` enum('Laki-laki','Perempuan') NOT NULL,
  `nik` varchar(16) NOT NULL,
  `agama` varchar(20) NOT NULL,
  `pendidikan_terakhir` varchar(30) NOT NULL,
  `asal_sekolah` varchar(100) NOT NULL,
  `alamat_lengkap` text NOT NULL,
  `status_penerimaan` enum('Menunggu','Proses Seleksi','Diterima','Ditolak') DEFAULT 'Menunggu',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `santri`
--

INSERT INTO `santri` (`id`, `nomor_pendaftaran`, `nama_lengkap`, `nisn`, `tempat_lahir`, `tanggal_lahir`, `jenis_kelamin`, `nik`, `agama`, `pendidikan_terakhir`, `asal_sekolah`, `alamat_lengkap`, `status_penerimaan`, `created_at`) VALUES
(1, 'PSB-20260223-001', 'Siswa 1', '1234567890', 'Kota', '2026-02-01', 'Laki-laki', '1234567890123456', 'Islam', 'SMP/MTs', 'MTs Konoha', 'Alamat', 'Menunggu', '2026-02-23 17:24:02');

-- --------------------------------------------------------

--
-- Table structure for table `web_alur`
--

CREATE TABLE `web_alur` (
  `id` int(11) NOT NULL,
  `title` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `web_alur`
--

INSERT INTO `web_alur` (`id`, `title`) VALUES
(13, 'Isi Formulir'),
(14, 'Login ke Panel Calon Santri'),
(15, 'Unggah Berkas'),
(16, 'Verifikasi & Tes');

-- --------------------------------------------------------

--
-- Table structure for table `web_informasi`
--

CREATE TABLE `web_informasi` (
  `id` int(11) NOT NULL,
  `icon` varchar(20) DEFAULT NULL,
  `title` varchar(100) DEFAULT NULL,
  `description` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `web_informasi`
--

INSERT INTO `web_informasi` (`id`, `icon`, `title`, `description`) VALUES
(10, '🕌', 'Fasilitas Asrama', 'Asrama yang nyaman dan kondusif.'),
(11, '📚', 'Kurikulum Terpadu', 'Perpaduan kurikulum nasional & pesantren.'),
(12, '🏆', 'Ekstrakurikuler', 'Pengembangan minat & bakat santri.');

-- --------------------------------------------------------

--
-- Table structure for table `web_persyaratan`
--

CREATE TABLE `web_persyaratan` (
  `id` int(11) NOT NULL,
  `type` varchar(50) DEFAULT NULL,
  `content` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `web_persyaratan`
--

INSERT INTO `web_persyaratan` (`id`, `type`, `content`) VALUES
(19, 'dokumen', 'Fotokopi SKL/Rapor Semester Terakhir'),
(20, 'dokumen', 'Fotokopi Kartu Keluarga (KK) terbaru'),
(21, 'dokumen', 'Fotokopi Akte Kelahiran'),
(22, 'dokumen', 'Pas Foto 3x4'),
(23, 'ketentuan', 'Beragama Islam'),
(24, 'ketentuan', 'Lulusan jenjang pendidikan sebelumnya');

-- --------------------------------------------------------

--
-- Table structure for table `web_settings`
--

CREATE TABLE `web_settings` (
  `setting_key` varchar(50) NOT NULL,
  `setting_value` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `web_settings`
--

INSERT INTO `web_settings` (`setting_key`, `setting_value`) VALUES
('contact_address', 'Kandang Aur 04/02, Panusupan, Cilongok, Banyumas'),
('contact_desc', 'Jika ada pertanyaan, jangan ragu menghubungi panitia PSB kami.'),
('contact_email', 'ppdarsalcilongok@gmail.com'),
('contact_phone', '-'),
('contact_wa', '6285743487277'),
('footer_about', 'Pondok Pesantren Darussalam Panusupan adalah lembaga pendidikan Islam terpadu yang fokus pada pembentukan akhlak, tahfidz, dan penguasaan teknologi dasar untuk menghadapi tantangan zaman.'),
('footer_copyright', '© 2026 PPDS Panusupan.'),
('hero_background', 'https://tebuireng.online/wp-content/uploads/2026/02/santri-tanpa-pondokPM.jpg'),
('hero_subtitle', 'Tahun Ajaran 2026/2027 Resmi Dibuka. Bergabunglah bersama kami membentuk generasi Rabbani.'),
('hero_title', 'Penerimaan Santri Baru'),
('navbar_logo', 'http://localhost/psb-backend/uploads/images/public_1771897742_8151.png'),
('navbar_text', 'PSB Online'),
('pengumuman_santri', ''),
('title_alur', 'Alur Pendaftaran'),
('title_kontak', 'Hubungi Kami'),
('title_persyaratan', 'Persyaratan Pendaftaran');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admins`
--
ALTER TABLE `admins`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- Indexes for table `dokumen_santri`
--
ALTER TABLE `dokumen_santri`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_dokumen` (`santri_id`,`jenis_dokumen`);

--
-- Indexes for table `orang_tua`
--
ALTER TABLE `orang_tua`
  ADD PRIMARY KEY (`id`),
  ADD KEY `santri_id` (`santri_id`);

--
-- Indexes for table `santri`
--
ALTER TABLE `santri`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nomor_pendaftaran` (`nomor_pendaftaran`);

--
-- Indexes for table `web_alur`
--
ALTER TABLE `web_alur`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `web_informasi`
--
ALTER TABLE `web_informasi`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `web_persyaratan`
--
ALTER TABLE `web_persyaratan`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `web_settings`
--
ALTER TABLE `web_settings`
  ADD PRIMARY KEY (`setting_key`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admins`
--
ALTER TABLE `admins`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `dokumen_santri`
--
ALTER TABLE `dokumen_santri`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `orang_tua`
--
ALTER TABLE `orang_tua`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `santri`
--
ALTER TABLE `santri`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `web_alur`
--
ALTER TABLE `web_alur`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `web_informasi`
--
ALTER TABLE `web_informasi`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `web_persyaratan`
--
ALTER TABLE `web_persyaratan`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `dokumen_santri`
--
ALTER TABLE `dokumen_santri`
  ADD CONSTRAINT `dokumen_santri_ibfk_1` FOREIGN KEY (`santri_id`) REFERENCES `santri` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `orang_tua`
--
ALTER TABLE `orang_tua`
  ADD CONSTRAINT `orang_tua_ibfk_1` FOREIGN KEY (`santri_id`) REFERENCES `santri` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
