class MobileMenu {
    constructor() {
        this.menuToggle = document.querySelector('.mobile-menu-toggle');
        this.navLinks = document.querySelector('.nav-links');
        this.isOpen = false;
        
        this.init();
    }
    
    init() {
        if (!this.menuToggle) {
            console.warn('Mobile menu toggle not found');
            return;
        }
        
        this.menuToggle.addEventListener('click', () => this.toggleMenu());
        
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (this.isOpen && !e.target.closest('.nav-container') && !e.target.closest('.mobile-menu-toggle')) {
                this.closeMenu();
            }
        });
        
        // Close menu when window is resized to desktop size
        window.addEventListener('resize', () => {
            if (window.innerWidth > 992 && this.isOpen) {
                this.closeMenu(false);
            }
        });
    }
    
    toggleMenu() {
        if (this.isOpen) {
            this.closeMenu();
        } else {
            this.openMenu();
        }
    }
    
    openMenu() {
        this.navLinks.classList.add('active');
        this.menuToggle.classList.add('active');
        this.isOpen = true;
        
        // Prevent body scrolling when menu is open
        document.body.style.overflow = 'hidden';
    }
    
    closeMenu(animate = true) {
        if (animate) {
            this.navLinks.classList.add('closing');
            setTimeout(() => {
                this.navLinks.classList.remove('active', 'closing');
            }, 300);
        } else {
            this.navLinks.classList.remove('active');
        }
        
        this.menuToggle.classList.remove('active');
        this.isOpen = false;
        
        // Re-enable body scrolling
        document.body.style.overflow = '';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new MobileMenu();
}); 