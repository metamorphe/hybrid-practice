class window.StateMachineAutomata
	constructor: (@op)->
		@paper = Utility.paperSetup(@op.dom)
		@subscribed = ''
		@live_set = false
		@bindTriggers()
	initMachine: ()->
		scope = this
		@machine_settings = @_extractMachine()
		@machine = StateMachine.create(@machine_settings)
		@activateMachine()
	unsubscribe: (scope)->
		if not sc then return
		sc.unsubscribe(scope.subscribed)
	subscribe: ()->
		scope = this
		if @subscribed == ''
			console.info("SUBSCRIBING")
			@subscribed = sc.subscribe "input", (msg)->
				if msg.flag == "S"
					state = msg.args[0]
					if not @live_set
						console.log "SETTING INITIAL", state
						@machine_settings.initial = state
						@op.restart.click();
						@live_set = true
					else
						console.log "UPDATING SM TO", state
						current = @machine.current
						transition = @states[current].transitions[state]
						if _.contains(@machine.transitions(), transition)
							scope.transit.apply(scope, [transition])
						else
							console.log "MISSED STATE", transition
		else
			console.info("UNSUBSCRIBING")
			@subscribed = sc.unsubscribe("input", @subscribed)
			@live_set = false

	activateMachine: ()->
		scope = this
		_.each(_.keys(@states), (state)-> 
			scope.activateState(state, false)
		)
		@activateState(@machine.current, true)
		@bindTransitionInteractivity()
		@bindAcceptorInteractivity()
	bindTriggers: ()->
		scope = this
		@op.restart.click((event)->
			console.info("RESTARTING DEVICE")
			scope.machine = StateMachine.create(scope.machine_settings)
			scope.activateMachine()
		)
		@op.live.click((event)->
			scope.subscribe.apply(scope)
		)
	setState: (state, style)->
		state.children[0].set(style)
	activateState: (state, selected)->
		style = if selected then {fillColor: ACTIVE_STATE} else {fillColor: INACTIVE_STATE}
		@setState @states[state], style
	activateTransition: (transition)->
		arrow = CanvasUtil.queryPrefixIn(transition, "ARROW")
		end = CanvasUtil.queryPrefixIn(transition, "END")
	getTransitionComponents: (transition)->
		components = @transitions[transition]
		arrow = CanvasUtil.queryPrefixIn(components, "ARROW")[0]
		end = CanvasUtil.queryPrefixIn(components, "END")[0]
		acceptor = CanvasUtil.queryPrefixIn(components, "ACCEPTOR")[0]
		{arrow: arrow, name: transition, end: end, acceptor: acceptor}
	transit: (name)->
		scope = this
		if @machine.cannot(name) then return
		t = @getTransitionComponents(name)
		t.arrow.set({strokeColor: ACTIVE_STATE})
		t.end.set({fillColor: ACTIVE_STATE})
		t.acceptor.set({strokeColor: ACTIVE_STATE, strokeWidth: 2})
		if t.acceptor.time_signal_id
			am.sendCommandById(0, "brightness", t.acceptor.time_signal_id)
		action = ()->
			if not scope.machine.cannot(name) then scope.machine[name]();
			t.arrow.set({strokeColor: INACTIVE_STATE_ARROW})
			t.end.set({fillColor: INACTIVE_STATE_ARROW})
			t.acceptor.set({strokeColor: INACTIVE_STATE_ARROW, strokeWidth: 1})
		_.delay(action, 500) 
	bindTransitionInteractivity: ()->
		scope = this
		_.each @transitions, (transition)->
			transition.onClick = ()->
				paper = scope.paper
				name = transition.sm_name
				scope.transit.apply(scope, [name])
	getAcceptor: (pageX, pageY)->
		paper = @paper
		offset = @op.dom.offset() 
		w = @op.dom.width()
		h = @op.dom.height()
		max = new paper.Point(w, h)
		offset = new paper.Point(offset.left, offset.top)
		page = new paper.Point(pageX, pageY)
		pt = page.subtract(offset)

		inside = pt.project(max).length <= max.length and pt.x > 0 and pt.y > 0
		pt = paper.view.viewToProject(pt)

		if not inside then return null
		return _.min @acceptors, (acceptor)->
			pt.getDistance(acceptor.position) # and less than some threshold


	setAcceptorsActive: (active)->
		scope = this
		_.each @acceptors, (acceptor)->
			paper = scope.paper
			if active then acceptor.set {fillColor: "#00A8E1"} else acceptor.set {fillColor: INACTIVE_STATE}
	bindAcceptorInteractivity: ()->
		scope = this

		# _.each @acceptors, (acceptor)->
		# 	acceptor.onMouseEnter = ()->
		# 		paper = scope.paper
		# 		acceptor.set {fillColor: ACTIVE_STATE}
		# 	acceptor.onMouseLeave = ()->
		# 		paper = scope.paper
		# 		acceptor.set {fillColor: INACTIVE_STATE}

	_extractMachine:()->
		scope = this
		states = CanvasUtil.queryPrefix('STATE');
		transitions = CanvasUtil.queryPrefix('TRANSITION')
		
		# TRACKING PAPER ELEMENTS
		@states = {}
		_.each states, (state, i)-> 
			name = CanvasUtil.getName(state).toUpperCase()
			scope.states[name] = state
			state.sm_name = name
			state.transitions = {}
			return 
		@transitions = {}
		_.each transitions, (transition, i)-> 
			name = CanvasUtil.getName(transition).toUpperCase()
			if _.isEmpty(name) then return
			scope.transitions[name] = transition
			transition.sm_name = name
			return
		
		@acceptors = CanvasUtil.queryPrefix("ACCEPTOR")
		
		# STATE MACHINE OBJECT CONSTRUCTION
		transitions = _.map transitions, (transition, i)-> 
			name = CanvasUtil.getName(transition).toUpperCase()			
			arrow = CanvasUtil.queryPrefixIn(transition, "ARROW")
			end = CanvasUtil.queryPrefixIn(transition, "END")
			
			# CHECKS
			if _.isEmpty(name) or _.isEmpty(arrow) or _.isEmpty(end) then return null  #invalid annotation
			
			arrow = arrow[0]
			end = end[0]

			
			forward = arrow.firstSegment.point.getDistance(end.position)
			backward = arrow.lastSegment.point.getDistance(end.position)
			invert = if forward > backward then false else true

			from = _.min states, (state)-> arrow.firstSegment.point.getDistance(state.position)
			to = _.min states, (state)-> arrow.lastSegment.point.getDistance(state.position)
			
			from = CanvasUtil.getName from
			to = CanvasUtil.getName to

			
			
			if invert 
				arrow.from = to
				arrow.to = from
				arrow.transition = name
				scope.states[to].transitions[from] = name;
				{name: name, from: to, to: from} 
			else 
				arrow.from = from
				arrow.to = to
				arrow.transition = name
				scope.states[from].transitions[to] = name;
				{name: name, from: from, to: to}
		
		start = CanvasUtil.queryPrefix('START')
		if _.isEmpty(start)
			console.warn "NO START STATE SPECIFIED"
			return

		start_state = CanvasUtil.queryPrefixIn(start[0], "END")
		if _.isEmpty(start_state)
			console.warn "NO START STATE SPECIFIED"
			callbacks = @_makeCallbacks(transitions)
			return {events: transitions, callbacks: callbacks}
		else
			start_state = start_state[0]
			start_state = _.min states, (state)-> start_state.position.getDistance(state.position)
			start_state = CanvasUtil.getName start_state
			callbacks = @_makeCallbacks(transitions)
			return {events: transitions, initial: start_state, callbacks: callbacks}
	_makeCallbacks: (transitions)->
		scope = this
		callbacks = {}
		_.each transitions, (transition)->
			callback = "on" + transition.name;
			callbackFN = (event, from, to, msg)->
				scope.activateState(from, false)
				scope.activateState(to, true)
			callbacks[callback] = callbackFN
		callbacks
	