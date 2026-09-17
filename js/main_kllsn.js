// ==========================================================================
// SMAN 8 TANJUNG JABUNG TIMUR - CEK KELULUSAN SCRIPT
// Multi-Tahun Ajaran (2025/2026, 2026/2027, 2027/2028)
// ==========================================================================

// 1. JADWAL WAKTU PEMBUKAAN PER TAHUN AJARAN
const OPEN_TIMES = {
    "2025/2026": new Date("2026-02-27T10:41:00+07:00"), // Sudah selesai countdown (Terbuka)
    "2026/2027": new Date("2027-05-05T10:00:00+07:00"), // Countdown TA 2026/2027
    "2027/2028": new Date("2028-05-05T10:00:00+07:00")  // Countdown TA 2027/2028
};

let currentYear = "2025/2026";
let countdownInterval = null;

// 2. DOM ELEMENTS
const yearBadge = document.getElementById("yearBadge");
const yearPills = document.querySelectorAll(".year-pill");
const lockDiv = document.getElementById("lock");
const appDiv = document.getElementById("app");
const searchForm = document.getElementById("searchForm");
const nisnInput = document.getElementById("nisnInput");
const btnCek = document.getElementById("btnCekKelulusan");
const resultDiv = document.getElementById("result");
const countdownSub = document.getElementById("countdownSub");
const noteDiv = document.getElementById("note");

// 3. UTILITAS
function setLocked(lock) {
    if (nisnInput) nisnInput.disabled = lock;
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

    const targetTime = OPEN_TIMES[year] || OPEN_TIMES["2025/2026"];
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
    if (nisnInput) nisnInput.focus();
}

// 5. YEAR SWITCHER HANDLER
function setAcademicYear(year) {
    if (!["2025/2026", "2026/2027", "2027/2028"].includes(year)) return;
    currentYear = year;

    // Update active pill button
    yearPills.forEach(pill => {
        if (pill.dataset.year === year) {
            pill.classList.add("active");
        } else {
            pill.classList.remove("active");
        }
    });

    // Update Header Badge
    if (yearBadge) {
        yearBadge.innerHTML = `<i class="fas fa-graduation-cap"></i> <span>Tahun Ajaran ${escapeHtml(year)}</span>`;
    }

    // Reset Result and Note
    if (resultDiv) resultDiv.innerHTML = "";
    if (noteDiv) noteDiv.textContent = "";
    if (nisnInput) nisnInput.value = "";

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

// 6. SEARCH FORM & RESULT RENDERING
function initSearchForm() {
    if (!searchForm) return;

    searchForm.addEventListener("submit", handleSearch);

    if (nisnInput) {
        nisnInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                handleSearch(e);
            }
        });
    }
}

function handleSearch(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (noteDiv) noteDiv.textContent = "";

    const nisn = (nisnInput.value || "").trim();

    if (!nisn) {
        if (noteDiv) noteDiv.textContent = "Silakan masukkan NISN Anda.";
        nisnInput.focus();
        return;
    }

    if (typeof SiswaDB === "undefined" || !SiswaDB.isValidNISN(nisn)) {
        renderResultError(
            "NISN Tidak Valid",
            "NISN harus terdiri dari tepat 10 digit angka tanpa spasi atau tanda baca."
        );
        return;
    }

    renderLoading();

    // Query Python Model API /api/kelulusan dengan fallback offline
    (async () => {
        try {
            const resp = await fetch(`/api/kelulusan?nisn=${encodeURIComponent(nisn)}&tahun=${encodeURIComponent(currentYear)}`);
            if (resp.ok) {
                const resJson = await resp.json();
                if (resJson && resJson.success && resJson.data) {
                    const siswa = resJson.data;
                    if (siswa.status === "LULUS") {
                        renderResultLulus(siswa);
                    } else {
                        renderResultTidakLulus(siswa);
                    }
                    return;
                }
            } else if (resp.status === 404) {
                const resJson = await resp.json().catch(() => ({}));
                renderResultError(
                    "Data NISN Tidak Ditemukan",
                    resJson.message || `NISN <strong>${escapeHtml(nisn)}</strong> tidak tercatat dalam basis data kelulusan kelas XII untuk <strong>Tahun Ajaran ${escapeHtml(currentYear)}</strong>.`
                );
                return;
            }
        } catch (netErr) {
            // Server Python tidak aktif atau dibuka via file:///, gunakan fallback JS database
        }

        // Fallback ke SiswaDB (Client-side Model)
        setTimeout(() => {
            const siswa = typeof SiswaDB !== "undefined" ? SiswaDB.findSiswa(nisn, currentYear) : null;

            if (siswa) {
                if (siswa.status === "LULUS") {
                    renderResultLulus(siswa);
                } else {
                    renderResultTidakLulus(siswa);
                }
            } else {
                if (typeof SiswaDB !== "undefined" && !SiswaDB.hasDataForYear(currentYear)) {
                    renderResultError(
                        "Data Belum Tersedia",
                        `Data kelulusan untuk <strong>Tahun Ajaran ${escapeHtml(currentYear)}</strong> belum diunggah atau belum dipublikasikan oleh pihak sekolah.`
                    );
                } else {
                    renderResultError(
                        "Data NISN Tidak Ditemukan",
                        `NISN <strong>${escapeHtml(nisn)}</strong> tidak tercatat dalam basis data kelulusan kelas XII untuk <strong>Tahun Ajaran ${escapeHtml(currentYear)}</strong>. Silakan periksa kembali nomor Anda atau pastikan tahun ajaran yang dipilih sesuai.`
                    );
                }
            }
        }, 300);
    })();
}

