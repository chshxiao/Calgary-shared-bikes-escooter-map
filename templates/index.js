
document.addEventListener('DOMContentLoaded', function() {
    console.log("here")''

  // create the map
  let map = L.map('map').setView([51.02, -114.05], 11);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);


  // set the height of the map
  $(window).on("resize", function() {
    $("#map").height($(window).height());
    map.invalidateSize();
  }).trigger("resize");


  // create a variable for marker cluster
  var markers = L.markerClusterGroup();


  // date range picker
  // $(function() {
  //   $('input[name="daterange"]').daterangepicker({
  //     opens: 'left'
  //   }, function(start, end, label) {
  //     console.log("A new date selection was made: " + start.format('YYYY-MM-DD') + ' to ' + end.format('YYYY-MM-DD'));
  //     console.log(start);
  //   });
  // });


  // get the earliest date
  fetch('https://data.calgary.ca/resource/c2es-76ed.json?$select=min(issueddate)')
  .then(response => response.json())
  .then(data => {
    
    let earliest = data[0]['min_issueddate'];
    let year = earliest.substring(0, 4);
    let month = earliest.substring(5, 7);
    let day = earliest.substring(8, 10);
    let earliest_date_format = month + '/' + day + '/' + year;


    // set up the date range picker
    let datepicker = $('input[name="daterange"]').daterangepicker({
      startDate: earliest_date_format,
      showDropdowns: true
    }, function(start, end) {

      let start_date = start.format('YYYY-MM-DD');
      let end_date = end.format('YYYY-MM-DD');

      let url = `https://data.calgary.ca/resource/c2es-76ed.json?$where=issueddate>='${start_date}' AND issueddate<='${end_date}'`;
      fetch(url)
      .then(response => response.json())
      .then(data => {

        console.log(data);

        data.forEach(dat => {
          markers.addLayer(
            L.marker([Number(dat['latitude']), Number(dat['longitude'])])
              .bindPopup(() => {

                let permitNum = dat['permitnum'];
                let issuedDate = dat['issueddate'];
                let workclassGroup = dat['workclassgroup'];
                let communityName = dat['communityname'];
                let originalAddress = dat['originaladdress'];
                let contractorName = dat['contractorname'] ?? "";

                return `Permit Number: ${permitNum}<br>` + 
                        `Issued Date: ${issuedDate}<br>`+
                        `Workclass Group: ${workclassGroup}<br>` +
                        `Contractor Name: ${contractorName}<br>` +
                        `Community Name: ${communityName}<br>` +
                        `Original Address: ${originalAddress}`;
              })
          )
          map.addLayer(markers);
            
        })
      });
    });


    document.querySelector('#refreshButton').onclick = function() {
      markers.clearLayers();
      map.setView([51.02, -114.05], 11, {
        animate: true,
        duration: 0.5
      });
      datepicker.data('daterangepicker').setStartDate(earliest_date_format);
      datepicker.data('daterangepicker').setEndDate(moment());
    }
  });

});
