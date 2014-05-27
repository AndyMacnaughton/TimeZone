
App = Ember.Application.create();

// Define application routes

var srchFirst;
var srchSecond;
var isloading = true;

App.IndexView = Ember.View.extend({
  didInsertElement: function() {

    var input = document.getElementById('location-first');
    srchFirst = new google.maps.places.SearchBox(input);

    google.maps.event.addListener(srchFirst, 'places_changed', function() {
      if (isloading) { return }

      var places = srchFirst.getPlaces();
      firstLat = places[0].geometry.location.lat();
      firstLong = places[0].geometry.location.lng();
  
      compareTimeZone(firstLat,firstLong,first)
    });

    var inputSecond = document.getElementById('location-second');
    srchSecond = new google.maps.places.SearchBox(inputSecond);

    google.maps.event.addListener(srchSecond, 'places_changed', function() {
      if (isloading) { return }

      var secondPlaces = srchSecond.getPlaces();
      secondLat = secondPlaces[0].geometry.location.lat();
      secondLong = secondPlaces[0].geometry.location.lng();
      
      compareTimeZone(secondLat,secondLong,second)

    });

    // Get Current Location
   getCurrentLocation()

  }

});

function getCurrentLocation() { 
  $body = $("body");
  $body.addClass("loading");

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(success, error);
  } else {
    error('not supported');
  }

  function success(position) {
    compareTimeZone(position.coords.latitude, position.coords.longitude, first);
    $body.removeClass("loading");
  }

  function error(msg) { 
    $body.removeClass("loading");
  }
}

// End of application routes

// Define Location Parameters

Point = Ember.Object.extend({
  longitude: null,
  latitude: null
});

Point.reopen({
  locationChanged: function() {
    Ember.run.once(this, 'processChange');
  }.observes('longitude', 'latitude'),

  processChange: function() {
  	getTimeZone()
  }
});

var point = Point.create({
  longitude: "0",
  latitude: "0"
});

Result = Ember.Object.extend({
	timeZoneName: null,
	rawOffset: null,
	timeZoneId: null,
	actualTime: null
});

Result.reopen({
	zonechanged: function() {
	  Ember.run.once(this, 'processChange');
	}.observes('timeZoneName','rawOffset','timeZoneId'),

	processChange: function() {
    if (typeof result.timeZoneId === "undefined") {
      return;

    } else if ( $('#clock-container').length) {
      var calcHours = result.rawOffset / 3600;
      var clockHTML = '<ul id="theClock" class="analog"><li class="hour"></li><li class="min"></li><li class="sec"></li></ul>';

      $('#clock-container').empty();
      $(clockHTML).appendTo('#clock-container')
      $('#theClock').clock( { offset: calcHours, type: 'analog' } ); 

    }

	}
});

var result = Result.create({
	timeZoneName: null,
	rawOffset: null,
	timeZoneId: null,
	actualTime: null
});

// End Location Parameters

// Comparison Variables

First = Ember.Object.extend({
  timeZoneName: null,
  rawOffset: null,
  timeZoneId: null,
  actualTime: null
});

First.reopen({
  compareChanged: function() {
    Ember.run.once(this, 'processChange');
  }.observes('timeZoneName'),

  processChange: function() {
    $('#container-left').hide()

    if (typeof first.timeZoneId1 !== 'null') {
      addClocks('clock-first', $('#digital-first'), first.rawOffset)
      $('#container-left').fadeIn()
    }

    showTimeDifference(false)
    findLocation()

  }
});

var first = First.create({
  timeZoneName: null,
  rawOffset: null,
  timeZoneId: null,
  actualTime: null
});

Second = Ember.Object.extend({
  timeZoneName: null,
  rawOffset: null,
  timeZoneId: null,
  actualTime: null
});

Second.reopen({
  compareChanged: function() {
    Ember.run.once(this, 'processChange');
  }.observes('timeZoneName'),

  processChange: function() {

    $('#container-right').hide()
    if (typeof second.timeZoneId1 !== 'null') {
      addClocks('clock-second', $('#digital-second'), second.rawOffset)
      $('#container-right').fadeIn()
    }
    showTimeDifference(false)
  }
});

