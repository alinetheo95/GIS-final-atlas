// scrollytelling.js

(async function() {
    const map = window.sharedMap;
    
    // Wait for map to be loaded
    if (!map.loaded()) {
        await new Promise(resolve => map.on('load', resolve));
    }
    
    console.log('Scrollytelling initialized');
    
    // Define narrative steps following your order
    const steps = {
        'intro': {
            center: [-73.935242, 40.730610],
            zoom: 10.5,
            pitch: 0,
            bearing: 0,
            layers: {
                'census-tracts-fill': 'none',
                'census-tracts-outline': 'none',
                'building-tiles-layer': 'none',
                'historical-ecology-layer': 'none',
                'streams-layer': 'none',
                'wetlands-layer': 'none',
                'trees-layer': 'none'
            }
        },
        
        // STEP 1: Historical Grid
        'historical-grid': {
            center: [-73.935242, 40.730610],
            zoom: 11,
            pitch: 0,
            bearing: 0,
            layers: {
                'census-tracts-fill': 'visible',
                'census-tracts-outline': 'visible',
                'building-tiles-layer': 'none',
                'historical-ecology-layer': 'none',
                'streams-layer': 'none',
                'wetlands-layer': 'none',
                'trees-layer': 'none'
            }
        },
        
        'grid-detail': {
            center: [-73.9712, 40.7831],
            zoom: 12.5,
            pitch: 0,
            bearing: 0,
            layers: {
                'census-tracts-fill': 'visible',
                'census-tracts-outline': 'visible',
                'building-tiles-layer': 'none',
                'historical-ecology-layer': 'none',
                'streams-layer': 'none',
                'wetlands-layer': 'none',
                'trees-layer': 'none'
            }
        },
        
        // STEP 2: Impervious Surfaces
        'impervious-intro': {
            center: [-73.952778, 40.798120],
            zoom: 13,
            pitch: 0,
            bearing: 0,
            layers: {
                'census-tracts-fill': 'visible',
                'census-tracts-outline': 'visible',
                'building-tiles-layer': 'visible',
                'historical-ecology-layer': 'none',
                'streams-layer': 'none',
                'wetlands-layer': 'none',
                'trees-layer': 'none'
            }
        },
        
        'impervious-detail': {
            center: [-73.952778, 40.798120],
            zoom: 14,
            pitch: 45,
            bearing: -17.6,
            layers: {
                'census-tracts-fill': 'none',
                'census-tracts-outline': 'none',
                'building-tiles-layer': 'visible',
                'historical-ecology-layer': 'none',
                'streams-layer': 'none',
                'wetlands-layer': 'none',
                'trees-layer': 'none'
            }
        },
        
        // STEP 3: Historical Ecology
        'historical-ecology': {
            center: [-73.952778, 40.798120],
            zoom: 12,
            pitch: 0,
            bearing: 0,
            layers: {
                'census-tracts-fill': 'none',
                'census-tracts-outline': 'none',
                'building-tiles-layer': 'none',
                'historical-ecology-layer': 'visible',
                'streams-layer': 'none',
                'wetlands-layer': 'none',
                'trees-layer': 'none'
            }
        },
        
        'ecology-comparison': {
            center: [-73.952778, 40.798120],
            zoom: 12,
            pitch: 0,
            bearing: 0,
            layers: {
                'census-tracts-fill': 'none',
                'census-tracts-outline': 'none',
                'building-tiles-layer': 'visible',
                'historical-ecology-layer': 'visible',
                'streams-layer': 'none',
                'wetlands-layer': 'none',
                'trees-layer': 'none'
            },
            paint: {
                'historical-ecology-layer': {
                    'fill-opacity': 0.7
                }
            }
        },
        
        // STEP 4: Streams
        'streams-intro': {
            center: [-73.935242, 40.730610],
            zoom: 11.5,
            pitch: 0,
            bearing: 0,
            layers: {
                'census-tracts-fill': 'none',
                'census-tracts-outline': 'none',
                'building-tiles-layer': 'none',
                'historical-ecology-layer': 'visible',
                'streams-layer': 'visible',
                'wetlands-layer': 'none',
                'trees-layer': 'none'
            }
        },
        
        'streams-detail': {
            center: [-73.952778, 40.798120],
            zoom: 13,
            pitch: 0,
            bearing: 0,
            layers: {
                'census-tracts-fill': 'none',
                'census-tracts-outline': 'none',
                'building-tiles-layer': 'visible',
                'historical-ecology-layer': 'none',
                'streams-layer': 'visible',
                'wetlands-layer': 'none',
                'trees-layer': 'none'
            }
        },
        
        // STEP 5: Wetlands
        'wetlands-intro': {
            center: [-73.935242, 40.730610],
            zoom: 11.5,
            pitch: 0,
            bearing: 0,
            layers: {
                'census-tracts-fill': 'none',
                'census-tracts-outline': 'none',
                'building-tiles-layer': 'none',
                'historical-ecology-layer': 'visible',
                'streams-layer': 'visible',
                'wetlands-layer': 'visible',
                'trees-layer': 'none'
            }
        },
        
        'wetlands-detail': {
            center: [-73.952778, 40.798120],
            zoom: 12.5,
            pitch: 0,
            bearing: 0,
            layers: {
                'census-tracts-fill': 'none',
                'census-tracts-outline': 'none',
                'building-tiles-layer': 'none',
                'historical-ecology-layer': 'none',
                'streams-layer': 'visible',
                'wetlands-layer': 'visible',
                'trees-layer': 'none'
            }
        },
        
        // STEP 6: Tree Coverage
        'trees-intro': {
            center: [-73.935242, 40.730610],
            zoom: 11,
            pitch: 0,
            bearing: 0,
            layers: {
                'census-tracts-fill': 'none',
                'census-tracts-outline': 'none',
                'building-tiles-layer': 'none',
                'historical-ecology-layer': 'none',
                'streams-layer': 'none',
                'wetlands-layer': 'none',
                'trees-layer': 'visible'
            }
        },
        
        'trees-detail': {
            center: [-73.9712, 40.7831],
            zoom: 13,
            pitch: 0,
            bearing: 0,
            layers: {
                'census-tracts-fill': 'none',
                'census-tracts-outline': 'none',
                'building-tiles-layer': 'visible',
                'historical-ecology-layer': 'none',
                'streams-layer': 'none',
                'wetlands-layer': 'none',
                'trees-layer': 'visible'
            },
            paint: {
                'building-tiles-layer': {
                    'raster-opacity': 0.4
                }
            }
        },
        
        // Final overview
        'all-layers': {
            center: [-73.935242, 40.730610],
            zoom: 11,
            pitch: 0,
            bearing: 0,
            layers: {
                'census-tracts-fill': 'visible',
                'census-tracts-outline': 'visible',
                'building-tiles-layer': 'visible',
                'historical-ecology-layer': 'visible',
                'streams-layer': 'visible',
                'wetlands-layer': 'visible',
                'trees-layer': 'visible'
            },
            paint: {
                'census-tracts-fill': {
                    'fill-opacity': 0.3
                },
                'building-tiles-layer': {
                    'raster-opacity': 0.4
                },
                'historical-ecology-layer': {
                    'fill-opacity': 0.3
                }
            }
        }
    };
    
    // Handle step transitions
    function handleStepEnter(stepName) {
        const config = steps[stepName];
        
        if (!config) {
            console.warn(`No configuration found for step: ${stepName}`);
            return;
        }
        
        console.log(`Entering step: ${stepName}`);
        
        // Animate map camera
        map.flyTo({
            center: config.center,
            zoom: config.zoom,
            pitch: config.pitch || 0,
            bearing: config.bearing || 0,
            duration: 2000,
            essential: true
        });
        
        // Toggle layer visibility
        if (config.layers) {
            Object.keys(config.layers).forEach(layerId => {
                if (map.getLayer(layerId)) {
                    map.setLayoutProperty(layerId, 'visibility', config.layers[layerId]);
                }
            });
        }
        
        // Update paint properties if specified
        if (config.paint) {
            Object.keys(config.paint).forEach(layerId => {
                if (map.getLayer(layerId)) {
                    Object.keys(config.paint[layerId]).forEach(property => {
                        map.setPaintProperty(layerId, property, config.paint[layerId][property]);
                    });
                }
            });
        }
    }
    
    // Intersection Observer for scroll detection
    const stepElements = document.querySelectorAll('.step');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const stepName = entry.target.dataset.step;
                handleStepEnter(stepName);
                entry.target.classList.add('active');
            } else {
                entry.target.classList.remove('active');
            }
        });
    }, {
        threshold: 0.5,
        rootMargin: '0px'
    });
    
    // Observe all steps
    stepElements.forEach(step => {
        observer.observe(step);
    });
    
    console.log('✅ Scrollytelling ready - found', stepElements.length, 'steps');
    
})();