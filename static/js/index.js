
document.addEventListener('DOMContentLoaded', function() {

    // create the map
    let map = L.map('map').setView([51.02, -114.05], 11);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);


    // set the height of the map
    $(window).on("resize", function () {
        $("#map").height($(window).height());
        map.invalidateSize();
    }).trigger("resize");


    // create a variable for marker cluster
    var markers = L.markerClusterGroup();

    
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
    let direction_token = 'AIzaSyCOX16JTdJvX_pLnOdPS35L5FpqrM2W24Q';


    function main_function() {
        // get the current location
        if (!navigator.geolocation) {
            document.alert("Geolocation is not supported by your browser");
        } else {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    // get the current location
                    const latitude = position.coords.latitude;
                    const longitude = position.coords.longitude;


                    map.setView([latitude, longitude], 14);


                    // marker for current location
                    var my_loc_marker = L.circle([latitude, longitude], {
                        radius: 100
                    }).addTo(map);


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

                                    // function for running direction api
                                    function navigate_button(from_lat, from_lon, to_lat, to_lon) {
                                        console.log(from_lat);
                                        let url = 'https://maps.googleapis.com/maps/api/directions/json' +
                                                    `?destination=${to_lat},${to_lon}` +
                                                    `&origin=${from_lat},${from_lon}` + 
                                                    `&key=${direction_token}`;
                                        console.log(url);
                                        fetch(url, {
                                            headers: {
                                                'Content-Type': 'application/json',
                                            },
                                            mode:'no-cors'
                                        })
                                        .then(response => response.json())
                                        .then(data => {console.log(data);})
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
                                                        .bindPopup(() => {
                                                            const div = document.createElement("div");
                                                            div.innerHTML = `bike id: ${dat['bike_id']}<br>` +
                                                                            `Company: ${dat['company']}<br>` +
                                                                            `Battery left: ${dat['battery_pct'] * 100}%<br>`;

                                                            const button = document.createElement("button");
                                                            button.innerHTML = "Navigate";
                                                            button.onclick = navigate_button(latitude, longitude,
                                                                                            dat['lat'], dat['lon']);
                                                            div.appendChild(button);
                                                            return div;
                                                            // return `bike id: ${dat['bike_id']}<br>` +
                                                            //     `Company: ${dat['company']}<br>` +
                                                            //     `Battery left: ${dat['battery_pct'] * 100}%`;
                                                        })
                                                )
                                            } else if (dat['company'] == 'Bird') {
                                                markers.addLayer(
                                                    L.marker([Number(dat['lat']), Number(dat['lon'])], { icon: bird_icon })
                                                        .bindPopup(() => {
                                                            return `bike id: ${dat['bike_id']}<br>` +
                                                                `Company: ${dat['company']}<br>` +
                                                                `Battery left: ${dat['battery_pct'] * 100}%`;
                                                        })
                                                )
                                            }
                                            map.addLayer(markers);
                                        })
                                    }


                                    let neuron_data = data.data.bikes;
                                    neuron_data.forEach(dat => {
                                        dat.company = 'Neuron';
                                    })

                                    let overall_data = bird_data.map((x) => x);
                                    overall_data.push.apply(overall_data, neuron_data);

                                    create_marker_cluster(overall_data);


                                    // filter
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

                                });

                        })


                }, () => {
                    console.log("cannot retrieve the location");
                });
        }
    }
    main_function();


    // refresh the page
    document.querySelector('#refreshButton').onclick = function () {
        markers.clearLayers();
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




    

});






//  // create the map
//  let map = L.map('map').setView([51.02, -114.05], 11);
//  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
//    maxZoom: 19,
//    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
//  }).addTo(map);
//
//
//  // set the height of the map
//  $(window).on("resize", function() {
//    $("#map").height($(window).height());
//    map.invalidateSize();
//  }).trigger("resize");
//
//
//  // create a variable for marker cluster
//  var markers = L.markerClusterGroup();
//
//
//  // date range picker
//  // $(function() {
//  //   $('input[name="daterange"]').daterangepicker({
//  //     opens: 'left'
//  //   }, function(start, end, label) {
//  //     console.log("A new date selection was made: " + start.format('YYYY-MM-DD') + ' to ' + end.format('YYYY-MM-DD'));
//  //     console.log(start);
//  //   });
//  // });
//
//
//  // get the earliest date
//  fetch('https://data.calgary.ca/resource/c2es-76ed.json?$select=min(issueddate)')
//  .then(response => response.json())
//  .then(data => {
//
//    let earliest = data[0]['min_issueddate'];
//    let year = earliest.substring(0, 4);
//    let month = earliest.substring(5, 7);
//    let day = earliest.substring(8, 10);
//    let earliest_date_format = month + '/' + day + '/' + year;
//
//
//    // set up the date range picker
//    let datepicker = $('input[name="daterange"]').daterangepicker({
//      startDate: earliest_date_format,
//      showDropdowns: true
//    }, function(start, end) {
//
//      let start_date = start.format('YYYY-MM-DD');
//      let end_date = end.format('YYYY-MM-DD');
//
//      let url = `https://data.calgary.ca/resource/c2es-76ed.json?$where=issueddate>='${start_date}' AND issueddate<='${end_date}'`;
//      fetch(url)
//      .then(response => response.json())
//      .then(data => {
//
//        console.log(data);
//
//        data.forEach(dat => {
//          markers.addLayer(
//            L.marker([Number(dat['latitude']), Number(dat['longitude'])])
//              .bindPopup(() => {
//
//                let permitNum = dat['permitnum'];
//                let issuedDate = dat['issueddate'];
//                let workclassGroup = dat['workclassgroup'];
//                let communityName = dat['communityname'];
//                let originalAddress = dat['originaladdress'];
//                let contractorName = dat['contractorname'] ?? "";
//
//                return `Permit Number: ${permitNum}<br>` +
//                        `Issued Date: ${issuedDate}<br>`+
//                        `Workclass Group: ${workclassGroup}<br>` +
//                        `Contractor Name: ${contractorName}<br>` +
//                        `Community Name: ${communityName}<br>` +
//                        `Original Address: ${originalAddress}`;
//              })
//          )
//          map.addLayer(markers);
//
//        })
//      });
//    });
//
//
//    document.querySelector('#refreshButton').onclick = function() {
//      markers.clearLayers();
//      map.setView([51.02, -114.05], 11, {
//        animate: true,
//        duration: 0.5
//      });
//      datepicker.data('daterangepicker').setStartDate(earliest_date_format);
//      datepicker.data('daterangepicker').setEndDate(moment());
//    }
//  });
//
//});
