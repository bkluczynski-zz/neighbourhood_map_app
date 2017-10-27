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
  const markers = [];
  let map = new google.maps.Map(document.getElementById('map'), {
          center: {lat: 40.7413549, lng: -73.9980244},
          zoom: 13
        });
  let largeInfoWindow = new google.maps.InfoWindow();
  let bounds = new google.maps.LatLngBounds();
    for (let i = 0; i < myLocations.length; i++){
      markers.push(new google.maps.Marker(
        new Markerito(myLocations[i], map)));
    }
  console.log(markers)
}

//ViewModel
const ViewModel = function(){

  const self = this;
  self.locationsList = ko.observableArray([]);

  myLocations.forEach(function(location){
    self.locationsList.push( new Location(location))
  })

  self.selectLocation = function(){
    console.log("i got clicked")
  }

}


ko.applyBindings(new ViewModel())
