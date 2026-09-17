"""
=============================================================================
SMAN 8 TANJUNG JABUNG TIMUR - MODEL KELULUSAN SISWA (PYTHON)
Multi-Tahun Ajaran: 2025/2026, 2026/2027, 2027/2028
=============================================================================
"""

import json
import os
from pathlib import Path
from typing import Dict, List, Optional, Any


class KelulusanModel:
    """Model data untuk mengelola status kelulusan siswa SMAN 8 Tanjung Jabung Timur."""

    DATA_FILE = Path(__file__).resolve().parent.parent / "data" / "siswa_kllsn.json"
    AVAILABLE_YEARS = ["2025/2026", "2026/2027", "2027/2028"]
    DEFAULT_YEAR = "2025/2026"

    _cached_data: Optional[Dict[str, List[Dict[str, Any]]]] = None

    @classmethod
    def load_data(cls, force_reload: bool = False) -> Dict[str, List[Dict[str, Any]]]:
        """Memuat data siswa dari berkas JSON."""
        if cls._cached_data is not None and not force_reload:
            return cls._cached_data

        data: Dict[str, List[Dict[str, Any]]] = {year: [] for year in cls.AVAILABLE_YEARS}

        if cls.DATA_FILE.exists():
            try:
                with open(cls.DATA_FILE, "r", encoding="utf-8") as f:
                    file_data = json.load(f)
                    if isinstance(file_data, dict):
                        for year in cls.AVAILABLE_YEARS:
                            data[year] = file_data.get(year, [])
            except Exception as err:
                print(f"[KelulusanModel] Peringatan: Gagal membaca {cls.DATA_FILE}: {err}")

        cls._cached_data = data
        return data

    @classmethod
    def cari_siswa(cls, nisn: str, tahun_ajaran: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """
        Mencari data kelulusan siswa berdasarkan NISN dan Tahun Ajaran.
        
        :param nisn: Nomor Induk Siswa Nasional (10 digit)
        :param tahun_ajaran: Tahun ajaran (cth: '2025/2026')
        :return: Dict data siswa jika ditemukan, atau None
        """
        if not nisn:
            return None

        clean_nisn = str(nisn).strip().upper()
        target_year = tahun_ajaran if tahun_ajaran in cls.AVAILABLE_YEARS else cls.DEFAULT_YEAR

        database = cls.load_data()
        daftar_siswa = database.get(target_year, [])

        for siswa in daftar_siswa:
            if str(siswa.get("nisn", "")).strip().upper() == clean_nisn:
                return {
                    "nisn": siswa.get("nisn"),
                    "nama": siswa.get("nama"),
                    "status": siswa.get("status", "LULUS"),
                    "tahunAjaran": target_year,
                    "keterangan": siswa.get("keterangan", "Dinyatakan LULUS dari SMAN 8 Tanjung Jabung Timur")
                }

        return None

    @classmethod
    def get_tahun_tersedia(cls) -> List[str]:
        """Mengembalikan daftar tahun ajaran yang didukung."""
        return list(cls.AVAILABLE_YEARS)

    @classmethod
    def get_statistik(cls) -> Dict[str, Any]:
        """Mengembalikan statistik jumlah siswa per tahun ajaran."""
        data = cls.load_data()
        stats = {
            year: len(data.get(year, []))
            for year in cls.AVAILABLE_YEARS
        }
        return {
            "total_tahun": len(cls.AVAILABLE_YEARS),
            "data_per_tahun": stats,
            "tahun_aktif": cls.DEFAULT_YEAR
        }

    @classmethod
    def is_valid_nisn(cls, nisn: str) -> bool:
        """Validasi format NISN 10 digit angka."""
        if not isinstance(nisn, str):
            nisn = str(nisn)
        nisn = nisn.strip()
        return len(nisn) == 10 and nisn.isdigit()


if __name__ == "__main__":
    test_nisn = "0081335737"
    hasil = KelulusanModel.cari_siswa(test_nisn, "2025/2026")
    print(f"Hasil pencarian NISN {test_nisn}:", hasil)
    print("Statistik:", KelulusanModel.get_statistik())
