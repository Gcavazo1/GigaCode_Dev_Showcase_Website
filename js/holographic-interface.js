document.addEventListener('DOMContentLoaded', function() {
    initializeHolographicInterface();
});

function initializeHolographicInterface() {
    // Initialize Neural Network visualization
    initializeNeuralNetwork();
    
    // Initialize Matrix content
    initializeMatrix();
    
    // Initialize status bars
    animateStatusBars();

    // Initialize timeline
    initializeTimeline();
}

function initializeNeuralNetwork() {
    const canvas = document.getElementById('network-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Resize canvas properly
    function resizeCanvas() {
        const devicePixelRatio = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        
        canvas.width = rect.width * devicePixelRatio;
        canvas.height = rect.height * devicePixelRatio;
        
        ctx.scale(devicePixelRatio, devicePixelRatio);
        
        return {
            width: rect.width,
            height: rect.height
        };
    }
    
    let { width, height } = resizeCanvas();
    
    // Neural network structure
    const layers = [5, 8, 6, 3]; // Defining layers of the network
    
    // Create structured nodes
    const nodes = [];
    const pulseTimers = []; // For pulsing animation
    
    // Create organized nodes in layers
    layers.forEach((nodeCount, layerIndex) => {
        const layerX = width * (layerIndex + 1) / (layers.length + 1);
        
        for (let i = 0; i < nodeCount; i++) {
            const layerY = height * (i + 1) / (nodeCount + 1);
            
            nodes.push({
                x: layerX,
                y: layerY,
                layer: layerIndex,
                index: i,
                radius: 4,
                baseRadius: 4,
                color: `hsl(${180 + (layerIndex * 20)}, 100%, 60%)`,
                pulseSize: 0,
                pulseOpacity: 0,
                active: false
            });
            
            // Initialize pulse timer
            pulseTimers.push(Math.random() * 100);
        }
    });
    
    // Create connections between layers
    const connections = [];
    const dataPackets = [];
    
    // Connect each node to 1-3 nodes in the next layer
    for (let layer = 0; layer < layers.length - 1; layer++) {
        const thisLayerNodes = nodes.filter(node => node.layer === layer);
        const nextLayerNodes = nodes.filter(node => node.layer === layer + 1);
        
        thisLayerNodes.forEach(sourceNode => {
            // Connect to 1-3 random nodes in next layer
            const connectionCount = Math.floor(Math.random() * 3) + 1;
            const targetIndices = new Set();
            
            while (targetIndices.size < connectionCount && targetIndices.size < nextLayerNodes.length) {
                const randomIndex = Math.floor(Math.random() * nextLayerNodes.length);
                targetIndices.add(randomIndex);
            }
            
            targetIndices.forEach(targetIndex => {
                const targetNode = nextLayerNodes[targetIndex];
                connections.push({
                    source: nodes.indexOf(sourceNode),
                    target: nodes.indexOf(targetNode),
                    strength: Math.random() * 0.5 + 0.2, // Connection strength 0.2-0.7
                    color: `hsla(${180 + (layer * 20)}, 100%, 60%, 0.4)`,
                    pulseOpacity: 0
                });
            });
        });
    }
    
    // Helper to create new data packets
    function createDataPacket() {
        // Find first layer nodes
        const firstLayerIndices = nodes
            .map((node, index) => node.layer === 0 ? index : -1)
            .filter(index => index !== -1);
        
        if (firstLayerIndices.length === 0) return;
        
        // Pick a random starting node
        const startNodeIndex = firstLayerIndices[Math.floor(Math.random() * firstLayerIndices.length)];
        
        // Activate that node
        nodes[startNodeIndex].active = true;
        nodes[startNodeIndex].pulseSize = 1;
        nodes[startNodeIndex].pulseOpacity = 1;
        
        // Find valid connections from this node
        const validConnections = connections.filter(conn => conn.source === startNodeIndex);
        
        if (validConnections.length === 0) return;
        
        // Create packet on a random connection from this node
        const randomConn = validConnections[Math.floor(Math.random() * validConnections.length)];
        
        dataPackets.push({
            connection: randomConn,
            position: 0, // Start of connection (0-1)
            speed: 0.003 + (Math.random() * 0.002), // Speed of traversal
            color: `hsl(${180 + Math.random() * 40}, 100%, 70%)`,
            size: Math.random() * 2 + 2
        });
    }
    
    // Animation loop
    function animate() {
        // Clear canvas, but with a slight fade effect for trails
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(0, 0, width, height);
        
        // Update and draw connections
        connections.forEach(connection => {
            const sourceNode = nodes[connection.source];
            const targetNode = nodes[connection.target];
            
            // Calculate connection opacity based on source and target node activity
            connection.pulseOpacity *= 0.97; // Fade existing pulse
            
            if (sourceNode.active || targetNode.active) {
                connection.pulseOpacity = Math.max(connection.pulseOpacity, 0.8);
            }
            
            // Draw connection line
            ctx.beginPath();
            ctx.moveTo(sourceNode.x, sourceNode.y);
            ctx.lineTo(targetNode.x, targetNode.y);
            
            // Apply glow effect
            ctx.shadowBlur = 4;
            ctx.shadowColor = connection.color.replace('0.4', '0.8');
            
            // Base opacity + pulse opacity
            const finalOpacity = Math.min(
                0.3 + (connection.pulseOpacity * 0.7), 1);
            
            ctx.strokeStyle = connection.color.replace('0.4', finalOpacity);
            ctx.lineWidth = 1 + (connection.pulseOpacity * 1.5);
            ctx.stroke();
            
            // Reset shadow for next drawing
            ctx.shadowBlur = 0;
        });
        
        // Update and draw data packets
        for (let i = dataPackets.length - 1; i >= 0; i--) {
            const packet = dataPackets[i];
            packet.position += packet.speed;
            
            // If packet reached target node
            if (packet.position >= 1) {
                const targetNode = nodes[packet.connection.target];
                
                // Activate target node
                targetNode.active = true;
                targetNode.pulseSize = 1;
                targetNode.pulseOpacity = 1;
                
                // Find next layer connections
                const nextConnections = connections.filter(c => c.source === packet.connection.target);
                
                // If connections exist, create a new packet on a random one
                if (nextConnections.length > 0) {
                    const nextConn = nextConnections[Math.floor(Math.random() * nextConnections.length)];
                    
                    dataPackets.push({
                        connection: nextConn,
                        position: 0,
                        speed: packet.speed * (0.9 + Math.random() * 0.2), // Slightly varied speed
                        color: packet.color,
                        size: packet.size * 0.9 // Slightly smaller
                    });
                }
                
                // Remove current packet
                dataPackets.splice(i, 1);
                continue;
            }
            
            // Draw packet
            const conn = packet.connection;
            const sourceNode = nodes[conn.source];
            const targetNode = nodes[conn.target];
            
            // Calculate position along connection line
            const x = sourceNode.x + (targetNode.x - sourceNode.x) * packet.position;
            const y = sourceNode.y + (targetNode.y - sourceNode.y) * packet.position;
            
            // Draw packet with glow
            ctx.beginPath();
            ctx.arc(x, y, packet.size, 0, Math.PI * 2);
            ctx.fillStyle = packet.color;
            ctx.shadowBlur = 10;
            ctx.shadowColor = packet.color;
            ctx.fill();
            ctx.shadowBlur = 0;
        }
        
        // Update and draw nodes
        nodes.forEach((node, index) => {
            // Update pulse animations
            pulseTimers[index] = (pulseTimers[index] + 1) % 300;
            const pulseFactor = Math.sin(pulseTimers[index] / 300 * Math.PI * 2) * 0.3 + 0.7;
            
            // Update node activity state
            if (node.active) {
                node.pulseSize *= 0.92;
                node.pulseOpacity *= 0.92;
                
                if (node.pulseSize < 0.1) {
                    node.active = false;
                }
            }
            
            // Pulsing radius effect
            const displayRadius = node.baseRadius * 
                (1 + (pulseFactor * 0.2) + (node.active ? node.pulseSize * 0.5 : 0));
            
            // Draw node with glow
            ctx.beginPath();
            ctx.arc(node.x, node.y, displayRadius, 0, Math.PI * 2);
            
            // Add glow
            ctx.shadowBlur = 10 + (node.active ? node.pulseSize * 10 : 0);
            ctx.shadowColor = node.color;
            
            // Node color depends on layer and activity
            const baseColor = node.color;
            const highlightColor = baseColor.replace('60%', '80%');
            
            ctx.fillStyle = node.active ? 
                highlightColor : 
                baseColor;
            
            ctx.fill();
            ctx.shadowBlur = 0;
            
            // Draw pulse ring if active
            if (node.active && node.pulseOpacity > 0.05) {
                ctx.beginPath();
                ctx.arc(
                    node.x, 
                    node.y, 
                    displayRadius + (node.pulseSize * 15), 
                    0, 
                    Math.PI * 2
                );
                ctx.strokeStyle = `hsla(${baseColor.match(/\d+/)[0]}, 100%, 70%, ${node.pulseOpacity})`;
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        });
        
        // Create new data packets occasionally
        if (Math.random() < 0.03) {
            createDataPacket();
        }
        
        requestAnimationFrame(animate);
    }
    
    // Start animation
    animate();
    
    // Create initial data packets
    for (let i = 0; i < 3; i++) {
        createDataPacket();
    }
    
    // Handle window resize
    window.addEventListener('resize', () => {
        ({ width, height } = resizeCanvas());
        
        // Reposition nodes
        layers.forEach((nodeCount, layerIndex) => {
            const layerX = width * (layerIndex + 1) / (layers.length + 1);
            
            // Find nodes in this layer and reposition them
            nodes.filter(node => node.layer === layerIndex).forEach((node, i) => {
                node.x = layerX;
                node.y = height * (i + 1) / (nodeCount + 1);
            });
        });
    });
}

// Make sure to call this function when the document is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeNeuralNetwork();
});

