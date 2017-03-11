class window.Widget 
  @bindings = {}
  @enable: ->
    $(document).keypress (event) ->
      _.each Widget.bindings, (func, key)->
        if event.which == parseInt(key)
          func(event)
    return
  @bindKeypress: (key, func, ascii = false)->
    if not ascii
      key = parseInt(key.charCodeAt(0))
    console.log "Binding", key
    Widget.bindings[key] = func;


class window.ActuatorWidgets 
  constructor: ()->
    $(".trash").click ()->
      $(this).siblings().remove()
    @group = new ActuatorGroup
      track: $("#actuator-group")
      result: $("#group-result") 
      button: $("#group-button")
      clear: $("#group-clear")

class window.ActuatorGroup extends Widget
  constructor: (@op)->
    scope = this
    console.log "GroupMaker"
    Widget.bindKeypress "g", ()-> scope.op.button.click()
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
    $('#name-button').on 'click', ->
      name = $(this).siblings('input').val()
      $(this).parents('event').find('.track-unit').find('p.actuator-title:first').html name
      return
    $('#group input').on 'input', ->
      name = $(this).val()
      $(this).parents('event').find('.track-unit').find('p.actuator-title:first').html name
      return
    
