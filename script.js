// MHP Candidate Website - Interactive features

document.addEventListener('DOMContentLoaded', () => {
    // Mobile menu toggle
    const mobileToggle = document.getElementById('mobile-toggle');
    const navList = document.querySelector('.nav-list');
    const navLinks = document.querySelectorAll('.nav-link');
    
    mobileToggle.addEventListener('click', () => {
        navList.classList.toggle('active');
        const icon = mobileToggle.querySelector('i');
        if (navList.classList.contains('active')) {
            icon.classList.remove('fa-bars');
            icon.classList.add('fa-times');
        } else {
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        }
    });

    // Close mobile menu on click
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navList.classList.remove('active');
            const icon = mobileToggle.querySelector('i');
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        });
    });

    // Sticky Header and Active Navigation
    const header = document.getElementById('header');
    const sections = document.querySelectorAll('section');

    window.addEventListener('scroll', () => {
        // Add shadow to header on scroll
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }

        // Active link highlighting based on scroll position
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (scrollY >= (sectionTop - 150)) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href').includes(current) && current !== '') {
                link.classList.add('active');
            }
        });
    });

    // Simple Form Submission (Prevent Default)
    const form = document.getElementById('contactForm');
    if(form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const btn = form.querySelector('button[type="submit"]');
            const originalText = btn.innerHTML;
            
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Gönderiliyor...';
            btn.style.opacity = '0.8';
            
            // Simulate sending delay
            setTimeout(() => {
                btn.innerHTML = '<i class="fas fa-check"></i> Mesajınız İletildi';
                btn.style.backgroundColor = '#28a745';
                form.reset();
                
                setTimeout(() => {
                    btn.innerHTML = originalText;
                    btn.style.backgroundColor = '';
                    btn.style.opacity = '1';
                }, 3000);
            }, 1500);
        });
    }
});

// Social Tabs Switcher
function switchSocialTab(tabKey) {
    const allTabs = document.querySelectorAll('.social-tab-content');
    const allButtons = document.querySelectorAll('.tab-btn');
    
    allTabs.forEach(tab => {
        tab.style.display = 'none';
        tab.classList.remove('active');
    });
    
    allButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-tab') === tabKey) {
            btn.classList.add('active');
        }
    });
    
    const targetTab = document.getElementById(`tab-${tabKey}`);
    if (targetTab) {
        targetTab.style.display = 'block';
        targetTab.classList.add('active');
    }
}

// Hero Slider - Dynamic & Modular
document.addEventListener('DOMContentLoaded', () => {
    const slidesWrapper = document.getElementById('heroSlidesWrapper');
    const dotsContainer = document.getElementById('sliderDots');
    const prevBtn = document.getElementById('sliderPrev');
    const nextBtn = document.getElementById('sliderNext');
    const sliderSection = document.getElementById('home');
    
    if (!slidesWrapper) return;
    
    const slides = slidesWrapper.querySelectorAll('.hero-slide');
    if (!slides.length) return;
    
    let currentSlide = 0;
    let slideInterval = null;
    const slideDuration = 5000; // 5 saniye otomatik geçiş
    
    // Dynamically build / sync dots based on slide count
    if (dotsContainer) {
        dotsContainer.innerHTML = '';
        slides.forEach((slide, idx) => {
            const dot = document.createElement('span');
            dot.className = `dot ${idx === 0 ? 'active' : ''}`;
            dot.dataset.slide = idx;
            const slideTitle = slide.querySelector('.hero-title')?.innerText.replace(/\s+/g, ' ').trim() || `Slayt ${idx + 1}`;
            dot.title = slideTitle;
            dot.addEventListener('click', () => {
                showSlide(idx);
                startAutoSlide();
            });
            dotsContainer.appendChild(dot);
        });
    }
    
    const dots = dotsContainer ? dotsContainer.querySelectorAll('.dot') : [];
    
    function showSlide(index) {
        if (index >= slides.length) currentSlide = 0;
        else if (index < 0) currentSlide = slides.length - 1;
        else currentSlide = index;
        
        slides.forEach((slide, i) => {
            if (i === currentSlide) {
                slide.classList.add('active');
            } else {
                slide.classList.remove('active');
            }
        });
        
        dots.forEach((dot, i) => {
            if (i === currentSlide) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }
    
    function nextSlide() {
        showSlide(currentSlide + 1);
    }
    
    function prevSlide() {
        showSlide(currentSlide - 1);
    }
    
    function startAutoSlide() {
        stopAutoSlide();
        slideInterval = setInterval(nextSlide, slideDuration);
    }
    
    function stopAutoSlide() {
        if (slideInterval) {
            clearInterval(slideInterval);
            slideInterval = null;
        }
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            nextSlide();
            startAutoSlide();
        });
    }
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            prevSlide();
            startAutoSlide();
        });
    }
    
    // Pause on hover
    if (sliderSection) {
        sliderSection.addEventListener('mouseenter', stopAutoSlide);
        sliderSection.addEventListener('mouseleave', startAutoSlide);
        
        // Touch swipe support for mobile
        let touchStartX = 0;
        let touchEndX = 0;
        
        sliderSection.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });
        
        sliderSection.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            if (touchStartX - touchEndX > 50) {
                nextSlide();
                startAutoSlide();
            } else if (touchEndX - touchStartX > 50) {
                prevSlide();
                startAutoSlide();
            }
        }, { passive: true });
    }
    
    // Initialize
    showSlide(0);
    startAutoSlide();
});