function initializeMatrix() {
    const matrixContent = document.querySelector('.matrix-content');
    if (!matrixContent) return;
    
    // Create matrix lines dynamically
    function createMatrixLine() {
        const line = document.createElement('div');
        line.className = 'matrix-line';
        
        // Generate random matrix text
        let text = '';
        const chars = '01';
        const length = Math.floor(Math.random() * 20) + 20;
        
        for (let i = 0; i < length; i++) {
            text += chars[Math.floor(Math.random() * chars.length)];
        }
        
        line.textContent = text;
        return line;
    }

    // Initialize with multiple lines
    for (let i = 0; i < 20; i++) {
        matrixContent.appendChild(createMatrixLine());
    }

    // Continuously update matrix
    setInterval(() => {
        // Remove first line and add new line
        if (matrixContent.children.length > 20) {
            matrixContent.removeChild(matrixContent.children[0]);
        }
        matrixContent.appendChild(createMatrixLine());

        // Random highlight effect
        const randomLine = matrixContent.children[
            Math.floor(Math.random() * matrixContent.children.length)
        ];
        randomLine.style.color = '#00ffff';
        randomLine.style.textShadow = '0 0 5px #00ffff';
        
        setTimeout(() => {
            randomLine.style.color = '';
            randomLine.style.textShadow = '';
        }, 100);
    }, 100);
}

