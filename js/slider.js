document.addEventListener('DOMContentLoaded', function() {
    const slidesContainer = document.querySelector('.section3-slides-container');
    const slides = document.querySelectorAll('.section3-slide');
    const prevButton = document.querySelector('.prev-btn');
    const nextButton = document.querySelector('.next-btn');
    
    let currentSlide = 0;
    const totalSlides = slides.length;

    function showSlide(index) {
        slides.forEach(slide => {
            slide.style.display = 'none';
        });

        slides[index].style.display = 'flex';

        currentSlide = index;
    }

    showSlide(currentSlide);

    nextButton.addEventListener('click', function() {
        let nextIndex = currentSlide + 1;
        if (nextIndex >= totalSlides) {
            nextIndex = 0; 
        }
        showSlide(nextIndex);
    });

    prevButton.addEventListener('click', function() {
        let prevIndex = currentSlide - 1;
        if (prevIndex < 0) {
            prevIndex = totalSlides - 1; 
        }
        showSlide(prevIndex);
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'ArrowRight') {
            nextButton.click();
        } else if (e.key === 'ArrowLeft') {
            prevButton.click();
        }
    });
});