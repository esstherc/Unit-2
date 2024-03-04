/* Map of GeoJSON data from airport-traffic.geojson */

//declare variable 
var map;
var attributes = [];
var index= 0; 
var dataStats = {}; 

//Step 1. Create the Leaflet map
function createMap(){
    //create the map
    map = L.map('map', {
        center: [31.7917, -7.0926],
        zoom: 2
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

//Step2. Creating a variable to hold the attributes array in main.js
function getData(map){
    //load the data
    fetch("data/airport-traffic.geojson")
        .then(response => response.json())
        .then(json => {
            attributes = processData(json); //create an attributes array
            minValue = calcStats(json);
            createPropSymbols(json, attributes);
            createSequenceControls(attributes);
            createLegend(attributes);
            createTitle(attributes);
        })
};

function calcStats(data){
    var allValues = [];     //create empty array to store all data values
    for(var airport of data.features){  //loop through each city
        for(var year = 2011; year <= 2022; year+=1){    //loop through each year
              var value = airport.properties[String(year)];   //get traffic for current year
              allValues.push(value);  //add value to array
        }
    }
    //get min, max, mean stats for our array
    dataStats.min = Math.min(...allValues);
    dataStats.max = Math.max(...allValues);
    //calculate meanValue
    var sum = allValues.reduce(function(a, b){return a+b;});
    dataStats.mean = sum/ allValues.length;
}

//calculate the radius of each proportional symbol
function calcPropRadius(attValue) {
    //constant factor adjusts symbol sizes evenly
    var minRadius = 4;
    //Flannery Appearance Compensation formula
    var radius = 1.0083 * Math.pow(attValue/dataStats['min'],0.5715) * minRadius
    return radius;
};

function createPopupContent(properties, attribute){
    var valueInMillions = (properties[attribute] / 1000000).toFixed(2);
    var popupContent = 
    "<p><b>Airport:</b> " + properties.Airport  + " (" + properties.Code + ")"
  + "<p><b>City:</b> " + properties.Location + ", " + properties.Country
  + "<p><b>Passenger Flow in " + attribute + ":</b> " + valueInMillions + " Million";

    return popupContent;
};

//function to convert markers to circle markers
function pointToLayer(feature, latlng, attributes){
    var attribute = attributes[0]; //Determine which attribute to visualize with proportional symbols
    
    //check  console.log(attribute);

    var options = { //create marker options
        fillColor: "#1e2f97",
        color: "#ffffff",
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

    //build popup content string - Initializing
    var popupContent = createPopupContent(feature.properties, attribute);

    //bind the popup to the circle marker
    layer.bindPopup(popupContent,{
        offset: new L.Point( 0,- 0.6* options.radius)
    });
    //return the circle marker to the L.geoJson pointToLayer option

    return layer;
};


//Step 3: Add circle markers for point features to the map
function createPropSymbols(data,attributes){
    //Create a Leaflet GeoJSON layer and add it to the map
    L.geoJson(data,{
        pointToLayer: function(feature, latlng){
            return pointToLayer(feature, latlng, attributes);
        }
        }).addTo(map);
};

document.addEventListener('DOMContentLoaded',createMap);


// Create new sequence controls
function createSequenceControls(attributes) {
    var SequenceControl = L.Control.extend({
        options: {
            position: 'bottomleft' // Specifies the position of the control on the map
        },

        onAdd: function() {
            // Create the control container with a particular class name
            var container = L.DomUtil.create('div', 'sequence-control-container');

            // Create range input element (slider) and append it to the container
            var slider = '<input class="range-slider" type="range" min="0" max="11" value="0" step="1"></input>';
            container.insertAdjacentHTML('beforeend', slider);

            // Create buttons and append them to the container
            var buttons = '<button class="step" id="reverse"><img src="img/backward.svg"></button>' +
                          '<button class="step" id="forward"><img src="img/forward.svg"></button>';
            container.insertAdjacentHTML('beforeend', buttons);

            // Set up event listeners for the slider and buttons
            this.setupListeners(container);

            // Disable any mouse event listeners for the container
            L.DomEvent.disableClickPropagation(container);

            return container;
        },

        setupListeners: function(container) {
            // Listener for the slider
            var slider = container.querySelector('.range-slider');
            slider.addEventListener('input', function() {
                index = this.value;
                updatePropSymbols(attributes[index]);
            });

            // Listeners for the buttons
            container.querySelectorAll('.step').forEach(function(step) {
                step.addEventListener('click', function() {
                    if (this.id == 'forward') {
                        index++;
                        index = index > 11 ? 0 : index;
                    } else if (this.id == 'reverse') {
                        index--;
                        index = index < 0 ? 11 : index;
                    }
                    slider.value = index;
                    updatePropSymbols(attributes[index]);
                });
            });
        }
    });

    // Add the new SequenceControl to the map
    map.addControl(new SequenceControl());
}

    
//Step 10: Resize proportional symbols according to new attribute values
function updatePropSymbols(attribute){
    map.eachLayer(function(layer){
        if (layer.feature && layer.feature.properties[attribute]){
            
            var props = layer.feature.properties; //access feature properties
            var radius = calcPropRadius(props[attribute]); //update each feature's radius based on new attribute values
            layer.setRadius(radius);

            var popupContent = createPopupContent(props, attribute);    
            document.getElementById('legend-year').textContent = attribute;
            layer.getPopup().setContent(popupContent).update(); //update popup with new content 
        };
    });
};        

//Step 3: build an attributes array from the data
function processData(data) {
    // Empty array to hold attributes
    // console.log(data.features[0].properties); 
    var attributes = [];

    // Properties of the first feature in the dataset
    var properties = data.features[0].properties;
    // console.log(properties)
    // Loop through each attribute in properties
    for (var attribute in properties) {
        
        // Check if the attribute is a valid year within the desired range
        if (parseInt(attribute) && parseInt(attribute) >= 2011 && parseInt(attribute) <= 2022) {
            attributes.push(attribute);
        }
    }

    // Sort the attributes array by year to ensure the sequence is chronological
    attributes.sort((a, b) => parseInt(a) - parseInt(b));

    return attributes;
}


function createLegend(attributes) {
    var LegendControl = L.Control.extend({
        options: {
            position: 'bottomright'
        },

        onAdd: function() {
            var container = L.DomUtil.create('div', 'legend-control-container');
            //Dynamically set the initial attribute year in the legend
            container.innerHTML = `<p class="legend-header">Passenger Flow in <span id="legend-year">${attributes[0]}</span></p>`;
            L.DomEvent.disableClickPropagation(container);

            //Step 1: start attribute legend svg string
            var svg = '<svg id="attribute-legend" width="160px" height="60px">';

            //Array of circle names to base loop on
            var circles = ["max","mean","min"];

            //Step 2: loop to add each circle and text to svg string
            for (var i=0; i<circles.length; i++){

                //Step 3: assign the r and cy attributes  
                var radius = calcPropRadius(dataStats[circles[i]]);  
                var cy = 59 - radius; 

                //circle string
                svg += '<circle class="legend-circle" id="' + circles[i] + '" r="' + radius + '"cy="' + cy + 
                '" fill="#1e2f97" fill-opacity="0.8" stroke="#ffffff" cx="30"/>';  

                //evenly space out labels            
                var textY = i * 20 + 20;            
                var valueInMillions = (dataStats[circles[i]] / 1000000).toFixed(2);
                //text string            
                svg += '<text id="' + circles[i] + '-text" x="65" y="' + textY + '">' + valueInMillions + " million" + '</text>';
            };
                
            //close svg string
            svg += "</svg>";

            //add attribute legend svg to container
            container.insertAdjacentHTML('beforeend',svg);
            L.DomEvent.disableClickPropagation(container); 

            return container;
            
        }
    });

    // Correctly instantiate and add the control to the map
    map.addControl(new LegendControl());
}

function createTitle(attributes){
    var InfoControl = L.Control.extend({
        options: {
            position: 'topright'
        },
    
        onAdd: function () {
            var container = L.DomUtil.create('div', 'info-box');
            container.innerHTML = `
                <h1>Tracking Passenger Flow at the World's 10 Busiest International Airports</h1>
                <p>This dataset offers a comprehensive overview of passenger flow through the world’s ten busiest international airports from 2011 to 2020. It captures the annual passenger numbers to observe trends, growth patterns, and fluctuations over a decade. Particularly noteworthy is the dataset's illumination of the dramatic impacts of global events, most significantly the COVID-19 pandemic, on international air travel.</p>
            `;
            L.DomEvent.disableClickPropagation(container); 
            return container;
        }
    });
    map.addControl(new InfoControl());

}

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