// Make sure to call this when the page loads
document.addEventListener('DOMContentLoaded', initializeMatrix);

function animateStatusBars() {
    const statusBars = document.querySelectorAll('.status-bar-wrapper .status-bar');
    
    function updateBar(bar) {
        // Get current width or set initial width if not set
        const currentWidth = parseFloat(bar.style.width) || 50;
        
        // Calculate new width with smooth transition
        const randomChange = (Math.random() - 0.5) * 10; // -5% to +5%
        let newWidth = currentWidth + randomChange;
        
        // Keep within bounds (30% to 95%)
        newWidth = Math.max(30, Math.min(95, newWidth));
        
        // Apply new width with transition
        bar.style.width = `${newWidth}%`;
        
        // Update the value text
        const container = bar.closest('.status-item');
        if (container) {
            const valueElement = container.querySelector('.status-value');
            if (valueElement) {
                valueElement.textContent = `${Math.round(newWidth)}%`;
                
                // Add flash effect on change
                valueElement.style.color = '#00ffff';
                setTimeout(() => {
                    valueElement.style.color = '#e0e0e0';
                }, 300);
            }
        }
    }

    // Set initial values
    statusBars.forEach(bar => {
        // Set initial width
        bar.style.width = `${Math.random() * 65 + 30}%`;
        updateBar(bar);
    });

    // Continuous updates
    setInterval(() => {
        statusBars.forEach(bar => updateBar(bar));
    }, 2000);
}

// Initialize with random starting values
function initializeStatusBars() {
    const bars = document.querySelectorAll('.status-bar');
    bars.forEach(bar => {
        const initialValue = 30 + Math.random() * 40; // Random start between 30-70%
        bar.setAttribute('data-value', initialValue);
    });
    animateStatusBars();
}

