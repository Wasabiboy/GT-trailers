// Mobile Menu Toggle
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('navMenu');
const menuOverlay = document.getElementById('menuOverlay');

function toggleMenu() {
    navMenu.classList.toggle('active');
    hamburger.classList.toggle('active');
    menuOverlay.classList.toggle('active');
    document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
}

function closeMenu() {
    navMenu.classList.remove('active');
    hamburger.classList.remove('active');
    menuOverlay.classList.remove('active');
    document.body.style.overflow = '';
}

hamburger.addEventListener('click', toggleMenu);
menuOverlay.addEventListener('click', closeMenu);

// Close menu when clicking on a link
document.querySelectorAll('.nav-menu a').forEach(link => {
    link.addEventListener('click', closeMenu);
});

// Dropdown menu functionality
document.querySelectorAll('.nav-menu .dropdown > a').forEach(dropdownLink => {
    dropdownLink.addEventListener('click', function(e) {
        // On mobile, toggle dropdown instead of navigating
        if (window.innerWidth <= 768) {
            e.preventDefault();
            const dropdown = this.parentElement;
            dropdown.classList.toggle('active');
        }
        // On desktop, allow navigation to the main page
    });

    // Prevent dropdown from closing when clicking inside dropdown menu
    const dropdown = dropdownLink.parentElement;
    const dropdownMenu = dropdown.querySelector('.dropdown-menu');
    if (dropdownMenu) {
        dropdownMenu.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    }
});

// Smooth scrolling for same-page hash links (respects CSS scroll-margin / scroll-padding)
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (!href || href === '#' || href.length < 2) return;
        const id = decodeURIComponent(href.slice(1));
        if (!id) return;
        const target = document.getElementById(id);
        if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

// Hero Slider
let currentSlide = 0;
const slides = document.querySelectorAll('.slide');
const indicators = document.querySelectorAll('.indicator');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');

function showSlide(index) {
    slides.forEach(slide => slide.classList.remove('active'));
    indicators.forEach(indicator => indicator.classList.remove('active'));

    if (index >= slides.length) {
        currentSlide = 0;
    } else if (index < 0) {
        currentSlide = slides.length - 1;
    } else {
        currentSlide = index;
    }

    slides[currentSlide].classList.add('active');
    indicators[currentSlide].classList.add('active');
}

function nextSlide() {
    showSlide(currentSlide + 1);
}

function prevSlide() {
    showSlide(currentSlide - 1);
}

if (prevBtn && nextBtn && slides.length) {
    nextBtn.addEventListener('click', nextSlide);
    prevBtn.addEventListener('click', prevSlide);

    indicators.forEach((indicator, index) => {
        indicator.addEventListener('click', () => {
            showSlide(index);
        });
    });

    setInterval(nextSlide, 5000);
}

// Active Navigation Link on Scroll
const sections = document.querySelectorAll('section[id]');

function updateActiveNav() {
    const scrollY = window.pageYOffset;

    sections.forEach(section => {
        const sectionHeight = section.offsetHeight;
        const sectionTop = section.offsetTop - 120;
        const sectionId = section.getAttribute('id');
        const navLink = document.querySelector(`.nav-menu a[href="#${sectionId}"]`);

        if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
            document.querySelectorAll('.nav-menu a').forEach(link => {
                link.classList.remove('active');
            });
            if (navLink) {
                navLink.classList.add('active');
            }
        }
    });
}

window.addEventListener('scroll', updateActiveNav);

// Project Filter
const filterButtons = document.querySelectorAll('.filter-btn');
const projectCards = document.querySelectorAll('.project-card');

filterButtons.forEach(button => {
    button.addEventListener('click', () => {
        // Remove active class from all buttons
        filterButtons.forEach(btn => btn.classList.remove('active'));
        // Add active class to clicked button
        button.classList.add('active');

        const filterValue = button.getAttribute('data-filter');

        projectCards.forEach(card => {
            if (filterValue === 'all' || card.getAttribute('data-category') === filterValue) {
                card.classList.remove('hide');
                card.style.animation = 'fadeIn 0.5s';
            } else {
                card.classList.add('hide');
            }
        });
    });
});

// Counter Animation
function animateCounter(element) {
    const target = parseInt(element.getAttribute('data-target'));
    const duration = 2000;
    const increment = target / (duration / 16);
    let current = 0;

    const updateCounter = () => {
        current += increment;
        if (current < target) {
            element.textContent = Math.floor(current);
            requestAnimationFrame(updateCounter);
        } else {
            element.textContent = target;
        }
    };

    updateCounter();
}

