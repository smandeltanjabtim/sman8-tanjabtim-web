// ==========================================================================
// SMAN 8 TANJUNG JABUNG TIMUR - SCRIPT KARTU PELAJAR
// ==========================================================================

document.addEventListener("DOMContentLoaded", () => {
    const searchForm = document.getElementById("searchForm");
    const nisnInput = document.getElementById("nisnInput");
    const btnCari = document.getElementById("btnCariKartu");
    const resultDiv = document.getElementById("result");
    const noteDiv = document.getElementById("note");
    const modal = document.getElementById("imageModal");
    const modalImg = document.getElementById("modalImg");
    const modalClose = document.getElementById("modalClose");

    // Extensions to probe
    const SUPPORTED_EXTENSIONS = ["png", "jpg", "jpeg", "PNG", "JPG", "JPEG"];

    function escapeHtml(s) {
        return String(s || "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    // Probe if image exists by loading it
    function probeImage(url) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve({ ok: true, url, width: img.naturalWidth, height: img.naturalHeight });
            img.onerror = () => resolve({ ok: false });
            img.src = url;
        });
    }

    async function findCardImage(nisn) {
        // 1. Coba Query ke API Model Python (/api/kartu)
        try {
            const resp = await fetch(`/api/kartu?nisn=${encodeURIComponent(nisn)}`);
            if (resp.ok) {
                const resJson = await resp.json();
                if (resJson && resJson.success && resJson.data && resJson.data.found) {
                    const data = resJson.data;
                    return {
                        url: data.url,
                        ext: (data.extension || "PNG").replace(".", "").toUpperCase(),
                        fileSize: data.fileSizeFormatted
                    };
                }
            } else if (resp.status === 404) {
                // Berkas memang tidak ada di server Python
                return null;
            }
        } catch (netErr) {
            // Server Python tidak aktif / dibuka lewat file:///, beralih ke probeImage
        }

        // 2. Fallback probeImage di sisi browser
        for (const ext of SUPPORTED_EXTENSIONS) {
            const url = `data/kartu/${nisn}.${ext}`;
            const res = await probeImage(url);
            if (res.ok) {
                return { url, ext: ext.toUpperCase(), width: res.width, height: res.height };
            }
        }
        return null;
    }

    function renderLoading() {
        if (!resultDiv) return;
        resultDiv.innerHTML = `
            <div class="result-loading">
                <i class="fas fa-spinner fa-spin"></i>
                <p style="font-weight:600; margin:0;">Mencari file kartu pelajar untuk NISN terkait...</p>
            </div>
        `;
    }

    function renderResultFound(nisn, studentData, cardInfo) {
        if (!resultDiv) return;

        const studentName = studentData ? studentData.nama : `Siswa NISN ${nisn}`;
        const downloadFileName = `Kartu_Pelajar_${nisn}.${cardInfo.ext.toLowerCase()}`;

        resultDiv.innerHTML = `
            <div class="result-card-kartu">
                <div style="text-align:center;">
                    <div class="result-badge-kartu">
                        <i class="fas fa-check-circle"></i>
                        <span>KARTU PELAJAR DITEMUKAN & TERVERIFIKASI</span>
                    </div>
                    <h2 class="student-name-title">${escapeHtml(studentName)}</h2>
                </div>

                <!-- Preview Box -->
                <div class="kartu-preview-wrapper">
                    <div class="kartu-img-box" id="cardPreviewContainer">
                        <img src="${cardInfo.url}" alt="Kartu Pelajar ${escapeHtml(nisn)}" id="cardPreviewImg" loading="lazy" />
                    </div>
                </div>

                <!-- Meta Details -->
                <div class="kartu-meta-grid">
                    <div class="kartu-meta-item">
                        <span class="meta-label">Nomor Induk Siswa Nasional</span>
                        <span class="meta-value">${escapeHtml(nisn)}</span>
                    </div>
                    <div class="kartu-meta-item">
                        <span class="meta-label">Satuan Pendidikan</span>
                        <span class="meta-value">SMAN 8 Tanjab Timur</span>
                    </div>
                    <div class="kartu-meta-item">
                        <span class="meta-label">Format File</span>
                        <span class="meta-value" style="color:#6ee7b7;">${escapeHtml(cardInfo.ext)} (${cardInfo.width}x${cardInfo.height} px)</span>
                    </div>
                    <div class="kartu-meta-item">
                        <span class="meta-label">Status Dokumen</span>
                        <span class="meta-value" style="color:#34d399;">Siap Diunduh / Dicetak</span>
                    </div>
                </div>

                <!-- Action Buttons -->
                <div class="kartu-actions-group">
                    <a href="${cardInfo.url}" download="${downloadFileName}" class="btn-download" id="btnDownload">
                        <i class="fas fa-download"></i>
                        <span>Unduh Kartu (${escapeHtml(cardInfo.ext)})</span>
                    </a>
                    <button type="button" class="btn-preview-modal" id="btnOpenModal">
                        <i class="fas fa-expand"></i>
                        <span>Lihat Ukuran Penuh</span>
                    </button>
                    <button type="button" class="btn-preview-modal" id="btnPrintCard" style="background:rgba(255,255,255,0.06);">
                        <i class="fas fa-print"></i>
                        <span>Cetak Dokumen</span>
                    </button>
                </div>

                <div class="result-notice">
                    <strong><i class="fas fa-info-circle"></i> Petunjuk Penggunaan:</strong><br>
                    Kartu Pelajar ini adalah dokumen identitas siswa resmi <strong>SMAN 8 Tanjung Jabung Timur</strong>. Anda dapat mengunduh gambar dengan resolusi asli untuk disimpan atau dicetak pada kartu PVC / kertas foto.
                </div>
            </div>
        `;

        // Attach event listeners for Modal & Print
        const btnOpenModal = document.getElementById("btnOpenModal");
        if (btnOpenModal && modal && modalImg) {
            btnOpenModal.addEventListener("click", () => {
                modalImg.src = cardInfo.url;
                modal.classList.add("active");
                document.body.style.overflow = "hidden";
            });
        }

        const cardPreviewImg = document.getElementById("cardPreviewImg");
        if (cardPreviewImg && modal && modalImg) {
            cardPreviewImg.style.cursor = "zoom-in";
            cardPreviewImg.addEventListener("click", () => {
                modalImg.src = cardInfo.url;
                modal.classList.add("active");
                document.body.style.overflow = "hidden";
            });
        }

        const btnPrintCard = document.getElementById("btnPrintCard");
        if (btnPrintCard) {
            btnPrintCard.addEventListener("click", () => {
                const printWindow = window.open("", "_blank");
                if (printWindow) {
                    printWindow.document.write(`
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <title>Cetak Kartu Pelajar - ${escapeHtml(nisn)}</title>
                            <style>
                                body {
                                    margin: 0;
                                    padding: 20px;
                                    display: flex;
                                    flex-direction: column;
                                    align-items: center;
                                    justify-content: center;
                                    min-height: 100vh;
                                    font-family: sans-serif;
                                }
                                img {
                                    max-width: 85.6mm; /* Standard ID card width */
                                    height: auto;
                                    box-shadow: 0 4px 10px rgba(0,0,0,0.15);
                                    border-radius: 8px;
                                }
                                @media print {
                                    body { padding: 0; }
                                    img { max-width: 85.6mm; box-shadow: none; }
                                }
                            </style>
                        </head>
                        <body>
                            <img src="${cardInfo.url}" alt="Kartu Pelajar" onload="window.print();" />
                        </body>
                        </html>
                    `);
                    printWindow.document.close();
                }
            });
        }
    }

    function renderResultNotFound(nisn) {
        if (!resultDiv) return;
        resultDiv.innerHTML = `
            <div class="result-card-error">
                <i class="fas fa-id-card-alt"></i>
                <h3>Kartu Pelajar Belum Ditemukan</h3>
                <p>
                    File kartu pelajar untuk NISN <strong>${escapeHtml(nisn)}</strong> belum tersedia di sistem (data/kartu).<br>
                    Pastikan nomor NISN yang dimasukkan sudah benar atau hubungi admin sekolah / bagian tata usaha SMAN 8 Tanjung Jabung Timur untuk informasi penerbitan kartu.
                </p>
            </div>
        `;
    }

    function renderValidationError(message) {
        if (!resultDiv) return;
        resultDiv.innerHTML = `
            <div class="result-card-error">
                <i class="fas fa-exclamation-circle"></i>
                <h3>Pemeriksaan NISN</h3>
                <p>${message}</p>
            </div>
        `;
    }

    // Main Search Handler
    async function handleSearch(e) {
        if (e && e.preventDefault) e.preventDefault();
        if (noteDiv) noteDiv.textContent = "";

        const nisn = (nisnInput.value || "").trim();

        if (!nisn) {
            if (noteDiv) noteDiv.textContent = "Silakan masukkan NISN Anda.";
            nisnInput.focus();
            return;
        }

        // NISN should be numeric, minimum 5-10 chars
        if (!/^\d{5,15}$/.test(nisn)) {
            renderValidationError("Format NISN harus berupa angka (contoh: 0081335737 atau 1000289776).");
            return;
        }

        renderLoading();
        if (btnCari) btnCari.disabled = true;

        try {
            // Check student info from database if available
            let studentData = null;
            if (typeof SiswaDB !== "undefined" && SiswaDB.findSiswa) {
                studentData = SiswaDB.findSiswa(nisn);
            }

            // Probe image in data/kartu/
            const cardInfo = await findCardImage(nisn);

            if (cardInfo) {
                renderResultFound(nisn, studentData, cardInfo);
            } else {
                renderResultNotFound(nisn);
            }
        } catch (err) {
            console.error("Error searching card:", err);
            renderValidationError("Terjadi kesalahan saat memproses data. Silakan coba lagi.");
        } finally {
            if (btnCari) btnCari.disabled = false;
        }
    }

    // Modal Close handlers
    if (modal && modalClose) {
        modalClose.addEventListener("click", () => {
            modal.classList.remove("active");
            document.body.style.overflow = "";
        });

        modal.addEventListener("click", (e) => {
            if (e.target === modal) {
                modal.classList.remove("active");
                document.body.style.overflow = "";
            }
        });

        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && modal.classList.contains("active")) {
                modal.classList.remove("active");
                document.body.style.overflow = "";
            }
        });
    }

    // Form Event Listeners
    if (searchForm) {
        searchForm.addEventListener("submit", handleSearch);
    }

    if (nisnInput) {
        nisnInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                handleSearch(e);
            }
        });
    }
});
