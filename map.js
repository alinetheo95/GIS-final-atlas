// Replace 'YOUR_MAPTILER_API_KEY' with your actual MapTiler API key
        const MAPTILER_API_KEY = 'NwvfiqzdTb7DasmC6kf0';
        
// Initialize the map
const map = new maplibregl.Map({
    container: 'map',
    style: 'style.json',
    center: [-73.935242, 40.730610], // NYC coordinates
    zoom: 11
});

// Add navigation controls
map.addControl(new maplibregl.NavigationControl(), 'top-left');

// Wait for map to load
map.on('load', () => {
    // Add the NYC trees data source
    map.addSource('nyc-trees', {
        type: 'geojson',
        data: 'https://data.cityofnewyork.us/resource/uvpi-gqnh.geojson?$limit=50000'
    });

    // Add the circle layer
    map.addLayer({
        id: 'nyc-trees',
        type: 'circle',
        source: 'nyc-trees',
        paint: {
            'circle-color': '#77c049',
            'circle-radius': 3
        }
    });

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

            // Build popup content
            const content = `
                <h5>Street Tree Info</h5>
                <p>Species: ${properties.spc_common || 'Unknown'}</p>
                <p>Status: ${properties.status || 'N/A'}</p>
                <p>Health: ${properties.health || 'N/A'}</p>
                <p>Diameter: ${properties.tree_dbh || 'N/A'}</p>
            `;

            // Ensure that if the map is zoomed out such that multiple
            // copies of the feature are visible, the popup appears
            // over the copy being pointed to.
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