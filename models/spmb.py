"""
=============================================================================
SMAN 8 TANJUNG JABUNG TIMUR - MODEL SELEKSI SPMB (PYTHON)
Multi-Tahun Ajaran: 2026/2027, 2027/2028, 2028/2029
=============================================================================
"""

import json
import os
import re
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Dict, List, Optional, Any


class SPMBModel:
    """Model data untuk mengelola dan memproses data seleksi penerimaan siswa baru (SPMB)."""

    BASE_DIR = Path(__file__).resolve().parent.parent
    SPMB_DIR = BASE_DIR / "data_spmb"

    CONFIG = {
        "2026/2027": {
            "excel_file": "data_spmb_2026.xlsx",
            "json_file": "data_spmb_2026.json",
            "open_time": "2026-06-29T05:00:00+07:00"
        },
        "2027/2028": {
            "excel_file": "data_spmb_2027.xlsx",
            "json_file": "data_spmb_2027.json",
            "open_time": "2027-06-29T05:00:00+07:00"
        },
        "2028/2029": {
            "excel_file": "data_spmb_2028.xlsx",
            "json_file": "data_spmb_2028.json",
            "open_time": "2028-06-29T05:00:00+07:00"
        }
    }

    DEFAULT_YEAR = "2026/2027"
    _cache: Dict[str, Dict[str, Any]] = {}

    @classmethod
    def _parse_xlsx_file(cls, file_path: Path) -> List[List[str]]:
        """Membaca berkas .xlsx murni dengan pustaka standar zipfile & XML Python."""
        if not file_path.exists():
            return []

        shared_strings = []
        try:
            with zipfile.ZipFile(file_path, 'r') as z:
                # 1. Baca sharedStrings jika ada
                if 'xl/sharedStrings.xml' in z.namelist():
                    tree = ET.fromstring(z.read('xl/sharedStrings.xml'))
                    for si in tree.findall('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}si'):
                        t = si.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t')
                        if t is not None and t.text:
                            shared_strings.append(t.text)
                        else:
                            texts = [
                                elem.text for elem in si.findall('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t')
                                if elem.text
                            ]
                            shared_strings.append(''.join(texts))

                # 2. Baca sheet1
                if 'xl/worksheets/sheet1.xml' not in z.namelist():
                    return []

                sheet_tree = ET.fromstring(z.read('xl/worksheets/sheet1.xml'))
                rows_data = []
                for row in sheet_tree.findall('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}sheetData/{http://schemas.openxmlformats.org/spreadsheetml/2006/main}row'):
                    row_vals = []
                    for c in row.findall('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}c'):
                        t = c.get('t')
                        v = c.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}v')
                        val = ''
                        if v is not None and v.text is not None:
                            if t == 's':
                                idx = int(v.text)
                                val = shared_strings[idx] if idx < len(shared_strings) else ''
                            else:
                                val = v.text
                        row_vals.append(val)
                    rows_data.append(row_vals)
                return rows_data
        except Exception as err:
            print(f"[SPMBModel] Gagal membaca berkas XLSX {file_path}: {err}")
            return []

    @classmethod
    def load_data(cls, tahun_ajaran: Optional[str] = None, force_reload: bool = False) -> Dict[str, Any]:
        """Memuat dan memetakan data SPMB per tahun ajaran."""
        target_year = tahun_ajaran if tahun_ajaran in cls.CONFIG else cls.DEFAULT_YEAR

        if target_year in cls._cache and not force_reload:
            return cls._cache[target_year]

        config = cls.CONFIG.get(target_year, {})
        excel_path = cls.SPMB_DIR / config.get("excel_file", "")
        json_path = cls.SPMB_DIR / config.get("json_file", "")

        peserta_map: Dict[str, Dict[str, Any]] = {}

        # 1. Coba baca dari Excel
        if excel_path.exists():
            rows = cls._parse_xlsx_file(excel_path)
            if len(rows) >= 2:
                header = [cls._norm(h) for h in rows[0]]
                idx_no = cls._find_col(header, ["no", "nomor", "no pendaftaran", "nopendaftaran"])
                idx_nama = cls._find_col(header, ["nama", "nama siswa", "nama peserta"])
                idx_asal = cls._find_col(header, ["asal sekolah", "asalsekolah", "asal"])
                idx_jalur = cls._find_col(header, ["jalur", "jalur pendaftaran", "jalur masuk"])
                idx_alasan = cls._find_col(header, ["alasan", "keterangan alasan", "keterangan"])

                # Fallback indices jika header tidak terdeteksi
                f_no = idx_no if idx_no != -1 else 0
                f_nama = idx_nama if idx_nama != -1 else 1
                f_asal = idx_asal if idx_asal != -1 else 2
                f_jalur = idx_jalur if idx_jalur != -1 else 3
                f_alasan = idx_alasan if idx_alasan != -1 else 4

                for r in rows[1:]:
                    if not r:
                        continue
                    raw_no = str(r[f_no] if f_no < len(r) else "").strip()
                    if not raw_no:
                        continue
                    
                    # Normalisasi nomor pendaftaran (contoh: 1 -> 001)
                    no_pendaftaran = raw_no.zfill(3) if raw_no.isdigit() else raw_no
                    nama = str(r[f_nama] if f_nama < len(r) else "").strip()
                    asal = str(r[f_asal] if f_asal < len(r) else "").strip()
                    jalur = str(r[f_jalur] if f_jalur < len(r) else "").strip()
                    alasan = str(r[f_alasan] if f_alasan < len(r) else "").strip()

                    peserta_map[no_pendaftaran.upper()] = {
                        "no": no_pendaftaran,
                        "nama": nama,
                        "asalsekolah": asal,
                        "jalur": jalur,
                        "alasan": alasan or "Silahkan ikuti prosedur daftar ulang",
                        "status": "DITERIMA",
                        "tahunAjaran": target_year
                    }

        # 2. Coba baca dari JSON jika belum terisi
        elif json_path.exists():
            try:
                with open(json_path, "r", encoding="utf-8") as f:
                    j_data = json.load(f)
                    if isinstance(j_data, list):
                        for item in j_data:
                            no = str(item.get("no", "")).strip()
                            if no:
                                no_padded = no.zfill(3) if no.isdigit() else no
                                peserta_map[no_padded.upper()] = {
                                    **item,
                                    "no": no_padded,
                                    "status": item.get("status", "DITERIMA"),
                                    "tahunAjaran": target_year
                                }
            except Exception as err:
                print(f"[SPMBModel] Gagal membaca JSON {json_path}: {err}")

        cls._cache[target_year] = peserta_map
        return peserta_map

    @classmethod
    def cari_peserta(cls, query: str, tahun_ajaran: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """
        Mencari data peserta SPMB berdasarkan Nomor Pendaftaran atau Nama.
        
        :param query: No Pendaftaran (cth: '001') atau Nama
        :param tahun_ajaran: Tahun ajaran (cth: '2026/2027')
        :return: Dict data peserta jika ditemukan, atau None
        """
        if not query:
            return None

        target_year = tahun_ajaran if tahun_ajaran in cls.CONFIG else cls.DEFAULT_YEAR
        database = cls.load_data(target_year)

        clean_q = str(query).strip().upper()
        # Coba format pad nomor jika angka (contoh: 1 -> 001)
        padded_q = clean_q.zfill(3) if clean_q.isdigit() else clean_q

        # 1. Cari exact match No Pendaftaran
        if padded_q in database:
            return database[padded_q]
        if clean_q in database:
            return database[clean_q]

        # 2. Cari berdasarkan nama
        for p in database.values():
            if clean_q in str(p.get("nama", "")).strip().upper():
                return p

        return None

    @classmethod
    def get_config(cls, tahun_ajaran: Optional[str] = None) -> Dict[str, Any]:
        """Mengembalikan konfigurasi jadwal & berkas SPMB."""
        target_year = tahun_ajaran if tahun_ajaran in cls.CONFIG else cls.DEFAULT_YEAR
        cfg = cls.CONFIG.get(target_year, {})
        excel_path = cls.SPMB_DIR / cfg.get("excel_file", "")
        
        return {
            "tahunAjaran": target_year,
            "openTime": cfg.get("open_time"),
            "hasDataFile": excel_path.exists(),
            "totalPeserta": len(cls.load_data(target_year))
        }

    @classmethod
    def get_tahun_tersedia(cls) -> List[str]:
        """Daftar tahun ajaran SPMB."""
        return list(cls.CONFIG.keys())

    @classmethod
    def get_statistik(cls) -> Dict[str, Any]:
        """Statistik data peserta SPMB per tahun."""
        stats = {}
        for yr in cls.CONFIG:
            data = cls.load_data(yr)
            stats[yr] = len(data)
        return {
            "total_tahun": len(cls.CONFIG),
            "data_per_tahun": stats,
            "tahun_aktif": cls.DEFAULT_YEAR
        }

    @staticmethod
    def _norm(s: Any) -> str:
        return re.sub(r'[^a-z0-9 ]', '', re.sub(r'\s+', ' ', str(s or '').lower())).strip()

    @classmethod
    def _find_col(cls, header: List[str], needles: List[str]) -> int:
        for nd in needles:
            norm_nd = cls._norm(nd)
            for idx, col in enumerate(header):
                if col == norm_nd:
                    return idx
        for nd in needles:
            norm_nd = cls._norm(nd)
            for idx, col in enumerate(header):
                if norm_nd in col or col in norm_nd:
                    return idx
        return -1


if __name__ == "__main__":
    test_no = "001"
    hasil = SPMBModel.cari_peserta(test_no, "2026/2027")
    print(f"Hasil pencarian No {test_no}:", hasil)
    print("Statistik SPMB:", SPMBModel.get_statistik())
