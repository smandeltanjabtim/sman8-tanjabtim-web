// ==========================================================================
// SMAN 8 TANJUNG JABUNG TIMUR - SPMB CHECKER SCRIPT
// Multi-Tahun Ajaran (2025/2026, 2026/2027, 2027/2028)
// ==========================================================================

// 1. KONFIGURASI TAHUN AJARAN & JADWAL PEMBUKAAN
const SPMB_CONFIG = {
    "2026/2027": {
        excelPath: "data_spmb/data_spmb_2026.xlsx",
        openTime: new Date("2026-06-29T05:00:00+07:00") // Countdown SPMB TA 2026/2027
    },
    "2027/2028": {
        excelPath: "data_spmb/data_spmb_2027.xlsx",
        openTime: new Date("2027-06-29T05:00:00+07:00") // Countdown SPMB TA 2027/2028
    },
    "2028/2029": {
        excelPath: "data_spmb/data_spmb_2028.xlsx",
        openTime: new Date("2028-06-29T05:00:00+07:00") // Countdown SPMB TA 2028/2029
    }
};

let currentYear = "2026/2027";
let countdownInterval = null;
const dataCache = {};
let loadingData = false;

// 2. DOM ELEMENTS
const yearBadge = document.getElementById("yearBadge");
const yearPills = document.querySelectorAll(".year-pill");
const lockDiv = document.getElementById("lock");
const appDiv = document.getElementById("app");
const searchForm = document.getElementById("searchForm");
const npInput = document.getElementById("npInput");
const btnCek = document.getElementById("btnCek");
const resultDiv = document.getElementById("result");
const countdownSub = document.getElementById("countdownSub");
const noteDiv = document.getElementById("note");

// 3. UTILITAS
function setLocked(lock) {
    if (npInput) npInput.disabled = lock;
    if (btnCek) btnCek.disabled = lock;
}

function updateTimeDisplay(id, value) {
    const el = document.getElementById(id);
    if (el) {
        el.textContent = value.toString().padStart(2, "0");
    }
}

