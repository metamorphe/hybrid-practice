class window.ActuatorGroup
	constructor: (@op)->
		scope = this
		console.log "GroupMaker"
		@op.clear.click (event)->
			console.log "CLEARING"
			scope.op.track.html("")
			scope.op.result.html("")
			return
		@op.button.click (event)->
			ids = _.chain scope.op.track.find('actuator')
			.map (dom)->
        		return $(dom).data 'hardware-id'
        	.uniq()
        	.value()
        	console.log ids
        	act = scope.op.track.find('actuator:first')
        	act = am.clone(act, "Group")
        	scope.op.result.html("").append(act).removeClass('actuator-droppable')
        	am.initActuator.apply(am, [act, {group: ids}]);
        	am.activate()
      		return