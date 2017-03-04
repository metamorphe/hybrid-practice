class window.StateMachineAutomata
	constructor: (@op)->
		@paper = Utility.paperSetup(@op.dom)
	initMachine: ()->
		scope = this
		@machine = @extractMachine()
		if _.isNull(@machine)
			console.warn "COULD NOT EXTRACT MACHINE"
			return
		@machine = StateMachine.create(@machine)
		_.each(@states, (state)-> 
			scope.activateState(state, false)
			)
		activate = @machine.current
		@activateState(@states[activate], true)
		@bindTransitionInteractivity()
	bindTransitionInteractivity: ()->
		scope = this
		_.each @transitions, (transition)->
			transition.onClick = ()->
				paper = scope.paper
				arrow = CanvasUtil.queryPrefixIn(transition, "ARROW")[0]
				end = CanvasUtil.queryPrefixIn(transition, "END")[0]
				acceptor = CanvasUtil.queryPrefixIn(transition, "ACCEPTOR")[0]
				if scope.machine.cannot(arrow.transition) then return
				arrow.set({strokeColor: ACTIVE_STATE})
				end.set({fillColor: ACTIVE_STATE})
				acceptor.set({strokeColor: ACTIVE_STATE, strokeWidth: 2})
				action = ()->
					scope.machine[arrow.transition]();
					arrow.set({strokeColor: INACTIVE_STATE_ARROW})
					end.set({fillColor: INACTIVE_STATE_ARROW})
					acceptor.set({strokeColor: INACTIVE_STATE_ARROW, strokeWidth: 1})
				
				_.delay(action, 500) 

	setState: (state, style)->
		state.children[0].set(style)
	activateState: (state, selected)->
		if selected
			@setState state, {fillColor: ACTIVE_STATE}
		else
			@setState state, {fillColor: INACTIVE_STATE}
	activateTransition: (transition)->
		arrow = CanvasUtil.queryPrefixIn(transition, "ARROW")
		end = CanvasUtil.queryPrefixIn(transition, "END")
	extractMachine:()->
		scope = this
		states = CanvasUtil.queryPrefix('STATE');
		transitions = CanvasUtil.queryPrefix('TRANSITION')
		
		# TRACKING PAPER ELEMENTS
		@states = {}
		_.each states, (state, i)-> 
			name = CanvasUtil.getName(state).toUpperCase()
			scope.states[name] = state
			return 
		@transitions = {}
		_.each transitions, (transition, i)-> 
			name = CanvasUtil.queryPrefixIn(transition, "NAME")
			if _.isEmpty(name) then return
			name = CanvasUtil.getName(name[0]).toUpperCase()
			scope.transitions[name] = transition
			return

		# STATE MACHINE OBJECT CONSTRUCTION
		transitions = _.map transitions, (transition, i)-> 
			name = CanvasUtil.queryPrefixIn(transition, "NAME")
			arrow = CanvasUtil.queryPrefixIn(transition, "ARROW")
			end = CanvasUtil.queryPrefixIn(transition, "END")
			
			# CHECKS
			if _.isEmpty(name) or _.isEmpty(arrow) or _.isEmpty(end) then return null  #invalid annotation
			
			arrow = arrow[0]
			end = end[0]
			name = CanvasUtil.getName(name[0]).toUpperCase()
			

			
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
				{name: name, from: to, to: from} 
			else 
				arrow.from = from
				arrow.to = to
				arrow.transition = name
				{name: name, from: from, to: to}
		
		start = CanvasUtil.queryPrefix('START')
		if _.isEmpty(start)
			console.warn "NO START STATE SPECIFIED"
			return

		start_state = CanvasUtil.queryPrefixIn(start[0], "END")
		if _.isEmpty(start_state)
			console.warn "NO START STATE SPECIFIED"
			callbacks = @makeCallbacks(transitions)
			return {events: transitions, callbacks: callbacks}
		else
			start_state = start_state[0]
			start_state = _.min states, (state)-> start_state.position.getDistance(state.position)
			start_state = CanvasUtil.getName start_state
			callbacks = @makeCallbacks(transitions)
			return {events: transitions, initial: start_state, callbacks: callbacks}
	makeCallbacks: (transitions)->
		scope = this
		callbacks = {}
		_.each transitions, (transition)->
			callback = "on" + transition.name;
			callbackFN = (event, from, to, msg)->
				scope.activateState(scope.states[from], false)
				scope.activateState(scope.states[to], true)
			callbacks[callback] = callbackFN
		callbacks
	