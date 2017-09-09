class window.Choreography
	@COUNTER: 0
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
		_.extend this, op
		@id = Choreography.COUNTER++
		
		# DEFAULTS
		@ids = []
		@async_period = 500
		@saved = false
		
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
		window.paper = ch.paper
		actuators = actuators or Choreography.ACTUATORS()
		arrows = CanvasUtil.getIDs(@ids)

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
				rtn = 
					hid: actuator.lid
					distance: distance
			else 
				rtn = 
					hid: actuator.lid
					distance: 0
			return rtn
		# Spatial Index Array
		@sia = Choreography.normalize(dist)
		return @sia

	@normalize: (dist)->
	    min = (_.min dist, (d)-> d.distance).distance
	    max = (_.max dist, (d)-> d.distance).distance
	    range = max - min
	    if range != 0
		    dist = _.each dist, (d)-> 
		      d.distance = (d.distance - min)/range

	    dist = _.map dist, (d)-> [d.hid, d.distance]
	    dist = _.object(dist)
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
        ids: @ids
        async_period:  @async_period
        saved: @saved
      set:(obj)->
        scope = this
        if _.isEmpty(obj) then return        
        prev = @form
        _.extend(this, obj)
        @actuator.form = {async_period: parseInt(@async_period)}
        
  
	update:()->
		$('choreography').find('.title').html(@actuator.title)
		$('choreography').find('.title').html(@actuator.title)
		$('choreography').find('.async').html(TimeSignal.pretty_time(@actuator.async_period))
		$('.popover.choreography').find('.popover-content').html(TimeSignal.pretty_time(@actuator.async_period))
		$('.popover.choreography').find('.title').html(@actuator.title)
		$('.popover.choreography').find('input').val(@actuator.async_period)