// Vision & Projects (Hedeflerimiz) Carousel Slider
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('projectsCarousel');
    const viewport = document.getElementById('projectsViewport');
    const track = document.getElementById('projectsTrack');
    const prevBtn = document.getElementById('projectsPrev');
    const nextBtn = document.getElementById('projectsNext');
    const dotsContainer = document.getElementById('projectsDots');
    
    if (!container || !viewport || !track) return;
    
    const cards = track.querySelectorAll('.project-card');
    if (!cards.length) return;
    
    let currentIndex = 0;
    let maxIndex = 0;
    let cardStep = 0;
    let autoPlayTimer = null;
    const autoPlayInterval = 4500;
    
    function calculateMetrics() {
        const viewportWidth = viewport.clientWidth;
        const firstCard = cards[0];
        const cardWidth = firstCard.offsetWidth;
        const gap = parseInt(window.getComputedStyle(track).gap) || 24;
        cardStep = cardWidth + gap;
        
        // Number of visible cards at a time
        const visibleCards = Math.max(1, Math.floor((viewportWidth + gap) / cardStep));
        maxIndex = Math.max(0, cards.length - visibleCards);
        
        if (currentIndex > maxIndex) {
            currentIndex = maxIndex;
        }
        
        renderDots();
        updateSliderPosition(false);
    }
    
    function renderDots() {
        if (!dotsContainer) return;
        dotsContainer.innerHTML = '';
        const totalDots = maxIndex + 1;
        
        for (let i = 0; i < totalDots; i++) {
            const dot = document.createElement('span');
            dot.className = `p-dot ${i === currentIndex ? 'active' : ''}`;
            dot.dataset.index = i;
            dot.title = `Hedef Grubu ${i + 1}`;
            dot.addEventListener('click', () => {
                goToIndex(i);
                startAutoPlay();
            });
            dotsContainer.appendChild(dot);
        }
    }
    
    function updateDots() {
        if (!dotsContainer) return;
        const dots = dotsContainer.querySelectorAll('.p-dot');
        dots.forEach((dot, i) => {
            if (i === currentIndex) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }
    
    function updateSliderPosition(animate = true) {
        if (!animate) {
            track.style.transition = 'none';
        } else {
            track.style.transition = 'transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)';
        }
        
        const offset = currentIndex * cardStep;
        track.style.transform = `translateX(-${offset}px)`;
        
        if (prevBtn) {
            prevBtn.classList.toggle('disabled', currentIndex === 0);
        }
        if (nextBtn) {
            nextBtn.classList.toggle('disabled', currentIndex >= maxIndex);
        }
        
        updateDots();
    }
    
    function goToIndex(index) {
        currentIndex = Math.max(0, Math.min(index, maxIndex));
        updateSliderPosition(true);
    }
    
    function nextProjects() {
        if (currentIndex >= maxIndex) {
            goToIndex(0);
        } else {
            goToIndex(currentIndex + 1);
        }
    }
    
    function prevProjects() {
        if (currentIndex <= 0) {
            goToIndex(maxIndex);
        } else {
            goToIndex(currentIndex - 1);
        }
    }
    
    function startAutoPlay() {
        stopAutoPlay();
        autoPlayTimer = setInterval(nextProjects, autoPlayInterval);
    }
    
    function stopAutoPlay() {
        if (autoPlayTimer) {
            clearInterval(autoPlayTimer);
            autoPlayTimer = null;
        }
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            nextProjects();
            startAutoPlay();
        });
    }
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            prevProjects();
            startAutoPlay();
        });
    }
    
    // Pause on hover
    container.addEventListener('mouseenter', stopAutoPlay);
    container.addEventListener('mouseleave', startAutoPlay);
    
    // Drag and Touch Support
    let isDragging = false;
    let startX = 0;
    
    viewport.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.clientX;
        stopAutoPlay();
        track.style.transition = 'none';
    });
    
    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const currentX = e.clientX;
        const diffX = currentX - startX;
        const baseOffset = currentIndex * cardStep;
        track.style.transform = `translateX(-${baseOffset - diffX}px)`;
    });
    
    window.addEventListener('mouseup', (e) => {
        if (!isDragging) return;
        isDragging = false;
        const diffX = e.clientX - startX;
        if (diffX < -50 && currentIndex < maxIndex) {
            goToIndex(currentIndex + 1);
        } else if (diffX > 50 && currentIndex > 0) {
            goToIndex(currentIndex - 1);
        } else {
            goToIndex(currentIndex);
        }
        startAutoPlay();
    });
    
    // Touch events for mobile
    let touchStartX = 0;
    let touchEndX = 0;
    
    viewport.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
        stopAutoPlay();
    }, { passive: true });
    
    viewport.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        const diff = touchStartX - touchEndX;
        if (diff > 50) {
            nextProjects();
        } else if (diff < -50) {
            prevProjects();
        }
        startAutoPlay();
    }, { passive: true });
    
    // Window resize handler with debounce
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            calculateMetrics();
        }, 150);
    });
    
    // Initial calculation and start
    calculateMetrics();
    startAutoPlay();
});

