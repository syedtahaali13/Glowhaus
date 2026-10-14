/* ═══════════════════════════════════════════════════════
   GLOWHAUS — HERO INTERACTION ENGINE
   Cursor-driven negative-space text reveal
   ═══════════════════════════════════════════════════════ */

(function () {
    'use strict';

    // ── DOM References ────────────────────────────────
    const hero = document.getElementById('heroContainer');
    const negativeText = document.getElementById('negativeText');
    const pendantLamp = document.getElementById('pendantLamp');
    const cursorGlow = document.getElementById('cursorGlow');
    const lampGlow = document.getElementById('lampGlow');

    // ── State ─────────────────────────────────────────
    let isHovering = false;
    let rafId = null;
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let currentX = mouseX;
    let currentY = mouseY;

    // ── Config ────────────────────────────────────────
    const SMOOTHING = 0.12;       // Lerp factor (0 = frozen, 1 = instant)
    const BASE_RADIUS_X = 380;     // Ellipse X radius of the glow mask
    const BASE_RADIUS_Y = 320;     // Ellipse Y radius of the glow mask
    const MIN_RADIUS = 0;
    const MAX_OPACITY = 1;
    const PARALLAX_STRENGTH = 12;  // Lamp parallax pixels

    // ═════════════════════════════════════════════════
    // MOUSE MOVE — capture raw cursor position
    // ═════════════════════════════════════════════════
    hero.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;

        if (!isHovering) {
            isHovering = true;
            currentX = mouseX;
            currentY = mouseY;
            // Fade in the text + cursor glow
            negativeText.style.opacity = MAX_OPACITY;
            cursorGlow.style.opacity = '1';
            startLoop();
        }
    });

    // ═════════════════════════════════════════════════
    // MOUSE LEAVE — fade out gracefully
    // ═════════════════════════════════════════════════
    hero.addEventListener('mouseleave', () => {
        isHovering = false;
        negativeText.style.opacity = '0';
        cursorGlow.style.opacity = '0';
        // Reset lamp parallax
        pendantLamp.style.transform = 'none';
    });

    // ═════════════════════════════════════════════════
    // NAVIGATION LOGIC (Overlay Menu)
    // ═════════════════════════════════════════════════
    const navMenuBtn = document.getElementById('navMenu');
    const navOverlay = document.getElementById('navOverlay');
    const categoriesBtn = document.getElementById('categoriesBtn');
    const categoriesDropdownContainer = document.getElementById('categoriesDropdownContainer');

    if (navMenuBtn && navOverlay) {
        navMenuBtn.addEventListener('click', () => {
            navMenuBtn.classList.toggle('active');
            navOverlay.classList.toggle('active');
        });

        // Close overlay when clicking an overlay anchor link
        navOverlay.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navMenuBtn.classList.remove('active');
                navOverlay.classList.remove('active');
            });
        });
    }

    if (categoriesBtn && categoriesDropdownContainer) {
        categoriesBtn.addEventListener('click', () => {
            categoriesDropdownContainer.classList.toggle('open');
        });
    }

    // ═════════════════════════════════════════════════
    // ANIMATION LOOP — smooth interpolation per frame
    // ═════════════════════════════════════════════════
    function startLoop() {
        if (rafId) return;
        rafId = requestAnimationFrame(loop);
    }

    function loop() {
        if (!isHovering) {
            rafId = null;
            return;
        }

        // Lerp towards target
        currentX += (mouseX - currentX) * SMOOTHING;
        currentY += (mouseY - currentY) * SMOOTHING;

        // ── Compute normalised position ─────────────
        const rect = hero.getBoundingClientRect();
        const relX = currentX - rect.left;
        const relY = currentY - rect.top;
        const xPercent = (relX / rect.width) * 100;
        const yPercent = (relY / rect.height) * 100;

        // ── Directional radius scaling ──────────────
        // Off-centre cursors get a slightly tighter mask
        // to simulate light falloff
        const distFromCentre = Math.abs(xPercent - 50) / 50; // 0–1
        const radiusX = BASE_RADIUS_X + (1 - distFromCentre) * 60;
        const radiusY = BASE_RADIUS_Y + (1 - distFromCentre) * 40;

        // ── Build directional radial-gradient mask ──
        // Warm core → soft trailing diffusion
        const maskGradient = `radial-gradient(
            ellipse ${radiusX}px ${radiusY}px at ${xPercent}% ${yPercent}%,
            rgba(0,0,0, 1)   0%,
            rgba(0,0,0, 0.85) 18%,
            rgba(0,0,0, 0.55) 38%,
            rgba(0,0,0, 0.2)  62%,
            rgba(0,0,0, 0)    100%
        )`;

        negativeText.style.webkitMaskImage = maskGradient;
        negativeText.style.maskImage = maskGradient;

        // ── Cursor glow follower ────────────────────
        cursorGlow.style.left = currentX + 'px';
        cursorGlow.style.top = currentY + 'px';

        // ── Subtle lamp parallax ────────────────────
        const offsetX = ((xPercent - 50) / 50) * PARALLAX_STRENGTH;
        const offsetY = ((yPercent - 50) / 50) * (PARALLAX_STRENGTH * 0.4);
        pendantLamp.style.transform = `translate(${offsetX}px, ${offsetY}px)`;

        // ── Lamp glow intensity based on proximity ──
        // Closer cursor = brighter glow
        const lampRect = pendantLamp.getBoundingClientRect();
        const lampCenterX = lampRect.left + lampRect.width / 2;
        const lampCenterY = lampRect.top + lampRect.height * 0.85;
        const distToLamp = Math.hypot(currentX - lampCenterX, currentY - lampCenterY);
        const maxDist = Math.hypot(rect.width / 2, rect.height / 2);
        const lampIntensity = 1 - Math.min(distToLamp / maxDist, 1);
        lampGlow.style.opacity = 0.5 + lampIntensity * 0.5;
        lampGlow.style.filter = `blur(${12 - lampIntensity * 4}px)`;

        rafId = requestAnimationFrame(loop);
    }

    // ═════════════════════════════════════════════════
    // TOUCH SUPPORT (mobile / tablet)
    // ═════════════════════════════════════════════════
    hero.addEventListener('touchmove', (e) => {
        const touch = e.touches[0];
        mouseX = touch.clientX;
        mouseY = touch.clientY;

        if (!isHovering) {
            isHovering = true;
            currentX = mouseX;
            currentY = mouseY;
            negativeText.style.opacity = MAX_OPACITY;
            cursorGlow.style.opacity = '1';
            startLoop();
        }
    }, { passive: true });

    hero.addEventListener('touchend', () => {
        // Keep the glow visible for a moment after touch ends
        setTimeout(() => {
            isHovering = false;
            negativeText.style.opacity = '0';
            cursorGlow.style.opacity = '0';
            pendantLamp.style.transform = 'none';
        }, 600);
    });

    // ═════════════════════════════════════════════════
    // INTRO — brief flash of text to hint at interaction
    // ═════════════════════════════════════════════════
    setTimeout(() => {
        if (isHovering) return;
        negativeText.style.transition = 'opacity 1.2s ease';
        negativeText.style.opacity = '0.6';

        // Set a centre mask for the hint
        const hintMask = `radial-gradient(
            ellipse 500px 400px at 50% 45%,
            rgba(0,0,0, 1) 0%,
            rgba(0,0,0, 0.6) 35%,
            rgba(0,0,0, 0) 100%
        )`;
        negativeText.style.webkitMaskImage = hintMask;
        negativeText.style.maskImage = hintMask;

        setTimeout(() => {
            if (isHovering) return;
            negativeText.style.opacity = '0';
            negativeText.style.transition = 'opacity 0.4s ease';
        }, 1800);
    }, 1600);

    // ═════════════════════════════════════════════════
    // SLIDER LOGIC — 4 slides with product cards
    // ═════════════════════════════════════════════════
    const slideNumberText = document.getElementById('slideNumber');
    const chevronLeft = document.getElementById('chevronLeft');
    const chevronRight = document.getElementById('chevronRight');
    const productCard = document.getElementById('productCard');
    const productCardImg = document.getElementById('productCardImg');
    const productCardName = document.getElementById('productCardName');
    const productCardPrice = document.getElementById('productCardPrice');

    const slides = [
        { img: 'assets/chandelier.png', name: 'Chandeliers', price: '$299.00' },
        { img: 'assets/hanging-light.png', name: 'Hanging Lights', price: '$149.00' },
        { img: 'assets/table-lamp.png', name: 'Table Lamps', price: '$89.00' },
        { img: 'assets/cove-lighting.png', name: 'Cove Lighting', price: '$199.00' },
    ];

    let currentSlide = 0;
    let slideInterval;

    function updateSlide(newIndex) {
        currentSlide = ((newIndex % slides.length) + slides.length) % slides.length;
        const data = slides[currentSlide];

        // Fade out number + card
        slideNumberText.style.opacity = '0';
        productCard.classList.add('fade-out');

        setTimeout(() => {
            slideNumberText.innerText = `0${currentSlide + 1}`;
            productCardImg.src = data.img;
            productCardImg.alt = data.name;
            productCardName.innerText = data.name;
            productCardPrice.innerText = data.price;

            slideNumberText.style.opacity = '1';
            productCard.classList.remove('fade-out');
        }, 280);
    }

    function nextSlide() { updateSlide(currentSlide + 1); resetInterval(); }
    function prevSlide() { updateSlide(currentSlide - 1); resetInterval(); }

    function resetInterval() {
        clearInterval(slideInterval);
        slideInterval = setInterval(nextSlide, 4000);
    }

    if (chevronLeft && chevronRight && slideNumberText) {
        chevronLeft.addEventListener('click', prevSlide);
        chevronRight.addEventListener('click', nextSlide);
        slideNumberText.style.transition = 'opacity 0.28s ease';
        resetInterval();
    }

    // ═════════════════════════════════════════════
    // DAY / NIGHT THEME TOGGLE — Product Marquee
    // ═════════════════════════════════════════════
    const themeToggle = document.getElementById('themeToggle');
    const marqueeSection = document.getElementById('specialFeatureArea');

    // Default: light/day mode active (sun shown, lights-off images visible)
    let isLightMode = true;

    if (themeToggle && marqueeSection) {
        // Start in light mode — no dark-mode class, toggle shows sun
        themeToggle.classList.add('is-light');

        themeToggle.addEventListener('click', () => {
            isLightMode = !isLightMode;

            if (isLightMode) {
                // Switch to day / light — show lights-off images
                marqueeSection.classList.remove('dark-mode');
                themeToggle.classList.add('is-light');
            } else {
                // Switch to night / dark — show lights-on images
                marqueeSection.classList.add('dark-mode');
                themeToggle.classList.remove('is-light');
            }
        });
    }

})();

