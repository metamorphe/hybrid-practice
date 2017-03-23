class window.Widget 
  @bindings = {}
  @enable: ->
    $(".trash").click ()->
      $(this).siblings().remove()
    $(document).keypress (event) ->
      _.each Widget.bindings, (func, key)->
        if event.which == parseInt(key)
          func(event)
    return
  @bindKeypress: (key, func, ascii = false)->
    if not ascii
      key = parseInt(key.charCodeAt(0))
    # console.log "Binding", key
    Widget.bindings[key] = func;


class window.ActuatorWidgets 
  constructor: ()->
    @group = new Grouper
      track: $("#actuator-group")
      result: $("#group-result") 
      button: $("#group-button")
      clear: $("#group-clear")
    @saver = new Saver
      track: $("#library.actuation-design .track-full")
      trigger: $("#library.actuation-design button")
      bindKey: 's'

class window.Saver extends Widget
  constructor: (@op)->
    scope = this
    @name = "actuator_group_library"
    Widget.bindKeypress @op.bindKey, ()-> scope.op.trigger.click()

    @op.trigger.click (event)->
      info = _.chain scope.op.track.find('actuator')
        .map (dom)->  
          act = am.getActuator(parseInt($(dom).data 'id'))
          ids: act.hardware_id
          canvas_id: act.canvas_id
          expression: rgb2hex(act.expression.toCSS())
          type: act.op.type
          title: act.getTitle()
          file: fs.getName()
        .value()
      console.log "INFO", info
      scope.save(info)
  generateKey: ->
    return [fs.getName(), @name].join(':')
  save: (data)->
    key = @generateKey()
    if ws then ws.set(key, JSON.stringify(data))
  load: ->
    scope = this
    key = @generateKey()
    actuators = JSON.parse(ws.get(key))
    _.each actuators, (actuator)->
      console.log actuator
      act = am.clone(null, actuator)
      scope.op.track.append(act)
      am.initActuator.apply(am, [act])
    am.activate()
    
class window.Grouper extends Widget
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
        act = am.clone(act, {title: "Group"})
        scope.op.result.html("").append(act).removeClass('actuator-droppable')
        am.initActuator.apply(am, [act, {group: ids}]);
        am.activate()
      return
    $('#name-button').on 'click', ->
      name = $(this).siblings('input').val()
      $(this).parents('event').find('.track-unit').find('label.title:first').html name
      return
    $('#group input').on 'input', ->
      name = $(this).val()
      $(this).parents('event').find('.track-unit').find('label.title:first').html name
      return
    