var second = Second.create({
  timeZoneName: null,
  rawOffset: null,
  timeZoneId: null,
  actualTime: null
});


// End Comparison Variables

// Search Box Functions
var firstOffset = null;
var secondOffset = null;

$(document).ready(function() {
  $('#location-first, #location-second, #tz-first, #tz-second').on('click', function() {
    $(this).val('');
  });

  // Define the data for time zone based searching
  var dd_first = $('#tz-first')
  var dd_second = $('#tz-second');

  var acOptions = {
    source: function( request, response ) {
      var matcher = new RegExp( "^" + $.ui.autocomplete.escapeRegex( request.term ), "i" );
      response( $.grep( timeZones, function( item ){  
      var isMatch = false;
      if (matcher.test(item.tzName) || matcher.test(item.tzAbbr)) {
        isMatch = true
      }
        return isMatch;
      }))
    },
    select: function( event, ui ) {
      var res = ui.item;
      $(this).val(res.tzName);

      var thisDigital = $('#digital-first');
      var thisAnalog = 'clock-first'
      var thisOffset = firstOffset
      if ( $(this).attr('id') === 'tz-second' ) {
        thisDigital = $('#digital-second')
        thisOffset = secondOffset
        thisAnalog = 'clock-second'
      }
      console.log(firstOffset)

      thisOffset = thisOffset * 3600

      addClocks(thisAnalog, thisDigital, thisOffset);
      showTimeDifference(true);

      return false
    }
  }

  function acRenderItems(ul, item) {
    return $( "<li>" )
        .append( $( "<a>" ).text( item.tzName ) )
        .appendTo( ul );
  }

  $( dd_first ).autocomplete(acOptions)
    .data('ui-autocomplete')._renderItem = function( ul, item ) {
      firstOffset = item.tzOffset;
      return acRenderItems(ul, item)
  }

  $( dd_second ).autocomplete(acOptions)
    .data('ui-autocomplete')._renderItem = function( ul, item ) {
      secondOffset = item.tzOffset;
      return acRenderItems(ul, item)
  }

  // end of tz searching

  $('#tz-first, #tz-second').hide()

  $('#myonoffswitch').on('click', function() {
    var vis = this.checked;
    toggleVis(vis)
  });

  isloading = false;

});

function toggleVis(vis) {

  var clearString = '#timeDifference, #clock-first, #clock-second, #digital-first, #digital-second';
  $(clearString).empty()
  $('#digital-second').empty() //this makes no sence...but seems to be needed//

  first = First.create({ timeZoneName:null,rawOffset:null,timeZoneId:null,actualTime:null });
  second = Second.create({ timeZoneName:null,rawOffset:null,timeZoneId:null,actualTime:null });

  if ( vis ) {

    $('#location-first, #location-second').hide()
    $('#location-first, #location-second').val('')
    $('#tz-first, #tz-second').show('slow')

  } else {

    $('#tz-first, #tz-second').hide()
    $('#tz-first, #tz-second').val('')
    firstOffset = null
    secondOffset = null
    $('#location-first, #location-second').show('slow')
    
  }

  $('#label-zone').toggleClass('light')
  $('#label-location').toggleClass('light')

}

// End of search box functions

// Clock Functions

function addClocks(analog, digital, offset) {
  digital.empty();
  startClock(digital,offset)

  $('#' + analog).empty();
  var draw = SVG(analog).size(260, 260)

  var time = new Date()
  time = moment(time.setSeconds(time.getSeconds() + offset)).format('HH')
  
  var clock;
  if (time >= 6 && time < 18) {
    colors.plate = '#E0E9F3'
    colors.marks = '#E0E9F3'

    clock = draw.clock('100%')
    clock.timeZone(offset).start()

  } else {

    colors.plate = '#2A3642'
    colors.marks = '#2A3642'

    clock = draw.clock('100%')
    clock.timeZone(offset).start()

  }
}

