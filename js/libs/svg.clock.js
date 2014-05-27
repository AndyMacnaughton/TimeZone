/* Clock.svg v0.1 (c) 2013 Wout Fierens - Svg.js is licensed under the terms of the MIT License */
var colors = {
   plate: '#2A3642'
  , marks: '#2A3642'
}

SVG.Clock = function(size,options) {
  var i, settings

  /* set defaults */
  settings = {
    plate:    colors.plate
  , marks:    colors.marks
  , center:   '#A0B2C2'
  , hours:    '#E06562'
  , minutes:  '#E06562'
  , seconds:  '#E06562'
  , offset:   '0'
  }

  // /* merge options */
  options = options || {}
  for (i in options)
    settings[i] = options[i]
  
  /* store full rotations */
  this.full = {
    hours:    0
  , minutes:  0
  , seconds:  0
  }
  
  /* store current time */
  this.time = {
    hours:    0
  , minutes:  0
  , seconds:  0
  }
  
  /* create nested svg element */
  this.constructor.call(this, SVG.create('svg'))
  
  /* set attributes */
  this.viewbox(0, 0, 100, 100)
  this.size(size, size)
  
  /* create base plate */
  this.plate = this.ellipse(100, 100)
    .fill(settings.plate)
  
  /* bar every five minutes */
  for (i = 11; i >= 0; i--)
    this.rect(3, 10)
      .move(48.5, 1)
      .fill(settings.marks)
      .rotate(i * 30, 50, 50)
  
  /* small bar every minute */
  for (i = 59; i >= 0; i--)
    if (i % 5 != 0)
      this.rect(1.2, 3.6)
        .move(49.4, 1)
        .fill(settings.marks)
        .rotate(i * 6, 50, 50)


  /* draw hour pointer */
  this.hours = this.rect(1,32)
    .move(50,18)
    .fill(settings.hours)
  
  /* draw minute pointer */
  this.minutes = this.rect(1,42)
    .move(50,8)
    .fill(settings.minutes)
  
  // /* draw second pointer */
    this.seconds = this.rect(0.5,38)
      .move(50,12)
      .fill(settings.seconds)
  
  /* add center point */
  this.center = this.circle(5).move(47.5, 47.5).fill(settings.center)

  /* set pointers without animation */
  this.update(0)
}

SVG.Clock.prototype = new SVG.Container

// Add time management methods to clock
SVG.extend(SVG.Clock, {

  timeZone: function(rawOffset) {
    
    var offset
    this.offset = rawOffset

    return this
  }

, start: function() {
    var self = this

    setInterval(function() {
      self.update()
    }, 1000)
    
    return this
  }

  // Update time
, update: function(duration) {

    /* add any time zone offset */
    if (this.offset == null) this.offset = 0

    /* get current time */
    var time = new Date()
    time.setSeconds(time.getSeconds() + this.offset)

    /* ensure duration */
    if (duration == null) duration = 300
    
    /* set all pointers */
    this
      .setHours(time.getHours(), time.getMinutes())
      .setMinutes(time.getMinutes(), duration)
      .setSeconds(time.getSeconds(), duration)

    return this
  }
  // Set hour
, setHours: function(hours, minutes) {
    /* store hour */
    this.time.hours = hours
    
    /* set pointer */
    this.hours
      .rotate((360 / 12 * ((hours + minutes / 60) % 12)), 50, 50)
    
    return this
  }
  // Set minute
, setMinutes: function(minutes, duration) {
    if (minutes == this.time.minutes)
      return this
    
    /* store minutes */
    this.time.minutes = minutes
    
    /* register a full circle */
    if (minutes == 0)
      this.full.minutes++
    
    /* calculate rotation */
    var deg = this.full.minutes * 360 + 360 / 60 * minutes
    
    /* animate if duration is given */
    if (duration)
      this.minutes
        .animate(duration, SVG.easing.smooth)
        .rotate(deg, 50, 50)
    else
      this.minutes
        .rotate(deg, 50, 50)
    
    return this
  }
  // Set second
, setSeconds: function(seconds, duration) {
    /* store seconds */
    this.time.seconds = seconds

    /* register a full circle */
    if (seconds == 0)
      this.full.seconds++

    /* calculate rotation */
    var deg = this.full.seconds * 360 + 360 / 60 * seconds

    /* animate if duration is given */
    if (duration)
      this.seconds
      .animate(duration, SVG.easing.smooth)
      .rotate(deg, 50, 50)
    else
      this.seconds
      .rotate(deg, 50, 50)

    return this
    }
  
})

// Extend SVG container
SVG.extend(SVG.Container, {
  // Add clock method 
  clock: function(size) {
    return this.put(new SVG.Clock(size))
  }
  
})