function escapeHtml(s) {
    return String(s || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

// 4. COUNTDOWN SYSTEM PER TAHUN AJARAN
function updateCountdownForYear(year) {
    stopCountdown();

    const config = SPMB_CONFIG[year] || SPMB_CONFIG["2026/2027"];
    const targetTime = config.openTime;
    const now = Date.now();
    const diff = targetTime.getTime() - now;

    if (diff > 0) {
        setLocked(true);
        if (lockDiv) {
            lockDiv.style.display = "block";
            lockDiv.style.opacity = "1";
            lockDiv.style.transform = "none";
        }
        if (appDiv) appDiv.style.display = "none";

        const tick = () => {
            const currentDiff = targetTime.getTime() - Date.now();
            if (currentDiff <= 0) {
                stopCountdown();
                setLocked(false);
                if (lockDiv) {
                    lockDiv.style.transition = "all .6s ease";
                    lockDiv.style.opacity = "0";
                    lockDiv.style.transform = "translateY(-10px)";
                    setTimeout(() => {
                        lockDiv.style.display = "none";
                        showApp();
                    }, 600);
                } else {
                    showApp();
                }
                return;
            }

            const totalSeconds = Math.floor(currentDiff / 1000);
            const days = Math.floor(totalSeconds / 86400);
            const hours = Math.floor((totalSeconds % 86400) / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;

            updateTimeDisplay("days", days);
            updateTimeDisplay("hours", hours);
            updateTimeDisplay("minutes", minutes);
            updateTimeDisplay("seconds", seconds);
        };

        tick();
        countdownInterval = setInterval(tick, 1000);
    } else {
        setLocked(false);
        showApp();
    }
}

function stopCountdown() {
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }
}

function showApp() {
    if (lockDiv) lockDiv.style.display = "none";
    if (appDiv) {
        appDiv.style.display = "block";
        appDiv.style.opacity = "1";
    }
    setLocked(false);
    if (npInput) npInput.focus();
}

// 5. YEAR SWITCHER HANDLER
function setAcademicYear(year) {
    if (!["2026/2027", "2027/2028", "2028/2029"].includes(year)) return;
    currentYear = year;

    // Update active pill
    yearPills.forEach(pill => {
        if (pill.dataset.year === year) {
            pill.classList.add("active");
        } else {
            pill.classList.remove("active");
        }
    });

    // Update Header Badge
    if (yearBadge) {
        yearBadge.innerHTML = `<i class="fas fa-calendar-alt"></i> <span>Tahun Ajaran ${escapeHtml(year)}</span>`;
    }

    // Reset Result and Form
    if (resultDiv) resultDiv.innerHTML = "";
    if (noteDiv) noteDiv.textContent = "";
    if (npInput) npInput.value = "";

    // Re-check countdown for the selected year
    updateCountdownForYear(year);
}

function initYearSwitcher() {
    yearPills.forEach(pill => {
        pill.addEventListener("click", () => {
            const year = pill.dataset.year;
            setAcademicYear(year);
        });
    });
}

// 6. EXCEL PARSER & DATA LOADER PER TAHUN
function renderLoading() {
    if (!resultDiv) return;
    resultDiv.innerHTML = `
        <div style="text-align:center; padding: 24px; color:#93c5fd; background:rgba(37,99,235,0.1); border-radius:14px; border:1px solid rgba(59,130,246,0.3);">
            <i class="fas fa-spinner fa-spin" style="font-size:1.8rem; margin-bottom:8px;"></i>
            <p style="font-weight:600; margin:0;">Memuat data seleksi SPMB (TA ${escapeHtml(currentYear)})...</p>
        </div>
    `;
}

async function loadExcelDataForYear(year) {
    if (dataCache[year]) return dataCache[year];

    const config = SPMB_CONFIG[year];
    if (!config) throw new Error("Konfigurasi tahun ajaran tidak ditemukan");

    loadingData = true;
    renderLoading();

    try {
        const resp = await fetch(config.excelPath, { cache: "no-store" });
        if (!resp.ok) {
            if (resp.status === 404) {
                // File belum diunggah untuk tahun ajaran ini
                dataCache[year] = { notFoundOnServer: true };
                return dataCache[year];
            }
            throw new Error(`Gagal memuat data (HTTP ${resp.status})`);
        }

        const arrayBuffer = await resp.arrayBuffer();
        const wb = XLSX.read(arrayBuffer, { type: "array" });
        const sheetName = wb.SheetNames[0];
        const ws = wb.Sheets[sheetName];

        const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: "" });

        const norm = (s) => String(s ?? "")
            .toLowerCase()
            .replaceAll(/\s+/g, " ")
            .replaceAll(/[^a-z0-9 ]/g, "")
            .trim();

        if (!rows || rows.length < 2) {
            dataCache[year] = {};
            return dataCache[year];
        }

        const headerRow = rows[0] || [];

        const findIndexByAny = (needles) => {
            const h = headerRow.map(norm);
            for (const nd of needles) {
                const ndn = norm(nd);
                const idx = h.findIndex((x) => x === ndn);
                if (idx !== -1) return idx;
            }
            for (const nd of needles) {
                const ndn = norm(nd);
                const idx = h.findIndex((x) => x.includes(ndn) || ndn.includes(x));
                if (idx !== -1) return idx;
            }
            return -1;
        };

        const idxNo = findIndexByAny(["no", "nomor", "no pendaftaran", "nomor pendaftaran", "nopendaftaran"]);
        const idxAsalSekolah = findIndexByAny(["asal sekolah", "asalsekolah", "asal"]);
        const idxJalur = findIndexByAny(["jalur", "jalur pendaftaran", "jalur masuk"]);
        const idxAlasan = findIndexByAny(["alasan", "keterangan alasan", "keterangan"]);
        const idxNama = findIndexByAny(["nama", "nama siswa", "nama peserta"]);

        const fallbackIdx = { no: 0, asal: 1, jalur: 2, alasan: 3, nama: -1 };
        const finalIdxNo = idxNo !== -1 ? idxNo : fallbackIdx.no;
        const finalIdxAsalSekolah = idxAsalSekolah !== -1 ? idxAsalSekolah : fallbackIdx.asal;
        const finalIdxJalur = idxJalur !== -1 ? idxJalur : fallbackIdx.jalur;
        const finalIdxAlasan = idxAlasan !== -1 ? idxAlasan : fallbackIdx.alasan;
        const finalIdxNama = idxNama !== -1 ? idxNama : fallbackIdx.nama;

        const map = {};

        for (let i = 1; i < rows.length; i++) {
            const r = rows[i];
            if (!r || r.length === 0) continue;

            let no = String(r[finalIdxNo] ?? "").trim();
            if (!no) continue;
            if (/^\d+$/.test(no)) {
                no = no.padStart(3, "0");
            }

            const asalsekolah = String(r[finalIdxAsalSekolah] ?? "").trim();
            const jalur = String(r[finalIdxJalur] ?? "").trim();
            const alasan = String(r[finalIdxAlasan] ?? "").trim();
            const nama = finalIdxNama !== -1 ? String(r[finalIdxNama] ?? "").trim() : "";

            map[no] = {
                nama,
                asalsekolah,
                jalur,
                alasan,
                tahunAjaran: year
            };
        }

        dataCache[year] = map;
        if (resultDiv) resultDiv.innerHTML = "";
        return map;
    } catch (err) {
        console.error(`Gagal membaca data SPMB untuk ${year}:`, err);
        throw err;
    } finally {
        loadingData = false;
    }
}

