class window.Choreography
	@COUNTER: 0
	@SCALE: 10000
	@library: []
	@default: (dom)-> return Choreography.CHOREOGRAPHIES[$("choreography.default").data().id]
	@ACTUATORS = ()-> Artwork.ACTUATORS()
	@selected: ()->
		if am 
			act = am.getActiveActuator()
			if not act then return null
			else return act.choreo
		else
			return null

	# OBJECT METHODS
	constructor: (op)->
		if not op.actuator
			console.error op.actuator, "ATTEMPT TO CREATE CHOREO WITHOUT ACT GROUP"
		
		_.extend this, op
		@_form = 
			id: Choreography.COUNTER++		
			async_period: 500
			saved: false
			paperPaths: []

		@form = op
		Choreography.library.push(this)
		@resolve()

	view_order: (actuators)->
		window.paper = ch.paper
		order = @resolve(actuators)
		_.each order, (p, k)->			
			e = CanvasUtil.query(paper.project, {lid: k})
			if _.isNaN p
				throw new Error "INVALID"
			style = {color: Choreography.temperatureColor(p)}
			CanvasUtil.setStyle e, style
			
	resolve: (actuators)->
		affordances = paper.project.getItems
			affordance: true
		CanvasUtil.call affordances, "remove"


		scope = this
		window.paper = ch.paper
		actuators = actuators or Choreography.ACTUATORS()
		arrows = CanvasUtil.getIDs(@form.paperPaths)

		dist = _.map actuators, (actuator)->
			if arrows.length != 0
				closest_arrow = _.min arrows, (arrow)->
					arrow = arrow.pathway
					npt = arrow.getNearestPoint(actuator.position)
					return npt.getDistance(actuator.position)
				

				closest_arrow = closest_arrow.pathway
				npt = closest_arrow.getNearestPoint(actuator.position)
				offset = closest_arrow.getOffsetOf(npt)
				distance =  offset / closest_arrow.length

				anchor = actuator.bounds.topCenter.add(new paper.Point(0, -5))

				c = new paper.Path.Line
					parent: closest_arrow
					from: anchor.clone()
					to: npt
					strokeWidth: 2
					affordance: true
					choreography: true
					visible: not $("#choreo-visibility").hasClass('active')
				d = new paper.Path.Circle
					radius: 5
					parent: closest_arrow
					position: anchor.clone()
					affordance: true
					choreography: true
					visible: not $("#choreo-visibility").hasClass('active')

				
				rtn = 
					hid: actuator.lid
					distance: distance
					affordanceLine: c
					affordanceDot: d
			else 
				rtn = 
					hid: actuator.lid
					distance: 0
					affordanceLine: null
					affordanceDot: null
			return rtn
		# Spatial Index Array
		sia = Choreography.normalize(dist)
		_.each sia, (node)->
			if node.affordanceLine
				node.affordanceLine.strokeColor = Choreography.temperatureColor(node.distance)
			if node.affordanceDot
				node.affordanceDot.fillColor = Choreography.temperatureColor(node.distance)
		
		sia = _.map sia, (d)-> [d.hid, d.distance]
		sia = _.object(sia)
		@_form.sia = sia

		return @_form.sia

	@normalize: (dist)->
	    min = (_.min dist, (d)-> d.distance).distance
	    min = 0
	    max = (_.max dist, (d)-> d.distance).distance
	    range = max - min
	    if range != 0
		    dist = _.each dist, (d)->  
		    	d.distance = (d.distance - min)/range
	    return dist

	@temperatureColor: (p)->
	    if p < 0 or p > 1 then console.warn "OUT OF RANGE - TEMP TIME", v
	    if p > 1 then p = 1
	    if p < 0 then p = 0
	    # "#000000",
	    thermogram = [ "#380584", "#A23D5C", "#FAA503", "#FFFFFF"];
	    thermogram.reverse();
	    
	    thermogram = _.map thermogram, (t) -> return new paper.Color(t)
	    if p == 0 then return thermogram[0]
	    i = p * (thermogram.length - 1)
	    
	    a = Math.ceil(i)
	    b = a - 1
	    terp = a - i
	    red = thermogram[a]
	    blue = thermogram[b]    

	    c = red.multiply(1-terp).add(blue.multiply(terp))
	    c.saturation = 0.8
	    return c
    
	Object.defineProperties @prototype,
    form: 
      get: ->
        return @_form
      set:(obj)->
        if _.isEmpty(obj) then return        
        _.extend(@_form, obj)
        # @actuator.form = {async_period: parseInt(@async_period)}
        
  
	update:()->
		$('choreography').find('.title').html(@actuator.title)
		$('choreography').find('.title').html(@actuator.title)
		$('choreography').find('.async').html(TimeSignal.pretty_time(@actuator.async_period))
		$('.popover.choreography').find('.popover-content').html(TimeSignal.pretty_time(@actuator.async_period))
		$('.popover.choreography').find('.title').html(@actuator.title)
		$('.popover.choreography').find('input').val(@actuator.async_period)



