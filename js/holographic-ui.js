// Holographic UI for Cyberpunk Portfolio

class HolographicUI {
    constructor() {
        this.container = document.querySelector('.holographic-container');
        this.elements = document.querySelectorAll('.holographic-element');
        this.centerX = this.container ? this.container.offsetWidth / 2 : 0;
        this.centerY = this.container ? this.container.offsetHeight / 2 : 0;
        
        this.init();
        this.animateHoloElements();
    }
    
    init() {
        if (!this.container) return;
        
        this.container.addEventListener('mousemove', (e) => {
            const rect = this.container.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            this.elements.forEach(element => {
                const dx = (x - this.centerX) / 20;
                const dy = (y - this.centerY) / 20;
                const depth = parseFloat(element.getAttribute('data-depth') || 1);
                
                element.style.transform = `translate3d(${dx * depth}px, ${dy * depth}px, 0) rotateX(${-dy * 0.2}deg) rotateY(${dx * 0.2}deg)`;
                
                // Add glow effect based on mouse position
                const distance = Math.sqrt(Math.pow(x - this.centerX, 2) + Math.pow(y - this.centerY, 2));
                const maxDistance = Math.sqrt(Math.pow(this.centerX, 2) + Math.pow(this.centerY, 2));
                const intensity = 1 - (distance / maxDistance);
                
                element.style.boxShadow = `0 0 ${20 * intensity}px rgba(0, 255, 255, ${0.5 * intensity})`;
            });
        });
        
        // Reset on mouse leave
        this.container.addEventListener('mouseleave', () => {
            this.elements.forEach(element => {
                element.style.transform = 'translate3d(0, 0, 0) rotateX(0) rotateY(0)';
                element.style.boxShadow = '0 0 10px rgba(0, 255, 255, 0.3)';
            });
        });
        
        // Initialize the holo-stats with random bars
        const holoStats = document.querySelector('.holo-stats');
        if (holoStats) {
            this.createStatusBars(holoStats);
        }
        
        // Initialize the holo-matrix with random text
        const holoMatrix = document.querySelector('.holo-matrix');
        if (holoMatrix) {
            this.createMatrixText(holoMatrix);
        }
        
        // Initialize the neural network graph
        const holoGraph = document.querySelector('.holo-graph');
        if (holoGraph) {
            this.createNeuralGraph(holoGraph);
        }
    }
    
    createStatusBars(container) {
        const bars = document.createElement('div');
        bars.className = 'status-bars';
        
        const statNames = ['CPU', 'RAM', 'GPU', 'NETWORK', 'STORAGE'];
        
        statNames.forEach(name => {
            const barContainer = document.createElement('div');
            barContainer.className = 'stat-bar-container';
            
            const label = document.createElement('div');
            label.className = 'stat-label';
            label.textContent = name;
            
            const bar = document.createElement('div');
            bar.className = 'stat-bar';
            
            const fill = document.createElement('div');
            fill.className = 'stat-fill';
            fill.style.width = `${Math.random() * 70 + 30}%`; // 30-100%
            
            const value = document.createElement('span');
            value.className = 'stat-value';
            value.textContent = `${Math.floor(parseInt(fill.style.width))}%`;
            
            bar.appendChild(fill);
            barContainer.appendChild(label);
            barContainer.appendChild(bar);
            barContainer.appendChild(value);
            bars.appendChild(barContainer);
        });
        
        container.appendChild(bars);
        
        // Animate the bars
        setInterval(() => {
            const fills = container.querySelectorAll('.stat-fill');
            const values = container.querySelectorAll('.stat-value');
            
            fills.forEach((fill, index) => {
                const newWidth = Math.random() * 70 + 30; // 30-100%
                fill.style.width = `${newWidth}%`;
                values[index].textContent = `${Math.floor(newWidth)}%`;
            });
        }, 2000);
    }
    