// Intersection Observer for Counter Animation
const observerOptions = {
    threshold: 0.5,
    rootMargin: '0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const statNumbers = entry.target.querySelectorAll('.stat-number[data-target]');
            statNumbers.forEach(stat => {
                if (!stat.classList.contains('animated')) {
                    stat.classList.add('animated');
                    animateCounter(stat);
                }
            });
        }
    });
}, observerOptions);

// Observe stats sections
document.querySelectorAll('.stats, .about-stats').forEach(section => {
    observer.observe(section);
});

// Form Submission
const contactForm = document.getElementById('contactForm');

if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Thank you for your enquiry! We will get back to you soon.');
        contactForm.reset();
    });
}

// Header Scroll Effect (Glassmorphism enhancement)
const header = document.querySelector('.header');

window.addEventListener('scroll', () => {
    if (window.pageYOffset > 50) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
});

// ===== Scroll Reveal Animation =====
const revealElements = document.querySelectorAll(
    '.feature-card, .service-card, .product-card, .about-content, ' +
    '.section-subtitle, .section-title, .stat-box, .contact-content, ' +
    '.section-description'
);

revealElements.forEach((el, index) => {
    el.classList.add('reveal');
    // Add staggered delays for grid children
    const parent = el.parentElement;
    if (parent) {
        const siblings = Array.from(parent.children).filter(c => c.classList.contains('reveal'));
        const i = siblings.indexOf(el);
        if (i > 0 && i < 5) {
            el.classList.add('reveal-delay-' + i);
        }
    }
});

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
        }
    });
}, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
});

document.querySelectorAll('.reveal').forEach(el => {
    revealObserver.observe(el);
});

// ===== Back to Top Button =====
const backToTop = document.getElementById('backToTop');

if (backToTop) {
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 500) {
            backToTop.classList.add('visible');
        } else {
            backToTop.classList.remove('visible');
        }
    });

    backToTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// ===== Auto Copyright Year =====
const yearEl = document.getElementById('currentYear');
if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
}

// Footer Dropdown Toggle
document.querySelectorAll('.footer-dropdown-toggle').forEach(toggle => {
    toggle.addEventListener('click', function(e) {
        // Only toggle on mobile, allow navigation on desktop
        if (window.innerWidth <= 768) {
            e.preventDefault();
            this.classList.toggle('active');
        }
    });
});

// Add CSS animation keyframes dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;
document.head.appendChild(style);

