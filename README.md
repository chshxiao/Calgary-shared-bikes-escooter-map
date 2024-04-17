# Calgary-shared-bikes-escooter-map
The city of Calgary proposed the Shared Micromobility project in 2018. E-scooters and e-bikes provided from the project give people great way to make their ways throughout the city. This project can help reduce the amount of vehicles on the road especially in the downtown area so that reduce the emission and make the city more walkable.

However, the e-bikes and e-scooters are coming from two separated companies: Bird and Neuron. This situation causes a problem of utilizing the facilities. That is, users need to download both applications on their cell phones to get access to the bikes and scooters. The problem would get even worse when there is a high demand of the facilities as users need to check both applications to find the most nearby available facility.

Therefore, I got the idea from Johnathan Rasmussen of a map of general available micromobility in Calgary. This application integrates the data of available bikes and scooter from both companies. The data includes the bike id, the location, the remaining battery level, and so on. Users are able to filter the map visualization to find the information they are looking for. Another feature of the map application is the navigation function. This function can navigate users to their destinations and provide extra useful information for the ride.


# Getting Started
The application is a integrated program for both Python and Javascript. To install the required python packages, run the following command in python terminal

`pip install -r requirements.txt`


To set up the Flask and the connection with the localhost database, run the following command in python terminal

`set FLASK_APP=main_application.py`

`set DATABASE_URL=postgresql://[username]:[password]@localhost/[database]`

`flask run`


# Data Sources
The current Neuron's shared micromobility data comes from the address:

`https://mds-global-yyc.neuron-mobility.com/gbfs/2/en/free_bike_status` 

There's also an API tutorial repository in GitHub. The address is:
`https://github.com/ubahnverleih/WoBike/tree/master`. However, the Bird's API didn't work on my end so the application is using the `bird_simulated_data.txt` now. This simulated data is the Neuron's data on April 12th, 2024.


# Details
Following is the description of each page in the map application.

## Sign in
The first page is the **sign in** page. Users can sign in with their user id and password.

![sign-in page screenshot](https://github.com/chshxiao/Calgary-shared-bikes-escooter-map/asset/readme_img/sign-in.png)

Users can register new accounts in the **register** page. If the user id is duplicated, the program will ask the users to register for another one.

![register page screenshot](https://github.com/chshxiao/Calgary-shared-bikes-escooter-map/asset/readme_img/register.png)

Once successfully sign in, users will get to the **map application**. The map elements are generated using Leaflet. Here's the link: `https://leafletjs.com/index.html`. The map is centered at user's current location. Available e-bikes and e-scooters are represented by icons for two companies as shown at the right bottom corner.
The other elements on the map application includes:
* sign out at the left top corner - Click to sign out and the application will redirect to the sign in page.
* filter panel at the left bottom corner - Filter to the data from companies specified by the users.

![filter panel screenshot](https://github.com/chshxiao/Calgary-shared-bikes-escooter-map/asset/readme_img/filter-panel.png)

* navigation at the right top corner - Input the address in the navigation box and the program will calculate the route for you. Click clear to clear the navigation and the routes.

* refresh button - Close all the events and refresh the whole page.

![navigation box and refresh button screenshot](https://github.com/chshxiao/Calgary-shared-bikes-escooter-map/asset/readme_img/navigation-and-refresh-button.png)

## Application Features
* Details of the bike
Click on the scooter icon of the e-bike or e-scooter want to look into, the detail information of the facility will be shown in a popup window. A dash-line route to the bike is also shown on the map. The detail includes bike id, company, and the remaining battery level, distance, and duration to the bike.

![popup screenshot](https://github.com/chshxiao/Calgary-shared-bikes-escooter-map/asset/readme_img/pop-up.png)

* Filter Panel
Click on the '>' arrow at the left bottom corner, you can narrow the visualization down to specific company. This is helpful when the user only use the e-bikes or the e-scooters from one company. Users can choose the "all" option to refresh the data and show all the available facilities.

![filter to neuron](https://github.com/chshxiao/Calgary-shared-bikes-escooter-map/asset/readme_img/filter-to-neuron.png)

* Navigation
Input an address to the navigation box and click navigate, the map will show the route from your current location to the destination in solid line. The conversion from address to latitue/longitude is performed by Mapbox Geocoding API. One of the acceptable address is the Google map address. For more details, please refer to `https://docs.mapbox.com/help/troubleshooting/address-geocoding-format-guide/`.

After the destination is inputted, when the user clicks on the scooter icon, a set of new routes from user's current location to the scooter, and from the scooter to the destination is created. The estimated distance, duration, and cost from the scooter to the destination, and the total distance and duration are also included in the detailed pop up window. 

If the battery level of the scooter is not predicted to be sufficient for the trip, an alert window will show up on the top of the screen warning low battery level.

![navigation detail with low battery screenshot](https://github.com/chshxiao/Calgary-shared-bikes-escooter-map/asset/readme_img/navigation-detail.png)

# API Documentation
The API of the map application requires access token. The current design of API only allows the extraction of available bikes information. The data is returned in the GeoJSON format.

To request an access token, type the request URL:

`http://[localhost]:5000/api/token/?user_id=xxx&password=yyy/`

To request all the available scooter data:

`http://[localhost]:5000/api/scooter/?access_token=xxx/`

You can add filter on company and the remaining battery level:

`http://[localhost]:5000/api/scooter/?company=bird&remaining_battery=0.7&access_token=xxx/`

This request will return you the available e-bikes and e-scooters from Bird with the remaining battery level more than 70%.

# Future Steps
1. Change the simulated data to the real-time data from Bird's API.
2. Add the functionality of recording ride history for better estimation of duration and cost of the future ride.
3. Add the ability of retrieving ride history from API.