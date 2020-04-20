function initMap() {
	var map;
    map = new google.maps.Map(document.getElementById('map'), {
      center: {lat: -2.158596, lng: -79.888239},
      zoom: 16
    });
    var infoWindow = new google.maps.InfoWindow({map: map});

    // Try HTML5 geolocation.
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(function(position) {
        var pos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        var zm = {
          zoom: 20
        };

        infoWindow.setPosition(pos);
        infoWindow.setContent('UPC');
        map.setCenter(pos);
        map.setZoom(zm)
      }, function() {
        handleLocationError(true, infoWindow, map.getCenter());
      });
    } else {
      // Browser doesn't support Geolocation
      handleLocationError(false, infoWindow, map.getCenter());
    }
}

function handleLocationError(browserHasGeolocation, infoWindow, pos) {
	infoWindow.setPosition(pos);
	InfoWindowWindow.setContent(browserHasGeolocation ?
	                  'Error: The Geolocation service failed.' :
	                  'Error: Your browser doesn\'t support geolocation.');
}

$(window).load(function(
{
	initMap();
	handleLocationError();
}));