/** Alt text from filename: "Spare-wheel-and-Mount.png" → "Spare wheel and mount" */
function altTextFromImageSrc(src) {
    if (!src || typeof src !== 'string') return 'Image';
    let pathPart = src;
    try {
        pathPart = new URL(src, typeof window !== 'undefined' ? window.location.href : 'https://example.com/').pathname;
    } catch (e) {
        /* keep relative src */
    }
    const rawFile = pathPart.split('/').pop() || '';
    let file = rawFile;
    try {
        file = decodeURIComponent(rawFile);
    } catch (e) {
        file = rawFile;
    }
    const stem = file.replace(/\.[^.]+$/i, '');
    if (!stem) return 'Image';
    const withSpaces = stem.replace(/_/g, ' ').replace(/-/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
    const words = withSpaces.split(' ');
    const small = new Set(['and', 'or', 'with', 'for', 'of', 'the', 'a', 'an', 'in', 'on', 'to']);
    return words
        .map((w, i) => {
            if (!w) return '';
            if (i > 0 && small.has(w)) return w;
            return w.charAt(0).toUpperCase() + w.slice(1);
        })
        .join(' ')
        .trim();
}

// Accessory lightbox (index.html grid)
const accessoryModal = document.getElementById('accessoryModal');
const accessoryModalImg = document.getElementById('accessoryModalImg');
const accessoryModalCaption = document.getElementById('accessoryModalCaption');
const accessoryModalClose = document.getElementById('accessoryModalClose');
const accessoryModalPrev = document.getElementById('accessoryModalPrev');
const accessoryModalNext = document.getElementById('accessoryModalNext');
let accessoryLightboxCells = [];
let accessorySlideIndex = 0;
let lastFocusedAccessoryCell = null;

function updateAccessoryModalImage() {
    if (!accessoryModalImg || !accessoryLightboxCells.length) return;
    const cell = accessoryLightboxCells[accessorySlideIndex];
    if (!cell) return;
    const thumb = cell.querySelector('img');
    if (!thumb) return;
    const relSrc = thumb.getAttribute('src');
    accessoryModalImg.src = thumb.currentSrc || thumb.src;
    const lbl = cell.querySelector('.accessory-cell-label');
    const fromThumb = thumb.getAttribute('alt') && thumb.getAttribute('alt').trim();
    const fromLabel = lbl && lbl.textContent ? lbl.textContent.trim() : '';
    const alt = fromThumb || fromLabel || altTextFromImageSrc(relSrc);
    accessoryModalImg.alt = alt;
    if (accessoryModalCaption) accessoryModalCaption.textContent = alt;
}

function openAccessoryModal(index) {
    if (!accessoryModal || !accessoryModalImg || !accessoryLightboxCells.length) return;
    accessorySlideIndex = index;
    if (accessorySlideIndex < 0) accessorySlideIndex = 0;
    if (accessorySlideIndex >= accessoryLightboxCells.length) {
        accessorySlideIndex = accessoryLightboxCells.length - 1;
    }
    updateAccessoryModalImage();
    accessoryModal.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';
    if (accessoryModalClose) accessoryModalClose.focus();
}

function closeAccessoryModal() {
    if (!accessoryModal || !accessoryModalImg) return;
    accessoryModal.setAttribute('hidden', '');
    accessoryModalImg.removeAttribute('src');
    accessoryModalImg.alt = '';
    if (accessoryModalCaption) accessoryModalCaption.textContent = '';
    document.body.style.overflow = '';
    if (lastFocusedAccessoryCell && typeof lastFocusedAccessoryCell.focus === 'function') {
        lastFocusedAccessoryCell.focus({ preventScroll: true });
    }
    lastFocusedAccessoryCell = null;
}

function changeAccessorySlide(dir) {
    if (!accessoryLightboxCells.length) return;
    accessorySlideIndex += dir;
    if (accessorySlideIndex >= accessoryLightboxCells.length) accessorySlideIndex = 0;
    if (accessorySlideIndex < 0) accessorySlideIndex = accessoryLightboxCells.length - 1;
    updateAccessoryModalImage();
}

function initAccessoryLightbox() {
    const grid = document.querySelector('.accessories-grid');
    if (!accessoryModal || !accessoryModalImg || !grid) return;

    accessoryLightboxCells = Array.from(grid.querySelectorAll('.accessory-cell'));

    accessoryLightboxCells.forEach((cell, i) => {
        const img = cell.querySelector('img');
        const lbl = cell.querySelector('.accessory-cell-label');
        if (img) {
            const fromLabel = lbl && lbl.textContent ? lbl.textContent.trim() : '';
            if (fromLabel) {
                img.setAttribute('alt', fromLabel);
            } else if (!img.getAttribute('alt') || !img.getAttribute('alt').trim()) {
                img.setAttribute('alt', altTextFromImageSrc(img.getAttribute('src')));
            }
        }
        if (lbl && !lbl.id) lbl.id = 'accessory-cell-lbl-' + i;
        if (lbl && lbl.id) cell.setAttribute('aria-labelledby', lbl.id);
        cell.setAttribute('role', 'button');
        cell.setAttribute('tabindex', '0');
    });

    accessoryLightboxCells.forEach((cell, index) => {
        cell.addEventListener('click', () => {
            lastFocusedAccessoryCell = cell;
            openAccessoryModal(index);
        });
        cell.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                lastFocusedAccessoryCell = cell;
                openAccessoryModal(index);
            }
        });
    });

    const accessoryInner = accessoryModal.querySelector('.gallery-modal__inner');
    if (accessoryInner) {
        accessoryInner.addEventListener('click', (e) => e.stopPropagation());
    }
    accessoryModal.addEventListener('click', () => closeAccessoryModal());

    if (accessoryModalClose) accessoryModalClose.addEventListener('click', () => closeAccessoryModal());
    if (accessoryModalPrev) accessoryModalPrev.addEventListener('click', () => changeAccessorySlide(-1));
    if (accessoryModalNext) accessoryModalNext.addEventListener('click', () => changeAccessorySlide(1));
}

initAccessoryLightbox();

