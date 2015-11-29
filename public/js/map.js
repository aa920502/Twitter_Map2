$(document).ready(function(){
  
  var socket = io.connect();
      socket.on('news', function(data) {
        console.log(data);
        //alert(data.hello);
        //socket.emit('other', {my: 'datas'});
      });

  /* google maps -----------------------------------------------------*/
  google.maps.event.addDomListener(window, 'load', initialize);

  function initialize() {

    /* position Amsterdam */
    var latlng = new google.maps.LatLng(52.3731, 4.8922);

    var mapOptions = {
      center: latlng,
      scrollWheel: false,
      zoom: 13
    };
    
    var marker = new google.maps.Marker({
      position: latlng,
      url: '/',
      animation: google.maps.Animation.DROP
    });
    
    var map = new google.maps.Map(document.getElementById('map'), mapOptions);
    marker.setMap(map);

  };
  /* end google maps -----------------------------------------------------*/
});