class window.Artwork
	constructor: (@file, @loadFN, @cloned) ->
		@svg = null
		if _.isUndefined @cloned then @import @loadFN else @clone()
	import: (loadFN) ->
		console.info 'ARTWORK: SVG IMPORT'
		scope = this
		paper.project.importSVG @file, (item) ->
			scope.svg = item
			scope.svg.position = paper.view.center
			scope.process()
			loadFN scope.svg
			if vm then vm.update()
			return
		return
	clone: ->
		cl = new Artwork(@svgPath, @loadFN, true)
		cl.svg = @svg.clone()
		cl
	process: ->
		# @orderLeds()

	# remove: ->
	# 	@svg.remove()
	# 	return
	# queryable: ->
	# 	_.map @query({}), (el) ->
	# 		el.name	  
	# query: (selector) ->
	# 	CanvasUtil.query @svg, selector
	# queryPrefix: (selector) ->
	# 	@query prefix: [ selector ]
	# orderLeds: ->
	# 	leds = CanvasUtil.queryPrefix('NLED')
	# 	cp = CanvasUtil.queryPrefix('CP')
	# 	bi = CanvasUtil.queryPrefix('BI')
	# 	# CHECKS
	# 	if _.isEmpty leds
	# 		console.warn("NO LEDS DETECTED")
	# 		return 
	# 	if _.isEmpty cp
	# 		console.warn("NO PATH; CAN'T ENUMERATE LEDS")
	# 		return 
	# 	if _.isEmpty bi
	# 		console.warn("NO BREAKIN; CAN'T ENUMERATE LEDS")
	# 		return
	# 	cp = cp[0]
	# 	bi = bi[0]
	# 	forward = cp[0].firstSegment.point.getDistance(bi.firstSegment.point)
	# 	backward = cp[0].lastSegment.point.getDistance(bi.firstSegment.point)
		
	# 	_.each leds, (led) ->
	# 		cpPoint = cp.getNearestPoint(led.position)
	# 		led.offset = polarity * cp.getOffsetOf(cpPoint)
	# 		return

	# 	leds = _.sortBy allLeds, 'offset'

	# 	_.each allLeds, (led, id) ->
	# 		obj.lid = id
	# 		return
	# loadLEDS: (scope) ->
	# 	leds = scope.queryPrefix('NLED')
	# _.each leds, (led) ->
	# 	# console.log(led.name);	
	# 	# if(led.name.indexOf("{") != -1){	
	# 	# data = JSON.parse(led.name.split("_")[1]);	# led.target = 7;//data.target;	# if(data.forceTarget) led.forceTarget = 7;//data.forceTarget;	# led.colorID = new paper.Color(data.colorID[0], data.colorID[1], data.colorID[2]);	# led.fillColor = new paper.Color(data.colorID[0], data.colorID[1], data.colorID[2]);	# // led = _.extend(led, data);	# console.log("EXTEND", JSON.parse(led.name.split("_")[1]));	if !paper.tool or !paper.tool.holder		return
	# 	paper.tool.holder.makeLED led.position, CanvasUtil.queryPrefix('DIF')
	# 	# var nled =  new paper.Path.Rectangle({
	# 	# 	name: "NLED: APA102C", 
	# 	# 	size: new paper.Size(Ruler.mm2pts(LED_WIDTH), Ruler.mm2pts(LED_WIDTH)),
	# 	# 	strokeColor: "black",
	# 	# 	strokeWidth: 1, 
	# 	# 	opacity: 1.0,
	# 	# 	parent: CanvasUtil.queryPrefix("ELD")[0], 
	# 	# 	position: led.position
	# 	# });
	# 	led.remove()
	# 	# nled.fillColor = new paper.Color(data.colorID)
	# 	# nled.colorID = new paper.Color(data.colorID)
	# 	# nled.position = new paper.Point(data.position)
	# 	# nled.target = data.target;
	# 	# if(data.forceTarget) led.forceTarget = data.forceTarget;
	# 	# paper.tool.holder.addRays(diffs, led);
	# 	# }
	# 	return
	# return