// Jetski parts lightbox (jetskis.html)
const jetskiPartsModal = document.getElementById('jetskiPartsModal');
const jetskiPartsModalImg = document.getElementById('jetskiPartsModalImg');
const jetskiPartsModalCaption = document.getElementById('jetskiPartsModalCaption');
const jetskiPartsModalClose = document.getElementById('jetskiPartsModalClose');
const jetskiPartsModalPrev = document.getElementById('jetskiPartsModalPrev');
const jetskiPartsModalNext = document.getElementById('jetskiPartsModalNext');
let jetskiPartsLightboxCells = [];
let jetskiPartsSlideIndex = 0;
let lastFocusedJetskiPartsCell = null;

function updateJetskiPartsModalImage() {
    if (!jetskiPartsModalImg || !jetskiPartsLightboxCells.length) return;
    const cell = jetskiPartsLightboxCells[jetskiPartsSlideIndex];
    if (!cell) return;
    const thumb = cell.querySelector('img');
    if (!thumb) return;
    const relSrc = thumb.getAttribute('src');
    jetskiPartsModalImg.src = thumb.currentSrc || thumb.src;
    const nameEl = cell.querySelector('.parts-card__name');
    const fromThumb = thumb.getAttribute('alt') && thumb.getAttribute('alt').trim();
    const fromName = nameEl && nameEl.textContent ? nameEl.textContent.trim() : '';
    const alt = fromThumb || fromName || altTextFromImageSrc(relSrc);
    jetskiPartsModalImg.alt = alt;
    if (jetskiPartsModalCaption) jetskiPartsModalCaption.textContent = alt;
}

function openJetskiPartsModal(index) {
    if (!jetskiPartsModal || !jetskiPartsModalImg || !jetskiPartsLightboxCells.length) return;
    jetskiPartsSlideIndex = index;
    if (jetskiPartsSlideIndex < 0) jetskiPartsSlideIndex = 0;
    if (jetskiPartsSlideIndex >= jetskiPartsLightboxCells.length) {
        jetskiPartsSlideIndex = jetskiPartsLightboxCells.length - 1;
    }
    updateJetskiPartsModalImage();
    jetskiPartsModal.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';
    if (jetskiPartsModalClose) jetskiPartsModalClose.focus();
}

function closeJetskiPartsModal() {
    if (!jetskiPartsModal || !jetskiPartsModalImg) return;
    jetskiPartsModal.setAttribute('hidden', '');
    jetskiPartsModalImg.removeAttribute('src');
    jetskiPartsModalImg.alt = '';
    if (jetskiPartsModalCaption) jetskiPartsModalCaption.textContent = '';
    document.body.style.overflow = '';
    if (lastFocusedJetskiPartsCell && typeof lastFocusedJetskiPartsCell.focus === 'function') {
        lastFocusedJetskiPartsCell.focus({ preventScroll: true });
    }
    lastFocusedJetskiPartsCell = null;
}

function changeJetskiPartsSlide(dir) {
    if (!jetskiPartsLightboxCells.length) return;
    jetskiPartsSlideIndex += dir;
    if (jetskiPartsSlideIndex >= jetskiPartsLightboxCells.length) jetskiPartsSlideIndex = 0;
    if (jetskiPartsSlideIndex < 0) jetskiPartsSlideIndex = jetskiPartsLightboxCells.length - 1;
    updateJetskiPartsModalImage();
}

