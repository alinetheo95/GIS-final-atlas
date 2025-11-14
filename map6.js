// Population Density - Census Tracts

// Initialize map 6
const map6 = new maplibregl.Map({
    container: 'map6',
    style: 'style.json',
    center: [-73.935242, 40.730610],
    zoom: 10
});

// Add navigation controls
map6.addControl(new maplibregl.NavigationControl(), 'top-left');

// Wait for map to fully load
map6.on('load', () => {
    console.log('Map 6 loaded, fetching census tract data...');
    
    // Fetch census tracts in GeoJSON format
    fetch('https://services5.arcgis.com/GfwWNkhOj9bNBqoJ/arcgis/rest/services/NYC_Census_Tracts_for_2020_US_Census/FeatureServer/0/query?where=1=1&outFields=*&outSR=4326&f=pgeojson')
        .then(response => {
            console.log('Response status:', response.status);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(geojsonData => {
            console.log('Census tract data loaded! Number of tracts:', geojsonData.features.length);
            
            // Add the source with the GeoJSON data
            map6.addSource('census-tracts', {
                type: 'geojson',
                data: geojsonData
            });
            
            console.log('Source added');

            // Add the fill layer for census tracts with population density coloring
            map6.addLayer({
                id: 'census-tracts-fill',
                type: 'fill',
                source: 'census-tracts',
                paint: {
                    'fill-color': [
                        'interpolate',
                        ['linear'],
                        ['get', 'PopDen'], // Population density field
                        0, '#ffffcc',      // Light yellow for low density
                        50, '#ffeda0',
                        100, '#fed976',
                        200, '#feb24c',
                        300, '#fd8d3c',
                        400, '#fc4e2a',
                        500, '#e31a1c',
                        600, '#bd0026',
                        700, '#800026'     // Dark red for high density
                    ],
                    'fill-opacity': 0.7
                }
            });

            // Add outline layer
            map6.addLayer({
                id: 'census-tracts-outline',
                type: 'line',
                source: 'census-tracts',
                paint: {
                    'line-color': '#ffffff',
                    'line-width': 1
                }
            });
            
            console.log('Layers added - census tracts with population density now visible!');

            // Create popup instance
            const popup = new maplibregl.Popup({
                closeButton: true,
                closeOnClick: true
            });

            // Add click event listener
            map6.on('click', 'census-tracts-fill', (e) => {
                if (e.features.length > 0) {
                    const properties = e.features[0].properties;
                    const coordinates = e.lngLat;

                    const content = `
                        <h5>Census Tract Info</h5>
                        <p><strong>Tract:</strong> ${properties.BoroCT2020 || properties.CT2020 || 'N/A'}</p>
                        <p><strong>Borough:</strong> ${properties.BoroName || 'N/A'}</p>
                        <p><strong>Population:</strong> ${properties.Pop_2020 ? properties.Pop_2020.toLocaleString() : 'N/A'}</p>
                        <p><strong>Population Density:</strong> ${properties.PopDen ? properties.PopDen.toFixed(2) + ' per sq mi' : 'N/A'}</p>
                        <p><strong>Land Area:</strong> ${properties.Shape__Area ? (properties.Shape__Area / 43560).toFixed(2) + ' acres' : 'N/A'}</p>
                    `;

                    popup.setLngLat(coordinates)
                        .setHTML(content)
                        .addTo(map6);
                }
            });

            // Change cursor on hover
            map6.on('mouseenter', 'census-tracts-fill', () => {
                map6.getCanvas().style.cursor = 'pointer';
            });

            map6.on('mouseleave', 'census-tracts-fill', () => {
                map6.getCanvas().style.cursor = '';
            });

            // Layer toggle functionality
            const toggleCheckbox = document.getElementById('layer-toggle-census');
            if (toggleCheckbox) {
                toggleCheckbox.addEventListener('change', (e) => {
                    const visibility = e.target.checked ? 'visible' : 'none';
                    map6.setLayoutProperty('census-tracts-fill', 'visibility', visibility);
                    map6.setLayoutProperty('census-tracts-outline', 'visibility', visibility);
                    console.log('Layer visibility:', visibility);
                });
            }
        })
        .catch(error => {
            console.error('Error fetching census tract data:', error);
        });
});

// Error handling
map6.on('error', (e) => {
    console.error('Map 6 error:', e);
});