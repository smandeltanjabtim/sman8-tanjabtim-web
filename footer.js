// ==========================================================================
// SMAN 8 TANJUNG JABUNG TIMUR - GLOBAL FOOTER LOADER
// File ini menghubungkan komponen footer terpusat ke seluruh halaman website:
// - index.html
// - pengumuman.html
// - cek_spmb.html
// - kelulusan.html
// - kartu.html
// ==========================================================================

(function() {
    const defaultFooterTemplate = `
<footer class="footer">
    <div class="container">
        <div class="footer-content">
            <!-- Brand & Profil Singkat -->
            <div class="footer-brand">
                <a href="index.html" class="footer-logo">
                    <img src="assets/images/logo.png" alt="Logo SMAN 8">
                    <span>SMAN 8 TJT</span>
                </a>
                <p class="footer-desc">
                    Sekolah Menengah Atas Negeri 8 Tanjung Jabung Timur. Membentuk generasi unggul, berbudi pekerti, berilmu, dan berakhlak mulia.
                </p>
            </div>
            
            <!-- Tautan Cepat -->
            <div class="footer-section">
                <h4>Tautan Cepat</h4>
                <ul class="footer-links">
                    <li><a href="index.html"><i class="fas fa-chevron-right"></i> Beranda</a></li>
                    <li><a href="index.html#about"><i class="fas fa-chevron-right"></i> Tentang Kami</a></li>
                    <li><a href="index.html#gallery"><i class="fas fa-chevron-right"></i> Galeri Kegiatan</a></li>
                    <li><a href="index.html#contact"><i class="fas fa-chevron-right"></i> Kontak Sekolah</a></li>
                    <li><a href="pengumuman.html"><i class="fas fa-chevron-right"></i> Portal Pengumuman</a></li>
                </ul>
            </div>
            
            <!-- Media Sosial Resmi -->
            <div class="footer-section">
                <h4>Media Sosial</h4>
                <p style="font-size:0.9rem; margin-bottom:1rem; color:#94a3b8;">Ikuti update kegiatan dan informasi terbaru sekolah melalui kanal resmi:</p>
                <div class="social-links">
                    <a href="https://www.tiktok.com/@smandel.update?is_from_webapp=1&sender_device=pc" target="_blank" rel="noopener noreferrer" class="social-link" aria-label="TikTok SMAN 8">
                        <i class="fab fa-tiktok"></i>
                    </a>
                    <a href="https://www.instagram.com/smandeltanjabtim?igsh=MWZocnJkZTFlc24zYQ==" target="_blank" rel="noopener noreferrer" class="social-link" aria-label="Instagram SMAN 8">
                        <i class="fab fa-instagram"></i>
                    </a>
                    <a href="#" class="social-link" aria-label="YouTube SMAN 8">
                        <i class="fab fa-youtube"></i>
                    </a>
                    <a href="https://wa.me/6285767192600" target="_blank" rel="noopener noreferrer" class="social-link" aria-label="WhatsApp SMAN 8">
                        <i class="fab fa-whatsapp"></i>
                    </a>
                </div>
            </div>
        </div>
        
        <!-- Hak Cipta -->
        <div class="footer-bottom">
            <p>&copy; 2026 SMAN 8 Tanjung Jabung Timur. Seluruh Hak Cipta Dilindungi.</p>
        </div>
    </div>
</footer>
    `.trim();

    function injectFooterHTML(htmlContent) {
        const placeholder = document.getElementById("footer-placeholder");
        if (placeholder) {
            placeholder.outerHTML = htmlContent;
            return;
        }

        const existingFooter = document.querySelector("footer.footer");
        if (existingFooter) {
            existingFooter.outerHTML = htmlContent;
            return;
        }

        document.body.insertAdjacentHTML("beforeend", htmlContent);
    }

    async function loadGlobalFooter() {
        // Coba memuat dari file footer.html jika sedang berjalan di server (HTTP / HTTPS / localhost)
        try {
            const response = await fetch("footer.html", { cache: "no-cache" });
            if (response.ok) {
                const htmlText = await response.text();
                if (htmlText && htmlText.trim().length > 0) {
                    injectFooterHTML(htmlText.trim());
                    return;
                }
            }
        } catch (err) {
            // Jika dibuka secara offline/file:/// (di mana browser membatasi fetch lokal karena kebijakan CORS),
            // gunakan template default yang tersinkronisasi agar footer selalu tampil sempurna.
        }

        // Fallback langsung menggunakan template internal
        injectFooterHTML(defaultFooterTemplate);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", loadGlobalFooter);
    } else {
        loadGlobalFooter();
    }
})();
