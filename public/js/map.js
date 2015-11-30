 var map, heatmap;
 var points = new Array();

 points.push(new google.maps.LatLng(18.45, -66.1));
function initialize() {

    /* position Amsterdam */
    var latlng = new google.maps.LatLng(18.45, -66.1);

    var mapOptions = {
      center: latlng,
      scrollWheel: false,
      zoom: 3,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    
    var marker = new google.maps.Marker({
      position: latlng,
      url: '/',
      animation: google.maps.Animation.DROP
    });
    
    map = new google.maps.Map(document.getElementById('map'), mapOptions);
    marker.setMap(map);

    heatmap = new google.maps.visualization.HeatmapLayer({
      data: points,
      map: map,
      radius: 50
    });
    heatmap.setMap(map);

  };


$(document).ready(function(){
  

 //points.push(new google.maps.LatLng(la))

  /* google maps -----------------------------------------------------*/
  google.maps.event.addDomListener(window, 'load', initialize);

  
  /* end google maps -----------------------------------------------------*/

    var socket = io.connect();
    socket.on('news', function(data) {
      console.log(data);
      //alert(data.hello);
      //socket.emit('other', {my: 'datas'});
    });
    socket.on('map', function(data) {
      console.log('got map data');
      for (var i = 0; i < data.length; i++) {
        var coord = data[i].split(',');
        var lng = parseFloat(coord[0]);
        var lat = parseFloat(coord[1]);
        points.push(new google.maps.LatLng(lat, lng));
      // console.log(lat);
      // console.log(lng);
      }
      console.log(points.length);
      heatmap.setMap(map);
      points.length = 0;
    });
   
});