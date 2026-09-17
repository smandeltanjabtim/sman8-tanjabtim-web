// ==========================================================================
// SMAN 8 TANJUNG JABUNG TIMUR - GLOBAL NAVBAR LOADER
// File ini menghubungkan komponen navbar terpusat ke seluruh halaman website:
// - index.html
// - pengumuman.html
// - cek_spmb.html
// - kelulusan.html
// - kartu.html
// ==========================================================================

(function() {
    const defaultNavbarTemplate = `
<nav class="navbar" id="navbar">
    <div class="nav-container">
        <a href="index.html" class="nav-logo">
            <img src="assets/images/logo.png" alt="Logo SMAN 8">
            <span>SMAN 8 Tanjab Timur</span>
        </a>
        
        <ul class="nav-menu" id="nav-menu">
            <li class="nav-item">
                <a href="index.html#home" class="nav-link" id="nav-home">
                    <i class="fas fa-home"></i> Beranda
                </a>
            </li>
            <li class="nav-item">
                <a href="index.html#about" class="nav-link" id="nav-about">
                    <i class="fas fa-info-circle"></i> Tentang
                </a>
            </li>
            <li class="nav-item">
                <a href="index.html#gallery" class="nav-link" id="nav-gallery">
                    <i class="fas fa-images"></i> Galeri
                </a>
            </li>
            <li class="nav-item">
                <a href="index.html#contact" class="nav-link" id="nav-contact">
                    <i class="fas fa-envelope"></i> Kontak
                </a>
            </li>
            <li class="nav-item">
                <a href="pengumuman.html" class="nav-link btn-nav-announcement" id="nav-pengumuman">
                    <i class="fas fa-bullhorn"></i> Pengumuman
                </a>
            </li>
        </ul>
        
        <button class="hamburger" id="hamburger" aria-label="Toggle navigation menu" type="button">
            <span></span>
            <span></span>
            <span></span>
        </button>
    </div>
</nav>
    `.trim();

    function setupNavbarInteractions() {
        const navbar = document.getElementById("navbar");
        const hamburger = document.getElementById("hamburger");
        const navMenu = document.getElementById("nav-menu");
        if (!navbar) return;

        // 1. Tentukan Active Link berdasarkan URL halaman saat ini
        const currentPath = window.location.pathname.toLowerCase();
        const navHome = document.getElementById("nav-home");
        const navAbout = document.getElementById("nav-about");
        const navGallery = document.getElementById("nav-gallery");
        const navContact = document.getElementById("nav-contact");
        const navPengumuman = document.getElementById("nav-pengumuman");

        const isAnnouncementSection = 
            currentPath.includes("pengumuman.html") || 
            currentPath.includes("cek_spmb.html") || 
            currentPath.includes("kelulusan.html") || 
            currentPath.includes("kartu.html");

        const isIndexPage = 
            currentPath.endsWith("index.html") || 
            currentPath.endsWith("/") || 
            currentPath === "" ||
            (!isAnnouncementSection && !currentPath.includes(".html"));

        if (isAnnouncementSection && navPengumuman) {
            document.querySelectorAll(".nav-link").forEach(l => l.classList.remove("active"));
            navPengumuman.classList.add("active");
        } else if (isIndexPage && navHome) {
            document.querySelectorAll(".nav-link").forEach(l => l.classList.remove("active"));
            navHome.classList.add("active");

            // Setup smooth scroll & scroll spy untuk halaman index
            const sections = document.querySelectorAll("section[id]");
            const navLinks = {
                home: navHome,
                about: navAbout,
                gallery: navGallery,
                contact: navContact
            };

            const handleScrollSpy = () => {
                const scrollPosition = window.scrollY + 120;
                sections.forEach(section => {
                    const sectionTop = section.offsetTop;
                    const sectionHeight = section.offsetHeight;
                    const sectionId = section.getAttribute("id");

                    if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                        Object.values(navLinks).forEach(link => link && link.classList.remove("active"));
                        if (navLinks[sectionId]) {
                            navLinks[sectionId].classList.add("active");
                        }
                    }
                });
            };

            window.addEventListener("scroll", handleScrollSpy, { passive: true });
        }

        // 2. Efek Navbar Scroll
        const handleNavbarScroll = () => {
            if (window.scrollY > 40) {
                navbar.classList.add("scrolled");
            } else {
                navbar.classList.remove("scrolled");
            }
        };

        window.addEventListener("scroll", handleNavbarScroll, { passive: true });
        handleNavbarScroll();

        // 3. Hamburger Menu Mobile Toggle
        if (hamburger && navMenu && !hamburger.dataset.navbarInit) {
            hamburger.dataset.navbarInit = "true";
            const toggleMenu = () => {
                hamburger.classList.toggle("active");
                navMenu.classList.toggle("active");
                const isExpanded = hamburger.classList.contains("active");
                hamburger.setAttribute("aria-expanded", isExpanded);
                document.body.style.overflow = isExpanded ? "hidden" : "";
            };

            const closeMenu = () => {
                if (hamburger.classList.contains("active")) {
                    hamburger.classList.remove("active");
                    navMenu.classList.remove("active");
                    hamburger.setAttribute("aria-expanded", "false");
                    document.body.style.overflow = "";
                }
            };

            hamburger.addEventListener("click", (e) => {
                e.stopPropagation();
                toggleMenu();
            });

            // Tutup menu saat nav-link diklik
            document.querySelectorAll(".nav-link").forEach(link => {
                link.addEventListener("click", () => {
                    closeMenu();
                });
            });

            // Tutup menu saat klik di luar navbar
            document.addEventListener("click", (e) => {
                if (navMenu.classList.contains("active") && !navbar.contains(e.target)) {
                    closeMenu();
                }
            });

            // Tutup menu saat tombol ESC ditekan
            document.addEventListener("keydown", (e) => {
                if (e.key === "Escape") {
                    closeMenu();
                }
            });
        }
    }

    function injectNavbarHTML(htmlContent) {
        const placeholder = document.getElementById("navbar-placeholder");
        if (placeholder) {
            placeholder.outerHTML = htmlContent;
            setupNavbarInteractions();
            return;
        }

        const existingNavbar = document.getElementById("navbar");
        if (existingNavbar) {
            existingNavbar.outerHTML = htmlContent;
            setupNavbarInteractions();
            return;
        }

        document.body.insertAdjacentHTML("afterbegin", htmlContent);
        setupNavbarInteractions();
    }

    async function loadGlobalNavbar() {
        // Coba memuat dari file navbar.html jika sedang berjalan di server (HTTP / HTTPS / localhost)
        try {
            const response = await fetch("navbar.html", { cache: "no-cache" });
            if (response.ok) {
                const htmlText = await response.text();
                if (htmlText && htmlText.trim().length > 0) {
                    injectNavbarHTML(htmlText.trim());
                    return;
                }
            }
        } catch (err) {
            // Jika dibuka secara offline/file:/// (di mana browser membatasi fetch lokal karena kebijakan CORS),
            // gunakan template default yang tersinkronisasi agar navbar langsung tampil sempurna.
        }

        // Fallback langsung menggunakan template internal
        injectNavbarHTML(defaultNavbarTemplate);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", loadGlobalNavbar);
    } else {
        loadGlobalNavbar();
    }
})();
