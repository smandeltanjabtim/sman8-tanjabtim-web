// ==========================================================================
// SMAN 8 TANJUNG JABUNG TIMUR - MAIN SCRIPT
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const navbar = document.getElementById('navbar');
    const navMenu = document.getElementById('nav-menu');
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.querySelectorAll('.nav-link');
    const statNumbers = document.querySelectorAll('.stat-number');
    const contactForm = document.getElementById('contactForm');

    // 1. Navbar Scroll Effect
    const handleNavbarScroll = () => {
        if (!navbar) return;
        if (window.scrollY > 40) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    };

    window.addEventListener('scroll', handleNavbarScroll, { passive: true });
    handleNavbarScroll();

    // 2. Mobile Menu Toggle
    if (hamburger && navMenu && !hamburger.dataset.navbarInit) {
        hamburger.dataset.navbarInit = "true";
        hamburger.addEventListener('click', (e) => {
            e.stopPropagation();
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
            
            // Prevent body scroll when menu is open on mobile
            if (navMenu.classList.contains('active')) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
            }
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (navMenu.classList.contains('active') && !navMenu.contains(e.target) && !hamburger.contains(e.target)) {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
                document.body.style.overflow = '';
            }
        });

        // Close menu on resize to desktop
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768 && navMenu.classList.contains('active')) {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }

    // 3. Smooth Scrolling & Menu Auto-close
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#' || !targetId) return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                e.preventDefault();
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }

            // Close mobile menu if open
            if (navMenu && navMenu.classList.contains('active')) {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    });

    // 4. Navbar Active Link on Scroll
    const updateActiveNavLink = () => {
        const sections = document.querySelectorAll('section[id]');
        const scrollPosition = window.scrollY + 160;

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');

            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                navLinks.forEach(link => {
                    const href = link.getAttribute('href');
                    if (href === `#${sectionId}`) {
                        link.classList.add('active');
                    } else if (href && href.startsWith('#')) {
                        link.classList.remove('active');
                    }
                });
            }
        });
    };

    window.addEventListener('scroll', updateActiveNavLink, { passive: true });

    // 5. Stat Counter Animation
    const animateCounter = (el) => {
        const target = parseInt(el.getAttribute('data-target'), 10) || 0;
        const duration = 1800; // ms
        const frameRate = 1000 / 60;
        const totalFrames = Math.round(duration / frameRate);
        let frame = 0;

        const counterInterval = setInterval(() => {
            frame++;
            const progress = frame / totalFrames;
            // Ease-out cubic formula
            const easeOutProgress = 1 - Math.pow(1 - progress, 3);
            const currentVal = Math.round(target * easeOutProgress);

            el.textContent = `${currentVal}+`;

            if (frame >= totalFrames) {
                el.textContent = `${target}+`;
                clearInterval(counterInterval);
            }
        }, frameRate);
    };

    const statsContainer = document.querySelector('.hero-stats');
    if (statsContainer && statNumbers.length > 0) {
        const statsObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    statNumbers.forEach(animateCounter);
                    statsObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.3 });

        statsObserver.observe(statsContainer);
    }

    // 6. EmailJS Contact Form Handler
    if (contactForm && typeof emailjs !== 'undefined') {
        try {
            emailjs.init('RiffZ2VPvqa-XIUI3');
        } catch (err) {
            console.warn('EmailJS initialization warning:', err);
        }

        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            if (!submitBtn) return;

            const originalContent = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengirim Pesan...';
            submitBtn.disabled = true;

            try {
                await emailjs.sendForm('smandeltanjabtim', 'template_a71769x', contactForm);
                alert('✅ Pesan Anda berhasil dikirim! Terima kasih telah menghubungi SMAN 8 Tanjung Jabung Timur.');
                contactForm.reset();
            } catch (error) {
                console.error('EmailJS Error:', error);
                alert('❌ Maaf, pengiriman pesan gagal. Silakan hubungi kami langsung via email smandeltanjabtim@gmail.com.');
            } finally {
                submitBtn.innerHTML = originalContent;
                submitBtn.disabled = false;
            }
        });
    }
});