// Values & Principles (İlkelerimiz) Carousel Slider
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('valuesCarousel');
    const viewport = document.getElementById('valuesViewport');
    const track = document.getElementById('valuesTrack');
    const prevBtn = document.getElementById('valuesPrev');
    const nextBtn = document.getElementById('valuesNext');
    const dotsContainer = document.getElementById('valuesDots');
    
    if (!container || !viewport || !track) return;
    
    const cards = track.querySelectorAll('.value-card');
    if (!cards.length) return;
    
    let currentIndex = 0;
    let maxIndex = 0;
    let cardStep = 0;
    let autoPlayTimer = null;
    const autoPlayInterval = 5000;
    
    function calculateMetrics() {
        const viewportWidth = viewport.clientWidth;
        const firstCard = cards[0];
        const cardWidth = firstCard.offsetWidth;
        const gap = parseInt(window.getComputedStyle(track).gap) || 24;
        cardStep = cardWidth + gap;
        
        // Number of visible cards at a time
        const visibleCards = Math.max(1, Math.floor((viewportWidth + gap) / cardStep));
        maxIndex = Math.max(0, cards.length - visibleCards);
        
        if (currentIndex > maxIndex) {
            currentIndex = maxIndex;
        }
        
        renderDots();
        updateSliderPosition(false);
    }
    
    function renderDots() {
        if (!dotsContainer) return;
        dotsContainer.innerHTML = '';
        const totalDots = maxIndex + 1;
        
        for (let i = 0; i < totalDots; i++) {
            const dot = document.createElement('span');
            dot.className = `v-dot ${i === currentIndex ? 'active' : ''}`;
            dot.dataset.index = i;
            dot.title = `İlke Grubu ${i + 1}`;
            dot.addEventListener('click', () => {
                goToIndex(i);
                startAutoPlay();
            });
            dotsContainer.appendChild(dot);
        }
    }
    
    function updateDots() {
        if (!dotsContainer) return;
        const dots = dotsContainer.querySelectorAll('.v-dot');
        dots.forEach((dot, i) => {
            if (i === currentIndex) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }
    
    function updateSliderPosition(animate = true) {
        if (!animate) {
            track.style.transition = 'none';
        } else {
            track.style.transition = 'transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)';
        }
        
        const offset = currentIndex * cardStep;
        track.style.transform = `translateX(-${offset}px)`;
        
        if (prevBtn) {
            prevBtn.classList.toggle('disabled', currentIndex === 0);
        }
        if (nextBtn) {
            nextBtn.classList.toggle('disabled', currentIndex >= maxIndex);
        }
        
        updateDots();
    }
    
    function goToIndex(index) {
        currentIndex = Math.max(0, Math.min(index, maxIndex));
        updateSliderPosition(true);
    }
    
    function nextValues() {
        if (currentIndex >= maxIndex) {
            goToIndex(0);
        } else {
            goToIndex(currentIndex + 1);
        }
    }
    
    function prevValues() {
        if (currentIndex <= 0) {
            goToIndex(maxIndex);
        } else {
            goToIndex(currentIndex - 1);
        }
    }
    
    function startAutoPlay() {
        stopAutoPlay();
        autoPlayTimer = setInterval(nextValues, autoPlayInterval);
    }
    
    function stopAutoPlay() {
        if (autoPlayTimer) {
            clearInterval(autoPlayTimer);
            autoPlayTimer = null;
        }
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            nextValues();
            startAutoPlay();
        });
    }
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            prevValues();
            startAutoPlay();
        });
    }
    
    // Pause on hover
    container.addEventListener('mouseenter', stopAutoPlay);
    container.addEventListener('mouseleave', startAutoPlay);
    
    // Drag and Touch Support
    let isDragging = false;
    let startX = 0;
    
    viewport.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.clientX;
        stopAutoPlay();
        track.style.transition = 'none';
    });
    
    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const currentX = e.clientX;
        const diffX = currentX - startX;
        const baseOffset = currentIndex * cardStep;
        track.style.transform = `translateX(-${baseOffset - diffX}px)`;
    });
    
    window.addEventListener('mouseup', (e) => {
        if (!isDragging) return;
        isDragging = false;
        const diffX = e.clientX - startX;
        if (diffX < -50 && currentIndex < maxIndex) {
            goToIndex(currentIndex + 1);
        } else if (diffX > 50 && currentIndex > 0) {
            goToIndex(currentIndex - 1);
        } else {
            goToIndex(currentIndex);
        }
        startAutoPlay();
    });
    
    // Touch events for mobile
    let touchStartX = 0;
    let touchEndX = 0;
    
    viewport.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
        stopAutoPlay();
    }, { passive: true });
    
    viewport.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        const diff = touchStartX - touchEndX;
        if (diff > 50) {
            nextValues();
        } else if (diff < -50) {
            prevValues();
        }
        startAutoPlay();
    }, { passive: true });
    
    // Window resize handler with debounce
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            calculateMetrics();
        }, 150);
    });
    
    // Initial calculation and start
    calculateMetrics();
    startAutoPlay();
});

