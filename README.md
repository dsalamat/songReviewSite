# Travel Itinerary
By Daniel Salamatovs (dsalamat) and Samuel Schreier (sschreie)

## Overview

This travel itinerary website utilizes Node.js, Express.js, MongoDB, RapidAPI, and Axios to provide a seamless experience. Some of the functionality includes adding and removing a destination from your itinerary, searching for a city and its details that can then be added to the itinerary, and clearing the itinerary. 

The itinerary is stored in MongoDB so that it can be accessed even after the itinerary app has been restarted. City details are retrieved from the GeoDB Cities API on RapidAPI.

https://rapidapi.com/wirefreethought/api/geodb-cities/details 

## Usage

This app is currently live at [this link](https://travel-itinerary.onrender.com). To see a demonstation of using the app, watch the [Usage Video](https://youtu.be/4Mj7_Sa9Tv4).

To use this app locally, you need to have Node.js and Node Package Manager (npm) installed. If you have those then:

1. **Clone** the repository
2. Run `npm install` in the directory to download all necessary dependencies
3. Run `node app.js` to start the app
4. Access the site at `http://localhost:4000`

To stop the app, run `stop` in the command line terminal or use *CTRL+C*

## Dependancies

* Axios
* EJS
* Express
* DotEnv
* GeoDB Api from RapidAPI
* MongoDB

