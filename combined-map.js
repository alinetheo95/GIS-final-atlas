// Combined map with all layers for scrollytelling

// Initialize the main map
const map = new maplibregl.Map({
    container: 'map',
    style: 'style.json',
    center: [-73.935242, 40.730610],
    zoom: 11
});

// Add navigation controls
map.addControl(new maplibregl.NavigationControl(), 'top-left');

// Make map globally accessible
window.sharedMap = map;

// Wait for map to fully load
map.on('load', async () => {
    console.log('Main map loaded, loading all layers...');
    
    try {
        // ====== LAYER 1: Census Tracts (Historical Grid / Population Density) ======
        console.log('Loading census tracts...');
        const censusResponse = await fetch('https://services5.arcgis.com/GfwWNkhOj9bNBqoJ/arcgis/rest/services/NYC_Census_Tracts_for_2020_US_Census/FeatureServer/0/query?where=1=1&outFields=*&outSR=4326&f=pgeojson');
        
        if (!censusResponse.ok) {
            throw new Error(`Census HTTP error! status: ${censusResponse.status}`);
        }
        
        const censusData = await censusResponse.json();
        console.log('✅ Census tract data loaded:', censusData.features.length, 'tracts');
        
        map.addSource('census-tracts', {
            type: 'geojson',
            data: censusData
        });
        
        map.addLayer({
            id: 'census-tracts-fill',
            type: 'fill',
            source: 'census-tracts',
            paint: {
                'fill-color': [
                    'interpolate',
                    ['linear'],
                    ['get', 'PopDen'],
                    0, '#ffffcc',
                    50, '#ffeda0',
                    100, '#fed976',
                    200, '#feb24c',
                    300, '#fd8d3c',
                    400, '#fc4e2a',
                    500, '#e31a1c',
                    600, '#bd0026',
                    700, '#800026'
                ],
                'fill-opacity': 0.7
            },
            layout: {
                'visibility': 'none' // Start hidden
            }
        });
        
        map.addLayer({
            id: 'census-tracts-outline',
            type: 'line',
            source: 'census-tracts',
            paint: {
                'line-color': '#ffffff',
                'line-width': 1
            },
            layout: {
                'visibility': 'none' // Start hidden
            }
        });
        
        // ====== LAYER 2: Impervious Surfaces (Building Tiles) ======
        console.log('Loading impervious surfaces...');
        
        map.addSource('building-tiles', {
            type: 'raster',
            tiles: ['Tiles/{z}/{x}/{y}.png'],
            tileSize: 256,
            minzoom: 12,
            maxzoom: 14
        });
        
        map.addLayer({
            id: 'building-tiles-layer',
            type: 'raster',
            source: 'building-tiles',
            paint: {
                'raster-opacity': 0.8
            },
            layout: {
                'visibility': 'none' // Start hidden
            }
        });
        
        console.log('✅ Impervious surfaces layer added');
        
        // ====== LAYER 3: Historical Ecology ======
        console.log('Loading historical ecology...');
        const ecologyResponse = await fetch('georef-export.geojson');
        const ecologyData = await ecologyResponse.json();
        console.log('✅ Historical ecology data loaded:', ecologyData.features.length, 'features');
        
        map.addSource('historical-ecology', {
            type: 'geojson',
            data: ecologyData
        });
        
        map.addLayer({
            id: 'historical-ecology-layer',
            type: 'fill',
            source: 'historical-ecology',
            paint: {
                'fill-color': '#77c049',
                'fill-opacity': 0.5
            },
            layout: {
                'visibility': 'none' // Start hidden
            }
        });
        
        // ====== LAYER 4: Streams ======
        console.log('Loading streams...');
        const streamsResponse = await fetch('streams-webmap.geojson');
        const streamsData = await streamsResponse.json();
        console.log('✅ Streams data loaded:', streamsData.features.length, 'features');
        
        map.addSource('streams', {
            type: 'geojson',
            data: streamsData
        });
        
        map.addLayer({
            id: 'streams-layer',
            type: 'line',
            source: 'streams',
            paint: {
                'line-color': '#25baed',
                'line-width': 2
            },
            layout: {
                'visibility': 'none' // Start hidden
            }
        });
        
        // ====== LAYER 5: Wetlands ======
        console.log('Loading wetlands...');
        const wetlandsResponse = await fetch('wetlands-webmap.geojson');
        const wetlandsData = await wetlandsResponse.json();
        console.log('✅ Wetlands data loaded:', wetlandsData.features.length, 'features');
        
        map.addSource('wetlands', {
            type: 'geojson',
            data: wetlandsData
        });
        
        map.addLayer({
            id: 'wetlands-layer',
            type: 'fill',
            source: 'wetlands',
            paint: {
                'fill-color': '#67c5ac',
                'fill-opacity': 0.6
            },
            layout: {
                'visibility': 'none' // Start hidden
            }
        });
        
        // ====== LAYER 6: Tree Coverage ======
        console.log('Loading tree coverage...');
        const treeResponse = await fetch('https://data.cityofnewyork.us/resource/hn5i-inap.json?$limit=500000');
        const treeData = await treeResponse.json();
        console.log('✅ Tree data loaded:', treeData.length, 'trees');
        
        // Convert to GeoJSON
        const treeFeatures = [];
        for (let i = 0; i < treeData.length; i++) {
            const item = treeData[i];
            if (item.location && item.location.coordinates) {
                treeFeatures.push({
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: item.location.coordinates
                    },
                    properties: {
                        objectid: item.objectid,
                        dbh: item.dbh,
                        genusspecies: item.genusspecies,
                        tpcondition: item.tpcondition,
                        tpstructure: item.tpstructure
                    }
                });
            }
        }
        
        const treeGeoJSON = {
            type: 'FeatureCollection',
            features: treeFeatures
        };
        
        map.addSource('trees', {
            type: 'geojson',
            data: treeGeoJSON
        });
        
        map.addLayer({
            id: 'trees-layer',
            type: 'circle',
            source: 'trees',
            paint: {
                'circle-color': '#77c049',
                'circle-radius': 2,
                'circle-opacity': 0.8
            },
            layout: {
                'visibility': 'none' // Start hidden
            }
        });
        
        console.log('✅ All layers loaded successfully!');
        
        // ====== INTERACTIONS ======
        
        // Popup for census tracts
        const censusPopup = new maplibregl.Popup({
            closeButton: true,
            closeOnClick: true
        });
        
        map.on('click', 'census-tracts-fill', (e) => {
            if (e.features.length > 0) {
                const properties = e.features[0].properties;
                const content = `
                    <h5>Census Tract Info</h5>
                    <p><strong>Tract:</strong> ${properties.BoroCT2020 || properties.CT2020 || 'N/A'}</p>
                    <p><strong>Borough:</strong> ${properties.BoroName || 'N/A'}</p>
                    <p><strong>Population:</strong> ${properties.Pop_2020 ? properties.Pop_2020.toLocaleString() : 'N/A'}</p>
                    <p><strong>Population Density:</strong> ${properties.PopDen ? properties.PopDen.toFixed(2) + ' per sq mi' : 'N/A'}</p>
                `;
                censusPopup.setLngLat(e.lngLat).setHTML(content).addTo(map);
            }
        });
        
        // Popup for trees
        const treePopup = new maplibregl.Popup({
            closeButton: true,
            closeOnClick: true
        });
        
        map.on('click', 'trees-layer', (e) => {
            if (e.features.length > 0) {
                const properties = e.features[0].properties;
                const content = `
                    <h5>Tree Info</h5>
                    <p><strong>Species:</strong> ${properties.genusspecies || 'N/A'}</p>
                    <p><strong>Diameter:</strong> ${properties.dbh || 'N/A'}</p>
                    <p><strong>Condition:</strong> ${properties.tpcondition || 'N/A'}</p>
                `;
                treePopup.setLngLat(e.features[0].geometry.coordinates.slice()).setHTML(content).addTo(map);
            }
        });
        
        // Popup for historical ecology
        const ecologyPopup = new maplibregl.Popup({
            closeButton: true,
            closeOnClick: true
        });
        
        map.on('click', 'historical-ecology-layer', (e) => {
            if (e.features.length > 0) {
                const properties = e.features[0].properties;
                let content = '<h5>Historical Ecology</h5>';
                for (let key in properties) {
                    content += `<p><strong>${key}:</strong> ${properties[key]}</p>`;
                }
                ecologyPopup.setLngLat(e.lngLat).setHTML(content).addTo(map);
            }
        });
        
        // Popup for streams
        const streamsPopup = new maplibregl.Popup({
            closeButton: true,
            closeOnClick: true
        });
        
        map.on('click', 'streams-layer', (e) => {
            if (e.features.length > 0) {
                const properties = e.features[0].properties;
                let content = '<h5>Stream Info</h5>';
                for (let key in properties) {
                    content += `<p><strong>${key}:</strong> ${properties[key]}</p>`;
                }
                streamsPopup.setLngLat(e.lngLat).setHTML(content).addTo(map);
            }
        });
        
        // Popup for wetlands
        const wetlandsPopup = new maplibregl.Popup({
            closeButton: true,
            closeOnClick: true
        });
        
        map.on('click', 'wetlands-layer', (e) => {
            if (e.features.length > 0) {
                const properties = e.features[0].properties;
                let content = '<h5>Wetland Info</h5>';
                for (let key in properties) {
                    content += `<p><strong>${key}:</strong> ${properties[key]}</p>`;
                }
                wetlandsPopup.setLngLat(e.lngLat).setHTML(content).addTo(map);
            }
        });
        
        // Cursor changes on hover
        ['census-tracts-fill', 'trees-layer', 'historical-ecology-layer', 'streams-layer', 'wetlands-layer'].forEach(layerId => {
            map.on('mouseenter', layerId, () => {
                map.getCanvas().style.cursor = 'pointer';
            });
            map.on('mouseleave', layerId, () => {
                map.getCanvas().style.cursor = '';
            });
        });
        
    } catch (error) {
        console.error('❌ Error loading layers:', error);
    }
});

// Error handling
map.on('error', (e) => {
    console.error('Map error:', e);
});