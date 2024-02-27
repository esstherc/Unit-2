/* Map of GeoJSON data from airport-traffic.geojson */

//declare variable 
var map;

//Step 1. Create the Leaflet map
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

function calcMinValue(data){
    //create empty array to store all data values
    var allValues = [];
    //loop through each city
    for(var airport of data.features){
        //loop through each year
        for(var year = 2011; year <= 2022; year+=1){
              //get traffic for current year
              var value = airport.properties[String(year)];
              //add value to array
              allValues.push(value);
        }
    }
    //get minimum value of our array
    var minValue = Math.min(...allValues)

    return minValue;
}

//calculate the radius of each proportional symbol
function calcPropRadius(attValue) {
    //constant factor adjusts symbol sizes evenly
    var minRadius = 3.5;
    //Flannery Appearance Compensation formula
    var radius = 1.0083 * Math.pow(attValue/minValue,0.5715) * minRadius

    return radius;
};

/* function onEachFeature(feature, layer) {
    //no property named popupContent; instead, create html string with all properties
    var popupContent = "";
    if (feature.properties) {
        //loop to add feature property names and values to html string
        for (var property in feature.properties){
            popupContent += "<p>" + property + ": " + feature.properties[property] + "</p>";
        }
        layer.bindPopup(popupContent);
    };
}; */ 

//function to convert markers to circle markers
function pointToLayer(feature, latlng){
    //Determine which attribute to visualize with proportional symbols
    var attribute = "2022";

    //create marker options
    var options = {
        fillColor: "#1e2f97",
        color: "#fff",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8,
        radius: 8
    };

    //For each feature, determine its value for the selected attribute
    var attValue = Number(feature.properties[attribute]);

    //Give each feature's circle marker a radius based on its attribute value
    options.radius = calcPropRadius(attValue);

    //create circle marker layer
    var layer = L.circleMarker(latlng, options);

    //build popup content string
    var popupContent = "<p><b>Airport:</b> " + feature.properties.Airport  + " (" + feature.properties.Code + ")"
                     + "<p><b>City:</b> " + feature.properties.Location + ", " + feature.properties.Country
                     + "</p><p><b>" + attribute + " Passenger Flow" + ":</b> " + feature.properties[attribute] 
                     + "</p>";

    //bind the popup to the circle marker
    layer.bindPopup(popupContent,{
        offset: new L.Point( 0,- 0.6* options.radius)
    });
    //return the circle marker to the L.geoJson pointToLayer option
    return layer;
};


//Step 3: Add circle markers for point features to the map
function createPropSymbols(data){
    //Create a Leaflet GeoJSON layer and add it to the map
    L.geoJson(data,{
        pointToLayer: pointToLayer
        }).addTo(map);
}

//Step2: Import GeoJSON data
function getData(){
    //load the data
    fetch("data/airport-traffic.geojson")
        .then(function(response){
            return response.json();
        })
        //Step 3. Add markers for point features to the map
        .then(function(json){
            //calculate minimum data value
            minValue = calcMinValue(json);
            // Call function to create proportional symbols
            createPropSymbols(json);
        })
};

document.addEventListener('DOMContentLoaded',createMap);


    /*var airplaneIcon = L.icon({
        iconUrl: 'img/airplane.svg', 
        iconSize: [38, 38], 
        iconAnchor: [19, 19], 
        popupAnchor: [0, -19] 
    });
      I used customized svg icon in my previous assignment.
      However, I found out that The L.icon object in Leaflet 
      does not have a radius property that could adjust like 
      one would with a L.circleMarker. so I comment out the previous
      icon and replace with circle
    */