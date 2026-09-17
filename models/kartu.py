"""
=============================================================================
SMAN 8 TANJUNG JABUNG TIMUR - MODEL KARTU PELAJAR (PYTHON)
Format Berkas: PNG, JPG, JPEG, WEBP
=============================================================================
"""

import os
from pathlib import Path
from typing import Dict, List, Optional, Any


class KartuModel:
    """Model data untuk verifikasi dan pengelolaan berkas kartu pelajar siswa."""

    BASE_DIR = Path(__file__).resolve().parent.parent
    KARTU_DIR = BASE_DIR / "data" / "kartu"
    ALLOWED_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp"]

    MIME_TYPES = {
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".webp": "image/webp"
    }

    @classmethod
    def cari_kartu(cls, nisn: str) -> Optional[Dict[str, Any]]:
        """
        Mencari berkas kartu pelajar siswa berdasarkan NISN.
        
        :param nisn: Nomor Induk Siswa Nasional
        :return: Metadata berkas kartu jika ditemukan, atau None
        """
        if not nisn:
            return None

        clean_nisn = str(nisn).strip()
        if not clean_nisn:
            return None

        if not cls.KARTU_DIR.exists():
            return None

        for ext in cls.ALLOWED_EXTENSIONS:
            file_name = f"{clean_nisn}{ext}"
            file_path = cls.KARTU_DIR / file_name

            # Cek varian huruf kecil & besar pada nama berkas
            if file_path.exists():
                stat = file_path.stat()
                return {
                    "found": True,
                    "nisn": clean_nisn,
                    "fileName": file_name,
                    "url": f"/data/kartu/{file_name}",
                    "fileSize": stat.st_size,
                    "fileSizeFormatted": cls._format_file_size(stat.st_size),
                    "mimeType": cls.MIME_TYPES.get(ext.lower(), "image/png"),
                    "extension": ext.lower()
                }

        # Cek jika ada berkas yang cocok secara case-insensitive
        try:
            for item in cls.KARTU_DIR.iterdir():
                if item.is_file() and item.stem.lower() == clean_nisn.lower() and item.suffix.lower() in cls.ALLOWED_EXTENSIONS:
                    stat = item.stat()
                    return {
                        "found": True,
                        "nisn": clean_nisn,
                        "fileName": item.name,
                        "url": f"/data/kartu/{item.name}",
                        "fileSize": stat.st_size,
                        "fileSizeFormatted": cls._format_file_size(stat.st_size),
                        "mimeType": cls.MIME_TYPES.get(item.suffix.lower(), "image/png"),
                        "extension": item.suffix.lower()
                    }
        except Exception as err:
            print(f"[KartuModel] Peringatan: Gagal memindai folder kartu: {err}")

        return None

    @classmethod
    def list_semua_kartu(cls) -> List[Dict[str, Any]]:
        """Mengembalikan seluruh daftar kartu pelajar yang tersedia."""
        if not cls.KARTU_DIR.exists():
            return []

        kartu_list = []
        try:
            for item in sorted(cls.KARTU_DIR.iterdir()):
                if item.is_file() and item.suffix.lower() in cls.ALLOWED_EXTENSIONS:
                    stat = item.stat()
                    kartu_list.append({
                        "nisn": item.stem,
                        "fileName": item.name,
                        "url": f"/data/kartu/{item.name}",
                        "fileSize": stat.st_size,
                        "fileSizeFormatted": cls._format_file_size(stat.st_size)
                    })
        except Exception as err:
            print(f"[KartuModel] Gagal membaca direktori kartu: {err}")

        return kartu_list

    @classmethod
    def get_statistik(cls) -> Dict[str, Any]:
        """Statistik ketersediaan kartu pelajar."""
        semua = cls.list_semua_kartu()
        return {
            "total_kartu": len(semua),
            "folder": str(cls.KARTU_DIR.relative_to(cls.BASE_DIR) if cls.KARTU_DIR.is_relative_to(cls.BASE_DIR) else cls.KARTU_DIR)
        }

    @staticmethod
    def _format_file_size(size_bytes: int) -> str:
        """Format ukuran berkas menjadi KB / MB yang mudah dibaca."""
        if size_bytes < 1024:
            return f"{size_bytes} B"
        elif size_bytes < 1024 * 1024:
            return f"{size_bytes / 1024:.1f} KB"
        else:
            return f"{size_bytes / (1024 * 1024):.2f} MB"


if __name__ == "__main__":
    test_nisn = "1000289775"
    hasil = KartuModel.cari_kartu(test_nisn)
    print(f"Hasil pencarian Kartu NISN {test_nisn}:", hasil)
    print("Statistik Kartu:", KartuModel.get_statistik())