function showTimeDifference(isTimeZone) {

  $('#timeDifference').empty()

  if ( (first.timeZoneName == null || second.timeZoneName == null) && isTimeZone === false ) { 
    return 
  } else if ( (firstOffset == null || secondOffset == null) && isTimeZone === true ) {
    return
  }

  var fOffset;
  var sOffset;

  if ( isTimeZone ) {
    fOffset = firstOffset * 3600
    sOffset = secondOffset * 3600
  } else {
    fOffset = first.rawOffset
    sOffset = second.rawOffset
  }

  var firstMoment = moment(moment.utc().add('s', fOffset));
  var secondMoment = moment(moment.utc().add('s', sOffset));
  var theDifference = Math.abs(firstMoment.diff(secondMoment, 'hours'))

  var timeDifference;

  var isPlural = '';
  if (theDifference > 1) {
    isPlural = 's'
  }

  if (firstMoment > secondMoment) {
    timeDifference = '<h2>is ' + theDifference + ' hour' + isPlural + ' ahead of</h2>'
  } else if (firstMoment < secondMoment) {
    timeDifference = '<h2>is ' + theDifference + ' hour' + isPlural + ' behind</h2>'
  } else {
    timeDifference = '<h2>is the same time as</h2>'
  }

  $(timeDifference).appendTo('#timeDifference')
}

function findLocation() {
  var findLocation = document.getElementById('location-first');
  if ($(findLocation).val().length === 0) {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(success, error);
    } else {
      error('not supported');
    }
  }

  function success(position) {
    var latlng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
    var geocoder = new google.maps.Geocoder();
    var findLocation = document.getElementById('location-first');

    geocoder.geocode({'latLng': latlng}, function(results, status) {
      
      if (status == google.maps.GeocoderStatus.OK) {
        if (results[1]) {
          $(findLocation).val(results[1].formatted_address);
        }
      }
    });
  }

  function error(msg) {
    console.log(msg)
  }
}

function getTimeZone() {
    var timeStamp = moment.utc().format("X");
    var qryStr = 'https://maps.googleapis.com/maps/api/timezone/json?location='+point.latitude +','+point.longitude+'&timestamp='+timeStamp +'&sensor=true';

      return $.getJSON(qryStr).then(function(data) {
        
        result.set('timeZoneName', data.timeZoneName);
        result.set('timeZoneId', data.timeZoneId);
        result.set('actualTime', moment(moment.utc().add('s', data.rawOffset)).format('HH:mm'));
        result.set('rawOffset', data.rawOffset); 

        return data;
      });  
}

function compareTimeZone(lat,lng,item) {
    var timeStamp = moment.utc().format("X");
    var qryStr = 'https://maps.googleapis.com/maps/api/timezone/json?location='+lat+','+lng+'&timestamp='+timeStamp +'&sensor=true';

    return $.getJSON(qryStr).then(function(data) {
      item.set('timeZoneName', data.timeZoneName);
      item.set('timeZoneId', data.timeZoneId);
      item.set('actualTime', moment(moment.utc().add('s', data.rawOffset)).format('HH:mm'));
      item.set('rawOffset', data.rawOffset); 
       
      return data;
    });  
}

function startClock(theClock, offset) {
  var appendClock = '<div id="clock" class="light"><div class="hour"></div><div class="minute"></div></div></div>';

  $(theClock).append(appendClock);

  var clock = $(theClock).children('#clock');

  var ticktock = function() {
    var now = moment.utc().add('s', offset).format("HHmm");

    var h = now[0] + now[1];
    var m = now[2] + now[3];
    var t = now[4] + now[5];

    clock.children('.hour').html(h);
    clock.children('.minute').html(m);

    if (h >= 6 && h < 18) {
      clock.attr('class', 'light');  
    } else {
      clock.attr('class', 'dark');  
    }

  }
  
  ticktock();
  
  // Calling ticktock() every 1 second
  setInterval(ticktock, 1000);
}

// End Clock Functions