function initJetskiPartsLightbox() {
    const grid = document.querySelector('.jetski-parts-grid');
    if (!jetskiPartsModal || !jetskiPartsModalImg || !grid) return;

    jetskiPartsLightboxCells = Array.from(grid.querySelectorAll('.parts-card'));

    jetskiPartsLightboxCells.forEach((cell, i) => {
        const img = cell.querySelector('img');
        const nameEl = cell.querySelector('.parts-card__name');
        if (img) {
            const fromName = nameEl && nameEl.textContent ? nameEl.textContent.trim() : '';
            if (fromName) {
                img.setAttribute('alt', fromName);
            } else if (!img.getAttribute('alt') || !img.getAttribute('alt').trim()) {
                img.setAttribute('alt', altTextFromImageSrc(img.getAttribute('src')));
            }
        }
        if (nameEl && !nameEl.id) nameEl.id = 'jetski-parts-name-' + i;
        if (nameEl && nameEl.id) cell.setAttribute('aria-labelledby', nameEl.id);
        cell.setAttribute('role', 'button');
        cell.setAttribute('tabindex', '0');
    });

    jetskiPartsLightboxCells.forEach((cell, index) => {
        cell.addEventListener('click', () => {
            lastFocusedJetskiPartsCell = cell;
            openJetskiPartsModal(index);
        });
        cell.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                lastFocusedJetskiPartsCell = cell;
                openJetskiPartsModal(index);
            }
        });
    });

    const inner = jetskiPartsModal.querySelector('.gallery-modal__inner');
    if (inner) {
        inner.addEventListener('click', (e) => e.stopPropagation());
    }
    jetskiPartsModal.addEventListener('click', () => closeJetskiPartsModal());

    if (jetskiPartsModalClose) jetskiPartsModalClose.addEventListener('click', () => closeJetskiPartsModal());
    if (jetskiPartsModalPrev) jetskiPartsModalPrev.addEventListener('click', () => changeJetskiPartsSlide(-1));
    if (jetskiPartsModalNext) jetskiPartsModalNext.addEventListener('click', () => changeJetskiPartsSlide(1));
}

initJetskiPartsLightbox();

// Gallery lightbox (digger-trailer.html and similar)
const galleryModal = document.getElementById('galleryModal');
const galleryModalImg = document.getElementById('galleryModalImg');
let gallerySlideIndex = 0;
let galleryImages = [];

function openModal(thumbEl) {
    if (!galleryModal || !galleryModalImg || !thumbEl) return;
    const grid = thumbEl.closest('.gallery-grid');
    galleryImages = grid
        ? Array.from(grid.querySelectorAll('.gallery-thumb img'))
        : Array.from(document.querySelectorAll('.gallery-grid .gallery-thumb img'));
    const clicked = thumbEl.querySelector('img');
    gallerySlideIndex = clicked ? galleryImages.indexOf(clicked) : 0;
    if (gallerySlideIndex < 0) gallerySlideIndex = 0;
    updateGalleryModalImage();
    galleryModal.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';
}

function updateGalleryModalImage() {
    if (!galleryModalImg || !galleryImages.length) return;
    const img = galleryImages[gallerySlideIndex];
    galleryModalImg.src = img.src;
    const fromAlt = img.getAttribute('alt') && img.getAttribute('alt').trim();
    galleryModalImg.alt = fromAlt || altTextFromImageSrc(img.getAttribute('src')) || 'Gallery image';
}

function closeModal() {
    if (!galleryModal || !galleryModalImg) return;
    galleryModal.setAttribute('hidden', '');
    galleryModalImg.removeAttribute('src');
    galleryModalImg.alt = '';
    document.body.style.overflow = '';
}

function changeSlide(dir) {
    if (!galleryImages.length) return;
    gallerySlideIndex += dir;
    if (gallerySlideIndex >= galleryImages.length) gallerySlideIndex = 0;
    if (gallerySlideIndex < 0) gallerySlideIndex = galleryImages.length - 1;
    updateGalleryModalImage();
}

if (galleryModal) {
    const galleryModalInner = galleryModal.querySelector('.gallery-modal__inner');
    if (galleryModalInner) {
        galleryModalInner.addEventListener('click', function (e) {
            e.stopPropagation();
        });
    }
    galleryModal.addEventListener('click', function () {
        closeModal();
    });
}

document.addEventListener('keydown', function (e) {
    const accessoryOpen = accessoryModal && !accessoryModal.hasAttribute('hidden');
    const jetskiPartsOpen = jetskiPartsModal && !jetskiPartsModal.hasAttribute('hidden');
    const galleryOpen = galleryModal && !galleryModal.hasAttribute('hidden');
    if (accessoryOpen) {
        if (e.key === 'Escape') {
            e.preventDefault();
            closeAccessoryModal();
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            changeAccessorySlide(-1);
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            changeAccessorySlide(1);
        }
        return;
    }
    if (jetskiPartsOpen) {
        if (e.key === 'Escape') {
            e.preventDefault();
            closeJetskiPartsModal();
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            changeJetskiPartsSlide(-1);
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            changeJetskiPartsSlide(1);
        }
        return;
    }
    if (galleryOpen) {
        if (e.key === 'Escape') closeModal();
        if (e.key === 'ArrowLeft') changeSlide(-1);
        if (e.key === 'ArrowRight') changeSlide(1);
    }
});