function initializeTimeline() {
    // Sample timeline data
    const timelineData = [
        { 
            time: '2020.03.15', 
            title: 'Project Initialization', 
            details: 'Neural network architecture established. Initial parameters set.'
        },
        { 
            time: '2020.07.24', 
            title: 'Algorithm v1.0', 
            details: 'First successful prediction model deployed to production.'
        },
        { 
            time: '2021.01.10', 
            title: 'Quantum Integration', 
            details: 'Quantum processing elements added to core functionality.'
        },
        { 
            time: '2021.09.05', 
            title: 'Security Upgrade', 
            details: 'Enhanced encryption protocols implemented across all systems.'
        },
        { 
            time: '2022.04.18', 
            title: 'Global Expansion', 
            details: 'System deployment across 17 international data centers.'
        },
        { 
            time: '2022.11.30', 
            title: 'AI Module v2.5', 
            details: 'Self-learning capabilities expanded with reinforcement learning.'
        },
        { 
            time: '2023.05.22', 
            title: 'Neuro-Interface', 
            details: 'Direct neural pathway established for enhanced interaction.'
        },
        { 
            time: '2024.01.14', 
            title: 'Future Vision', 
            details: 'Predictive timeline capabilities now extend to 5-year forecasts.'
        }
    ];

    const timelineContent = document.querySelector('.timeline-content');
    const navDots = document.querySelector('.nav-dots');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');

    if (!timelineContent || !navDots || !prevBtn || !nextBtn) return;

    let currentPosition = 0;
    const visibleEvents = 3; // Number of events visible at once

    // Create timeline events
    timelineData.forEach((event, index) => {
        const eventElement = document.createElement('div');
        eventElement.className = 'timeline-event';
        eventElement.innerHTML = `
            <div class="event-marker"></div>
            <div class="event-time">${event.time}</div>
            <div class="event-title">${event.title}</div>
            <div class="event-details">${event.details}</div>
        `;
        timelineContent.appendChild(eventElement);
        
        // Create navigation dot
        const dot = document.createElement('div');
        dot.className = 'nav-dot';
        if (index === 0) dot.classList.add('active');
        dot.addEventListener('click', () => goToEvent(index));
        navDots.appendChild(dot);
        
        // Add random data point visuals
        addDataPoints(eventElement);
    });

    // Add decorative data point visuals
    function addDataPoints(element) {
        const numPoints = Math.floor(Math.random() * 5) + 3;
        for (let i = 0; i < numPoints; i++) {
            const point = document.createElement('div');
            point.className = 'data-point';
            point.style.left = `${Math.random() * 100}%`;
            point.style.top = `${Math.random() * 100}%`;
            point.style.animationDelay = `${Math.random() * 2}s`;
            element.appendChild(point);
        }
    }

    // Navigate through timeline
    function updateTimeline() {
        const eventWidth = 330; // Width of event + margin
        timelineContent.style.transform = `translateX(-${currentPosition * eventWidth}px)`;
        
        // Update active dot
        document.querySelectorAll('.nav-dot').forEach((dot, index) => {
            dot.classList.toggle('active', index === currentPosition);
        });
        
        // Update button states
        prevBtn.disabled = currentPosition === 0;
        nextBtn.disabled = currentPosition >= timelineData.length - visibleEvents;
    }

    function goToEvent(index) {
        currentPosition = Math.min(
            Math.max(0, index), 
            timelineData.length - visibleEvents
        );
        updateTimeline();
    }

    prevBtn.addEventListener('click', () => {
        if (currentPosition > 0) {
            currentPosition--;
            updateTimeline();
        }
    });

    nextBtn.addEventListener('click', () => {
        if (currentPosition < timelineData.length - visibleEvents) {
            currentPosition++;
            updateTimeline();
        }
    });

    // Add glitch effect on hover
    document.querySelectorAll('.event-title').forEach(title => {
        title.addEventListener('mouseover', () => {
            title.style.animation = 'glitch 1s infinite';
        });
        title.addEventListener('mouseout', () => {
            title.style.animation = 'none';
        });
    });

    // Initialize timeline
    updateTimeline();

    // Optional: Add keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') prevBtn.click();
        if (e.key === 'ArrowRight') nextBtn.click();
    });
}