    createMatrixText(container) {
        const matrixContainer = document.createElement('div');
        matrixContainer.className = 'matrix-container';
        
        // Create 10 lines of "code"
        for (let i = 0; i < 10; i++) {
            const line = document.createElement('div');
            line.className = 'matrix-line';
            
            // Generate random "code" for each line
            let codeText = '';
            const length = Math.floor(Math.random() * 30) + 20; // 20-50 chars
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,./<>?';
            
            for (let j = 0; j < length; j++) {
                codeText += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            
            line.textContent = codeText;
            matrixContainer.appendChild(line);
        }
        
        container.appendChild(matrixContainer);
        
        // Animate the matrix text
        setInterval(() => {
            const lines = container.querySelectorAll('.matrix-line');
            const randomLine = Math.floor(Math.random() * lines.length);
            
            // Update a random line
            let newText = '';
            const length = Math.floor(Math.random() * 30) + 20;
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,./<>?';
            
            for (let j = 0; j < length; j++) {
                newText += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            
            lines[randomLine].textContent = newText;
            lines[randomLine].style.color = 'var(--primary-color)';
            
            setTimeout(() => {
                lines[randomLine].style.color = 'var(--text-color)';
            }, 500);
        }, 200);
    }
    
    createNeuralGraph(container) {
        const canvas = document.createElement('canvas');
        canvas.className = 'neural-canvas';
        canvas.width = container.offsetWidth;
        canvas.height = container.offsetHeight;
        
        container.appendChild(canvas);
        
        const ctx = canvas.getContext('2d');
        const nodes = [];
        const connections = [];
        
        // Create nodes
        for (let i = 0; i < 20; i++) {
            nodes.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                radius: Math.random() * 3 + 2,
                color: 'rgba(0, 255, 255, 0.7)'
            });
        }
        
        // Create connections
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                if (Math.random() > 0.7) { // 30% chance of connection
                    connections.push({
                        from: i,
                        to: j,
                        active: false,
                        activationTime: 0
                    });
                }
            }
        }
        
        // Animation loop
        const animate = () => {
            requestAnimationFrame(animate);
            
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Draw connections
            connections.forEach(conn => {
                const from = nodes[conn.from];
                const to = nodes[conn.to];
                
                ctx.beginPath();
                ctx.moveTo(from.x, from.y);
                ctx.lineTo(to.x, to.y);
                
                if (conn.active) {
                    const progress = (Date.now() - conn.activationTime) / 1000; // 1 second animation
                    if (progress < 1) {
                        const gradient = ctx.createLinearGradient(from.x, from.y, to.x, to.y);
                        gradient.addColorStop(0, 'rgba(0, 255, 255, 0.1)');
                        gradient.addColorStop(progress, 'rgba(0, 255, 255, 0.8)');
                        gradient.addColorStop(progress + 0.1, 'rgba(0, 255, 255, 0.1)');
                        gradient.addColorStop(1, 'rgba(0, 255, 255, 0.1)');
                        ctx.strokeStyle = gradient;
                        ctx.lineWidth = 2;
                    } else {
                        conn.active = false;
                        ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)';
                        ctx.lineWidth = 1;
                    }
                } else {
                    ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)';
                    ctx.lineWidth = 1;
                }
                
                ctx.stroke();
            });
            
            // Draw nodes
            nodes.forEach(node => {
                ctx.beginPath();
                ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
                ctx.fillStyle = node.color;
                ctx.fill();
            });
        };
        
        animate();
        
        // Randomly activate connections
        setInterval(() => {
            const randomConn = connections[Math.floor(Math.random() * connections.length)];
            randomConn.active = true;
            randomConn.activationTime = Date.now();
        }, 300);
    }
    
    animateHoloElements() {
        // Add subtle floating animation to holographic elements
        this.elements.forEach(element => {
            const randomDelay = Math.random() * 2;
            const randomDuration = 3 + Math.random() * 2;
            
            element.style.animation = `float ${randomDuration}s ease-in-out ${randomDelay}s infinite alternate`;
        });
    }
}

// Add floating animation keyframes to the document
const style = document.createElement('style');
style.textContent = `
@keyframes float {
    0% { transform: translateY(0px); }
    100% { transform: translateY(-10px); }
}

.stat-bar-container {
    margin-bottom: 10px;
}

.stat-label {
    color: var(--text-color);
    font-size: 0.8rem;
    margin-bottom: 2px;
}

.stat-bar {
    height: 8px;
    background-color: rgba(0, 255, 255, 0.1);
    border-radius: 4px;
    overflow: hidden;
}

.stat-fill {
    height: 100%;
    background-color: var(--primary-color);
    transition: width 0.5s ease;
}

.stat-value {
    color: var(--text-color);
    font-size: 0.8rem;
    margin-left: 5px;
}

.matrix-container {
    font-family: monospace;
    font-size: 0.7rem;
    color: var(--text-color);
    height: 100%;
    overflow: hidden;
}

.matrix-line {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-bottom: 2px;
    transition: color 0.3s ease;
}

.neural-canvas {
    width: 100%;
    height: 100%;
}
`;

document.head.appendChild(style);

document.addEventListener('DOMContentLoaded', () => {
    new HolographicUI();
});