/* ═══════════════════════════════════════════════════════
   TESTIMONIAL CAROUSEL
   Drag-to-swipe stacked card carousel (vanilla JS)
   ═══════════════════════════════════════════════════════ */
/* ═══════════════════════════════════════════════════════
   TESTIMONIAL INTERACTION ENGINE
   3-Second Auto-Cycling Carousel + Navigation Buttons & Drag
   ═══════════════════════════════════════════════════════ */
(function () {
    'use strict';

    const TESTIMONIALS = [
        {
            id: 1,
            name: 'Sarah Mitchell',
            avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=120&fit=crop&crop=face',
            description: 'The chandelier we ordered completely transformed our dining room. Absolutely stunning craftsmanship and quality!'
        },
        {
            id: 2,
            name: 'James Thornton',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&crop=face',
            description: 'Exceptional service from start to finish. The wall lights arrived beautifully packaged and look incredible.'
        },
        {
            id: 3,
            name: 'Amelia Chen',
            avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&h=120&fit=crop&crop=face',
            description: 'Highly recommended! The pendant lamps exceeded every expectation. Our home feels like a luxury hotel now.'
        },
        {
            id: 4,
            name: 'David Vance',
            avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop&crop=face',
            description: 'The warm amber glow from our hanging lights creates an unmatched cozy evening atmosphere. Perfection in design.'
        },
        {
            id: 5,
            name: 'Elena Rostova',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=face',
            description: 'Remarkable build quality and aesthetic elegance. Every guest compliments our living room chandelier.'
        }
    ];

    const stack = document.getElementById('testimonialStack');
    const dotsContainer = document.getElementById('testimonialDots');
    const prevBtn = document.getElementById('testimonialPrev');
    const nextBtn = document.getElementById('testimonialNext');
    const carouselWrapper = document.querySelector('.testimonial-carousel-wrapper');

    if (!stack || !dotsContainer) return;

    let currentIndex = 0;
    let isDragging = false;
    let isAnimating = false;
    let startX = 0;
    let currentX = 0;
    let autoplayTimer = null;
    const AUTOPLAY_DELAY = 3000; // 3 seconds

    // ── Build Cards ────────────────────────────────────
    function buildCards() {
        stack.innerHTML = '';
        const total = TESTIMONIALS.length;

        for (let i = 0; i < Math.min(3, total); i++) {
            const pos = i; // 0 = top, 1 = mid, 2 = back
            const t = TESTIMONIALS[(currentIndex + i) % total];
            const card = createCard(t, pos);
            stack.appendChild(card);
        }

        buildDots();
        attachDragListeners();
    }

    function createCard(t, pos) {
        const card = document.createElement('div');
        card.className = 't-card';
        card.setAttribute('data-pos', pos);

        card.innerHTML = `
            <img class="t-avatar" src="${t.avatar}" alt="${t.name}" loading="lazy">
            <div class="t-rating" aria-label="5 stars rating">
                <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
            </div>
            <span class="t-name">${t.name}</span>
            <p class="t-desc">${t.description}</p>
        `;

        return card;
    }

    // ── Dots ───────────────────────────────────────────
    function buildDots() {
        dotsContainer.innerHTML = '';
        TESTIMONIALS.forEach((_, i) => {
            const dot = document.createElement('div');
            dot.className = 't-dot' + (i === currentIndex ? ' active' : '');
            dot.addEventListener('click', () => {
                goTo(i);
                resetAutoplay();
            });
            dotsContainer.appendChild(dot);
        });
    }

    // ── Navigation ─────────────────────────────────────
    function advance(direction) {
        if (isAnimating) return;
        const topCard = stack.querySelector('.t-card[data-pos="0"]');
        if (!topCard) return;

        isAnimating = true;
        topCard.classList.add(direction > 0 ? 'swipe-left' : 'swipe-right');

        setTimeout(() => {
            currentIndex = (currentIndex + (direction > 0 ? 1 : TESTIMONIALS.length - 1)) % TESTIMONIALS.length;
            buildCards();
            isAnimating = false;
        }, 300);
    }

    function goTo(index) {
        if (index === currentIndex || isAnimating) return;
        currentIndex = index;
        buildCards();
    }

    // ── Autoplay 3s Loop ───────────────────────────────
    function startAutoplay() {
        stopAutoplay();
        autoplayTimer = setInterval(() => {
            if (!isDragging && !isAnimating) {
                advance(1);
            }
        }, AUTOPLAY_DELAY);
    }

    function stopAutoplay() {
        if (autoplayTimer) {
            clearInterval(autoplayTimer);
            autoplayTimer = null;
        }
    }

    function resetAutoplay() {
        stopAutoplay();
        startAutoplay();
    }

    // Button controls (Desktop and Mobile)
    const prevBtnMobile = document.getElementById('testimonialPrevMobile');
    const nextBtnMobile = document.getElementById('testimonialNextMobile');

    [prevBtn, prevBtnMobile].forEach(btn => {
        if (btn) {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                advance(-1);
                resetAutoplay();
            });
        }
    });

    [nextBtn, nextBtnMobile].forEach(btn => {
        if (btn) {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                advance(1);
                resetAutoplay();
            });
        }
    });

    // Pause autoplay on mouse hover / touch
    if (carouselWrapper) {
        carouselWrapper.addEventListener('mouseenter', stopAutoplay);
        carouselWrapper.addEventListener('mouseleave', startAutoplay);
        carouselWrapper.addEventListener('touchstart', stopAutoplay, { passive: true });
        carouselWrapper.addEventListener('touchend', startAutoplay, { passive: true });
    }

    // ── Drag Logic ─────────────────────────────────────
    function attachDragListeners() {
        const topCard = stack.querySelector('.t-card[data-pos="0"]');
        if (!topCard) return;

        topCard.addEventListener('pointerdown', onDragStart);
    }

    function onDragStart(e) {
        if (isAnimating) return;
        stopAutoplay();
        isDragging = true;
        startX = e.clientX;
        currentX = 0;

        const topCard = e.currentTarget;
        topCard.classList.add('dragging');
        topCard.setPointerCapture(e.pointerId);

        topCard.addEventListener('pointermove', onDragMove);
        topCard.addEventListener('pointerup', onDragEnd);
        topCard.addEventListener('pointercancel', onDragEnd);
    }

    function onDragMove(e) {
        if (!isDragging) return;
        currentX = e.clientX - startX;
        const rotate = currentX / 18;
        e.currentTarget.style.transform = `translateX(${currentX}px) rotate(${rotate}deg) scale(1)`;
    }

    function onDragEnd(e) {
        if (!isDragging) return;
        isDragging = false;

        const topCard = e.currentTarget;
        topCard.classList.remove('dragging');
        topCard.removeEventListener('pointermove', onDragMove);
        topCard.removeEventListener('pointerup', onDragEnd);
        topCard.removeEventListener('pointercancel', onDragEnd);

        const THRESHOLD = 75;

        if (currentX < -THRESHOLD) {
            advance(1);
        } else if (currentX > THRESHOLD) {
            advance(-1);
        } else {
            // Snap back
            topCard.style.transform = '';
        }

        currentX = 0;
        startAutoplay();
    }

    // ── Init ───────────────────────────────────────────
    buildCards();
    startAutoplay();

})();
