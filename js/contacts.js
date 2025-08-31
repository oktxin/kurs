document.addEventListener('DOMContentLoaded', function() {
    function initMap() {
        if (typeof ymaps !== 'undefined') {
            ymaps.ready(function() {
                const map = new ymaps.Map('contact-map', {
                    center: [51.1694, 71.4491], 
                    zoom: 11,
                    controls: ['zoomControl', 'fullscreenControl']
                });

                const officePlacemark = new ymaps.Placemark([51.1694, 71.4491], {
                    hintContent: t('map.office.hint'),
                    balloonContent: t('map.office.balloon')
                }, {
                    preset: 'islands#redIcon'
                });

                const complexPlacemark = new ymaps.Placemark([51.1800, 71.4600], {
                    hintContent: t('map.complex.hint'),
                    balloonContent: t('map.complex.balloon')
                }, {
                    preset: 'islands#blueIcon'
                });

                map.geoObjects.add(officePlacemark);
                map.geoObjects.add(complexPlacemark);
            });
        }
    }

    if (typeof ymaps !== 'undefined') {
        initMap();
    } else {
        console.warn(t('map.warning'));
    }

    const contactForm = document.querySelector('.contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const name = this.querySelector('input[type="text"]').value.trim();
            const phone = this.querySelector('input[type="tel"]').value.trim();

            if (!name) {
                showNotification(t('contact.form.nameRequired'), 'error');
                return;
            }
            
            if (!phone) {
                showNotification(t('contact.form.phoneRequired'), 'error');
                return;
            }

            showNotification(t('contact.form.success'), 'success');
            this.reset();
        });
    }

    const tourBtn = document.querySelector('.tour-btn');
    if (tourBtn) {
        tourBtn.addEventListener('click', function() {
            const formSection = document.getElementById('contact-form');
            if (formSection) {
                formSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });

                const textarea = document.querySelector('textarea');
                if (textarea) {
                    textarea.value = t('contact.form.tourMessage');
                }
            }
        });
    }

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
        } else {
            notification.style.background = '#f44336';
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

    const animateOnScroll = () => {
        const elements = document.querySelectorAll('.contact-card, .social-card, .faq-item, .sidebar-item');
        
        elements.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;
            const elementVisible = 150;
            
            if (elementTop < window.innerHeight - elementVisible) {
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            }
        });
    };

    const animatedElements = document.querySelectorAll('.contact-card, .social-card, .faq-item, .sidebar-item');
    animatedElements.forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px)';
        element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    });

    window.addEventListener('load', animateOnScroll);
    window.addEventListener('scroll', animateOnScroll);

    const contactDetails = document.querySelectorAll('.contact-detail');
    contactDetails.forEach(detail => {
        detail.addEventListener('click', function() {
            const text = this.querySelector('p').textContent;
            navigator.clipboard.writeText(text).then(() => {
                showNotification(t('contact.copied'), 'success');
            });
        });
    });
});