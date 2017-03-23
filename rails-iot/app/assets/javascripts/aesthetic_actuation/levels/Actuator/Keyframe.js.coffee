# class LightTransition extends Transition
# 	constructor: (@op)->
# 	make: ->
# 		# get and clone template
# 	play: ->
# 		#get keyframe before
# 		#get keyframe after if any
# 		switch @op.style
# 			when "fade_to_black" then @transit(a, b, @fade_to_black)
# 			when "fade_to_white" then @transit(a, b, @fade_to_white)
# 			when "cross_dissolve" then @transit(a, b, @cross_dissolve)
# 		# send commands
# 	transit: (a, b, func)->
# 		a = a.tail()
# 		b = b.head()
# 		# zip pairings
# 		# for each command
# 			# func(a, b, duration)
# 	fade_to_color: (a, b, duration)->
# 		# for a given duration, 
# 		# generate the instruction set for fading to black
# 	cross_dissolve: (a, b, duration)->
# 		# fade_to_color(a, b, duration)
# 	fade_to_black:(a, b, duration)->
# 		# @fade_to_color(a, new paper.Color('#000000'), duration/2)
# 		# @fade_to_color(new paper.Color('#000000'), b, duration/2)
# 	fade_to_white:(a, b, duration)->
# 		# @fade_to_color(a, new paper.Color('#FFFFFF'), duration/2)
# 		# @fade_to_color(new paper.Color('#FFFFFF'), b, duration/2)

# class Keyframe
# 	constructor:(@op)->
# 	make: ->
# 		# get and clone html template
# 		# activate drag and drop capabilities
# 	tail: ->
# 		# if not compiled, then compile
# 	head: ->
# 		# if not compiled, then compile
# 	compile: ->
# 		# get actuator
# 		# get channel, signal pair
# 		# get command lists
# 	play: ->
# 		# if not compiled, then compile
# 		# send to device
