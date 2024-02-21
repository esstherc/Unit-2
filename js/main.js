/* Map of GeoJSON data from airport-traffic.geojson */
//declare map var in global scope
var map;
//function to instantiate the Leaflet map
function createMap(){
    //create the map
    map = L.map('map', {
        center: [20, 0],
        zoom: 2.5
    });

    var Stadia_AlidadeSmooth = L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.{ext}', {
        minZoom: 0,
        maxZoom: 20,
        attribution: '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        ext: 'png'
    }).addTo(map);

    //call getData function
    getData();
};

function onEachFeature(feature, layer) {
    //no property named popupContent; instead, create html string with all properties
    var popupContent = "";
    if (feature.properties) {
        //loop to add feature property names and values to html string
        for (var property in feature.properties){
            popupContent += "<p>" + property + ": " + feature.properties[property] + "</p>";
        }
        layer.bindPopup(popupContent);
    };
};


//function to retrieve the data and place it on the map
function getData(){
    //load the data
    fetch("data/airport-traffic.geojson")
        .then(function(response){
            return response.json();
        })
        .then(function(json){
            var airplaneIcon = L.icon({
                iconUrl: 'img/airplane.svg', 
                iconSize: [38, 38], 
                iconAnchor: [19, 19], 
                popupAnchor: [0, -19] 
            });

            //create a Leaflet GeoJSON layer and add it to the map with custom icons
            L.geoJson(json, {
                onEachFeature: onEachFeature,
                pointToLayer: function (feature, latlng){
                    return L.marker(latlng, {icon: airplaneIcon});
                }
            }).addTo(map);
        })
};

document.addEventListener('DOMContentLoaded',createMap)