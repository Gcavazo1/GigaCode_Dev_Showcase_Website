// Main JavaScript for Cyberpunk Portfolio

document.addEventListener('DOMContentLoaded', function() {
    // Initialize smooth scrolling
    initSmoothScrolling();
    
    // Initialize modal functionality
    initModal();
    
    // Initialize button ripple effects
    initRippleEffect();
    
    // Initialize navigation highlighting
    initNavHighlighting();
    
    // Initialize scroll reveal animations
    initScrollReveal();
    
    // Initialize the 3D model viewer
    if (typeof window.initializeModelViewer === 'function') {
        // Add a loading indicator before initializing the model
        const modelContainer = document.getElementById('model-showcase');
        if (modelContainer) {
            // Create and add loading indicator
            const loader = document.createElement('div');
            loader.className = 'model-loader';
            loader.innerHTML = `
                <div class="loader-progress">
                    <div class="loader-bar"></div>
                </div>
                <div class="loader-text">Loading 3D Model <span class="loader-percent">0%</span></div>
            `;
            modelContainer.appendChild(loader);
            
            // Initialize model with callback for loading progress
            window.initializeModelViewer('model-showcase', (progress) => {
                const percent = Math.floor(progress * 100);
                const loaderBar = document.querySelector('.loader-bar');
                const loaderPercent = document.querySelector('.loader-percent');
                
                if (loaderBar && loaderPercent) {
                    loaderBar.style.width = `${percent}%`;
                    loaderPercent.textContent = `${percent}%`;
                    
                    // Remove loader when complete
                    if (percent >= 100) {
                        setTimeout(() => {
                            loader.classList.add('fade-out');
                            setTimeout(() => loader.remove(), 500);
                        }, 500);
                    }
                }
            });
        }
    }
    
    // Add scroll-based animation for the model container
    const modelContainer = document.getElementById('model-showcase');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                modelContainer.classList.add('in-view');
            } else {
                modelContainer.classList.remove('in-view');
            }
        });
    }, { threshold: 0.3 });
    
    if (modelContainer) {
        observer.observe(modelContainer);
    }
    
    // Add functionality to model control buttons
    document.getElementById('rotate-left')?.addEventListener('click', () => {
        // Access the model and rotate it left
        // This would need to be implemented in the 3d-model.js
    });
    
    document.getElementById('reset-view')?.addEventListener('click', () => {
        // Reset the model view
        // This would need to be implemented in the 3d-model.js
    });
    
    document.getElementById('rotate-right')?.addEventListener('click', () => {
        // Access the model and rotate it right
        // This would need to be implemented in the 3d-model.js
    });
    
    initRobloxProjects();
    
    // Show welcome message for first-time visitors
    if (!localStorage.getItem('returnVisitor')) {
        showWelcomeMessage();
        localStorage.setItem('returnVisitor', 'true');
    }
});

// Smooth scrolling for navigation links
function initSmoothScrolling() {
    const navLinks = document.querySelectorAll('.nav-links a');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all links
            navLinks.forEach(link => link.classList.remove('active'));
            
            // Add active class to clicked link
            this.classList.add('active');
            
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            window.scrollTo({
                top: targetSection.offsetTop,
                behavior: 'smooth'
            });
        });
    });
}

// Modal functionality for the join team form
function initModal() {
    const modal = document.getElementById('join-modal');
    const btn = document.getElementById('join-button');
    const closeBtn = document.querySelector('.close-modal');
    const form = document.getElementById('join-form');
    
    // Open modal
    btn.addEventListener('click', function() {
        modal.style.display = 'block';
        setTimeout(() => {
            modal.classList.add('active');
        }, 10);
    });
    
    // Close modal
    closeBtn.addEventListener('click', function() {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.classList.remove('active');
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
        }
    });
    
    // Form submission
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Here you would typically send the form data to a server
        // For now, we'll just show a success message
        
        const formData = new FormData(form);
        let formValues = {};
        
        formData.forEach((value, key) => {
            formValues[key] = value;
        });
        
        console.log('Form submitted:', formValues);
        
        // Reset form and close modal
        form.reset();
        modal.classList.remove('active');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
        
        // Show success message (you could create a toast notification here)
        alert('Thanks for your interest! We\'ll be in touch soon.');
    });
}

