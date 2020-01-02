// create our base map
var mapboxAccessToken = API_KEY;
var map = L.map('map').setView([37.8, -96], 5);

// add light tile layer
L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=' + mapboxAccessToken, {
    id: 'mapbox/light-v9',
    attribution: "UNC Bootcamp"
}).addTo(map);

//  add states data to the map
L.geoJson(statesData).addTo(map);

//  assign our data route to a variable
var data_url = "/api/energy_comparison";

// grab the data with d3
d3.json(data_url, function(data){

    // loop through our data and join with states data
    for(var i = 0; i < data.state.length; i++) {
        for(var j = 0; j < data.state.length; j++) {
            if(data.state[i] === statesData.features[j].properties.name) {
                statesData.features[j].properties.energy_difference = data.energy_difference[i];
                statesData.features[j].properties.renewable_total = data.renewable_total[i];
                statesData.features[j].properties.rank = data.rank[i];
                statesData.features[j].properties.total_energy_consumed_gwh = data.total_energy_consumed_gwh[i];
            }
        }
    };

    // grab energy difference min and max values to create the color scale
    var min = Math.min.apply(null, data.energy_difference);
    var max = Math.max.apply(null, data.energy_difference);

    // console.log('min, max:', min, max);

    // create function that assign colors
    function getColor(d) {
        return d < 0  ? "#f7fcf5":
               d < 1000000 ? "#e5f5e0":
               d < 5000000 ? "#c7e9c0":
               d < 10000000 ? "#a1d99b":
               d < 20000000 ? "#74c476":
               d < 40000000 ? "#41ab5d":
               d < 50000000 ? "#238b45":
                              "#005a32"                                   
    }

    // create style function 
    function style(feature) {
        return {
            fillColor: getColor(feature.properties.energy_difference),
            weight: 2,
            opacity: 0.8,
            color: 'gray',
            fillOpacity: 0.6
        };
    }
    
    //  add styles to our map
    L.geoJson(statesData, { style: style }).addTo(map);

    //  add the legend to the map
    var legend = L.control({position: 'bottomright'});

    legend.onAdd = function (map) {
        // create a div for the legend
        var div = L.DomUtil.create('div', 'info legend'),
            grades = [0, 1000000, 5000000, 10000000, 20000000, 40000000, 50000000]
            labels = [];

        // loop through our density intervals and generate a label with a colored square for each interval
        for (var i = 0; i < grades.length; i++) {
            div.innerHTML +=
                '<i style="background:' + getColor(grades[i] + 1) + '"></i> ' +
                grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
        }

        return div;
    };
    legend.addTo(map);
    
    // add mouseover event for each feature to style and show popup
    function onEachFeature(feature, layer) {
        layer.on('mouseover', function(e) {
            layer.setStyle({
                weight: 5,
                color: '#666',
                dashArray: '',
                fillOpacity: 1
            });
        
            if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
                this.bringToFront();
            }
            layer.openPopup();
        }).on('mouseout', function(e) {
            geojson.resetStyle(e.target);
            layer.closePopup();
        });
        
        // create the popup variable
        var popupHtml = "<h5>" + (feature.properties.name) + "</h5>" + 
        "<p><strong>Renewable Energy: </strong>" + feature.properties.renewable_total + "</p>" + 
        "<p><strong>Total Consumed Energy: </strong>" + (feature.properties.total_energy_consumed_gwh) + "</p>" + 
        "<p><strong>Consumed Energy Rank: </strong>" + (feature.properties.rank) + "</p>";

        // add the popup to the map and set location
        layer.bindPopup(popupHtml, { className: 'popup', 'offset': L.point(0, -20) });
    }

    //  add the style and onEachFeature function to the map
    geojson = L.geoJson(statesData, {
        style: style,
        onEachFeature: onEachFeature
    }).addTo(map);

});
