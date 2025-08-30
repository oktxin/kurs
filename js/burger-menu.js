document.addEventListener('DOMContentLoaded', function() {
    const burgerMenu = document.querySelector('.burger-menu');
    const mobileMenu = document.querySelector('.mobile-menu');
    const menuOverlay = document.querySelector('.menu-overlay');
    const body = document.body;
    const mobileMenuLinks = document.querySelectorAll('.mobile-menu a');

    if (!burgerMenu || !mobileMenu || !menuOverlay) {
        console.error('Не найдены элементы бургер-меню');
        return;
    }

    function toggleMenu() {
        burgerMenu.classList.toggle('active');
        mobileMenu.classList.toggle('active');
        menuOverlay.classList.toggle('active');
        body.classList.toggle('body-no-scroll');
    }

    burgerMenu.addEventListener('click', function(e) {
        e.stopPropagation();
        toggleMenu();
    });

    menuOverlay.addEventListener('click', function() {
        if (mobileMenu.classList.contains('active')) {
            toggleMenu();
        }
    });

    mobileMenuLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            if (mobileMenu.classList.contains('active')) {
                toggleMenu();
            }

            const href = this.getAttribute('href');
            if (href && href.startsWith('#')) {
                e.preventDefault();
                const targetSection = document.querySelector(href);
                if (targetSection) {
                    setTimeout(() => {
                        targetSection.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                    }, 300);
                }
            }
        });
    });

    window.addEventListener('resize', function() {
        if (window.innerWidth > 1200 && mobileMenu.classList.contains('active')) {
            toggleMenu();
        }
    });

    document.addEventListener('click', function(e) {
        if (mobileMenu.classList.contains('active') && 
            !mobileMenu.contains(e.target) && 
            !burgerMenu.contains(e.target)) {
            toggleMenu();
        }
    });

    mobileMenu.addEventListener('click', function(e) {
        e.stopPropagation();
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && mobileMenu.classList.contains('active')) {
            toggleMenu();
        }
    });
});