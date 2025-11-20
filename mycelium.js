// ===== MYCELIUM SIMULATION FOR TREE COVERAGE MAP =====
// This script creates a hybrid DLA/Hyphae/Physarum growth simulation
// that runs only on the tree coverage map (#map)

// Wait for the tree map to be initialized
function waitForTreeMap() {
    if (window.treeMap) {
        console.log('Tree map found, initializing mycelium simulation');
        initMyceliumSimulation(window.treeMap);
    } else {
        setTimeout(waitForTreeMap, 100);
    }
}

// Start when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitForTreeMap);
} else {
    waitForTreeMap();
}

function initMyceliumSimulation(treeMap) {
    // ===== CANVAS SETUP =====
    const canvas = document.getElementById('myceliumCanvas');
    if (!canvas) {
        console.error('Canvas element not found');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    const mapContainer = document.getElementById('map');
    
    // Position and size canvas to match map
    function updateCanvasPosition() {
        const rect = mapContainer.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = rect.width + 'px';
        canvas.style.height = rect.height + 'px';
        canvas.style.pointerEvents = 'none';
        
        // Redraw if nodes exist
        if (nodes.length > 0) {
            draw();
        }
    }
    
    updateCanvasPosition();
    window.addEventListener('resize', updateCanvasPosition);
    window.addEventListener('scroll', updateCanvasPosition);
    
    // Redraw when map moves or zooms
    treeMap.on('move', () => {
        if (nodes.length > 0) draw();
    });
    
    treeMap.on('zoom', () => {
        if (nodes.length > 0) draw();
    });

    // ===== SIMULATION STATE =====
    let seeds = [];
    let nodes = [];
    let activeTips = [];
    let isRunning = false;
    let isSeedMode = false;
    let iteration = 0;
    let animationFrame = null;
    
    // ===== CONFIGURATION =====
    const config = {
        stepsPerFrame: 5,
        maxActiveTips: 50,
        stepSize: 0.0003, // degrees lat/lng
        branchProbability: 0.15,
        branchAngle: 45 * Math.PI / 180,
        stickDistance: 0.0005,
        avoidanceDistance: 0.0008,
        killDistance: 0.02,
        spawnDistance: 0.005,
        reinforcementRate: 0.05,
        decayRate: 0.02,
        useReinforcement: true,
        useAvoidance: true,
        useDLA: true
    };

    // ===== NODE CLASS =====
    class Node {
        constructor(lat, lng, parent = null, isSeed = false) {
            this.lat = lat;
            this.lng = lng;
            this.parent = parent;
            this.children = [];
            this.isSeed = isSeed;
            this.thickness = isSeed ? 3 : 1;
            this.flow = 0;
            this.age = 0;
            
            if (parent) {
                parent.children.push(this);
            }
        }
        
        getPixel() {
            // Convert lat/lng to screen pixels using MapLibre/Mapbox
            const point = treeMap.project([this.lng, this.lat]);
            return point;
        }
        
        distance(other) {
            const dlat = this.lat - other.lat;
            const dlng = this.lng - other.lng;
            return Math.sqrt(dlat * dlat + dlng * dlng);
        }
    }

    // ===== ACTIVE TIP CLASS =====
    class ActiveTip {
        constructor(node) {
            this.node = node;
            this.direction = Math.random() * Math.PI * 2;
            this.energy = 1.0;
        }
        
        step() {
            // DLA component: random walk
            if (config.useDLA) {
                this.direction += (Math.random() - 0.5) * 0.5;
            }
            
            // Hyphae component: avoid crowding
            if (config.useAvoidance) {
                const nearby = nodes.filter(n => 
                    this.node.distance(n) < config.avoidanceDistance
                );
                
                if (nearby.length > 5) {
                    // Turn away from crowded areas
                    const avgLat = nearby.reduce((s, n) => s + n.lat, 0) / nearby.length;
                    const avgLng = nearby.reduce((s, n) => s + n.lng, 0) / nearby.length;
                    const awayAngle = Math.atan2(
                        this.node.lat - avgLat,
                        this.node.lng - avgLng
                    );
                    this.direction = this.direction * 0.7 + awayAngle * 0.3;
                }
            }
            
            // Move forward
            const newLat = this.node.lat + Math.sin(this.direction) * config.stepSize;
            const newLng = this.node.lng + Math.cos(this.direction) * config.stepSize;
            
            // Check if too far from network
            const nearestDist = Math.min(...nodes.map(n => 
                Math.sqrt((newLat - n.lat)**2 + (newLng - n.lng)**2)
            ));
            
            if (nearestDist > config.killDistance) {
                return null; // Kill this tip
            }
            
            // Create new node
            const newNode = new Node(newLat, newLng, this.node, false);
            nodes.push(newNode);
            
            // Update flow (Physarum component)
            if (config.useReinforcement) {
                let current = newNode;
                while (current.parent) {
                    current.flow += config.reinforcementRate;
                    current.thickness = Math.min(5, 1 + current.flow * 0.5);
                    current = current.parent;
                }
            }
            
            // Branching
            if (Math.random() < config.branchProbability) {
                const branchTip = new ActiveTip(newNode);
                branchTip.direction = this.direction + (Math.random() < 0.5 ? 1 : -1) * config.branchAngle;
                return [new ActiveTip(newNode), branchTip];
            }
            
            return new ActiveTip(newNode);
        }
    }

    // ===== SIMULATION FUNCTIONS =====
    function spawnInitialTips() {
        activeTips = [];
        seeds.forEach(seed => {
            for (let i = 0; i < 3; i++) {
                activeTips.push(new ActiveTip(seed));
            }
        });
    }

    function simulationStep() {
        if (!isRunning || seeds.length === 0) return;
        
        for (let step = 0; step < config.stepsPerFrame; step++) {
            const newTips = [];
            
            // Process each active tip
            for (let i = activeTips.length - 1; i >= 0; i--) {
                const result = activeTips[i].step();
                
                if (result === null) {
                    // Tip died
                    activeTips.splice(i, 1);
                } else if (Array.isArray(result)) {
                    // Tip branched
                    activeTips.splice(i, 1);
                    newTips.push(...result);
                } else {
                    // Tip continued
                    activeTips[i] = result;
                }
            }
            
            activeTips.push(...newTips);
            
            // Limit active tips
            if (activeTips.length > config.maxActiveTips) {
                activeTips = activeTips.slice(0, config.maxActiveTips);
            }
            
            // Spawn new tips if needed
            while (activeTips.length < Math.min(config.maxActiveTips / 2, 20) && nodes.length > 0) {
                const randomNode = nodes[Math.floor(Math.random() * Math.min(50, nodes.length))];
                activeTips.push(new ActiveTip(randomNode));
            }
            
            iteration++;
        }
        
        // Decay flows (Physarum pruning)
        if (config.useReinforcement && iteration % 50 === 0) {
            nodes.forEach(n => {
                n.flow *= (1 - config.decayRate);
                n.thickness = Math.min(5, Math.max(0.5, 1 + n.flow * 0.5));
            });
        }
        
        draw();
        updateStats();
        animationFrame = requestAnimationFrame(simulationStep);
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw connections
        nodes.forEach(node => {
            if (!node.parent) return;
            
            const p1 = node.getPixel();
            const p2 = node.parent.getPixel();
            
            // Check if points are on screen
            if (p1.x < 0 || p1.x > canvas.width || p1.y < 0 || p1.y > canvas.height) return;
            if (p2.x < 0 || p2.x > canvas.width || p2.y < 0 || p2.y > canvas.height) return;
            
            // Gradient color based on flow
            const flowIntensity = Math.min(1, node.flow / 2);
            const hue = 280 - flowIntensity * 80; // Purple to pink
            
            ctx.strokeStyle = `hsla(${hue}, 70%, ${50 + flowIntensity * 20}%, 0.6)`;
            ctx.lineWidth = node.thickness;
            ctx.lineCap = 'round';
            
            ctx.beginPath();
            ctx.moveTo(p2.x, p2.y);
            ctx.lineTo(p1.x, p1.y);
            ctx.stroke();
        });
        
        // Draw nodes
        nodes.forEach(node => {
            const p = node.getPixel();
            
            // Check if on screen
            if (p.x < 0 || p.x > canvas.width || p.y < 0 || p.y > canvas.height) return;
            
            if (node.isSeed) {
                // Seeds
                ctx.fillStyle = 'rgba(147, 51, 234, 0.8)';
                ctx.beginPath();
                ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
                ctx.fill();
            } else {
                // Regular nodes
                ctx.fillStyle = 'rgba(236, 72, 153, 0.4)';
                ctx.beginPath();
                ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
                ctx.fill();
            }
        });
        
        // Draw active tips
        activeTips.forEach(tip => {
            const p = tip.node.getPixel();
            
            if (p.x < 0 || p.x > canvas.width || p.y < 0 || p.y > canvas.height) return;
            
            ctx.fillStyle = 'rgba(96, 165, 250, 0.8)';
            ctx.beginPath();
            ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    function updateStats() {
        const nodeCountEl = document.getElementById('nodeCount');
        const tipCountEl = document.getElementById('tipCount');
        const lengthTotalEl = document.getElementById('lengthTotal');
        const iterCountEl = document.getElementById('iterCount');
        
        if (nodeCountEl) nodeCountEl.textContent = nodes.length;
        if (tipCountEl) tipCountEl.textContent = activeTips.length;
        
        // Calculate total length
        let totalLength = 0;
        nodes.forEach(n => {
            if (n.parent) totalLength += n.distance(n.parent);
        });
        const lengthMeters = totalLength * 111000; // rough conversion
        if (lengthTotalEl) lengthTotalEl.textContent = Math.round(lengthMeters) + 'm';
        if (iterCountEl) iterCountEl.textContent = iteration;
    }

    // ===== EVENT HANDLERS =====
    
    // Add seed points when clicking map
    treeMap.on('click', (e) => {
        if (isSeedMode) {
            const seed = new Node(e.lngLat.lat, e.lngLat.lng, null, true);
            seeds.push(seed);
            nodes.push(seed);
            canvas.classList.add('active');
            draw();
            updateStats();
        }
    });

    // Toggle seed mode button
    const toggleSeedBtn = document.getElementById('toggleSeedMode');
    if (toggleSeedBtn) {
        toggleSeedBtn.addEventListener('click', () => {
            isSeedMode = !isSeedMode;
            const indicator = document.getElementById('seedModeIndicator');
            
            if (isSeedMode) {
                toggleSeedBtn.textContent = '🎯 Seed Mode: ON';
                toggleSeedBtn.style.background = '#f59e0b';
                if (indicator) indicator.classList.add('active');
                // Change map cursor
                mapContainer.style.cursor = 'crosshair';
            } else {
                toggleSeedBtn.textContent = 'Click to Add Seed Points';
                toggleSeedBtn.style.background = '#6366f1';
                if (indicator) indicator.classList.remove('active');
                mapContainer.style.cursor = '';
            }
        });
    }

    // Start button
    const startBtn = document.getElementById('startBtn');
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            if (seeds.length === 0) {
                alert('Please add seed points first! Click "Click to Add Seed Points", then click on the map.');
                return;
            }
            isRunning = true;
            canvas.classList.add('active');
            if (activeTips.length === 0) spawnInitialTips();
            simulationStep();
            startBtn.textContent = 'Growing...';
            startBtn.style.background = '#059669';
        });
    }

    // Pause button
    const pauseBtn = document.getElementById('pauseBtn');
    if (pauseBtn) {
        pauseBtn.addEventListener('click', () => {
            isRunning = false;
            if (animationFrame) {
                cancelAnimationFrame(animationFrame);
                animationFrame = null;
            }
            if (startBtn) {
                startBtn.textContent = 'Resume Growth';
                startBtn.style.background = '#10b981';
            }
        });
    }

    // Clear button
    const clearBtn = document.getElementById('clearBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            isRunning = false;
            if (animationFrame) {
                cancelAnimationFrame(animationFrame);
                animationFrame = null;
            }
            seeds = [];
            nodes = [];
            activeTips = [];
            iteration = 0;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            canvas.classList.remove('active');
            updateStats();
            if (startBtn) {
                startBtn.textContent = 'Start Growth';
                startBtn.style.background = '#10b981';
            }
        });
    }

    // Speed slider
    const speedSlider = document.getElementById('speedSlider');
    if (speedSlider) {
        speedSlider.addEventListener('input', (e) => {
            config.stepsPerFrame = parseInt(e.target.value);
            const speedVal = document.getElementById('speedVal');
            if (speedVal) speedVal.textContent = e.target.value;
        });
    }

    // Branch probability slider
    const branchSlider = document.getElementById('branchSlider');
    if (branchSlider) {
        branchSlider.addEventListener('input', (e) => {
            config.branchProbability = parseInt(e.target.value) / 100;
            const branchVal = document.getElementById('branchVal');
            if (branchVal) branchVal.textContent = e.target.value + '%';
        });
    }

    // Max tips slider
    const tipsSlider = document.getElementById('tipsSlider');
    if (tipsSlider) {
        tipsSlider.addEventListener('input', (e) => {
            config.maxActiveTips = parseInt(e.target.value);
            const tipsVal = document.getElementById('tipsVal');
            if (tipsVal) tipsVal.textContent = e.target.value;
        });
    }

    // Algorithm checkboxes
    const reinforcementCheck = document.getElementById('reinforcement');
    if (reinforcementCheck) {
        reinforcementCheck.addEventListener('change', (e) => {
            config.useReinforcement = e.target.checked;
        });
    }

    const avoidanceCheck = document.getElementById('avoidance');
    if (avoidanceCheck) {
        avoidanceCheck.addEventListener('change', (e) => {
            config.useAvoidance = e.target.checked;
        });
    }

    const dlaCheck = document.getElementById('dla');
    if (dlaCheck) {
        dlaCheck.addEventListener('change', (e) => {
            config.useDLA = e.target.checked;
        });
    }

    // Initialize stats
    updateStats();
    
    console.log('Mycelium simulation initialized successfully');
}