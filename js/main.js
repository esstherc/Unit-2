/* Map of GeoJSON data from airport-traffic.geojson */

//declare variable 
var map;
var index= 0; 

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
    var minRadius = 4;
    //Flannery Appearance Compensation formula
    var radius = 1.0083 * Math.pow(attValue/minValue,0.5715) * minRadius

    return radius;
};


//function to convert markers to circle markers
function pointToLayer(feature, latlng, attributes){
    //Determine which attribute to visualize with proportional symbols
    var attribute = attributes[0];
    
    //check
    //console.log(attribute);

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

    //build popup content string - Initializing
    var popupContent = "<p><b>Airport:</b> " + feature.properties.Airport  + " (" + feature.properties.Code + ")"
                     + "<p><b>City:</b> " + feature.properties.Location + ", " + feature.properties.Country
                     + "<p><b>Passenger Flow in " + attribute + ":</b> " + feature.properties[attribute] ;
                     + "</p>";

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
}

//Step2: Import GeoJSON data
function getData(){
    //load the data
    fetch("data/airport-traffic.geojson")
        .then(function(response){
            return response.json();
        })
        //Step 3. Add markers for point features to the map
        .then(function(json){ //加工 在then里处理 额外数据 json() to (json)
            attributes = processData(json);
            //calculate minimum data value
            minValue = calcMinValue(json);
            // Call function to create proportional symbols
            createPropSymbols(json);
            createSequenceControls(attributes); 
        })
};

document.addEventListener('DOMContentLoaded',createMap);

//GOAL: Allow the user to sequence through the attributes and resymbolize the map 
//Step 1: Create new sequence controls
function createSequenceControls(attributes){
    //create range input element (slider)
    var slider = "<input class='range-slider' type='range'></input>";
    document.querySelector("#panel").insertAdjacentHTML('beforeend',slider);

    //set slider attributes
    document.querySelector(".range-slider").max = 11;
    document.querySelector(".range-slider").min = 0;
    document.querySelector(".range-slider").value = 0;
    document.querySelector(".range-slider").step = 1;

    document.querySelector('#panel').insertAdjacentHTML('beforeend','<button class="step" id="reverse"></button>');
    document.querySelector('#panel').insertAdjacentHTML('beforeend','<button class="step" id="forward"></button>');

    //replace button content with images
    document.querySelector('#reverse').insertAdjacentHTML('beforeend',"<img src='img/backward.svg'>");
    document.querySelector('#forward').insertAdjacentHTML('beforeend',"<img src='img/forward.svg'>");

    //Step 5: click listener for buttons
    document.querySelectorAll('.step').forEach(function(step){
        step.addEventListener("click", function(){
            //Step 6: increment or decrement depending on button clicked
            if (step.id == 'forward'){
                index++;
                //Step 7: if past the last attribute, wrap around to first attribute
                index = index > 11 ? 0 : index;
            } else if (step.id == 'reverse'){
                index--;
                //Step 7: if past the first attribute, wrap around to last attribute
                index = index < 0 ? 11 : index;
            };

            //Step 8: update slider
            document.querySelector('.range-slider').value = index;
            console.log(attributes);
            console.log(attributes[index]);
            updatePropSymbols(attributes[index]);
        })
    })
    
//Step 10: Resize proportional symbols according to new attribute values
function updatePropSymbols(attribute){
    map.eachLayer(function(layer){
        if (layer.feature && layer.feature.properties[attribute]){
            //access feature properties
            var props = layer.feature.properties;
            var feature = layer.feature
            //update each feature's radius based on new attribute values
            var radius = calcPropRadius(props[attribute]);
            layer.setRadius(radius);

            var popupContent = 
                       "<p><b>Airport:</b> " + feature.properties.Airport  + " (" + feature.properties.Code + ")"
                     + "<p><b>City:</b> " + feature.properties.Location + ", " + feature.properties.Country
                     + "<p><b>Passenger Flow in " + attribute + ":</b> " + props[attribute];

            //update popup content            
            popup = layer.getPopup();            
            popup.setContent(popupContent).update();
        };
    });
};        

    //Step 5: input listener for slider
    document.querySelector('.range-slider').addEventListener('input', function(){            
        //Step 6: get the new index value
        var index = this.value;
        console.log(index)
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

// Creating a variable to hold the attributes array in main.js
function getData(map){
    //load the data
    fetch("data/airport-traffic.geojson")
        .then(function(response){
            return response.json();
        })
        .then(function(json){
             //create an attributes array
            var attributes = processData(json);
            // console.log(attributes); 
            minValue = calcMinValue(json);
            createPropSymbols(json, attributes);
            createSequenceControls(attributes);
        })
};


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