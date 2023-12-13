# Travel Itinerary
By Daniel Salamatovs and Samuel Schreier

## Overview

This travel itinerary website utilizes Node.js, Express.js, MongoDB, RapidAPI, and Axios to provide a seamless experience. Some of the functionality includes adding and removing a destination from your itinerary, searching for a city and its details that can then be added to the itinerary, and clearing the itinerary. 

The itinerary is stored in MongoDB so that it can be accessed even after the itinerary app has been restarted. City details are retrieved from the GeoDB Cities API on RapidAPI.

## Usage

To use this app you need to have Node.js and Node Package Manager (npm) installed. If you have those then:

1. **Clone** the repository
2. Run **npm install** in the directory to download all necessary dependencies
3. Run *node app.js portNumber* to run the app on your desired port number
4. Access the site at localhost:portNumber

To stop the app, type stop in the command line terminal or use *CTRL+C*

