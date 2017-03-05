# Allows for querying scene graph elements using prefix annotation
#    LEDS --> obj.query({prefix:['NLED']});
#    Interactive LEDS --> obj.query({prefix:['ILED']});
#    Breakout --> obj.query({prefix:['BO']});
#    Breakin --> obj.query({prefix:['BI']});
#    Breakin --> obj.queryPrefix("BI");

window.CanvasUtil = ->

CanvasUtil.import = (filename, options) ->
  extension = filename.split('.')
  extension = extension[extension.length - 1]
  if extension == 'svg'
    paper.project.importSVG filename, (item) ->
      item.set options
      return
  else
    console.log 'IMPLEMENTATION JSON IMPORT'
  return

CanvasUtil.getLEDS = (diffuser) ->
  leds = CanvasUtil.queryPrefix('NLED')
  leds = _.filter(leds, (led) ->
    diffuser.contains led.position
  )
  leds

CanvasUtil.getDiffusers = (led) ->
  diffs = CanvasUtil.queryPrefix('DDS')
  diffs = _.filter(diffs, (diff) ->
    diff.contains led.position
  )
  diffs

CanvasUtil.getMediums = ->
  reflectors = CanvasUtil.queryPrefix('REF')
  lenses = CanvasUtil.queryPrefix('LENS')
  diffusers = CanvasUtil.queryPrefix('DIFF')
  _.each diffusers, (el) ->
    el.optic_type = 'diffuser'
    el.reflectance = 0.3
    el.refraction = 0.8
    # el.probability = 0.5;
    name = Artwork.getName(el).split('_')[1]
    name = name.split('_')[0]
    el.n = parseFloat(name)
    return
  _.each reflectors, (el) ->
    el.optic_type = 'reflector'
    el.reflectance = 0.9
    return
  _.each lenses, (el) ->
    el.optic_type = 'lens'
    el.refraction = 0.80
    name = Artwork.getName(el).split('_')[1]
    name = name.split('_')[0]
    el.n = parseFloat(name)
    return
  _.flatten [
    lenses
    reflectors
    diffusers
  ]

CanvasUtil.export = (filename) ->
  console.log 'Exporting SVG...', filename
  prev_zoom = paper.view.zoom
  paper.view.zoom = 1
  paper.view.update()
  exp = paper.project.exportSVG(
    asString: true
    precision: 5)
  saveAs new Blob([ exp ], type: 'application/svg+xml'), filename + '.svg'
  paper.view.zoom = prev_zoom
  paper.view.update()
  return

CanvasUtil.fitToViewWithZoom = (element, bounds, position) ->
  position = position or paper.view.center
  scaleX = element.bounds.width / bounds.width
  scaleY = element.bounds.height / bounds.height
  scale = _.max([
    scaleX
    scaleY
  ])
  console.log 'SET ZOOM TO', scale, bounds.width, bounds.height, 'for', element.bounds.width, element.bounds.height
  paper.view.zoom = 1 / scale
  paper.view.center = position
  return

CanvasUtil.getIDs = (arr) ->
  _.chain(arr).map((el) ->
    CanvasUtil.query paper.project, id: el
  ).flatten().compact().value()

CanvasUtil.getIntersections = (el, collection) ->
  hits = _.map(collection, (c) ->
    c.getIntersections el
  )
  hits = _.compact(hits)
  hits = _.flatten(hits)
  hits

CanvasUtil.query = (container, selector) ->
  `var prefixes`
  # Prefix extension
  if 'prefix' of selector
    prefixes = selector['prefix']

    selector['name'] = (item) ->
      p = CanvasUtil.getPrefixItem(item)
      prefixes.indexOf(p) != -1

    delete selector['prefix']
  else if 'pname' of selector
    prefixes = selector['pname']

    selector['name'] = (item) ->
      p = CanvasUtil.getNameItem(item)
      prefixes.indexOf(p) != -1

    delete selector['pname']
  elements = container.getItems(selector)
  elements = _.map(elements, (el, i, arr) ->
    if el.className == 'Shape'
      nel = el.toPath(true)
      el.remove()
      nel
    else
      el
  )
  elements

CanvasUtil.queryName = (selector) ->
  CanvasUtil.query paper.project, pname: [ selector ]

CanvasUtil.queryPrefix = (selector) ->
  CanvasUtil.query paper.project, prefix: [ selector ]

CanvasUtil.queryPrefixIn = (sub, selector) ->
  CanvasUtil.query sub, prefix: [ selector ]

CanvasUtil.queryIDs = (selector) ->
  _.map selector, (id) ->
    CanvasUtil.queryID id

CanvasUtil.queryID = (selector) ->
  result = CanvasUtil.query(paper.project, id: selector)
  if result.length == 0 then null else result[0]

CanvasUtil.queryPrefixWithId = (selector, id) ->
  _.where CanvasUtil.queryPrefix(selector), lid: id

CanvasUtil.set = (arr, property, value) ->
  if typeof property == 'object'
    _.each arr, (el) ->
      for k of property
        `k = k`
        value = property[k]
        el[k] = value
      return
  else
    _.each arr, (el) ->
      el[property] = value
      return
  return

CanvasUtil.call = (collection, calling) ->
  _.each collection, (rt) ->
    rt[calling]()
    return
  return

CanvasUtil.getPrefix = (item) ->
  if _.isUndefined(item)
    return ''
  if _.isUndefined(item.name)
    return ''
  # if(item.name.split(":").length < 2) return "";
  if item.name.split(':').length < 2
    return ''
  item.name.split(':')[0].trim()

CanvasUtil.getPrefixItem = (item) ->
  if _.isUndefined(item)
    return ''
  if _.isNull(item)
    return ''
  if item.split(':').length < 2
    return ''
  item.split(':')[0].trim()

CanvasUtil.getName = (item) ->
  if _.isUndefined(item)
    return ''
  if _.isUndefined(item.name)
    return ''
  if item.name.split(':').length < 2
    return ''
  name = item.name.split(':')[1].trim()
  if(name[0] == "_") then name = name.slice(1)
  name = name.replace("_x5F_", "_")
  name


CanvasUtil.getNameItem = (item) ->
  if _.isUndefined(item)
    return ''
  if item.split(':').length < 2
    return ''
  item.split(':')[1].trim()

# ---
# generated by js2coffee 2.2.0