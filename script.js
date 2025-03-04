document.addEventListener("DOMContentLoaded", () => {
    // Check if we are on the mobile app page
    if (window.location.pathname.includes("mobile-app.html")) {
        // Disable the button hover effect on the mobile app page
        const buttons = document.querySelectorAll(".glow-btn");
        buttons.forEach(button => {
            button.style.boxShadow = "0 0 15px cyan, 0 0 40px blue";
            button.style.transform = "scale(1)";
        });

        // Disable the bio reveal effect on the mobile app page
        const bio = document.querySelector('.bio');
        if (bio) {
            bio.classList.remove("reveal-active");
        }

        // Disable the screenshot loading effect on the mobile app page
        const screenshots = document.querySelectorAll(".gallery-grid img");
        if (screenshots.length > 0) {
            screenshots.forEach((screenshot) => {
                screenshot.classList.remove("fade-in");
            });
        }
    } else {
        // Home page (index.html) hover effect remains enabled
        const buttons = document.querySelectorAll(".glow-btn");
        buttons.forEach(button => {
            button.addEventListener("mouseenter", () => {
                button.style.boxShadow = "0 0 25px cyan, 0 0 40px blue";
                button.style.transform = "scale(1.1)";
            });
            button.addEventListener("mouseleave", () => {
                button.style.boxShadow = "0 0 15px cyan, 0 0 40px blue";
                button.style.transform = "scale(1)";
            });
        });

        // Add reveal effect to bio after the header animation is done
        const bio = document.querySelector('.bio');
        if (bio) { 
            setTimeout(() => {
                bio.classList.add("reveal-active");
            }, 3000); // 3 seconds after page load
        }

        // Screenshot Loading Effect on Home Page (index)
        const screenshots = document.querySelectorAll(".gallery-grid img");
        if (screenshots.length > 0) {
            screenshots.forEach((screenshot, index) => {
                setTimeout(() => {
                    screenshot.classList.add("fade-in");
                }, 500 * index); // Staggered animation for screenshots
            });
        }
    }
});
