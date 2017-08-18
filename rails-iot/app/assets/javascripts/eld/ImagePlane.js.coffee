class window.ImagePlane
  constructor: (options) ->
    width = Ruler.pts2mm(options.width)
    @graph = new Graph(
      name: 'Radial Gradient Graph'
      range: options.range
      shape: 'circle'
      size: new Size(options.width, options.width)
      fillColor: 'black')
    # this.graph.plotPoint(new paper.Point(10, 0));
    @graph.dom.set
      pivot: @graph.dom.bounds.bottomRight
      position: options.position
    return
  @generate: (diffuser, led_ref, ramp, result, params) ->
    bottomReflector = new (paper.Path)(
      parent: result
      name: 'REF:_0.90'
      fillColor: '#ED1C24'
      segments: [
        ramp.bounds.bottomLeft
        ramp.bounds.bottomRight
        led_ref.bounds.topLeft
        led_ref.bounds.bottomLeft
        led_ref.bounds.bottomCenter
        led_ref.bounds.bottomCenter.clone().add(new (paper.Point)(0, 3))
        ramp.bounds.bottomLeft.clone().add(new (paper.Point)(0, 3 + led_ref.bounds.height))
      ])
    switch diffuser
      when 'Planar'
        diff = new (Path.Line)(
          parent: result
          name: 'DIFF:_1.44'
          segments: [
            new (paper.Point)(led_ref.bounds.topCenter.x, ramp.bounds.topRight.y)
            ramp.bounds.topLeft
          ]
          strokeColor: 'blue'
          strokeWidth: 1)
        img_plane = new (Path.Line)(
          parent: result
          name: 'IMG: Image Plane'
          segments: [
            new (paper.Point)(led_ref.bounds.topCenter.x, ramp.bounds.topRight.y)
            ramp.bounds.topLeft
          ]
          strokeColor: 'green'
          strokeWidth: 1)
        img_plane.position.y -= Ruler.mm2pts(4)
        img_plane.reverse()
      when 'Hemisphere'
        cuboid = new (Path.Rectangle)(
          parent: result
          name: 'DIFF:_1.44'
          size: new (paper.Size)(params.lens.width * 2, Ruler.mm2pts(30) * 2)
          strokeColor: 'orange'
          strokeWidth: 1)
        cuboid.set
          pivot: cuboid.bounds.center
          position: new (paper.Point)(led_ref.bounds.topCenter.x, ramp.bounds.topRight.y)
        hemis = new (paper.Path.Ellipse)(cuboid.bounds)
        hemis.set
          parent: result
          strokeColor: 'blue'
          strokeWidth: 1
          name: 'DIFF:_1.44'
        hemis.segments[0].handleIn = null
        hemis.segments[2].handleOut = null
        hemis.segments[3].remove()
        hemis.segments[2].remove()
        hemis.closed = false
        expanded = cuboid.expand(
          strokeAlignment: 'exterior'
          strokeWidth: 1
          name: 'IMG: Image Plane'
          strokeOffset: Ruler.mm2pts(4)
          strokeColor: 'green'
          fillColor: null
          joinType: 'square'
          parent: result)
        cuboid.remove()
        hemis = new (paper.Path.Ellipse)(expanded.bounds)
        hemis.set
          parent: result
          strokeColor: 'green'
          strokeWidth: 1
          name: 'IMG: Image Plane'
        hemis.segments[0].handleIn = null
        hemis.segments[2].handleOut = null
        hemis.segments[3].remove()
        hemis.segments[2].remove()
        hemis.closed = false
        expanded.remove()
      when 'Cuboid'
        cuboid = new Path.Rectangle
          parent: result
          name: 'DIFF:_1.44'
          size: new (paper.Size)(params.lens.width, Ruler.mm2pts(30))
          strokeColor: 'blue'
          strokeWidth: 1
        cuboid.set
          pivot: cuboid.bounds.bottomRight
          position: new (paper.Point)(led_ref.bounds.topCenter.x, ramp.bounds.topRight.y)
        
        expanded = cuboid.expand
          strokeAlignment: 'exterior'
          strokeWidth: 1
          name: 'IMG: Image Plane'
          strokeOffset: Ruler.mm2pts(4)
          strokeColor: 'green'
          fillColor: null
          joinType: 'miter'
          parent: result
          closed: false

        cuboid.segments[3].remove()
        expanded.removeSegments 0, expanded.segments.length - 4
        cuboid.closed = false
        
  visualize: ->
    scope = this
    rays = CanvasUtil.queryPrefix('RAY')
    image_plane = CanvasUtil.queryPrefix('IMG')
    # console.log("RAYS:", rays.length);
    if _.isEmpty(image_plane)
      return
    image_plane = image_plane[0]
    hits = CanvasUtil.getIntersections(image_plane, rays)
    # console.log("HITS:", hits.length);
    origin = image_plane.lastSegment.point
    data = _.map(hits, (h) ->
      pt = h.point.subtract(origin)
      # pt = pt.divide(new paper.Point(image_plane.bounds.width, 1));
      # pt = pt.multiply(new paper.Point(image_plane.bounds.width, 1));
      # pt = pt.add(new paper.Point(-image_plane.bounds.width/2, 0));
      pt
    )
    # console.log(_.map(data, function(d){ return d.toString();}));
    # scope.graph.plotPoint(data[0]);
    # console.log(data[0])
    pts = _.map(data, (pt) ->
      scope.graph.plotPoint pt, fillColor: 'white'
    )
    line_result = new (paper.Group)(
      children: pts
      pivot: scope.graph.unmapPoint(new (paper.Point)(0, 0)))
    line_result
  visualizeWheel: ->
    line_result = @visualize()
    theta = _.range(-180, 180, 1)
    _.each theta, (t) ->
      lr = line_result.clone()
      lr.rotation = t
      return
    return
  visualizeAt: (orientation) ->
    line_result = @visualize()
    lr.rotation = orientation
    this

  @visualizeHits = (hits) ->
    new paper.Group 
      children: _.map hits, (h, i) ->
        c = new paper.Path.Circle
          radius: 0.1
          fillColor: 'orange'
          position: h.point
       

  @getSignal: (bins = 100) ->
    # GATHER ENERGY
    rays = CanvasUtil.queryPrefix('RAY')
    image_plane = CanvasUtil.queryPrefix('IMG')
    if _.isEmpty(image_plane) then return
    image_plane = image_plane[0]

    hits = CanvasUtil.getIntersections(image_plane, rays)
    n = hits.length
    origin = image_plane.firstSegment.point
    data = _.map hits, (h) ->
      pt = image_plane.getNearestPoint(h.point)
      offset = image_plane.getOffsetOf(pt)
      rel_pos = offset
      {
        x: rel_pos
        strength: h.path.strength
        direction: h.path.direction
      }
    range = image_plane.length
    step = range / bins
    hist = _.groupBy data, (ray) ->
      Math.floor ray.x / step
    hist = _.each(hist, (v, k) ->
      hist[k] = _.reduce(v, ((sum, ray) ->
        sum + ray.strength
      ), 0)
      return
    )
    signal = []
    i = 0
    while i < bins
      signal[i] = 0
      i += 1
    for i of hist
      key = parseInt(i)
      signal[key] = hist[i]
    {
      signal: numeric.div(signal, _.max(signal) + 0.01)
      hits: n
    }

  @calculateNormality: (visualize = false) ->
    rays = CanvasUtil.queryPrefix('RAY')
    image_plane = CanvasUtil.queryPrefix('IMG')
    if _.isEmpty(image_plane)
      return 0
    image_plane = image_plane[0]
    hits = CanvasUtil.getIntersections(image_plane, rays)
    if hits.length == 0
      return 0
    sum = _.reduce(hits, ((sum, hit) ->
      # console.log("ANG", hit.path.lastSegment.point.angle);
      offset = image_plane.getOffsetOf(hit.point)
      normal = image_plane.getNormalAt(offset)
      normal.length = 30
      if visualize
        c = new (paper.Path.Line)(
          from: hit.point
          to: hit.point.add(normal)
          strokeColor: 'purple'
          strokeWidth: 0.5
          name: 'DRAY: Desired Ray')
      test = hit.path.lastSegment.point.subtract(hit.point)
      sum + Math.abs(normal.angle - (test.angle)) % 180
    ), 0)
    # console.log(sum, hits.length)
    sum /= hits.length
    # NORMALIZE AND INVERT
    norm = sum / 90
    invert = 1 - norm
    invert * hits.length / rays.length

  @calculateEnergy = (bins = 100) ->
    data = ImagePlane.getSignal(bins)
    signal = data.signal
    _.reduce(signal, ((memo, s) ->
      memo + s
    ), 0) / 50

  @calculateUniformity = (bins = 100) ->
    data = ImagePlane.getSignal(bins)
    signal = data.signal
    # console.log(signal);
    # CAP
    i = 0
    while i < bins
      signal[i] = if signal[i] > 0 then 1 else 0
      i += 1
    hits = _.reduce(signal, ((sum, v) ->
      sum + v
    ), 0)
    area = hits / bins
    area
