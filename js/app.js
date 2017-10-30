//class of Location initialized with title and location
const Location = function(data) {
    this.title = data.title;
    this.location = data.location;
}

//class of Marker
const Markerito = function(data, map) {
    this.map = map,
    this.position = data.location,
    this.title = data.title,
    this.animation = google.maps.Animation.DROP,
    this.id = UUID.generate()
}

let map;
//hardcoded Locations - can be changed into API to an external DB
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
      //example of location which does not produce any results in Wikipedia
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
//map initialization
function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: {
            lat: 51.5478976,
            lng: -0.0784964
        },
        zoom: 14
    });
    google.maps.event.addDomListener(window, "resize", function() {
   let center = map.getCenter();
   google.maps.event.trigger(map, "resize");
   map.setCenter(center);
  })
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
      //if it's not defined wait
        setTimeout(function() {
            self.putLocations();
            self.putMarkersDown();
            self.initializeLargeInfoAndBounds();
        }, 1000)
    }

    //markers list being an observable array
    self.markers = ko.observableArray([])
    //location list being an observable array
    self.locationsList = ko.observableArray([]);
    //search input being an observable
    self.searchLocation = ko.observable('');

    //display myLocations in the list
    self.putLocations = function() {
        myLocations.forEach(function(location) {
            self.locationsList.push(new Location(location))
        })
    }

    self.toggleList = function(){
      self.shouldShowList(!self.shouldShowList())

    }

    self.shouldShowList = ko.observable(true);
    //make a marker bounce when selected either on the list or directly by clicking on the marker
    self.toggleBounce = function(marker){
      self.markers().forEach(function(item){
        //before making a marker bounce make sure the rest of markers don't bounce
        if (item.getAnimation() !== null) {
          item.setAnimation(null);
        }
          })
          marker.setAnimation(google.maps.Animation.BOUNCE);
        }

    //display markers on the map
    self.putMarkersDown = function() {
        self.locationsList().forEach(function(location) {
            marker = new google.maps.Marker(new Markerito(location, map))
            marker.addListener('click', function() {
                self.populateInfoWindow(this, largeInfoWindow)
            });
            self.markers.push(marker);
        })
    }

    //filter markers having a part of their location.title matching filter query
    self.filterMarkers = function() {
        for (let i = 0; i < self.markers().length; i++) {
            if ((self.markers()[i].title.toLowerCase().indexOf(self.searchLocation().toLowerCase()) > -1) || (self.searchLocation().length === 0)) {
                self.markers()[i].setVisible(true)
            } else {
                self.markers()[i].setVisible(false)
            }
        }
    }
    //get JSON and parse it into extract and id
    self.parseJsonAndDisplay = function(data, innerHTML, location) {
        let dataObj = data.query.pages;
        let id = Object.keys(dataObj).join();
        //in case dataObj is undefined (when wiki does not find any info about location) output the generic message
        let extract = dataObj[id].extract === undefined || dataObj[id].extract === ""
            ? ' Sorry, there is no available results for this place in Wikipedia'
            : dataObj[id].extract;
        //displayHTMLOfExtract
        self.displayHTML(innerHTML, dataObj, id, extract, location);
    }

    self.displayHTML = function(innerHTML, dataObj, id, extract, location) {
        innerHTML += '<strong>' + dataObj[id].title + '</strong>';
        innerHTML += extract;
        innerHTML += '<em> credit to Wikipedia</em>';
        //display infoWindow
        self.displayInfoWindow(innerHTML,location)
    }

    //initialize largeInfoWindow and bounds
    self.initializeLargeInfoAndBounds = function() {
        largeInfoWindow = new google.maps.InfoWindow();
        bounds = new google.maps.LatLngBounds();
    }

    //set content of infoWindow to whatever HTML is passed
    self.displayInfoWindow = function(innerHTML, location){
      largeInfoWindow.setContent(innerHTML)
      largeInfoWindow.open(map, location)
    }

    self.populateInfoWindow = function(marker, target) {
        //get the real marker
        marker = self.markers().filter(markerito => markerito.title === marker.title)[0];
        //if infoWindow does not have a marker property
        if (largeInfoWindow.marker != marker) {
            largeInfoWindow.marker = marker;
            //animate the marker
            self.toggleBounce(marker)
            //open infoWindow with Wikipedia extract
            self.openInfoBox(marker)
            // Make sure the marker and animation property is cleared if the infowindow is closed.
            largeInfoWindow.addListener('closeclick', function() {
                largeInfoWindow.marker = null;
                marker.setAnimation(null);
            });
        }
    }
    //handle error if request fails for any reason
    self.handleError = function(location, innerHTML, err) {
        innerHTML += '<strong>' + location.title + '</strong>' + " Could not get description from Wikipedia. Try again later"
        innerHTML += err ? 'error code: ' + err : '';
        self.displayInfoWindow(innerHTML, location)
    }

    self.openInfoBox = function(location) {
        let innerHTML = '<div>';
        let numberOfSentences = '&exsentences=2'
        let completeURL = baseUrl + location.title + numberOfSentences;
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
                self.handleError(location, innerHTML, err)
            })
        }).catch(function(err) {
            self.handleError(location, innerHTML, err)
        })
    }

    //filter locations in the list using ko.computed and utils.arrayFilter
    self.filteredLocations = ko.computed(function() {
        return ko.utils.arrayFilter(self.locationsList(), function(result) {
            self.filterMarkers(result)
            return ((self.searchLocation().length === 0 || result.title.toLowerCase().indexOf(self.searchLocation().toLowerCase()) > -1))
        })
    })

}

ko.applyBindings(new ViewModel())
