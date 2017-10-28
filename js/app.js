//class of Location initialized with title and location
const Location = function(data){
  this.title = data.title;
  this.location = data.location;
}

const Markerito = function(data, map){
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
          {title: 'Park Ave Penthouse', location: {lat: 40.7713024, lng: -73.9632393}},
          {title: 'Chelsea Loft', location: {lat: 40.7444883, lng: -73.9949465}},
          {title: 'Union Square Open Floor Plan', location: {lat: 40.7347062, lng: -73.9895759}},
          {title: 'East Village Hip Studio', location: {lat: 40.7281777, lng: -73.984377}},
          {title: 'TriBeCa Artsy Bachelor Pad', location: {lat: 40.7195264, lng: -74.0089934}},
          {title: 'Chinatown Homey Space', location: {lat: 40.7180628, lng: -73.9961237}}
];

function initMap(){
  map = new google.maps.Map(document.getElementById('map'), {
          center: {lat: 40.7413549, lng: -73.9980244},
          zoom: 13
        });
}

console.log("window", largeInfoWindow)
//ViewModel
const ViewModel = function(){

  const self = this;
  const markers = [];
  let bounds;
  let marker;


  //introduced timeout to wait till google is defined
  if(typeof google != 'undefined'){
    self.putMarkersAndLocations()
    self.initializeLargeInfoAndBounds()
    } else {
    setTimeout(function(){
      self.putMarkersAndLocations()
      self.initializeLargeInfoAndBounds()
    }, 500)
  }

  self.locationsList = ko.observableArray([]);

  self.putMarkersAndLocations = function(){
    myLocations.forEach(function(location){
      self.locationsList.push( new Location(location))
      marker = new google.maps.Marker(new Markerito(location, map))
      marker.addListener('click', function(){
        self.populateInfoWindow(this, largeInfoWindow)
      });
      markers.push(marker);
    })
  }

  self.initializeLargeInfoAndBounds = function(){
    largeInfoWindow = new google.maps.InfoWindow();
    bounds = new google.maps.LatLngBounds();
  }

  self.populateInfoWindow = function(marker, target){

      marker = markers.filter(markerito => markerito.title === marker.title)[0];

    if (largeInfoWindow.marker != marker){
      largeInfoWindow.marker = marker;
      largeInfoWindow.setContent('<div>' + marker.title + '</div>');
          largeInfoWindow.open(map, marker);
          // Make sure the marker property is cleared if the infowindow is closed.
          largeInfoWindow.addListener('closeclick',function(){
            largeInfoWindow.setMarker = null;
          });

    }
  }

}



ko.applyBindings(new ViewModel())
