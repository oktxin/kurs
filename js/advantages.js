document.addEventListener('DOMContentLoaded', function() {

    function animateCounters() {
        const counters = document.querySelectorAll('.stat-number');
        const speed = 200; 

        counters.forEach(counter => {
            const target = +counter.getAttribute('data-target');
            const count = +counter.innerText;
            const increment = Math.ceil(target / speed);

            if (count < target) {
                counter.innerText = Math.min(count + increment, target);
                setTimeout(animateCounters, 1);
            }
        });
    }

    function startCounterAnimation() {
        const heroSection = document.querySelector('.advantages-hero');
        const heroPosition = heroSection.getBoundingClientRect().top;
        const screenPosition = window.innerHeight / 1.3;

        if (heroPosition < screenPosition) {
            animateCounters();
            window.removeEventListener('scroll', startCounterAnimation);
        }
    }

    window.addEventListener('scroll', startCounterAnimation);
    startCounterAnimation(); 

    function initLocationMap() {
        if (typeof ymaps !== 'undefined') {
            ymaps.ready(function() {
                const map = new ymaps.Map('location-map', {
                    center: [51.1694, 71.4491],
                    zoom: 13,
                    controls: ['zoomControl', 'fullscreenControl']
                });

                const features = [
                    {
                        coords: [51.1694, 71.4491],
                        title: t('map.features.eco.title'),
                        content: t('map.features.eco.content')
                    },
                    {
                        coords: [51.1650, 71.4550],
                        title: t('map.features.transport.title'),
                        content: t('map.features.transport.content')
                    },
                    {
                        coords: [51.1720, 71.4430],
                        title: t('map.features.infra.title'),
                        content: t('map.features.infra.content')
                    }
                ];

                features.forEach(feature => {
                    const placemark = new ymaps.Placemark(feature.coords, {
                        hintContent: feature.title,
                        balloonContent: feature.content
                    }, {
                        preset: 'islands#blueIcon'
                    });
                    map.geoObjects.add(placemark);
                });
            });
        }
    }

    if (typeof ymaps !== 'undefined') {
        initLocationMap();
    }

    const navLinks = document.querySelectorAll('a[href^="#"]');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const headerHeight = document.querySelector('header').offsetHeight;
                const targetPosition = targetElement.offsetTop - headerHeight;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    const animateOnScroll = () => {
        const elements = document.querySelectorAll('.feature-card, .security-card, .tech-card, .infra-feature, .comparison-row');
        
        elements.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;
            const elementVisible = 150;
            
            if (elementTop < window.innerHeight - elementVisible) {
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            }
        });
    };

    const animatedElements = document.querySelectorAll('.feature-card, .security-card, .tech-card, .infra-feature, .comparison-row');
    animatedElements.forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px)';
        element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    });

    window.addEventListener('load', animateOnScroll);
    window.addEventListener('scroll', animateOnScroll);

    const ctaButtons = document.querySelectorAll('.cta-btn');
    ctaButtons.forEach(button => {
        button.addEventListener('click', function() {
            if (this.classList.contains('primary')) {
                const contactForm = document.getElementById('contact-form');
                if (contactForm) {
                    contactForm.scrollIntoView({ behavior: 'smooth' });
                } else {
                    window.location.href = 'contacts.html#contact-form';
                }
            } else if (this.classList.contains('secondary')) {
                showNotification(t('advantages.downloadNotification'), 'info');
            }
        });
    });

    function showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 2rem;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        
        if (type === 'success') {
            notification.style.background = '#4CAF50';
        } else if (type === 'error') {
            notification.style.background = '#f44336';
        } else {
            notification.style.background = '#2196F3';
        }
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    const comparisonRows = document.querySelectorAll('.comparison-row');
    comparisonRows.forEach(row => {
        row.addEventListener('mouseenter', function() {
            this.style.background = '#f8f9fa';
        });
        
        row.addEventListener('mouseleave', function() {
            this.style.background = 'white';
        });
    });
});