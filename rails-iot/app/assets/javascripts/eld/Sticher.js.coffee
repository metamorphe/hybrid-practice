# ANGLE STEP FOR STICHING PROCESS
window.MORPH_LINE_STEP = 1
window.TOPOGRAPHIC_STEP = PROFILE_SAMPLING #0.01
window.DOME_DIFF_EPSILON = 10
window.DOME_STEP = MORPH_LINE_STEP
window.INF_LONG = 10000
window.SLICE_SAMPLE_SIZE = 1

window.rampify = (ramp_lines, parent) ->
  levels = _.range(1, 0, -TOPOGRAPHIC_STEP)
  # levels = [0.1, 0.3, 0.5].reverse()
  # levels = levels.reverse()
  levels = _.map levels, (level) ->
    make_level ramp_lines, level, new (paper.Color)(level)
  ramp = new (paper.Group)(levels)
  ramp.parent = parent
  # ramp.sendToBack()

window.make_level = (ramp_lines, level, color) ->
  # c = new paper.Color "red"
  # c.hue = color.brightness * 360
  ramp_lines = _.groupBy ramp_lines, "origin"
  rampcp = new paper.CompoundPath
      fillColor: color
  _.each ramp_lines, (lines, origin)->
    ramp = new paper.Path
      parent: rampcp
    _.each lines, (rl, idx) ->
      closestStop = _.min rl.ramp, (v) -> Math.abs v[0].gray - level
      offset = closestStop[1] * rl.line.length
      pt = rl.line.getPointAt offset
      ramp.addSegment(pt)
    ramp.closePath()
    return ramp
  return rampcp

window.interpolation_lines = (diffuser, leds, visible = false) ->
  return switch diffuser.className
    when "Group", "CompoundPath"
      return _.chain diffuser.children
              .map (child)->
                window.interpolation_lines(child, leds, visible)
              .flatten()
              .value() 
    when "Path"
      pts = _.range(0, diffuser.length, MORPH_LINE_STEP)
      s = _.map pts, (i) ->
        pt = diffuser.getPointAt(i)
        closest = _.min leds, (l) -> l.position.getDistance pt
        l = new paper.Path.Line
          from: closest.position
          to: pt
          strokeColor: 'blue'
          strokeWidth: 1
          visible: visible
          
        cross = diffuser.getIntersections(l)
        if cross.length >= 2 then l.lastSegment.point = cross[0].point
        {
          line: l
          led: closest
          roundedLength: parseInt(l.length)
          pathOrigin: diffuser.id
        }

window.sliceLines = (lines, cache_gradients) ->
  angles = _.map(lines, (l) ->
    theta = l.line.lastSegment.point.subtract(l.line.firstSegment.point).angle
    lower = theta - (DOME_STEP / 2.0)
    upper = theta + DOME_STEP / 2.0
    upper++
    # overlap for anti-aliasing
    lower--
    # overlap for anti-aliasing
    upper = if upper > 180 then -180 + upper % 180 else upper
    lower = if lower < -180 then 180 + -lower % 180 else lower
    length = l.roundedLength
    # console.log(lower.toFixed(0), theta.toFixed(0), upper.toFixed(0));
    {
      line: l.line
      length: l.roundedLength
      led: l.led
      angleIn: lower
      center: theta
      angleOut: upper
    }
  )
  compact_angles = []
  n = angles.length
  current = angles[0]
  # console.log("CURRENT", current);
  # console.log("LAST", angles[angles.length - 1]);
  travel = 0
  i = 1
  while i < angles.length
    slice = angles[i]
    if Math.abs(slice.length - (current.length)) < DOME_DIFF_EPSILON
      travel += Math.abs(slice.angleOut - (current.angleOut))
      current.angleOut = slice.angleOut
      # current = (slice.length + current.length) / 2.0;
      # console.log("SETTING TO", current.angleIn.toFixed(0), slice.angleOut.toFixed(0), travel);
    else
      compact_angles.push current
      current = slice
      travel = 0
      i++
      continue
    if travel > 360
      current.angleIn = 1
      current.angleOut = 0.999
      compact_angles.push current
    i++
  compact_angles

window.generateSlicedSegment2 = (o, path, gradient, visible = false) ->
  `var arcPoints`
  # Generate both the inPoint and outPoint vectors.
  origin = o.led.position
  # // Define a circle to be the bounding box of the inputted Geometry.
  circle = new (paper.Path.Circle)(
    radius: INF_LONG
    position: origin
    strokeColor: 'blue'
    strokeWidth: 0.5
    visible: visible)
  if o.angleIn > o.angleOut
    a = _.range(o.angleIn, 180, SLICE_SAMPLE_SIZE)
    b = _.range(-180, o.angleOut, SLICE_SAMPLE_SIZE)
    arcPoints = _.flatten([
      a
      b
    ])
  else
    arcPoints = _.range(o.angleIn, o.angleOut + SLICE_SAMPLE_SIZE, SLICE_SAMPLE_SIZE)
  if arcPoints.length < 360
    arcPoints = _.map(arcPoints, (theta) ->
      pt = new (paper.Point)(0, 0)
      pt.length = INF_LONG
      pt.angle = theta
      pt = pt.add(origin)
      l = new (paper.Path.Line)(
        from: origin
        to: pt
        visible: false)
      ixt = l.getIntersections(path)
      ixt[0].point
    )
    # // Define the intersecting path to consist of the inPoint, center, and outPoint.
    intersectingPath = new (paper.Path)(
      segments: _.flatten([
        arcPoints
        origin.clone()
      ])
      strokeWidth: 3
      strokeColor: 'red'
      closed: true)
    # intersectingPath = pieSlice.intersect(path);
    # pieSlice.remove();
  else
    intersectingPath = path
    path.bringToFront()
  intersectingPath.set
    strokeColor: 'black'
    strokeWidth: 0
  intersectingPath.fillColor =
    gradient:
      stops: gradient
      radial: true
    origin: origin
    destination: intersectingPath.segments[0].point.clone()
  intersectingPath

# ---
# generated by js2coffee 2.2.0