// 7. RESULT RENDERING
function renderResult(row, np) {
    if (!resultDiv) return;

    resultDiv.innerHTML = `
        <div class="result-card-success">
            <div style="text-align:center;">
                <div class="result-badge-success">
                    <i class="fas fa-check-circle"></i>
                    <span>SELAMAT, DINYATAKAN LOLOS SELEKSI SPMB!</span>
                </div>
                <h2 class="student-name-title">${escapeHtml(row.nama || "Calon Siswa Baru")}</h2>
            </div>

            <div class="student-meta-grid">
                <div class="student-meta-item">
                    <span class="meta-label">Nomor Pendaftaran</span>
                    <span class="meta-value">${escapeHtml(np)}</span>
                </div>
                <div class="student-meta-item">
                    <span class="meta-label">Tahun Ajaran</span>
                    <span class="meta-value" style="color:#fbbf24;">${escapeHtml(row.tahunAjaran || currentYear)}</span>
                </div>
                <div class="student-meta-item">
                    <span class="meta-label">Asal Sekolah</span>
                    <span class="meta-value">${escapeHtml(row.asalsekolah || "-")}</span>
                </div>
                <div class="student-meta-item">
                    <span class="meta-label">Jalur Pendaftaran</span>
                    <span class="meta-value" style="color:#60a5fa;">${escapeHtml(row.jalur || "Reguler")}</span>
                </div>
                <div class="student-meta-item" style="grid-column: 1 / -1;">
                    <span class="meta-label">Status Penerimaan</span>
                    <span class="meta-value" style="color:#34d399;">Diterima di SMAN 8 Tanjung Jabung Timur</span>
                </div>
            </div>

            ${row.alasan ? `
                <div style="margin-bottom: 1.25rem; background:rgba(255,255,255,0.05); padding:12px 16px; border-radius:10px; border:1px solid rgba(255,255,255,0.08);">
                    <span class="meta-label">Keterangan / Catatan:</span>
                    <p style="color:#e2e8f0; font-size:0.92rem; margin:0;">${escapeHtml(row.alasan)}</p>
                </div>
            ` : ""}

            <div class="result-notice">
                <strong><i class="fas fa-info-circle"></i> Petunjuk Penting:</strong><br>
                Selamat bergabung menjadi bagian dari keluarga besar <strong>SMAN 8 Tanjung Jabung Timur</strong>! 🚀💙<br>
                Harap segera melakukan <strong>Daftar Ulang</strong> sesuai dengan jadwal dan persyaratan resmi yang telah ditetapkan panitia sekolah.
            </div>
        </div>
    `;
}

