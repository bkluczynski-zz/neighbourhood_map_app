//class of Location initialized with title and location
const Location = function(data) {
    this.title = data.title;
    this.location = data.location;
}

const Markerito = function(data, map) {
    this.map = map,
    this.position = data.location,
    this.title = data.title,
    this.animation = google.maps.Animation.DROP,
    this.id = UUID.generate()
}

let map;
//hardcoded Locations
let myLocations = [
    {
        title: 'Arcola Theatre',
        location: {
            lat: 51.546915,
            lng: -0.075005
        }
    }, {
        title: 'Dalston Junction railway station',
        location: {
            lat: 51.546129,
            lng: -0.07512
        }
    }, {
        title: 'London Fields',
        location: {
            lat: 51.54092244,
            lng: -0.0601511
        }
    }, {
        title: 'Dalston Kingsland railway station',
        location: {
            lat: 51.5481561,
            lng: -0.0756712
        }
    }, {
        title: 'Argos Shop',
        location: {
            lat: 51.5499028,
            lng: -0.0743401
        }
    }, {
        title: 'Hackney Downs School',
        location: {
            lat: 51.5527081,
            lng: -0.060567
        }
    }
];

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: {
            lat: 51.5478976,
            lng: -0.0784964
        },
        zoom: 14
    });
}

//ViewModel
const ViewModel = function() {

    const self = this;
    const baseUrl = "http://en.wikipedia.org/w/api.php?&origin=*&action=query&prop=extracts&format=json&exintro=&titles=";

    let bounds;
    let marker;
    let largeInfoWindow;

    //introduced timeout to wait till google is defined
    if (typeof google != 'undefined') {
        self.putLocations();
        self.putMarkersDown();
        self.initializeLargeInfoAndBounds();
    } else {
        setTimeout(function() {
            self.putLocations();
            self.putMarkersDown();
            self.initializeLargeInfoAndBounds();
        }, 500)
    }

    self.markers = ko.observableArray([])
    self.locationsList = ko.observableArray([]);

    self.putLocations = function() {
        myLocations.forEach(function(location) {
            self.locationsList.push(new Location(location))
        })
    }

    self.putMarkersDown = function() {
        self.locationsList().forEach(function(location) {
            marker = new google.maps.Marker(new Markerito(location, map))
            marker.addListener('click', function() {
                self.populateInfoWindow(this, largeInfoWindow)
            });
            self.markers.push(marker);
        })
    }

    self.filterMarkers = function() {
        for (let i = 0; i < self.markers().length; i++) {
            if ((self.markers()[i].title.toLowerCase().indexOf(self.searchLocation().toLowerCase()) > -1) || (self.searchLocation().length === 0)) {
                self.markers()[i].setVisible(true)
            } else {
                self.markers()[i].setVisible(false)
            }
        }
    }

    self.parseJsonAndDisplay = function(data, innerHTML, location) {
        debugger;
        let dataObj = data.query.pages;
        let id = Object.keys(dataObj).join();
        let extract = dataObj[id].extract === undefined
            ? ' Sorry, there is no available results for this place in Wikipedia'
            : dataObj[id].extract;
        self.displayHTML(innerHTML, dataObj, id, extract, location);
    }

    self.displayHTML = function(innerHTML, dataObj, id, extract, location) {
        innerHTML += '<strong>' + dataObj[id].title + '</strong>';
        innerHTML += extract;
        self.displayInfoWindow(innerHTML,location)
    }

    self.initializeLargeInfoAndBounds = function() {
        largeInfoWindow = new google.maps.InfoWindow();
        bounds = new google.maps.LatLngBounds();
    }

    self.displayInfoWindow = function(innerHTML, location){
      largeInfoWindow.setContent(innerHTML)
      largeInfoWindow.open(map, location)
    }

    self.populateInfoWindow = function(marker, target) {
        marker = self.markers().filter(markerito => markerito.title === marker.title)[0];
        if (largeInfoWindow.marker != marker) {
            largeInfoWindow.marker = marker;
            self.openInfoBox(marker)
            // Make sure the marker property is cleared if the infowindow is closed.
            largeInfoWindow.addListener('closeclick', function() {
                largeInfoWindow.marker = null;
            });
        }
    }

    self.handleError = function(location, innerHTML) {
        innerHTML += '<strong>' + location.title + '</strong>' + " Could not get description from Wikipedia. Try again later"
        self.displayInfoWindow(innerHTML, location)
    }

    self.openInfoBox = function(location) {
        let innerHTML = '<div>';
        let completeURL = baseUrl + location.title
        fetch(completeURL, {
            header: {
                'Access-Control-Allow-Origin': '*'
            }
        }).then(function(response) {
            if (response.status !== 200) {
                //needs to abstract this to a separate function
                self.handleError(location, innerHTML)
                return;
            }
            response.json().then(function(data) {
                self.parseJsonAndDisplay(data, innerHTML, location)
            }).catch(function(err) {
                self.handleError(location, innerHTML)
            })
        }).catch(function(err) {
            self.handleError(location, innerHTML)
        })
    }
    self.searchLocation = ko.observable('');

    self.filteredLocations = ko.computed(function() {
        return ko.utils.arrayFilter(self.locationsList(), function(result) {
            self.filterMarkers(result)
            return ((self.searchLocation().length === 0 || result.title.toLowerCase().indexOf(self.searchLocation().toLowerCase()) > -1))
        })
    })

}

ko.applyBindings(new ViewModel())
