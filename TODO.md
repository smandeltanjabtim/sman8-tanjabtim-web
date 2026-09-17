# TODO - Responsif & Pembaruan UI/UX (Mobile & Desktop)

## Rencana Perubahan
- [x] Audit style: cek seluruh nilai px fixed yang berpotensi tidak responsif pada `style.css`, `css/style_cek.css`, `css/style_kllsn.css`, `css/style_spmb.css`, `css/style_kartu.css`
- [x] Samakan strategi responsif: gunakan `clamp()` dan satuan relatif (`rem`, `vw`, `vh`, `%`) untuk font/padding/margin
- [x] Rapikan kontainer dan grid: pastikan tidak ada `max-width`/height fixed yang membuat layout tidak nyaman di ultra-wide
- [x] Tambahkan rule umum untuk viewport sangat kecil (mendukung 320px+): cegah elemen overflow horizontal dan pastikan tombol/input proporsional
- [x] Tambahkan rule untuk ultra-wide: scaling elemen penting tetap proporsional tanpa banyak breakpoint
- [x] Standarisasi Navbar & Hamburger menu mobile interaktif di semua halaman
- [x] Standarisasi Footer terpadu di seluruh halaman web
- [x] Tambahkan Card ke-3 pada pengumuman.html untuk Unduh Kartu Pelajar Siswa
- [x] Buat halaman kartu.html, script_kartu.js, dan css/style_kartu.css dengan integrasi data/kartu
- [x] Samakan layout countdown cek_spmb.html dengan kelulusan.html (form disembunyikan saat lock aktif)
- [x] Samakan lebar kontainer navbar desktop di cek_spmb, kelulusan, dan kartu dengan index & pengumuman (1240px)
- [x] Tambahkan fitur filter Tahun Ajaran (2025/2026 s/d 2027/2028 kelulusan & 2026/2027 s/d 2028/2029 SPMB)
- [x] Satukan seluruh footer di semua halaman menjadi 1 file terpusat (`footer.html` & `footer.js`)
- [x] Satukan seluruh navbar di semua halaman menjadi 1 file terpusat (`navbar.html` & `navbar.js`)
- [x] Migrasi seluruh model data dan backend ke Python murni (`models/kelulusan.py`, `models/spmb.py`, `models/kartu.py`)
- [x] Bangun server aplikasi web Python (`app.py`) dan launcher (`run.bat`)
- [x] Hubungkan antarmuka frontend (Kelulusan, SPMB, Kartu) ke API REST Model Python

## Implementasi
- [x] Edit `style.css` & `index.html` & `script.js` (Beranda & Profil)
- [x] Edit `css/style_spmb.css` & `pengumuman.html` & `script_spmb.js` (Portal Pengumuman)
- [x] Edit `css/style_cek.css` & `cek_spmb.html` & `spmb-check.js` (Cek SPMB & Multi Tahun Ajaran)
- [x] Edit `css/style_kllsn.css` & `kelulusan.html` & `js/main_kllsn.js` & `js/database_kllsn.js` (Cek Kelulusan & Multi Tahun Ajaran)
- [x] Buat `css/style_kartu.css` & `kartu.html` & `script_kartu.js` (Unduh Kartu Pelajar)
- [x] Buat `footer.html` & `footer.js` dan hubungkan ke 5 halaman (index, pengumuman, cek_spmb, kelulusan, kartu)
- [x] Buat `navbar.html` & `navbar.js` dan hubungkan ke 5 halaman (index, pengumuman, cek_spmb, kelulusan, kartu)
- [x] Buat `models/kelulusan.py`, `models/spmb.py`, `models/kartu.py`, `models/__init__.py`
- [x] Buat `app.py`, `run.bat`, dan `README.md`
- [x] Hubungkan `js/main_kllsn.js`, `spmb-check.js`, `script_kartu.js` ke API Python

## Testing & Verifikasi
- [x] Cek di layar kecil (320px, 375px, 414px)
- [x] Cek di tablet (768px, 1024px)
- [x] Cek di desktop (1280px, 1440px)
- [x] Cek di ultra-wide (2000px+)
- [x] Verifikasi koneksi footer dan navbar terpusat di seluruh halaman
- [x] Jalankan automated test suite untuk seluruh Model Python (Kelulusan, SPMB, Kartu)
- [x] Uji seluruh endpoint REST API Python (`/api/kelulusan`, `/api/spmb`, `/api/kartu`, `/api/health`)
