class window.Benchmark
	constructor: (@op)->
		scope = this
		@elapsedTime = 0
		@editor = ace.edit(@op.editor)
		@editor.setTheme('ace/theme/monokai')
		newSession = ace.createEditSession('', 'ace/mode/javascript')
		@editor.setSession(newSession)
		@editor.$blockScrolling = Infinity
		@op.run_button.click ()->
			val = scope.editor.getValue()
			eval(val);
			return
	# SPECIFIC TO RUNTIME ENVIRONMENT
	init: ->
		@elapsedTime = 0
		return
	play: (transition, delay) ->
		@elapsedTime += delay
		_.delay (->
			sm.transit sm, transition
			return
		), @elapsedTime
		return
	run: ->
		console.log 'NOT YET IMPLEMENTED'
		return
	# ---
	# generated by js2coffee 2.2.0