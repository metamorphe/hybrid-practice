class window.Widget 
  @bindings = {}
  @enable: ->
    $(".trash").click ()->
      $(this).siblings().not('button').remove()
    $(".toggle").click ()->
      $(this).parent().toggleClass('shrink')
      state = $(this).parent().hasClass('shrink')
      $(this).parent().find('.trigger').prop("disabled", state)
      if state
        $(this).find('span').removeClass('glyphicon-collapse-up')
        $(this).find('span').addClass('glyphicon-collapse-down')
      else
        $(this).find('span').removeClass('glyphicon-collapse-down')
        $(this).find('span').addClass('glyphicon-collapse-up')
    
    Widget.bindKeypress "u", ()-> $('event button.toggle').click()
    Widget.bindKeypress "i", ()-> $('event.actuation-design button.toggle').click()
    Widget.bindKeypress "o", ()-> $('event.signal-design button.toggle').click()
    Widget.bindKeypress "p", ()-> $('event.composition-design button.toggle').click()

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
    console.log "ENABLING WIDGETS"
    @group = new Grouper
      track: $("#actuator-group")
      result: $("#group-result") 
      trigger: $("#group-button.trigger")
      clear: $("#group-clear")
      bindKey: 'g'
    @saver = new Saver
      track: $("#library.actuation-design .track-full")
      trigger: $("#library.actuation-design button.trigger")
      bindKey: 's'

class window.Saver extends Widget
  constructor: (@op)->
    console.log "Saver"
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
      # console.log "INFO", info
      scope.save(info)
  generateKey: ->
    return [fs.getName(), @name].join(':')
  save: (data)->
    console.log "SAVING"
    key = @generateKey()
    if ws then ws.set(key, JSON.stringify(data))
  load: ->
    scope = this
    key = @generateKey()
    actuators = JSON.parse(ws.get(key))
    console.log "LOADING", actuators.length, "FROM CACHE"
    _.each actuators, (actuator)->
     
      actuatorops = _.extend actuator, 
        parent: scope.op.track
        activate: true
      act = am.clone null, actuatorops
      
class window.Grouper extends Widget
  constructor: (@op)->
    scope = this
    console.log "GroupMaker"
    Widget.bindKeypress @op.bindKey, ()-> scope.op.trigger.click()
    @op.clear.click (event)->
      console.log "CLEARING"
      scope.op.track.html("")
      scope.op.result.html("")
      return
    @op.trigger.click (event)->
      ids = _.chain scope.op.track.find('actuator')
        .map (dom)->
          return $(dom).data 'hardware-id'
        .uniq()
        .value()
        console.log ids
        act = scope.op.track.find('actuator:first')
        act = am.clone act, 
          title: "Group"
          group: ids
          activate: true
          clear: true
          parent: scope.op.result
      return
    $('#name-button').on 'click', ->
      name = $(this).siblings('input').val()
      $(this).parents('event').find('.track-unit').find('label.title:first').html name
      return
    $('#group input').on 'input', ->
      name = $(this).val()
      $(this).parents('event').find('.track-unit').find('label.title:first').html name
      return
    
