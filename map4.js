//impervious surfaces

// Initialize map 4
const map4 = new maplibregl.Map({
    container: 'map4',
    style: 'style.json',
    center: [-73.935242, 40.730610],
    zoom: 11
});

// Add navigation controls
map4.addControl(new maplibregl.NavigationControl(), 'top-left');

// Wait for map to fully load
map4.on('load', () => {
    console.log('Map loaded, fetching building footprints...');
    
    // Fetch building footprints in GeoJSON format (limit to 5000 for performance)
    fetch('https://data.cityofnewyork.us/resource/5zhs-2jue.geojson?$limit=5000')
        .then(response => {
            console.log('Response status:', response.status);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(geojsonData => {
            console.log('Building data loaded! Number of buildings:', geojsonData.features.length);
            
            // Add the source with the GeoJSON data
            map4.addSource('nyc-buildings', {
                type: 'geojson',
                data: geojsonData
            });
            
            console.log('Source added');

            // Add the fill layer for building footprints
            map4.addLayer({
                id: 'nyc-buildings-fill',
                type: 'fill',
                source: 'nyc-buildings',
                paint: {
                    'fill-color': '#888888',
                    'fill-opacity': 0.6
                }
            });

            // Add outline layer
            map4.addLayer({
                id: 'nyc-buildings-outline',
                type: 'line',
                source: 'nyc-buildings',
                paint: {
                    'line-color': '#d6d2d2ff',
                    'line-width': 1
                }
            });
            
            console.log('Layers added - you should now see building footprints on the map!');

            // Create popup instance
            const popup = new maplibregl.Popup({
                closeButton: true,
                closeOnClick: true
            });

            // Add click event listener
            map4.on('click', 'nyc-buildings-fill', (e) => {
                if (e.features.length > 0) {
                    const properties = e.features[0].properties;
                    const coordinates = e.lngLat;

                    const content = `
                        <h5>Building Info</h5>
                        <p><strong>BIN:</strong> ${properties.bin || 'N/A'}</p>
                        <p><strong>Building Name:</strong> ${properties.name || 'N/A'}</p>
                        <p><strong>Construction Year:</strong> ${properties.cnstrct_yr || 'N/A'}</p>
                        <p><strong>Height (ft):</strong> ${properties.heightroof || 'N/A'}</p>
                        <p><strong>Ground Elevation:</strong> ${properties.groundelev || 'N/A'}</p>
                    `;

                    popup.setLngLat(coordinates)
                        .setHTML(content)
                        .addTo(map4);
                }
            });

            // Change cursor on hover
            map4.on('mouseenter', 'nyc-buildings-fill', () => {
                map4.getCanvas().style.cursor = 'pointer';
            });

            map4.on('mouseleave', 'nyc-buildings-fill', () => {
                map4.getCanvas().style.cursor = '';
            });

            // Layer toggle functionality
            const toggleCheckbox = document.getElementById('layer-toggle-buildings');
            if (toggleCheckbox) {
                toggleCheckbox.addEventListener('change', (e) => {
                    const visibility = e.target.checked ? 'visible' : 'none';
                    map4.setLayoutProperty('nyc-buildings-fill', 'visibility', visibility);
                    map4.setLayoutProperty('nyc-buildings-outline', 'visibility', visibility);
                    console.log('Layer visibility:', visibility);
                });
            }
        })
        .catch(error => {
            console.error('Error fetching building data:', error);
        });
});

// Error handling
map4.on('error', (e) => {
    console.error('Map error:', e);
});