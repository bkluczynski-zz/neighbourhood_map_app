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
let largeInfoWindow;
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

    self.putMarkersDown = function(){
      self.locationsList().forEach(function(location){
        marker = new google.maps.Marker(new Markerito(location, map))
        marker.addListener('click', function() {
            self.populateInfoWindow(this, largeInfoWindow)
        });
        self.markers.push(marker);
      })
    }

    self.filterMarkers = function(){
      for (let i = 0; i < self.markers().length; i++){
        if ((self.markers()[i].title.toLowerCase().indexOf(self.searchLocation().toLowerCase()) > -1) || (self.searchLocation().length === 0)){
          self.markers()[i].setVisible(true)
        } else {
          self.markers()[i].setVisible(false)
        }
      }
    }

    self.initializeLargeInfoAndBounds = function() {
        largeInfoWindow = new google.maps.InfoWindow();
        bounds = new google.maps.LatLngBounds();
    }

    self.populateInfoWindow = function(marker, target) {
        debugger;
        marker = self.markers().filter(markerito => markerito.title === marker.title)[0];
        self.getWikipediaDescription(marker)
        if (largeInfoWindow.marker != marker) {
            largeInfoWindow.marker = marker;
            largeInfoWindow.setContent('<div>' + marker.title + '</div>');
            largeInfoWindow.open(map, marker);
            // Make sure the marker property is cleared if the infowindow is closed.
            largeInfoWindow.addListener('closeclick', function() {
                largeInfoWindow.marker = null;
            });
        }
    }

    self.getWikipediaDescription = function(location){
      debugger;
      let completeURL = baseUrl + location.title
      fetch(completeURL, {
        header: {
    'Access-Control-Allow-Origin':'*',
  }}
).then(function(response){
          if (response.status !== 200) {
            console.log("something went wrong. Status code: " + response.status);
            return;
          }

          response.json().then(function(data){
            console.log(data);
          })

        })
        .catch(function(err){
          console.log('Fetch Error', err)
        })
    }
    self.searchLocation = ko.observable('');

    self.filteredLocations = ko.computed(function() {
      return  ko.utils.arrayFilter(self.locationsList(), function(result) {
          self.filterMarkers(result)
          return  ((self.searchLocation().length === 0 || result.title.toLowerCase().indexOf(self.searchLocation().toLowerCase()) > -1))
        })
    })

}

ko.applyBindings(new ViewModel())