// Holographic UI JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Initialize neural network canvas
    initializeNetworkCanvas();
    
    // Initialize matrix content
    initializeMatrixContent();
    
    // Initialize timeline
    initializeTimeline();
});

function initializeNetworkCanvas() {
    const canvas = document.getElementById('network-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    const nodes = [];
    const connections = [];
    const nodeCount = 15;
    
    // Create nodes
    for (let i = 0; i < nodeCount; i++) {
        nodes.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            radius: Math.random() * 3 + 2,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5
        });
    }
    
    // Create connections
    for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
            if (Math.random() > 0.5) {
                connections.push([i, j]);
            }
        }
    }
    
    // Animation function
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Update nodes
        nodes.forEach(node => {
            node.x += node.vx;
            node.y += node.vy;
            
            // Bounce off edges
            if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
            if (node.y < 0 || node.y > canvas.height) node.vy *= -1;
            
            // Keep within bounds
            node.x = Math.max(0, Math.min(canvas.width, node.x));
            node.y = Math.max(0, Math.min(canvas.height, node.y));
        });
        
        // Draw connections
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        
        connections.forEach(([i, j]) => {
            const nodeA = nodes[i];
            const nodeB = nodes[j];
            const distance = Math.sqrt(
                Math.pow(nodeA.x - nodeB.x, 2) + 
                Math.pow(nodeA.y - nodeB.y, 2)
            );
            
            // Only draw connections within a certain distance
            if (distance < 150) {
                ctx.beginPath();
                ctx.moveTo(nodeA.x, nodeA.y);
                ctx.lineTo(nodeB.x, nodeB.y);
                
                // Fade based on distance
                const opacity = 1 - (distance / 150);
                ctx.strokeStyle = `rgba(0, 255, 255, ${opacity * 0.2})`;
                ctx.stroke();
            }
        });
        
        // Draw nodes
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00ffff';
        
        nodes.forEach(node => {
            ctx.beginPath();
            ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
            ctx.fillStyle = '#00ffff';
            ctx.fill();
        });
        
        requestAnimationFrame(animate);
    }
    
    // Start animation
    animate();
    
    // Handle window resize
    window.addEventListener('resize', () => {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
    });
}

function initializeMatrixContent() {
    const matrixContent = document.querySelector('.matrix-content');
    if (!matrixContent) return;
    
    // Matrix is already populated with static content in HTML
    // Add animation to make some digits change randomly
    
    setInterval(() => {
        const lines = matrixContent.querySelectorAll('.matrix-line');
        const randomLineIndex = Math.floor(Math.random() * lines.length);
        const line = lines[randomLineIndex];
        
        if (line) {
            const text = line.textContent;
            const randomCharIndex = Math.floor(Math.random() * text.length);
            const newChar = Math.floor(Math.random() * 2).toString();
            
            const newText = 
                text.substring(0, randomCharIndex) + 
                newChar + 
                text.substring(randomCharIndex + 1);
                
            line.textContent = newText;
            
            // Add flash effect
            line.style.color = '#ffffff';
            line.style.textShadow = '0 0 10px #ffffff';
            
            setTimeout(() => {
                line.style.color = '';
                line.style.textShadow = '';
            }, 300);
        }
    }, 200);
}

function initializeTimeline() {
    // The timeline is already populated with static content in HTML
    // Add animation to make it look active
    
    const events = document.querySelectorAll('.timeline-event');
    
    // Add pulsing effect to the in-progress event
    const inProgressEvent = document.querySelector('.event-status.in-progress');
    if (inProgressEvent) {
        setInterval(() => {
            inProgressEvent.style.opacity = '0.5';
            setTimeout(() => {
                inProgressEvent.style.opacity = '1';
            }, 500);
        }, 1000);
    }
    
    // Occasionally add a new event
    setTimeout(() => {
        const timelineContent = document.querySelector('.timeline-content');
        if (timelineContent) {
            const newEvent = document.createElement('div');
            newEvent.className = 'timeline-event';
            newEvent.innerHTML = `
                <div class="event-time">12:15:42</div>
                <div class="event-marker"></div>
                <div class="event-details">
                    <div class="event-name">New Data Received</div>
                    <div class="event-status in-progress">IN PROGRESS</div>
                </div>
            `;
            
            // Add with animation
            newEvent.style.opacity = '0';
            newEvent.style.transform = 'translateY(10px)';
            timelineContent.appendChild(newEvent);
            
            setTimeout(() => {
                newEvent.style.transition = 'all 0.5s ease';
                newEvent.style.opacity = '1';
                newEvent.style.transform = 'translateY(0)';
            }, 100);
        }
    }, 10000); // Add after 10 seconds
} 