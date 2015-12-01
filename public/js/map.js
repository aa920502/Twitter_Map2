var map, heatmap;
var points = new Array();

//points.push(new google.maps.LatLng(18.45, -66.1));

function initialize() {

    /* position Amsterdam */
    var latlng = new google.maps.LatLng(18.45, -66.1);

    var mapOptions = {
      center: latlng,
      scrollWheel: false,
      zoom: 3,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    
    // var marker = new google.maps.Marker({
    //   position: latlng,
    //   url: '/',
    //   animation: google.maps.Animation.DROP
    // });
    
    map = new google.maps.Map(document.getElementById('map'), mapOptions);
    //marker.setMap(map);

    heatmap = new google.maps.visualization.HeatmapLayer({
      data: points,
      map: map,
      radius: 30
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
      points.length = 0;
      for (var i = 0; i < data.length-1; i++) {
        var coord = data[i].split(',');
        var lng = parseFloat(coord[0]);
        var lat = parseFloat(coord[1]);
        points.push(new google.maps.LatLng(lat, lng));
      // console.log(lat);
      // console.log(lng);
      }
      
      console.log("points count: " + points.length);
      totSentiment = data[data.length-1];
      console.log("total sentiment: " + totSentiment);
      avgSentiment = 0.5 + (data[data.length-1]/(2*points.length));
      console.log("current average sentiment is "+ avgSentiment);
      var rate  = 0.5 + (data[data.length-1]/(2*points.length)); // rate must be 0-1
      // var gradient = [
      //       'rgba('+Math.round(255*rate)+', '+Math.round(255*(1-rate))+', 0, 0)',
      //       'rgba('+Math.round(255*rate)+', '+Math.round(255*(1-rate))+', 0, 1)'];
      
      if (totSentiment > 0 ){
        gradient = null;
      }
      else {
        var gradient = [
          'rgba(0, 255, 255, 0)',
          'rgba(0, 255, 255, 1)',
          'rgba(0, 191, 255, 1)',
          'rgba(0, 127, 255, 1)',
          'rgba(0, 63, 255, 1)',
          'rgba(0, 0, 255, 1)',
          'rgba(0, 0, 223, 1)',
          'rgba(0, 0, 191, 1)',
          'rgba(0, 0, 159, 1)',
          'rgba(0, 0, 127, 1)',
          'rgba(63, 0, 91, 1)',
          'rgba(127, 0, 63, 1)',
          'rgba(191, 0, 31, 1)',
          'rgba(255, 0, 0, 1)' ]
        }

      heatmap.set('gradient', gradient);
      heatmap.setMap(map);
      
    });

   
});