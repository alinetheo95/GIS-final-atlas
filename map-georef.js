/// Initialize the map
const map = new maplibregl.Map({
    container: 'map',
    style: 'style.json',
    center: [-73.935242, 40.730610],
    zoom: 11
});

// Add navigation controls
map.addControl(new maplibregl.NavigationControl(), 'top-left');

// Wait for map to fully load
map.on('load', () => {
    console.log('Map loaded');
    
    // Add the NYC trees data source
    map.addSource('nyc-trees', {
        type: 'geojson',
        data: 'https://data.cityofnewyork.us/resource/uvpi-gqnh.geojson?$limit=50000'
    });
    
    console.log('Source added');

    // Add the circle layer - make sure it's on top
    map.addLayer({
        id: 'nyc-trees',
        type: 'circle',
        source: 'nyc-trees',
        paint: {
            'circle-color': '#77c049',
            'circle-radius': 5,  // Made slightly larger so it's easier to see
            'circle-stroke-width': 1,
            'circle-stroke-color': '#ffffff'
        }
    });
    
    console.log('Layer added');

    // Create popup instance
    const popup = new maplibregl.Popup({
        closeButton: true,
        closeOnClick: true
    });

    // Add click event listener
    map.on('click', 'nyc-trees', (e) => {
        console.log('Tree clicked');
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
    toggleCheckbox.addEventListener('change', (e) => {
        const visibility = e.target.checked ? 'visible' : 'none';
        map.setLayoutProperty('nyc-trees', 'visibility', visibility);
    });
});

// Monitor when data finishes loading
map.on('sourcedata', (e) => {
    if (e.sourceId === 'nyc-trees' && e.isSourceLoaded) {
        console.log('NYC trees data fully loaded');
    }
});

// Error handling
map.on('error', (e) => {
    console.error('Map error:', e);
});