function renderLoading() {
    if (!resultDiv) return;
    resultDiv.innerHTML = `
        <div class="result-loading">
            <i class="fas fa-spinner fa-spin"></i>
            <p style="font-weight:600; margin:0;">Memeriksa status kelulusan di database sekolah (TA ${escapeHtml(currentYear)})...</p>
        </div>
    `;
}

function renderResultLulus(siswa) {
    if (!resultDiv) return;
    resultDiv.innerHTML = `
        <div class="result-card-lulus">
            <div style="text-align:center;">
                <div class="result-badge-lulus">
                    <i class="fas fa-award"></i>
                    <span>SELAMAT! ANDA DINYATAKAN LULUS</span>
                </div>
                <h2 class="student-name-title">${escapeHtml(siswa.nama)}</h2>
            </div>

            <div class="student-meta-grid">
                <div class="student-meta-item">
                    <span class="meta-label">Nomor Induk Siswa Nasional</span>
                    <span class="meta-value">${escapeHtml(siswa.nisn)}</span>
                </div>
                <div class="student-meta-item">
                    <span class="meta-label">Satuan Pendidikan</span>
                    <span class="meta-value">SMAN 8 Tanjab Timur</span>
                </div>
                <div class="student-meta-item">
                    <span class="meta-label">Tahun Ajaran</span>
                    <span class="meta-value" style="color:#fbbf24;">${escapeHtml(siswa.tahunAjaran || currentYear)}</span>
                </div>
                <div class="student-meta-item">
                    <span class="meta-label">Status Kelulusan</span>
                    <span class="meta-value" style="color:#34d399; font-weight:800;">LULUS</span>
                </div>
            </div>

            <div class="result-notice">
                <strong><i class="fas fa-graduation-cap"></i> Ucapan Selamat dari Civitas Akademika:</strong><br>
                Selamat dan sukses atas kelulusan yang telah diraih! Semoga ilmu yang didapatkan di <strong>SMAN 8 Tanjung Jabung Timur</strong> berkah dan menjadi bekal berharga untuk menggapai cita-cita di jenjang pendidikan tinggi maupun karier selanjutnya. 🎓✨
            </div>
        </div>
    `;
}

function renderResultTidakLulus(siswa) {
    if (!resultDiv) return;
    resultDiv.innerHTML = `
        <div class="result-card-error">
            <i class="fas fa-info-circle" style="color:#f59e0b;"></i>
            <h3>Pemberitahuan Status Kelulusan</h3>
            <p>
                Peserta didik atas nama <strong>${escapeHtml(siswa.nama)}</strong> (NISN: ${escapeHtml(siswa.nisn)}) pada Tahun Ajaran ${escapeHtml(currentYear)}.<br>
                Silakan hubungi pihak sekolah/wali kelas untuk mendapatkan informasi dan arahan lebih lanjut.
            </p>
        </div>
    `;
}

function renderResultError(title, message) {
    if (!resultDiv) return;
    resultDiv.innerHTML = `
        <div class="result-card-error">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>${title}</h3>
            <p>${message}</p>
        </div>
    `;
}

// 7. INITIALIZATION
document.addEventListener("DOMContentLoaded", () => {
    initYearSwitcher();
    updateCountdownForYear(currentYear);
    initSearchForm();
});

window.addEventListener("beforeunload", () => {
    stopCountdown();
});