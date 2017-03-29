class window.Choreography
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
	@COUNTER: 0
	@CHOREOGRAPHIES: []
	@default: (dom)-> return Choreography.CHOREOGRAPHIES[$("choreography.default").data().id]
	@get: (dom)-> return Choreography.CHOREOGRAPHIES[dom.data().id]
	@ACTUATORS = ()-> CanvasUtil.query paper.project, {prefix: ["NLED", "LED", "HEATER", "MOTOR"]}
	@selected: ()->
		s = $('choreography.selected')
		if s.length == 0 then return null
		return Choreography.CHOREOGRAPHIES[s.data().id]
	popover: ()->
		scope = this
		@dom.data
			content: "500ms"
			placement: 'left'
			template: '<div class="choreography popover" role="tooltip"><div class="arrow"></div><div class="popover-content"></div><input min="0" max="1000" step="10" type="range"/></div>'

		@dom.click (event)-> 
			$(this).blur()			
			event.stopPropagation()
			$('choreography').not(this).popover('hide')
			tag = this.tagName
			$(tag).removeClass 'selected'

			$(this).addClass 'selected'
			ch.mode = "choreography"
			ch.update()
			$('#add-arrows span.info').html("#" + scope.id)
			scope.dom.popover('show')
			$('.choreography.popover').find('input').val(@async_period)
			$('.choreography.popover').find('input').on 'click', (event)->
				event.stopPropagation()
			$('.choreography.popover').find('input').on 'input', (event)->
				pop = $(this).parents('.popover')
				t = $(this).val()
				pop.find('.popover-content').html(TimeSignal.pretty_time(t))
				scope.form = {async_period: t}
	constructor: (op)->
		_.extend this, op
		@id = Choreography.COUNTER++
		@dom.data('id', @id)
		@trigger = @dom.find('button')

		# DEFAULTS
		@ids = []
		@async_period = 500
		@saved = false
		@dom.data
			content: TimeSignal.pretty_time @async_period

		Choreography.CHOREOGRAPHIES.push(this)
		@popover()
		@resolve()
	view_order: (actuators)->
		window.paper = ch.paper
		order = @resolve(actuators)
		_.each order, (p, k)->			
			e = CanvasUtil.query(paper.project, {lid: k})
			e[0].fillColor = Choreography.temperatureColor(p)

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

		@sia = @normalize(dist)
		return @sia

	normalize: (dist)->
	    min = (_.min dist, (d)-> d.distance).distance
	    max = (_.max dist, (d)-> d.distance).distance
	    range = max - min
	    if range != 0
		    dist = _.each dist, (d)-> 
		      d.distance = (d.distance - min)/range

	    dist = _.map dist, (d)-> [d.hid, d.distance]
	    dist = _.object(dist)
	    return dist
    
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
      
        @dom.data @form  
        @setAsync(@async_period)
        
  
	setAsync: (t)->
		@dom.find('.async').html(TimeSignal.pretty_time(t))
		