function renderNotFound(np) {
    if (!resultDiv) return;

    resultDiv.innerHTML = `
        <div class="result-card-error">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Nomor Pendaftaran Tidak Ditemukan</h3>
            <p>
                Nomor Pendaftaran <strong>${escapeHtml(np)}</strong> tidak tercatat dalam database hasil seleksi SPMB untuk <strong>Tahun Ajaran ${escapeHtml(currentYear)}</strong>.<br>
                Pastikan nomor yang Anda masukkan sudah benar (3 digit angka) atau pastikan pilihan tahun ajaran sudah sesuai.
            </p>
        </div>
    `;
}

function renderYearDataUnavailable(year) {
    if (!resultDiv) return;

    resultDiv.innerHTML = `
        <div class="result-card-error">
            <i class="fas fa-folder-open" style="color:#60a5fa;"></i>
            <h3>Data SPMB Belum Tersedia</h3>
            <p>
                Dokumen data seleksi SPMB untuk <strong>Tahun Ajaran ${escapeHtml(year)}</strong> belum diunggah ke sistem atau sedang dalam tahap persiapan panitia sekolah.<br>
                Silakan hubungi pihak panitia SPMB SMAN 8 Tanjung Jabung Timur untuk konfirmasi lebih lanjut.
            </p>
        </div>
    `;
}

function renderGeneralError(msg) {
    if (!resultDiv) return;
    resultDiv.innerHTML = `
        <div class="result-card-error">
            <i class="fas fa-exclamation-circle"></i>
            <h3>Terjadi Kendala Teknis</h3>
            <p>${escapeHtml(msg)}</p>
        </div>
    `;
}

// 8. SEARCH HANDLER
async function handleSearch(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (noteDiv) noteDiv.textContent = "";

    let np = (npInput.value || "").trim();

    if (!np) {
        if (noteDiv) noteDiv.textContent = "Silakan masukkan Nomor Pendaftaran Anda.";
        npInput.focus();
        return;
    }

    if (/^\d{1,2}$/.test(np)) {
        np = np.padStart(3, "0");
        npInput.value = np;
    }

    if (btnCek) btnCek.disabled = true;
    renderLoading();

    // 1. Coba Query ke API Model Python (/api/spmb)
    try {
        const resp = await fetch(`/api/spmb?no=${encodeURIComponent(np)}&tahun=${encodeURIComponent(currentYear)}`);
        if (resp.ok) {
            const resJson = await resp.json();
            if (resJson && resJson.success && resJson.data) {
                renderResult(resJson.data, np);
                return;
            }
        } else if (resp.status === 404) {
            const resJson = await resp.json().catch(() => ({}));
            renderNotFound(np);
            return;
        }
    } catch (netErr) {
        // Server Python tidak aktif atau dibuka via file:///, beralih ke parser client-side
    } finally {
        if (btnCek) btnCek.disabled = false;
    }

    // 2. Fallback ke Excel Parser di sisi browser (jika offline / file:///)
    if (typeof XLSX === "undefined") {
        if (noteDiv) noteDiv.textContent = "Data tidak ditemukan dan komponen pembaca offline tidak aktif.";
        return;
    }

    if (btnCek) btnCek.disabled = true;

    try {
        const yearData = await loadExcelDataForYear(currentYear);

        if (yearData && yearData.notFoundOnServer) {
            renderYearDataUnavailable(currentYear);
            return;
        }

        const row = yearData && yearData[np];

        if (row) {
            renderResult(row, np);
        } else {
            renderNotFound(np);
        }
    } catch (err) {
        renderGeneralError(err.message || "Gagal memproses pencarian data SPMB.");
    } finally {
        if (btnCek) btnCek.disabled = false;
    }
}

function initSpmbChecker() {
    if (searchForm) {
        searchForm.addEventListener("submit", handleSearch);
    }

    if (npInput) {
        npInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                handleSearch(e);
            }
        });
    }
}

// 9. INITIALIZATION
document.addEventListener("DOMContentLoaded", () => {
    initYearSwitcher();
    updateCountdownForYear(currentYear);
    initSpmbChecker();
});

window.addEventListener("beforeunload", () => {
    stopCountdown();
});