// Photo Gallery (Bento Carousel, Filtering & Lightbox Modal)
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('galleryCarousel');
    const viewport = document.getElementById('galleryViewport');
    const track = document.getElementById('galleryTrack');
    const prevBtn = document.getElementById('galleryPrev');
    const nextBtn = document.getElementById('galleryNext');
    const dotsContainer = document.getElementById('galleryDots');
    const slides = Array.from(document.querySelectorAll('.gallery-bento-slide'));
    const bentoItems = Array.from(document.querySelectorAll('.gallery-bento-item'));
    const filterBtns = document.querySelectorAll('.gallery-filter-btn');
    
    // Lightbox elements
    const modal = document.getElementById('imageLightboxModal');
    const backdrop = document.getElementById('lightboxBackdrop');
    const closeBtn = document.getElementById('lightboxCloseBtn');
    const lightboxPrev = document.getElementById('lightboxPrevBtn');
    const lightboxNext = document.getElementById('lightboxNextBtn');
    const lightboxImg = document.getElementById('lightboxImage');
    const lightboxTitle = document.getElementById('lightboxTitle');
    const lightboxDesc = document.getElementById('lightboxDesc');
    const lightboxCounter = document.getElementById('lightboxCounter');
    
    if (!container || !track || !slides.length) return;
    
    let currentSlide = 0;
    const totalSlides = slides.length;
    let autoPlayTimer = null;
    
    // Create Dots
    if (dotsContainer) {
        dotsContainer.innerHTML = '';
        slides.forEach((_, idx) => {
            const dot = document.createElement('span');
            dot.className = `gallery-dot ${idx === 0 ? 'active' : ''}`;
            dot.setAttribute('data-slide', idx);
            dot.addEventListener('click', () => {
                goToSlide(idx);
                startAutoPlay();
            });
            dotsContainer.appendChild(dot);
        });
    }
    
    function updateDots() {
        if (!dotsContainer) return;
        const dots = dotsContainer.querySelectorAll('.gallery-dot');
        dots.forEach((dot, idx) => {
            dot.classList.toggle('active', idx === currentSlide);
        });
    }
    
    function goToSlide(index) {
        currentSlide = (index + totalSlides) % totalSlides;
        track.style.transform = `translateX(-${currentSlide * 100}%)`;
        updateDots();
    }
    
    function nextSlide() {
        goToSlide(currentSlide + 1);
    }
    
    function prevSlide() {
        goToSlide(currentSlide - 1);
    }
    
    function startAutoPlay() {
        stopAutoPlay();
        autoPlayTimer = setInterval(nextSlide, 5000);
    }
    
    function stopAutoPlay() {
        if (autoPlayTimer) {
            clearInterval(autoPlayTimer);
            autoPlayTimer = null;
        }
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            nextSlide();
            startAutoPlay();
        });
    }
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            prevSlide();
            startAutoPlay();
        });
    }
    
    container.addEventListener('mouseenter', stopAutoPlay);
    container.addEventListener('mouseleave', startAutoPlay);
    
    // Touch & Swipe Support
    let touchStartX = 0;
    let touchEndX = 0;
    
    if (viewport) {
        viewport.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
            stopAutoPlay();
        }, { passive: true });
        
        viewport.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            const diff = touchStartX - touchEndX;
            if (diff > 50) {
                nextSlide();
            } else if (diff < -50) {
                prevSlide();
            }
            startAutoPlay();
        }, { passive: true });
    }
    
    // Filter Buttons Interaction
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const filter = btn.getAttribute('data-filter');
            if (filter === 'all') {
                goToSlide(0);
                bentoItems.forEach(item => item.style.opacity = '1');
            } else {
                let targetSlideIdx = -1;
                slides.forEach((slide, idx) => {
                    const match = slide.querySelector(`[data-category="${filter}"]`);
                    if (match && targetSlideIdx === -1) {
                        targetSlideIdx = idx;
                    }
                });
                
                if (targetSlideIdx !== -1) {
                    goToSlide(targetSlideIdx);
                }
                
                bentoItems.forEach(item => {
                    const cat = item.getAttribute('data-category');
                    if (cat === filter) {
                        item.style.opacity = '1';
                    } else {
                        item.style.opacity = '0.35';
                    }
                });
                
                setTimeout(() => {
                    bentoItems.forEach(item => item.style.opacity = '1');
                }, 2500);
            }
            startAutoPlay();
        });
    });
    
    // Lightbox Logic
    let currentLightboxIdx = 0;
    
    function openLightbox(index) {
        if (!bentoItems[index] || !modal) return;
        currentLightboxIdx = index;
        const item = bentoItems[index];
        const src = item.getAttribute('data-src') || item.querySelector('img')?.src;
        const title = item.getAttribute('data-title') || 'Fotoğraf';
        const desc = item.getAttribute('data-desc') || '';
        
        if (lightboxImg) lightboxImg.src = src;
        if (lightboxTitle) lightboxTitle.innerText = title;
        if (lightboxDesc) lightboxDesc.innerText = desc;
        if (lightboxCounter) lightboxCounter.innerText = `${currentLightboxIdx + 1} / ${bentoItems.length}`;
        
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    function closeLightbox() {
        if (!modal) return;
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    function nextLightboxImage() {
        const nextIdx = (currentLightboxIdx + 1) % bentoItems.length;
        openLightbox(nextIdx);
    }
    
    function prevLightboxImage() {
        const prevIdx = (currentLightboxIdx - 1 + bentoItems.length) % bentoItems.length;
        openLightbox(prevIdx);
    }
    
    bentoItems.forEach((item, idx) => {
        item.addEventListener('click', () => {
            openLightbox(idx);
        });
    });
    
    if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
    if (backdrop) backdrop.addEventListener('click', closeLightbox);
    if (lightboxNext) lightboxNext.addEventListener('click', nextLightboxImage);
    if (lightboxPrev) lightboxPrev.addEventListener('click', prevLightboxImage);
    
    window.addEventListener('keydown', (e) => {
        if (modal && !modal.classList.contains('active')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowRight') nextLightboxImage();
        if (e.key === 'ArrowLeft') prevLightboxImage();
    });
    
    startAutoPlay();
});

// Video Gallery (Cinema Player & Video Modal)
document.addEventListener('DOMContentLoaded', () => {
    const mainStage = document.getElementById('cinemaMainStage');
    const mainThumb = document.getElementById('cinemaMainThumb');
    const mainTitle = document.getElementById('cinemaMainTitle');
    const mainDesc = document.getElementById('cinemaMainDesc');
    const playBtn = document.getElementById('cinemaMainPlayBtn');
    const playlistCards = document.querySelectorAll('.playlist-card');
    
    const videoModal = document.getElementById('videoPlayerModal');
    const videoBackdrop = document.getElementById('videoModalBackdrop');
    const videoCloseBtn = document.getElementById('videoModalCloseBtn');
    const modalTitle = document.getElementById('videoModalTitle');
    const modalDesc = document.getElementById('videoModalDesc');
    const demoThumb = document.getElementById('demoVideoThumb');
    const modalDuration = document.getElementById('demoModalDuration');
    
    if (!mainStage || !playlistCards.length) return;
    
    let activeVideoData = {
        title: playlistCards[0].getAttribute('data-title'),
        desc: playlistCards[0].getAttribute('data-desc'),
        thumb: playlistCards[0].getAttribute('data-thumb'),
        duration: playlistCards[0].getAttribute('data-duration') || '12:45'
    };
    
    playlistCards.forEach(card => {
        card.addEventListener('click', () => {
            playlistCards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            
            const title = card.getAttribute('data-title');
            const desc = card.getAttribute('data-desc');
            const thumb = card.getAttribute('data-thumb');
            const duration = card.getAttribute('data-duration') || '10:00';
            
            activeVideoData = { title, desc, thumb, duration };
            
            if (mainTitle) mainTitle.innerText = title;
            if (mainDesc) mainDesc.innerText = desc;
            if (mainThumb) mainThumb.src = thumb;
        });
    });
    
    function openVideoModal() {
        if (!videoModal) return;
        if (modalTitle) modalTitle.innerText = activeVideoData.title;
        if (modalDesc) modalDesc.innerText = activeVideoData.desc;
        if (demoThumb) demoThumb.src = activeVideoData.thumb;
        if (modalDuration) modalDuration.innerText = activeVideoData.duration;
        
        videoModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    function closeVideoModal() {
        if (!videoModal) return;
        videoModal.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    if (playBtn) playBtn.addEventListener('click', openVideoModal);
    if (mainStage) mainStage.addEventListener('click', (e) => {
        if (e.target !== playBtn && !playBtn.contains(e.target)) openVideoModal();
    });
    
    if (videoCloseBtn) videoCloseBtn.addEventListener('click', closeVideoModal);
    if (videoBackdrop) videoBackdrop.addEventListener('click', closeVideoModal);
    
    window.addEventListener('keydown', (e) => {
        if (videoModal && videoModal.classList.contains('active') && e.key === 'Escape') {
            closeVideoModal();
        }
    });
});

// Contact Form & Ben Robot Değilim Captcha Handling
document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.getElementById('contactForm');
    const captchaWrapper = document.getElementById('captchaWrapper');
    const captchaBox = document.getElementById('captchaBox');
    const captchaTrigger = document.getElementById('captchaTrigger');
    const submitBtn = document.getElementById('contactSubmitBtn');
    const successAlert = document.getElementById('formSuccessAlert');
    
    if (!contactForm || !captchaTrigger) return;
    
    let isCaptchaVerified = false;
    let isCaptchaLoading = false;
    
    // Captcha Click Simulation
    captchaTrigger.addEventListener('click', () => {
        if (isCaptchaVerified || isCaptchaLoading) return;
        
        // Clear errors
        captchaBox.classList.remove('error');
        captchaWrapper.classList.remove('show-error');
        
        // Start loading
        isCaptchaLoading = true;
        captchaBox.classList.add('loading');
        
        // Simulate realistic verification delay
        setTimeout(() => {
            isCaptchaLoading = false;
            isCaptchaVerified = true;
            captchaBox.classList.remove('loading');
            captchaBox.classList.add('verified');
        }, 750);
    });
    
    // Form Submission
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        if (!isCaptchaVerified) {
            captchaBox.classList.remove('error');
            void captchaBox.offsetWidth; // Force reflow to retrigger animation
            captchaBox.classList.add('error');
            captchaWrapper.classList.add('show-error');
            return;
        }
        
        // Successful verification - Simulate sending
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Gönderiliyor...';
        
        setTimeout(() => {
            contactForm.reset();
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
            
            // Reset captcha
            isCaptchaVerified = false;
            captchaBox.classList.remove('verified');
            
            // Show success alert
            if (successAlert) {
                successAlert.classList.add('show');
                setTimeout(() => {
                    successAlert.classList.remove('show');
                }, 6000);
            }
        }, 900);
    });
});