class window.BehaviorManager
	constructor: (@op) ->
		# $("*").not('.popover').not('actuator').not('datasignal').not('track-full').not('.track-unit').click (event)->
		# 	console.log this
		# 	$('.popover').fadeOut(100)
		scope = this
		@play_ids = []
		@playing = false
		@scrub_ids = []
		@activateDragAndDrop()
		$("button#compose").click(()-> scope.play())
		$("button#add-stage").click(()-> scope.addStage())
		Widget.bindKeypress 32,((event) ->
			event.preventDefault()
			$('#compose').click()), true

		BehaviorManager.CHOREOGRAPHIES = _.map $("choreography"), (dom)-> 
			return new Choreography
				dom: $(dom)

	getActors: ()->
		actuators = _.map $('#stage').find('actuator'), (actor)-> return am.resolve(actor)		
	loadStage: (actuator)->
		if _.isUndefined(actuator.parent)
			template = bm.addStage()
		else
			template = $('#stage acceptor[data-id='+ actuator.parent+']')	
			
		ops = 
			clear: false
			target: template
		ops = _.extend(ops, actuator)
		ActuatorManager.create ops	
	addStage: ()->
		template = $('acceptor.actuator.template').clone().removeClass('template');
		$('#stage').append(template)
		am.activateDragAndDrop()
		return template
	addSignalTrack: (actor)->
		template = $('acceptor.datasignals.template').clone().removeClass('template');
		tracks = _.keys(actor.physical_channels()).length
		template.attr('data-tracks', tracks)
		$('#timetrack').append(template)
		tsm.activateDragAndDrop()
		tsm.activateTrackButtons()
	playScrubber: (start, end)->
		scope = this
		duration = parseInt((end - start))
		@scrubberSet Math.round(@scrubberPos(start))
		@op.scrubber.css
			transition: 'left '+ duration+'ms linear'
			left: Math.round(@scrubberPos(end))
		id = _.delay (()-> scope.pause()), duration
		@scrub_ids.push id
	scrubberSet: (x)->
		@op.scrubber.css
			transition : 'left 0s linear'
			left: x
	scrubberPos: (t)->
		timescale = $('#timetrack acceptor').data().timescale
		w = @op.scrubber.parent().width()
		p = t/timescale * w
		return p
	scrubberTime: ()->
		timescale = $('#timetrack acceptor').data().timescale
		w = @op.scrubber.parent().width()
		t = timescale * @op.scrubber.position().left / w
		return t
	
	play: ()->
		if @playing
			@pause()
			return

		scope = this
		raw_commands = @compile()
		if _.isEmpty raw_commands then return

		t_start = @scrubberTime()
		
		# RESTART
		commands = _.filter raw_commands, (command)-> command.t > t_start
		if _.isEmpty commands 
			t_start = 0
			commands = raw_commands

		start = _.first(commands).t
		end = _.last(commands).t + _.last(commands).duration
		commands = _.each commands, (command)-> command.t = command.t - t_start

		scope.play_ids = Scheduler.schedule(commands, true)
		scope.playScrubber(start, end)
		@playing = true
	pause: ()->
		@op.scrubber.css
			transition : 'left 0s linear'
		pos = @scrubberPos(@scrubberTime())
		@scrubberSet(pos)
		_.each _.flatten([@scrub_ids, @play_ids]), (id)->
			clearTimeout(id)
		@play_ids = []
		@playing = false


	activateDragAndDrop: ()->
		scope = this
		@op.scrubber.draggable
			containment: "parent"
			axis: "x"
			grid: [ 5, 200 ]
			scroll: false
	compile: ()->
		actors = $("#stage actuator").not(".template")
		signal_tracks = $("#timetrack acceptor").not(".template")
		choreos = $("#choreography-binders choreography")
		choreography = _.chain actors
			.map (actor, i)->
				actor = am.resolve(actor)
				channels = _.keys(actor.physical_channels()).sort()
				if i < signal_tracks.length
					signal_track = $(signal_tracks[i])
					signals = signal_track.find('datasignal')
					tracks = signal_track.data().tracks
					timescale = signal_track.data().timescale
					height = signal_track.height()
					width = signal_track.width()
					commands = _.chain signals
						.map (signal, j)->
							# CENTER LEFT CORNER POSITION VECTOR
							a = $(signal).parent().offset()
							b = $(signal).offset()
							pos = {top: b.top - a.top, left: b.left - a.left}
							pos.top += $(signal).height() / 2.0;

							# COLLAPSING TO INDEX 
							i = Math.floor(pos.top / height * tracks)

							# RESOLVING CHANNEL
							channel = channels[i]

							# TIME OFFSET
							offset = (pos.left / width) * timescale

							# COMPILING INSTRUCTIONS PER CHANNEL
							ts = tsm.resolve(signal)
							commands = ts.command_list_data(ts.p_signal,{offset: offset})
							commands = _.map commands, (command) -> 
								cl = actor.perform(channel, command)
								return cl
							commands =_.flatten(commands)
							commands
						.flatten()
						.value()
				else
					return []
			.flatten()
			.sortBy("t")
			.value()
		return choreography