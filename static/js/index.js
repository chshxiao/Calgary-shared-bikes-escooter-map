
document.addEventListener('DOMContentLoaded', function() {

    // constant
    let bird_full_charge_dist = 25;             // the maximum range coverage of bird scooter for a full charge
    let neuron_full_charge_dist = 60;           // the maximum range coverage of neuron scooter for a full charge


    // create the map
    let map = L.map('map', {zoomControl: false}).setView([51.02, -114.05], 11);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);


    // set the height of the map
    $(window).on("resize", function () {
        $("#map").height($(window).height());
        map.invalidateSize();
    }).trigger("resize");


    // set the zoom control on the left bottom corner
    new L.Control.Zoom({ position: 'bottomleft' }).addTo(map);
    new L.control.scale({ position: 'bottomright' }).addTo(map);


    // create a variable for marker cluster
    var markers = L.markerClusterGroup();


    // create a variable for polyline cluster
    var polylines = [];

    
    // marker for destination
    var dest_marker = [];


    // marker for my location
    var my_location_marker = [];


    // current location
    let latitude;
    let longitude;


    // bike location
    let bike_latitude;
    let bike_longitude;


    // destination location
    let dest_latitude;
    let dest_longitude;


    // create scooter icons
    var neuron_icon = L.icon({
        iconUrl: 'https://raw.githubusercontent.com/chshxiao/Calgary-shared-bikes-escooter-map/master/img/neuron_scooter2.png',
        iconSize: [40, 40],
        iconAnchor: [20, 20]
    })
    var bird_icon = L.icon({
        iconUrl: 'https://raw.githubusercontent.com/chshxiao/Calgary-shared-bikes-escooter-map/master/img/bird_scooter2.png',
        iconSize: [40, 40],
        iconAnchor: [20, 20]
    })


    // direction api token
    let direction_token = 'pk.eyJ1Ijoicm95eGlhbyIsImEiOiJjbHRoeXNmNnYwYWFzMmlvMXJ5bXRtaHZuIn0.7wuCPxXiZeN9KyF8oAKPFg';


    // geolocation handler
    let geolocation_id;


    // record the ride
    let record_flag = false;
    let start_lat = 0;
    let start_lon = 0;
    let start_time = 0;
    let end_lat = 0;
    let end_lon = 0;
    let end_time = 0;


    function main_function() {
        // get the current location
        if (!navigator.geolocation) {
            document.alert("Geolocation is not supported by your browser");
        } else {
            geolocation_id = navigator.geolocation.watchPosition(
                (position) => {
                    clear_my_location();

                    // get the current location
                    latitude = position.coords.latitude;
                    longitude = position.coords.longitude;


                    // set current location as the center of the map view
                    // if no destination or bike specified
                    if(dest_latitude == 0 || dest_latitude == undefined) {
                        if (bike_latitude == 0 || bike_latitude == undefined) {
                            map.setView([latitude, longitude], 14);
                        }
                    }


                    // marker for current location
                    var my_marker = L.circleMarker([latitude, longitude], {
                        radius: 5
                    }).addTo(map);
                    my_location_marker.push(my_marker);


                    // // route test'
                    // const test_body = { 'email': 'xhcs1998@gmail.com' };
                    // const test_header = {
                    //     'User-Agent': 'Bird/4.53.0 (co.bird.Ride; build:24; iOS 12.4.1) Alamofire/4.53.0',
                    //     'Device-Id': '54fdfdf5-21a7-49d2-9e91-e2a1954b638e',
                    //     'App-Version': '4.53.0',
                    //     'Content-Type': 'application/json',
                    //     'Access-Control-Allow-Origin': '*',
                    //     'Platform': 'ios',
                    // };
                    // fetch('https://api-auth.prod.birdapp.com/api/v1/auth/email', {
                    //     method: 'POST',
                    //     headers: test_header,
                    //     body: test_body,
                    //     mode: 'no-cors',
                    // })
                    // .then()
                    // console.log('after');


                    // bird data
                    let bird_url = 'https://raw.githubusercontent.com/chshxiao/Calgary-shared-bikes-escooter-map/master/bird_simulated_data.txt';
                    fetch(bird_url)
                        .then(response => response.json())
                        .then(data => {

                            let bird_data = data.data.bikes;
                            bird_data.forEach(dat => {
                                dat.company = 'Bird';
                            })

                            // neuron data
                            let neuron_url = 'https://mds-global-yyc.neuron-mobility.com/gbfs/2/en/free_bike_status';
                            fetch(neuron_url)
                                .then(response => response.json())
                                .then(data => {

                                    let neuron_data = data.data.bikes;
                                    neuron_data.forEach(dat => {
                                        dat.company = 'Neuron';
                                    })


                                    // get the overall data
                                    // overall data is used instead of neuron data or bird data
                                    let overall_data = bird_data.map((x) => x);
                                    overall_data.push.apply(overall_data, neuron_data);


                                    // function for navigate to the bike
                                    // create a pop up on the marker
                                    function navigate_to_bike(bike_id, company, bat_left) {

                                        // navigate to the bike
                                        let url = 'https://api.mapbox.com/directions/v5/mapbox/walking/' +
                                                    `${longitude},${latitude};` +
                                                    `${bike_longitude},${bike_latitude}` +
                                                    '?steps=true' +
                                                    `&access_token=${direction_token}`;
                                        
                                        fetch(url)
                                        .then(response => response.json())
                                        .then(data => {

                                            // if the destination is not specified, only navigate to the bike
                                            if (dest_latitude == 0 || dest_latitude == undefined) {

                                                // get distance and duration to the bike
                                                var bike_dist = (data['routes'][0]['distance'] / 1000).toPrecision(2);
                                                var bike_duration = (data['routes'][0]['duration'] / 60).toPrecision(2);

                                                var popup = L.popup()
                                                    .setLatLng([bike_latitude, bike_longitude])
                                                    .setContent(`bike id: ${bike_id}<br>` +
                                                        `Company: ${company}<br>` +
                                                        `Battery left: ${(bat_left * 100).toPrecision(2)}%<br>` +
                                                        `distance to bike: ${bike_dist}km<br>` +
                                                        `duration to bike: ${bike_duration}min`)
                                                    .addTo(map);


                                                // display the route to the bike
                                                var latlngs = [];
                                                var to_bike_steps = data['routes'][0]['legs'][0]['steps'];

                                                to_bike_steps.forEach(step => {
                                                    var lat = step['intersections'][0]['location'][1];
                                                    var lon = step['intersections'][0]['location'][0];

                                                    latlngs.push([lat, lon]);
                                                })

                                                var pline = L.polyline(latlngs, { dashArray: '5, 10' }).addTo(map);
                                                polylines.push(pline);


                                                // set the middle between bike and current location as center of the map
                                                map.setView([(latitude + bike_latitude)/2, (longitude + bike_longitude)/2], 14);
                                            }


                                            // if the destination is specified, navigate from the bike to the destination
                                            else {

                                                // get distance and duration to the bike
                                                var bike_dist = (data['routes'][0]['distance'] / 1000).toPrecision(2);
                                                var bike_duration = Number((data['routes'][0]['duration'] / 60).toPrecision(2));


                                                // get steps to the bike
                                                var latlngs = [];
                                                var to_bike_steps = data['routes'][0]['legs'][0]['steps'];

                                                to_bike_steps.forEach(step => {
                                                    var lat = step['intersections'][0]['location'][1];
                                                    var lon = step['intersections'][0]['location'][0];

                                                    latlngs.push([lat, lon]);
                                                })

                                                var bike_pline = L.polyline(latlngs, { dashArray: '5, 10' }).addTo(map);
                                                polylines.push(bike_pline);


                                                // get destination information
                                                let bike2dest_url = 'https://api.mapbox.com/directions/v5/mapbox/cycling/' +
                                                                    `${bike_longitude},${bike_latitude};` +
                                                                    `${dest_longitude},${dest_latitude}` +
                                                                    '?steps=true' +
                                                                    `&access_token=${direction_token}`;
                                                fetch(bike2dest_url)
                                                .then(response => response.json())
                                                .then(data => {

                                                    // get distance and duration to the destination
                                                    var dest_dist = (data['routes'][0]['distance'] / 1000).toPrecision(2);
                                                    var dest_duration = Number((data['routes'][0]['duration'] / 60).toPrecision(2));


                                                    // estimate the price for the trip
                                                    var price = Number((1.15 + 0.42 * dest_duration).toPrecision(2));
                                                    if (price < 2.5) {
                                                        price = 2.5;
                                                    }


                                                    // get steps from the bike to the destination
                                                    var latlngs = [];
                                                    var bike2dest_steps = data['routes'][0]['legs'][0]['steps'];

                                                    bike2dest_steps.forEach(step => {
                                                        var lat = step['intersections'][0]['location'][1];
                                                        var lon = step['intersections'][0]['location'][0];

                                                        latlngs.push([lat, lon]);
                                                    })

                                                    var dest_pline = L.polyline(latlngs).addTo(map);
                                                    polylines.push(dest_pline);


                                                    // set the middle between bike and current location as center of the map
                                                    map.setView([(latitude + dest_latitude)/2, (longitude + dest_longitude)/2], 14);


                                                    // create the popup
                                                    var popup = L.popup()
                                                        .setLatLng([bike_latitude, bike_longitude])
                                                        .setContent(`bike id: ${bike_id}<br>` +
                                                            `Company: ${company}<br>` +
                                                            `Battery left: ${(bat_left * 100).toPrecision(2)}%<br>` +
                                                            `distance to bike: ${bike_dist}km<br>` +
                                                            `duration to bike: ${bike_duration}min<br>` +
                                                            `distance to destination: ${dest_dist}km<br>` +
                                                            `duration to destination: ${dest_duration}min<br>` +
                                                            `total duration: ${bike_duration + dest_duration}min<br>` +
                                                            `estimated price: $${price}`
                                                        ).addTo(map);


                                                    // determine if the remaining battery is sufficient
                                                    if (company == 'Bird') {
                                                        if ((bat_left * bird_full_charge_dist) < dest_dist) {
                                                            document.getElementById('lowBatteryAlert').style.display = 'block';
                                                            setTimeout(() => {
                                                                document.getElementById('lowBatteryAlert').style.display = 'none';
                                                            }, 2000);
                                                        }
                                                    } else if (company == 'Neuron') {
                                                        if ((bat_left * neuron_full_charge_dist) < dest_dist) {
                                                            document.getElementById('lowBatteryAlert').style.display = 'block';
                                                            setTimeout(() => {
                                                                document.getElementById('lowBatteryAlert').style.display = 'none';
                                                            }, 2000);
                                                        }
                                                    }                                                   
                                                })

                                            }
                                        })
                                    }


                                    // function for adding elements to marker cluster layer and display them
                                    function create_marker_cluster(overall_data) {
                                        
                                        // remove the old cluster layer group
                                        map.removeLayer(markers);


                                        // create the new cluster layer group
                                        markers = L.markerClusterGroup();
                                        overall_data.forEach(dat => {

                                            if (dat['company'] == 'Neuron') {

                                                markers.addLayer(
                                                    L.marker([Number(dat['lat']), Number(dat['lon'])], { icon: neuron_icon })
                                                        .on('click', () => {

                                                            // remove old popup and polyline route
                                                            clear_popup_route();

                                                            bike_latitude = Number(dat['lat']);
                                                            bike_longitude = Number(dat['lon']);
                                                            let bike_id = dat['bike_id'];
                                                            let company = dat['company'];
                                                            let battery_pct = dat['battery_pct'];

                                                            navigate_to_bike(bike_id, company, battery_pct);
                                                        })

                                                );

                                            } else if (dat['company'] == 'Bird') {
                                                markers.addLayer(
                                                    L.marker([Number(dat['lat']), Number(dat['lon'])], { icon: bird_icon })
                                                        .on('click', () => {
                                                            
                                                            // remove old popup and polyline route
                                                            clear_popup_route();

                                                            bike_latitude = Number(dat['lat']);
                                                            bike_longitude = Number(dat['lon']);
                                                            let bike_id = dat['bike_id'];
                                                            let company = dat['company'];
                                                            let battery_pct = dat['battery_pct'];

                                                            navigate_to_bike(bike_id, company, battery_pct);
                                                        })
                                                )
                                            }
                                            map.addLayer(markers);
                                        })
                                    }


                                    // create markers cluster
                                    create_marker_cluster(overall_data);


                                    // filter to company
                                    document.querySelector('#submit').onclick = function () {
                                        let company = document.getElementsByName('company');
                                        let value;
                                        for (i = 0; i < company.length; ++i) {
                                            if (company[i].checked)
                                                value = company[i].value;
                                        }

                                        console.log(value);
                                        if (value == 'All') {
                                            overall_data = bird_data.map((x) => x);
                                            overall_data.push.apply(overall_data, neuron_data);
                                            create_marker_cluster(overall_data);

                                        } else if (value == 'Neuron') {
                                            console.log(neuron_data)
                                            overall_data = neuron_data.map((x) => x);
                                            create_marker_cluster(overall_data);

                                        } else if (value == 'Bird') {
                                            overall_data = bird_data.map((x) => x);
                                            create_marker_cluster(overall_data);

                                        } else {
                                            return;
                                        }
                                    }


                                    // navigate to the destination
                                    document.querySelector('#destinationSubmit').onclick = function () {

                                        // clean up the previous navigate route
                                        polylines.forEach((pline) => {
                                            map.removeLayer(pline);
                                        })


                                        // retrieve the destination from the input
                                        let destination_val = document.getElementById('destinationText').value;


                                        // get the destination in latlon
                                        let destination2latlngurl = 'https://api.mapbox.com/search/geocode/v6/forward' + 
                                                                    `?q=${destination_val}` +
                                                                    `&access_token=${direction_token}`;
                                        fetch(destination2latlngurl)
                                        .then(response => response.json())
                                        .then(data => {

                                            // get the first point coordiante
                                            dest_latitude = Number(data['features'][0]['geometry']['coordinates'][1]);
                                            dest_longitude = Number(data['features'][0]['geometry']['coordinates'][0]);


                                            // show the destination on the map
                                            let marker = L.marker([dest_latitude, dest_longitude]).addTo(map)
                                            dest_marker.push(marker);


                                            // get the route to the destination
                                            let destination_url = 'https://api.mapbox.com/directions/v5/mapbox/cycling/' +
                                                                    `${longitude},${latitude};` +
                                                                    `${dest_longitude},${dest_latitude}` +
                                                                    '?steps=true' +
                                                                    `&access_token=${direction_token}`;
                                            fetch(destination_url)
                                            .then(response => response.json())
                                            .then(data => {

                                                // display the route to the destination
                                                var latlngs = [];
                                                var to_dest_steps = data['routes'][0]['legs'][0]['steps'];

                                                to_dest_steps.forEach(step => {
                                                    var lat = step['intersections'][0]['location'][1];
                                                    var lon = step['intersections'][0]['location'][0];

                                                    latlngs.push([lat, lon]);
                                                })

                                                var pline = L.polyline(latlngs).addTo(map);
                                                polylines.push(pline);


                                                // set the middle of the destination and the current location as the center of the map
                                                map.setView([(latitude + dest_latitude)/2, (longitude + dest_longitude)/2], 14);
                                            })
                                        })
                                        
                                    }

                                });

                        })


                }, () => {
                    console.log("cannot retrieve the location");
                });
        }
    }
    main_function();


    // function to clear my location marker
    function clear_my_location() {
        if (my_location_marker.length > 0) {
            map.removeLayer(my_location_marker[0]);
            my_location_marker = [];
        }
    }

    // function to clear navigation
    function clear_navigation() {
        // clear navigation box
        document.getElementById('destinationText').value="";

        // clear destination coordinates
        dest_latitude = 0;
        dest_longitude = 0;


        // clear destination marker
        if (dest_marker.length > 0) {
            map.removeLayer(dest_marker[0]);
            dest_marker = [];
        }

        clear_popup_route();
    }


    // function to clear popup and route polylines
    function clear_popup_route() {
        map.closePopup();
        polylines.forEach((pline) => {
            map.removeLayer(pline);
        })
    }


    //function to clear filter
    function clear_filter() {

        // hide the filter panel
        document.getElementById('filterContainer').style.zIndex = -1;
        document.getElementById('filterButton').innerHTML = '>';


        // change the checked option back to all
        document.getElementById('allCompanies').checked = true;
    }


    // // record the ride
    // document.querySelector('#recordTripButton').onclick = function() {
        
    //     // toggle the record flag
    //     record_flag = !record_flag;
    //     console.log(record_flag);


    //     // It's recording the trip
    //     if (record_flag) {

    //         // change the button
    //         document.getElementById('recordTripButton').innerHTML = 'stop the record';

    //         // record the latitude longitude and the date
    //         start_lat = latitude;
    //         start_lon = longitude;
    //         start_time = dayjs();
    //     }
    //     // end the record
    //     else {

    //         // change the button
    //         document.getElementById('recordTripButton').innerHTML = 'Record the ride';


    //         // record the end latitude, longitude, and the time
    //         end_lat = latitude;
    //         end_lon = longitude;
    //         end_time = dayjs();


    //         // display the submit button
    //         document.getElementById('recordTripButton').style.display = 'none';


    //         // display the result
    //         // get destination information
    //         let trip_url = 'https://api.mapbox.com/directions/v5/mapbox/cycling/' +
    //                             `${start_lon},${start_lat};` +
    //                             `${end_lon},${end_lat}` +
    //                             `?access_token=${direction_token}`;
    //         fetch(trip_url)
    //         .then(response => response.json())
    //         .then(data => {
                
    //             let route_dist = (data['routes'][0]['distance'] / 1000).toPrecision(2);
    //             let route_duration = Number((data['routes'][0]['duration'] / 60).toPrecision(2));
    //             let duration = end_time.diff(start_time, 'minute');


    //             // display the result
    //             let result_box = document.getElementById('result');
    //             result_box.style.display = 'block';
    //             let result_text = '<p style="text-align: center; font-size: 17px; font-weight: bold">Ride Summary</p>' +
    //                                 `<p style="text-align: center; font-size: 15px;">start time: ${start_time.format('YYYY-MM-DD HH:MM:ss')}<br>` +
    //                                 `end time: ${end_time.format('YYYY-MM-DD HH:MM:ss')}<br>` +
    //                                 `duration: ${duration}min<br>` +
    //                                 `distance: ${route_dist}km</p>` +
    //                                 `<div style="text-align:center">` +
    //                                 `<form action="{{ url_for('templates', filename="error.html") }}" method="post">` + 
    //                                 `<input type="radio" id="commute" name="ride_type" value="commute">` +
    //                                 `<label for="commute">Commute</label>` +
    //                                 `<input type="radio" id="fun" name="ride_type" value="commute">` + 
    //                                 `<label for="fun">Relaxation</label><br>` +
    //                                 `<button>Ok</button>` +
    //                                 `</form>` + 
    //                                 '</div>';

    //             result_box.innerHTML = result_text;

    //         })
    //     }
    // }


    // refresh the page
    document.querySelector('#refreshButton').onclick = function () {

        markers.clearLayers();              // clear marker cluster group
        clear_popup_route();                // clear popup and route polylines
        clear_navigation();                 // clear navigation
        clear_filter();                     // clear filter
        clear_my_location();                // clear my location marker
        navigator.geolocation.clearWatch(id);

        main_function();
    }


    // exand the filter
    document.querySelector('#filterButton').onclick = function () {
        var z_index = document.getElementById('filterContainer').style.zIndex;
        if (z_index == 1) {
            document.getElementById('filterContainer').style.zIndex = -1;
            document.getElementById('filterButton').innerHTML = '>';
        } else {
            document.getElementById('filterContainer').style.zIndex = 1;
            document.getElementById('filterButton').innerHTML = '<';
        }
    }


    // clear the navigation page
    document.querySelector('#destinationClear').onclick = function () {
        clear_navigation();
    }
});

