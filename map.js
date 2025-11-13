// Initialize the map
const map = new maplibregl.Map({
    container: 'map',
    style: 'style.json',
    center: [-73.935242, 40.730610],
    zoom: 13
});

// Add navigation controls
map.addControl(new maplibregl.NavigationControl(), 'top-left');

// Function to convert regular JSON to GeoJSON
function convertToGeoJSON(data) {
    return {
        type: 'FeatureCollection',
        features: data.map(item => ({
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: [
                    parseFloat(item.longitude),
                    parseFloat(item.latitude)
                ]
            },
            properties: {
                spc_common: item.spc_common,
                status: item.status,
                health: item.health,
                tree_dbh: item.tree_dbh
            }
        }))
    };
}

// Wait for map to fully load
map.on('load', () => {
    console.log('Map loaded, fetching tree data...');
    
    // Fetch up to 50,000 trees
    fetch('https://data.cityofnewyork.us/resource/uvpi-gqnh.json?$limit=50000&$where=latitude IS NOT NULL AND longitude IS NOT NULL')
        .then(response => {
            console.log('Response status:', response.status);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Data loaded! Number of trees:', data.length);
            
            // Convert to GeoJSON
            const geojsonData = convertToGeoJSON(data);
            console.log('Converted to GeoJSON, features:', geojsonData.features.length);
            
            // Add the source with the converted data
            map.addSource('nyc-trees', {
                type: 'geojson',
                data: geojsonData
            });
            
            console.log('Source added');

            // Add the circle layer
            map.addLayer({
                id: 'nyc-trees',
                type: 'circle',
                source: 'nyc-trees',
                paint: {
                    'circle-color': '#77c049',
                    'circle-radius': 2,
                    'circle-opacity': 0.8
                }
            });
            
            console.log('Layer added - you should now see green dots on the map!');

            // Create popup instance
            const popup = new maplibregl.Popup({
                closeButton: true,
                closeOnClick: true
            });

            // Add click event listener
            map.on('click', 'nyc-trees', (e) => {
                if (e.features.length > 0) {
                    const properties = e.features[0].properties;
                    const coordinates = e.features[0].geometry.coordinates.slice();

                    const content = `
                        <h5>Street Tree Info</h5>
                        <p>Species: ${properties.spc_common || 'Unknown'}</p>
                        <p>Status: ${properties.status || 'N/A'}</p>
                        <p>Health: ${properties.health || 'N/A'}</p>
                        <p>Diameter: ${properties.tree_dbh || 'N/A'}</p>
                    `;

                    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
                    }

                    popup.setLngLat(coordinates)
                        .setHTML(content)
                        .addTo(map);
                }
            });

            // Change cursor on hover
            map.on('mouseenter', 'nyc-trees', () => {
                map.getCanvas().style.cursor = 'pointer';
            });

            map.on('mouseleave', 'nyc-trees', () => {
                map.getCanvas().style.cursor = '';
            });

            // Layer toggle functionality
            const toggleCheckbox = document.getElementById('layer-toggle');
            if (toggleCheckbox) {
                toggleCheckbox.addEventListener('change', (e) => {
                    const visibility = e.target.checked ? 'visible' : 'none';
                    map.setLayoutProperty('nyc-trees', 'visibility', visibility);
                    console.log('Layer visibility:', visibility);
                });
            }
        })
        .catch(error => {
            console.error('Error fetching tree data:', error);
        });
});

// Error handling
map.on('error', (e) => {
    console.error('Map error:', e);
});