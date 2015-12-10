var map, heatmap;
var points = new Array();
var totSentiment = 0;
//points.push(new google.maps.LatLng(18.45, -66.1));

function initialize() {

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

    // Create the legend and display on the map
    var legendDiv = document.createElement('DIV');
    var legend = new Legend(legendDiv, map);
    legendDiv.index = 1;
    map.controls[google.maps.ControlPosition.LEFT_BOTTOM].push(legendDiv);

    heatmap = new google.maps.visualization.HeatmapLayer({
      data: points,
      map: map,
      radius: 35
    });
    heatmap.setMap(map);

  };


function Legend(controlDiv, map) {
  // Set CSS styles for the DIV containing the control
  // Setting padding to 5 px will offset the control
  // from the edge of the map
  controlDiv.style.padding = '5px';

  // Set CSS for the control border
  var controlUI = document.createElement('DIV');
  controlUI.style.backgroundColor = 'white';
  controlUI.style.borderStyle = 'solid';
  controlUI.style.borderWidth = '2px';
  controlUI.title = 'Legend';
  controlDiv.appendChild(controlUI);

  // Set CSS for the control text
  var controlText = document.createElement('DIV');
  controlText.style.fontFamily = 'Arial,sans-serif';
  controlText.style.fontSize = '12px';
  controlText.style.paddingLeft = '4px';
  controlText.style.paddingRight = '4px';
  controlText.style.color = 'black';

  
  // Add the text
  controlText.innerHTML = '<b>Legend</b><br />' +
    '<img src="images/green.png" /> Positive<br />' +
    '<img src="images/blue.png" /> Negative<br />';
  
  controlUI.appendChild(controlText);
}


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

  socket.on('trend', function(data) {
    //console.log(data);

    var content = '<b>Currently Trending: ' + data[0] + ':</b>' + '<ol><li>#SamRules!!</li><li>#JunchaoDrools!</li><li>#SaveTheWhales</li> </ol>'
    var loc = new google.maps.LatLng(parseFloat(data[1]), parseFloat(data[2]));
    
    var infowindow = new google.maps.InfoWindow({
      content: content
    });
    function toggleBounce() {
      if (marker.getAnimation() !== null) {
        marker.setAnimation(null);
      } else {
        marker.setAnimation(google.maps.Animation.BOUNCE);
      }
    }
    
    
    var marker = new google.maps.Marker({
      position: loc,
      map: map,
      title: 'Trending in America',
      animation: google.maps.Animation.DROP
    });
    google.maps.event.addListener(marker, 'click', function() {
      infowindow.open(map,marker);
      //toggleBounce();
    });
  });

  socket.on('map', function(data) {
    console.log('got map data');
    points.length = 0;
    totSentiment = 0;
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


 socket.on('mapUpdate', function(data) {
  console.log('got new points for map');
  for (var i = 0; i < data.length-1; i++) {
      console.log(data[i]);
      var coord = data[i].split(',');
      var lng = parseFloat(coord[0]);
      var lat = parseFloat(coord[1]);
      points.push(new google.maps.LatLng(lat, lng));
    // console.log(lat);
    // console.log(lng);
    }
    console.log("points count: " + points.length);
    totSentiment += data[data.length-1];
    console.log("total sentiment: " + totSentiment);
   
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