// Button ripple effect
function initRippleEffect() {
    const buttons = document.querySelectorAll('.cyber-button, .donation-button');
    
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            const x = e.clientX - e.target.getBoundingClientRect().left;
            const y = e.clientY - e.target.getBoundingClientRect().top;
            
            const ripple = document.createElement('span');
            ripple.classList.add('ripple');
            ripple.style.left = `${x}px`;
            ripple.style.top = `${y}px`;
            
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
}

// Navigation highlighting based on scroll position
function initNavHighlighting() {
    const sections = document.querySelectorAll('.section');
    const navLinks = document.querySelectorAll('.nav-links a');
    
    window.addEventListener('scroll', function() {
        let current = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            
            if (pageYOffset >= sectionTop - 200) {
                current = section.getAttribute('id');
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });
}

// Scroll reveal animations
function initScrollReveal() {
    const revealElements = document.querySelectorAll('.reveal');
    
    function checkReveal() {
        const windowHeight = window.innerHeight;
        const revealPoint = 150;
        
        revealElements.forEach(element => {
            const revealTop = element.getBoundingClientRect().top;
            
            if (revealTop < windowHeight - revealPoint) {
                element.classList.add('active');
            } else {
                element.classList.remove('active');
            }
        });
    }
    
    window.addEventListener('scroll', checkReveal);
    
    // Initial check
    checkReveal();
}

function initRobloxProjects() {
    const cards = document.querySelectorAll('.roblox-project-card');
    
    cards.forEach(card => {
        // Add hover effect to images
        const image = card.querySelector('.card-hologram img');
        
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const angleX = (y - centerY) / 20;
            const angleY = (centerX - x) / 20;
            
            card.style.transform = `perspective(1000px) rotateX(${angleX}deg) rotateY(${angleY}deg) translateZ(10px)`;
            image.style.transform = `scale(1.1) translateX(${(x - centerX) / 50}px) translateY(${(y - centerY) / 50}px)`;
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateZ(0)';
            image.style.transform = 'scale(1) translateX(0) translateY(0)';
        });
        
        // Add button interaction
        const followButton = card.querySelector('.follow-project');
        followButton.addEventListener('click', () => {
            followButton.classList.add('clicked');
            followButton.innerHTML = '<span>Following Project ✓</span><div class="button-glow"></div>';
            setTimeout(() => {
                followButton.classList.remove('clicked');
            }, 1500);
        });
    });
}

function showWelcomeMessage() {
    const welcomeMessage = document.createElement('div');
    welcomeMessage.className = 'welcome-message';
    welcomeMessage.innerHTML = `
        <h3>Welcome to GigaCode Dev Showcase</h3>
        <p>This site features background music for an immersive experience. Would you like to enable it?</p>
        <button class="welcome-button enable-music">Enable Music</button>
        <button class="welcome-button skip-music">Maybe Later</button>
    `;
    
    document.body.appendChild(welcomeMessage);
    
    // Handle button clicks
    welcomeMessage.querySelector('.enable-music').addEventListener('click', function() {
        // Find the audio player and trigger play
        const playButton = document.getElementById('play-audio');
        if (playButton) playButton.click();
        welcomeMessage.remove();
    });
    
    welcomeMessage.querySelector('.skip-music').addEventListener('click', function() {
        welcomeMessage.remove();
    });
}

// Add smooth scrolling with performance optimization
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Close mobile menu if open
        const mobileMenu = document.querySelector('.mobile-menu-toggle');
        if (mobileMenu && mobileMenu.classList.contains('active')) {
            const event = new Event('click');
            mobileMenu.dispatchEvent(event);
        }
        
        const targetId = this.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        
        if (targetElement) {
            // Use requestAnimationFrame for smoother scrolling
            const scrollToElement = () => {
                const yOffset = -80; // Adjust based on your header height
                const y = targetElement.getBoundingClientRect().top + window.pageYOffset + yOffset;
                
                window.scrollTo({
                    top: y,
                    behavior: 'smooth'
                });
            };
            
            requestAnimationFrame(scrollToElement);
        }
    });
}); 