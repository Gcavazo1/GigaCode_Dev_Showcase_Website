class HolographicInterface {
    constructor() {
        console.log('Initializing Holographic Interface...');
        this.initializeDisplays();
        this.animate();
    }

    initializeDisplays() {
        try {
            // Neural Network visualization
            const networkCanvas = document.getElementById('network-canvas');
            if (networkCanvas) {
                console.log('Initializing Neural Network display...');
                this.initNetworkDisplay(networkCanvas);
            } else {
                console.warn('Network canvas element not found');
            }

            // System Status bars
            console.log('Initializing System Status display...');
            this.initStatusBars();

            // Project Matrix
            console.log('Initializing Project Matrix display...');
            this.initProjectMatrix();

            // Timeline
            console.log('Initializing Timeline display...');
            this.initTimeline();
        } catch (error) {
            console.error('Error initializing displays:', error);
        }
    }

    initNetworkDisplay(canvas) {
        // Set canvas dimensions
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight - 60; // Account for header
        
        const ctx = canvas.getContext('2d');
        const nodes = [];
        const connections = [];
        
        // Create nodes
        for (let i = 0; i < 15; i++) {
            nodes.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                radius: Math.random() * 3 + 2,
                speed: Math.random() * 0.5 + 0.2
            });
        }

        // Create connections
        nodes.forEach((node, i) => {
            nodes.slice(i + 1).forEach(otherNode => {
                if (Math.random() > 0.5) {
                    connections.push([node, otherNode]);
                }
            });
        });

        // Animation
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Draw connections
            connections.forEach(([node1, node2]) => {
                ctx.beginPath();
                ctx.moveTo(node1.x, node1.y);
                ctx.lineTo(node2.x, node2.y);
                ctx.strokeStyle = 'rgba(0, 255, 255, 0.2)';
                ctx.stroke();
            });

            // Update and draw nodes
            nodes.forEach(node => {
                node.x += Math.sin(Date.now() * 0.001 * node.speed) * 0.5;
                node.y += Math.cos(Date.now() * 0.001 * node.speed) * 0.5;
                
                // Keep nodes within bounds
                if (node.x < 0) node.x = canvas.width;
                if (node.x > canvas.width) node.x = 0;
                if (node.y < 0) node.y = canvas.height;
                if (node.y > canvas.height) node.y = 0;
                
                ctx.beginPath();
                ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
                ctx.fillStyle = '#00ffff';
                ctx.fill();
                
                // Add glow effect
                ctx.shadowBlur = 10;
                ctx.shadowColor = '#00ffff';
            });

            requestAnimationFrame(animate);
        };

        animate();
        
        // Handle window resize
        window.addEventListener('resize', () => {
            canvas.width = canvas.parentElement.clientWidth;
            canvas.height = canvas.parentElement.clientHeight - 60;
        });
    }

    initStatusBars() {
        const statusContainer = document.querySelector('.status-bars');
        if (!statusContainer) return;
        
        // Create status metrics
        const metrics = [
            { name: 'CPU', value: 82 },
            { name: 'RAM', value: 65 },
            { name: 'GPU', value: 93 },
            { name: 'STORAGE', value: 47 }
        ];
        
        // Create and append status bars
        metrics.forEach(metric => {
            const barContainer = document.createElement('div');
            barContainer.className = 'status-bar-container';
            
            const label = document.createElement('div');
            label.className = 'status-label';
            label.textContent = metric.name;
            
            const barWrapper = document.createElement('div');
            barWrapper.className = 'status-bar-wrapper';
            
            const bar = document.createElement('div');
            bar.className = 'status-bar';
            bar.style.width = `${metric.value}%`;
            
            const value = document.createElement('span');
            value.className = 'status-value';
            value.textContent = `${metric.value}%`;
            
            barWrapper.appendChild(bar);
            barContainer.appendChild(label);
            barContainer.appendChild(barWrapper);
            barContainer.appendChild(value);
            statusContainer.appendChild(barContainer);
        });
    }

    initProjectMatrix() {
        const matrixContainer = document.querySelector('.matrix-content');
        if (!matrixContainer) return;
        
        // Generate matrix code
        const generateMatrixCode = () => {
            let code = '';
            const chars = '01';
            const lines = 15;
            
            for (let i = 0; i < lines; i++) {
                let line = '';
                const length = 20 + Math.floor(Math.random() * 15);
                
                for (let j = 0; j < length; j++) {
                    line += chars.charAt(Math.floor(Math.random() * chars.length));
                }
                
                code += `<div class="matrix-line">${line}</div>`;
            }
            
            return code;
        };
        
        matrixContainer.innerHTML = generateMatrixCode();
        
        // Update matrix periodically
        setInterval(() => {
            const lines = matrixContainer.querySelectorAll('.matrix-line');
            const randomLine = Math.floor(Math.random() * lines.length);
            
            if (lines[randomLine]) {
                lines[randomLine].innerHTML = Array(20 + Math.floor(Math.random() * 15))
                    .fill(0)
                    .map(() => Math.floor(Math.random() * 2))
                    .join('');
            }
        }, 200);
    }

    initTimeline() {
        const timelineContainer = document.querySelector('.timeline-content');
        if (!timelineContainer) return;
        
        // Create timeline events
        const events = [
            { time: '08:42:15', event: 'System Initialization', status: 'complete' },
            { time: '09:15:33', event: 'Neural Network Training', status: 'complete' },
            { time: '10:27:08', event: 'Data Synchronization', status: 'in-progress' },
            { time: '11:00:00', event: 'Security Protocol Update', status: 'pending' },
            { time: '12:30:00', event: 'Maintenance Routine', status: 'pending' }
        ];
        
        // Create timeline element
        const timeline = document.createElement('div');
        timeline.className = 'timeline';
        
        // Add events to timeline
        events.forEach(event => {
            const eventElement = document.createElement('div');
            eventElement.className = `timeline-event ${event.status}`;
            
            eventElement.innerHTML = `
                <div class="event-time">${event.time}</div>
                <div class="event-line"></div>
                <div class="event-dot"></div>
                <div class="event-content">
                    <div class="event-name">${event.event}</div>
                    <div class="event-status">${event.status}</div>
                </div>
            `;
            
            timeline.appendChild(eventElement);
        });
        
        timelineContainer.appendChild(timeline);
    }

    animate() {
        // This method can be used for global animations
        // Each display has its own animation already
        requestAnimationFrame(() => this.animate());
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, creating Holographic Interface...');
    new HolographicInterface();
}); 