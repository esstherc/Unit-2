/* Example from Leaflet GeoJSON Tutorial */

// Initialize a map object and center map with customized lat, long,zoom level
var map = L.map('map').setView([39.75, -104.99], 3);

// Add tile layer to map
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

// Define a GeoJSON point feature with properties and geometry
var geojsonFeature = {
    "type": "Feature",
    "properties": {
        "name": "Coors Field",
        "amenity": "Baseball Stadium",
        "popupContent": "This is where the Rockies play!"
    },
    "geometry": {
        "type": "Point",
        "coordinates": [-104.99404, 39.75621]
    }
};

// Create GeoJSON and add it to the map
//L.geoJSON(geojsonFeature).addTo(map);

// Create an empty GeoJSON layer and add it to the map
var myLayer = L.geoJSON().addTo(map);

//  Define an array of line strings as a GeoJSON LineString object
var myLines = [{
    "type": "LineString",
    "coordinates": [[-100, 40], [-105, 45], [-110, 55]]
}, {
    "type": "LineString",
    "coordinates": [[-105, 40], [-110, 45], [-115, 55]]
}];

// Define a style object,customize color, weight and opacity, for styling LineString
var myStyle = {
    "color": "#ff7800",
    "weight": 5,
    "opacity": 0.65
};

// Add the styled line strings as a GeoJSON layer to the map
L.geoJSON(myLines, {
    style: myStyle
}).addTo(map);

// Define an array of polygons as a GeoJSON Polygon object
var states = [{
    "type": "Feature",
    "properties": {"party": "Republican"},
    "geometry": {
        "type": "Polygon",
        "coordinates": [[
            [-104.05, 48.99],
            [-97.22,  48.98],
            [-96.58,  45.94],
            [-104.03, 45.94],
            [-104.05, 48.99]
        ]]
    }
}, {
    "type": "Feature",
    "properties": {"party": "Democrat"},
    "geometry": {
        "type": "Polygon",
        "coordinates": [[
            [-109.05, 41.00],
            [-102.06, 40.99],
            [-102.03, 36.99],
            [-109.04, 36.99],
            [-109.05, 41.00]
        ]]
    }
}];

// Add GeoJSON Polygon object to the map, with a style function that styles features based on their properties
L.geoJSON(states, {
    style: function(feature) {
        switch (feature.properties.party) {
            case 'Republican': return {color: "#ff0000"};
            case 'Democrat':   return {color: "#0000ff"};
        }
    }
}).addTo(map);

// Define a function that will be called on each feature before adding it to a GeoJSON layer
function onEachFeature(feature, layer) {
    // does this feature have a property named popupContent?
    if (feature.properties && feature.properties.popupContent) {
        layer.bindPopup(feature.properties.popupContent);
    }
}

// Add the GeoJSON feature to the map with the onEachFeature function applied to each feature
L.geoJSON(geojsonFeature, {
    onEachFeature: onEachFeature
}).addTo(map);