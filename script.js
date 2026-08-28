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
    const tabUygar = document.getElementById('tab-uygar');
    const tabIstanbul = document.getElementById('tab-istanbul');
    const tabButtons = document.querySelectorAll('.tab-btn');
    
    if (tabKey === 'uygar') {
        if(tabUygar) tabUygar.style.display = 'block';
        if(tabIstanbul) tabIstanbul.style.display = 'none';
        tabButtons[0]?.classList.add('active');
        tabButtons[1]?.classList.remove('active');
    } else {
        if(tabUygar) tabUygar.style.display = 'none';
        if(tabIstanbul) tabIstanbul.style.display = 'block';
        tabButtons[0]?.classList.remove('active');
        tabButtons[1]?.classList.add('active');
    }
}
