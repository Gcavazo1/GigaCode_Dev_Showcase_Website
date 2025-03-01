class Navigation {
    constructor() {
        this.nav = document.querySelector('.side-nav');
        this.links = document.querySelectorAll('.nav-links a');
        this.currentSection = '';
        
        this.init();
    }
    
    init() {
        // Handle scroll spy
        this.handleScroll = this.handleScroll.bind(this);
        window.addEventListener('scroll', this.handleScroll);
        
        // Handle link clicks
        this.links.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(link.getAttribute('href'));
                if (target) {
                    this.smoothScroll(target);
                }
            });
        });
        
        // Initial check for active section
        this.handleScroll();
    }
    
    handleScroll() {
        const scrollPosition = window.scrollY + 100;
        
        // Find the current section
        this.links.forEach(link => {
            const target = document.querySelector(link.getAttribute('href'));
            if (target) {
                const { offsetTop, offsetHeight } = target;
                
                if (scrollPosition >= offsetTop && 
                    scrollPosition < offsetTop + offsetHeight) {
                    // Remove active class from all links
                    this.links.forEach(l => l.classList.remove('active'));
                    // Add active class to current link
                    link.classList.add('active');
                    
                    // Update current section
                    this.currentSection = link.getAttribute('href');
                }
            }
        });
    }
    
    smoothScroll(target) {
        const targetPosition = target.offsetTop;
        const startPosition = window.scrollY;
        const distance = targetPosition - startPosition;
        const duration = 1000;
        let start = null;
        
        function animation(currentTime) {
            if (start === null) start = currentTime;
            const timeElapsed = currentTime - start;
            const run = ease(timeElapsed, startPosition, distance, duration);
            window.scrollTo(0, run);
            if (timeElapsed < duration) requestAnimationFrame(animation);
        }
        
        // Easing function
        function ease(t, b, c, d) {
            t /= d / 2;
            if (t < 1) return c / 2 * t * t + b;
            t--;
            return -c / 2 * (t * (t - 2) - 1) + b;
        }
        
        requestAnimationFrame(animation);
    }
}

// Initialize navigation when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new Navigation();
}); 