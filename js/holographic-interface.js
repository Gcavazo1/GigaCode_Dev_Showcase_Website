// New dedicated JS file for holographic interface
document.addEventListener('DOMContentLoaded', function() {
    initializeHolographicInterface();
});

function initializeHolographicInterface() {
    // Initialize Neural Network visualization
    initializeNeuralNetwork();
    
    // Initialize Matrix content
    initializeMatrix();
    
    // Add animation to status bars
    animateStatusBars();
}

function initializeNeuralNetwork() {
    const canvas = document.getElementById('network-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width = canvas.offsetWidth;
    const height = canvas.height = canvas.offsetHeight;
    
    // Create nodes
    const nodes = [];
    const nodeCount = 15;
    
    for (let i = 0; i < nodeCount; i++) {
        nodes.push({
            x: Math.random() * width,
            y: Math.random() * height,
            radius: Math.random() * 3 + 2,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5
        });
    }
    
    // Create connections
    const connections = [];
    for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
            if (Math.random() > 0.5) {
                connections.push([i, j]);
            }
        }
    }
    
    // Animation function
    function animate() {
        ctx.clearRect(0, 0, width, height);
        
        // Update nodes
        nodes.forEach(node => {
            node.x += node.vx;
            node.y += node.vy;
            
            // Bounce off edges
            if (node.x < 0 || node.x > width) node.vx *= -1;
            if (node.y < 0 || node.y > height) node.vy *= -1;
            
            // Keep within bounds
            node.x = Math.max(0, Math.min(width, node.x));
            node.y = Math.max(0, Math.min(height, node.y));
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
        nodes.forEach(node => {
            ctx.beginPath();
            ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
            ctx.fillStyle = '#00ffff';
            ctx.fill();
            
            // Add glow
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#00ffff';
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

function initializeMatrix() {
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

function animateStatusBars() {
    const statusBars = document.querySelectorAll('.status-bar');
    
    statusBars.forEach(bar => {
        // Add pulsing animation
        setInterval(() => {
            const currentWidth = parseFloat(bar.style.width);
            const randomChange = (Math.random() - 0.5) * 5; // -2.5% to +2.5%
            let newWidth = currentWidth + randomChange;
            
            // Keep within reasonable bounds
            newWidth = Math.max(30, Math.min(98, newWidth));
            
            bar.style.width = `${newWidth}%`;
            
            // Update the corresponding value
            const container = bar.closest('.status-item');
            if (container) {
                const valueElement = container.querySelector('.status-value');
                if (valueElement) {
                    valueElement.textContent = `${Math.round(newWidth)}%`;
                }
            }
        }, 3000);
    });
} 