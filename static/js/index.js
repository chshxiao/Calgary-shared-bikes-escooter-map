
document.addEventListener('DOMContentLoaded', function() {

    // get the current location
    if (!navigator.geolocation) {
      document.alert("Geolocation is not supported by your browser");
    } else {
      navigator.geolocation.getCurrentPosition(
        (position) => {
            // get the current location
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;

            // create the map
            let map = L.map('map').setView([latitude, longitude], 11);
            L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            }).addTo(map);

            // set the height of the map
            $(window).on("resize", function() {
                $("#map").height($(window).height());
                map.invalidateSize();
            }).trigger("resize");

            // marker for current location
            var my_loc_marker = L.circle([latitude, longitude], {
                radius: 100
            }).addTo(map);

            // // route test'
            // const test_body = ({ 'email': 'xhcs1998@gmail.com' });
            // const test_header = ({
            //     'User-Agent': 'Bird/4.53.0 (co.bird.Ride; build:24; iOS 12.4.1) Alamofire/4.53.0',
            //     'Device-Id': '54fdfdf5-21a7-49d2-9e91-e2a1954b638e',
            //     'App-Version': '4.53.0',
            //     'Content-Type': 'application/json',
            //     'Access-Control-Allow-Origin': '*',
            //     'Platform': 'Win64',
            // });
            // fetch('https://api-auth.prod.birdapp.com/api/v1/auth/email', {
            //     method: 'POST',
            //     headers: test_header,
            //     body: test_body,
            //     mode: 'no-cors',
            // })
            // .then()
            // console.log('after');

            // create a variable for marker cluster
            var markers = L.markerClusterGroup();

            // bird data


            // neuron data
            let url = 'https://mds-global-yyc.neuron-mobility.com/gbfs/2/en/free_bike_status';
            fetch(url)
            .then(response => response.json())
            .then(data => {

                console.log(data);

                data.data.bikes.forEach(dat => {
                    dat.company = 'Neuron';
                    markers.addLayer(
                        L.marker([Number(dat['lat']), Number(dat['lon'])])
                        .bindPopup(() => {
                            return `bike id: ${dat['bike_id']}<br>`+
                                    `Company: ${dat['company']}<br>`+
                                    `Battery left: ${dat['battery_pct'] * 100}%`;
                        })
                    )
                    map.addLayer(markers);

                })
            });
        });


        // refresh the page
        document.querySelector('#refreshButton').onclick = function() {
            markers.clearLayers();
            map.setView([51.02, -114.05], 11, {
                animate: true,
                duration: 0.5
            });
        }


        // exand the filter
        document.querySelector('#filterButton').onclick = function() {
            var z_index = document.getElementById('filterContainer').style.zIndex;
            if (z_index == 1){
                document.getElementById('filterContainer').style.zIndex = -1;
                document.getElementById('filterButton').innerHTML = '>';
            } else {
                document.getElementById('filterContainer').style.zIndex = 1;
                document.getElementById('filterButton').innerHTML = '<';
            }
        }
    }
        () => {
            console.log("cannot retrieve the location");
        };
    }

);






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
