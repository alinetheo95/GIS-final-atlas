// park space

// Initialize the map
const map3 = new maplibregl.Map({
    container: 'map3',
    style: 'style.json',
    center: [-73.935242, 40.730610],
    zoom: 11
});

// Add navigation controls
map3.addControl(new maplibregl.NavigationControl(), 'top-left');

// Wait for map to fully load
map3.on('load', () => {
    console.log('Map loaded, fetching parks data...');
    
    // Fetch parks boundaries in GeoJSON format
    fetch('https://data.cityofnewyork.us/resource/enfh-gkve.geojson?$limit=1000')
        .then(response => {
            console.log('Response status:', response.status);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(geojsonData => {
            console.log('Parks data loaded! Number of parks:', geojsonData.features.length);
            
            // Add the source with the GeoJSON data
            map3.addSource('nyc-parks', {
                type: 'geojson',
                data: geojsonData
            });
            
            console.log('Source added');

            // Add the fill layer for park boundaries
            map3.addLayer({
                id: 'nyc-parks-fill',
                type: 'fill',
                source: 'nyc-parks',
                paint: {
                    'fill-color': '#77c049',
                    'fill-opacity': 0.5
                }
            });

            // Add outline layer
            map3.addLayer({
                id: 'nyc-parks-outline',
                type: 'line',
                source: 'nyc-parks',
                paint: {
                    'line-color': '#4a7c2f',
                    'line-width': 2
                }
            });
            
            console.log('Layers added - you should now see park boundaries on the map!');

            // Create popup instance
            const popup = new maplibregl.Popup({
                closeButton: true,
                closeOnClick: true
            });

            // Add click event listener
            map3.on('click', 'nyc-parks-fill', (e) => {
                if (e.features.length > 0) {
                    const properties = e.features[0].properties;
                    const coordinates = e.lngLat;

                    const content = `
                        <h5>NYC Park</h5>
                        <p><strong>Name:</strong> ${properties.signname || properties.name311 || 'Unknown'}</p>
                        <p><strong>Borough:</strong> ${properties.borough || 'N/A'}</p>
                        <p><strong>Acres:</strong> ${properties.acres ? parseFloat(properties.acres).toFixed(2) : 'N/A'}</p>
                    `;

                    popup.setLngLat(coordinates)
                        .setHTML(content)
                        .addTo(map3);
                }
            });

            // Change cursor on hover
            map3.on('mouseenter', 'nyc-parks-fill', () => {
                map3.getCanvas().style.cursor = 'pointer';
            });

            map3.on('mouseleave', 'nyc-parks-fill', () => {
                map3.getCanvas().style.cursor = '';
            });

            // Layer toggle functionality
            const toggleCheckbox = document.getElementById('layer-toggle');
            if (toggleCheckbox) {
                toggleCheckbox.addEventListener('change', (e) => {
                    const visibility = e.target.checked ? 'visible' : 'none';
                    map3.setLayoutProperty('nyc-parks-fill', 'visibility', visibility);
                    map3.setLayoutProperty('nyc-parks-outline', 'visibility', visibility);
                    console.log('Layer visibility:', visibility);
                });
            }
        })
        .catch(error => {
            console.error('Error fetching parks data:', error);
        });
});

// Error handling
map3.on('error', (e) => {
    console.error('Map error:', e);
});
