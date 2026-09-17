# SMAN 8 Tanjung Jabung Timur - Python Web Application

Aplikasi Web Resmi SMAN 8 Tanjung Jabung Timur berbasis **Python**.

## 🚀 Fitur & Model Python

1. **Model Kelulusan Siswa (`models/kelulusan.py`)**:
   - Pencarian data kelulusan siswa berbasis NISN 10 digit.
   - Mendukung multi-tahun ajaran (2025/2026, 2026/2027, 2027/2028).
   - REST API: `GET /api/kelulusan?nisn=...&tahun=...`

2. **Model Seleksi SPMB (`models/spmb.py`)**:
   - Pengolahan data penerimaan siswa baru langsung dari file Excel `.xlsx` / JSON menggunakan parser Python.
   - REST API: `GET /api/spmb?no=...&tahun=...`

3. **Model Kartu Pelajar (`models/kartu.py`)**:
   - Verifikasi dan penyajian berkas kartu pelajar siswa berbasis NISN (PNG, JPG, JPEG).
   - REST API: `GET /api/kartu?nisn=...`

4. **Python Application Server (`app.py`)**:
   - Web server bawaan Python 3 standar tanpa perlu dependensi tambahan (`pip install`).
   - Menyajikan REST API dan seluruh aset web statis (HTML, CSS, JS, Gambar).

---

## 💻 Cara Menjalankan

### Cara 1: Menggunakan Script Batch (Windows)
Cukup klik dua kali berkas **`run.bat`**.

### Cara 2: Menggunakan Terminal / Command Prompt
```bash
python app.py
```
Akses web melalui browser di: **http://localhost:8000**
