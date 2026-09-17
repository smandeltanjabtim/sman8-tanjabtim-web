"""
=============================================================================
SMAN 8 TANJUNG JABUNG TIMUR - PYTHON WEB APPLICATION SERVER
Server Web & REST API Terpadu Menggunakan Pustaka Standar Python 3
=============================================================================
"""

import os
import sys
import json
import urllib.parse
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Dict, Any, Optional

# Import Model Python
from models.kelulusan import KelulusanModel
from models.spmb import SPMBModel
from models.kartu import KartuModel

BASE_DIR = Path(__file__).resolve().parent
DEFAULT_HOST = os.environ.get("HOST", "0.0.0.0")
DEFAULT_PORT = int(os.environ.get("PORT", 8000))


class SMAN8RequestHandler(SimpleHTTPRequestHandler):
    """HTTP Request Handler untuk menyajikan REST API Model Python dan aset web statis."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(BASE_DIR), **kwargs)

    def end_headers(self):
        # Tambahkan header CORS dan security standar
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        super().end_headers()

    def do_OPTIONS(self):
        """Menangani preflight request CORS."""
        self.send_response(HTTPStatus.NO_CONTENT)
        self.end_headers()

    def do_GET(self):
        """Router utama untuk request GET."""
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path
        query_params = urllib.parse.parse_qs(parsed_url.query)

        # 1. Routing REST API
        if path.startswith("/api/"):
            self._handle_api(path, query_params)
            return

        # 2. Routing Halaman Beranda (default index.html)
        if path == "/" or path == "":
            self.path = "/index.html"

        # 3. Sajikan Berkas Statis via SimpleHTTPRequestHandler
        super().do_GET()

    def _handle_api(self, path: str, params: Dict[str, list]):
        """Menangani seluruh endpoint API berbasis Model Python."""
        
        # Endpoint: /api/health
        if path == "/api/health":
            self._send_json(HTTPStatus.OK, {
                "success": True,
                "app": "SMAN 8 Tanjung Jabung Timur Web Server",
                "version": "1.0.0",
                "python_version": sys.version,
                "models": ["KelulusanModel", "SPMBModel", "KartuModel"]
            })
            return

        # Endpoint: /api/kelulusan
        elif path == "/api/kelulusan":
            nisn = self._get_param(params, "nisn")
            tahun = self._get_param(params, "tahun") or KelulusanModel.DEFAULT_YEAR

            if not nisn:
                self._send_json(HTTPStatus.BAD_REQUEST, {
                    "success": False,
                    "message": "Parameter 'nisn' wajib diisi."
                })
                return

            siswa = KelulusanModel.cari_siswa(nisn, tahun)
            if siswa:
                self._send_json(HTTPStatus.OK, {
                    "success": True,
                    "data": siswa
                })
            else:
                self._send_json(HTTPStatus.NOT_FOUND, {
                    "success": False,
                    "message": f"Data kelulusan untuk NISN '{nisn}' pada Tahun Ajaran {tahun} tidak ditemukan."
                })
            return

        # Endpoint: /api/kelulusan/stats
        elif path == "/api/kelulusan/stats":
            stats = KelulusanModel.get_statistik()
            self._send_json(HTTPStatus.OK, {
                "success": True,
                "data": stats
            })
            return

        # Endpoint: /api/spmb
        elif path == "/api/spmb":
            query = self._get_param(params, "no") or self._get_param(params, "np") or self._get_param(params, "query")
            tahun = self._get_param(params, "tahun") or SPMBModel.DEFAULT_YEAR

            if not query:
                self._send_json(HTTPStatus.BAD_REQUEST, {
                    "success": False,
                    "message": "Parameter nomor pendaftaran ('no' atau 'np') wajib diisi."
                })
                return

            peserta = SPMBModel.cari_peserta(query, tahun)
            if peserta:
                self._send_json(HTTPStatus.OK, {
                    "success": True,
                    "data": peserta
                })
            else:
                self._send_json(HTTPStatus.NOT_FOUND, {
                    "success": False,
                    "message": f"Nomor pendaftaran '{query}' tidak ditemukan pada data SPMB TA {tahun}."
                })
            return

        # Endpoint: /api/spmb/config
        elif path == "/api/spmb/config":
            tahun = self._get_param(params, "tahun") or SPMBModel.DEFAULT_YEAR
            config = SPMBModel.get_config(tahun)
            self._send_json(HTTPStatus.OK, {
                "success": True,
                "data": config
            })
            return

        # Endpoint: /api/spmb/stats
        elif path == "/api/spmb/stats":
            stats = SPMBModel.get_statistik()
            self._send_json(HTTPStatus.OK, {
                "success": True,
                "data": stats
            })
            return

        # Endpoint: /api/kartu
        elif path == "/api/kartu":
            nisn = self._get_param(params, "nisn")
            if not nisn:
                self._send_json(HTTPStatus.BAD_REQUEST, {
                    "success": False,
                    "message": "Parameter 'nisn' wajib diisi."
                })
                return

            kartu = KartuModel.cari_kartu(nisn)
            if kartu:
                self._send_json(HTTPStatus.OK, {
                    "success": True,
                    "data": kartu
                })
            else:
                self._send_json(HTTPStatus.NOT_FOUND, {
                    "success": False,
                    "message": f"Berkas kartu pelajar untuk NISN '{nisn}' belum diunggah atau tidak ditemukan."
                })
            return

        # Endpoint: /api/kartu/stats
        elif path == "/api/kartu/stats":
            stats = KartuModel.get_statistik()
            self._send_json(HTTPStatus.OK, {
                "success": True,
                "data": stats
            })
            return

        # Endpoint Tidak Ditemukan
        else:
            self._send_json(HTTPStatus.NOT_FOUND, {
                "success": False,
                "message": f"Endpoint API '{path}' tidak ditemukan."
            })

    def _get_param(self, params: Dict[str, list], key: str) -> Optional[str]:
        """Mengambil nilai parameter query string pertama."""
        vals = params.get(key)
        if vals and len(vals) > 0:
            return vals[0].strip()
        return None

    def _send_json(self, status_code: HTTPStatus, data: Dict[str, Any]):
        """Mengirim response berformat JSON."""
        body = json.dumps(data, ensure_ascii=False, indent=2).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format, *args):
        """Kustomisasi tampilan log request ke console."""
        sys.stderr.write(f"[Python Server] {self.address_string()} - {format % args}\n")


def run_server(host: str = DEFAULT_HOST, port: int = DEFAULT_PORT):
    """Menjalankan HTTP server."""
    server_address = (host, port)
    httpd = ThreadingHTTPServer(server_address, SMAN8RequestHandler)

    print("=" * 65)
    print(" SMAN 8 TANJUNG JABUNG TIMUR - PYTHON SERVER AKTIF")
    print("=" * 65)
    print(f" * Server berjalan di : http://localhost:{port}")
    print(f" * Akses Jaringan Lokal : http://{host}:{port}")
    print(" * Model Python Terhubung:")
    print("   - KelulusanModel  -> /api/kelulusan")
    print("   - SPMBModel       -> /api/spmb")
    print("   - KartuModel      -> /api/kartu")
    print("=" * 65)
    print(" Tekan Ctrl + C untuk menghentikan server.\n")

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[Python Server] Server dimatikan.")
        httpd.server_close()


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="SMAN 8 Tanjabtim Python Server")
    parser.add_argument("--host", default=DEFAULT_HOST, help="Host binding (default: 0.0.0.0)")
    parser.add_argument("--port", type=int, default=DEFAULT_PORT, help="Port binding (default: 8000 or env $PORT)")
    args = parser.parse_args()

    run_server(host=args.host, port=args.port)
