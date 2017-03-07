class window.SocketControl
  constructor: (@op) ->
    console.info 'ENABLING SOCKET COMMUNICATION'
    @subscribers = {}
    @state = SocketControl.DISCONNECTED
    @init()
    return
  subscribe:(fn)->
    id = guid()
    @subscribers[id] = fn
    return id
  unsubscribe: (id)->
    delete @subscribers[id]
    return ''
  init: ->
    scope = this
    success = @processPorts()

    # ADD TO DOM
    available_ports = _.map(@ports, (port, i, arr) ->
      dom = $('<option></options>').html(port.name.toUpperCase()).attr('value', port.value)
      dom
    )
    @op.selector.html available_ports
    
    # ADD INTERACTIVITY
    if success
      @op.trigger.click ->
        switch scope.state
          when SocketControl.DISCONNECTED
            scope.connect()
          when SocketControl.CONNECTED
            scope.disconnect()
          when SocketControl.ERROR
            scope.connect()
        return
    @update()
    return
  update: ->
    scope = this
    switch @state
      when SocketControl.DISCONNECTED
        @_disconnect_func scope.op.trigger
      when SocketControl.CONNECTED
        @_connect_func scope.op.trigger
      when SocketControl.ERROR
        @_error_func scope.op.trigger
    return
  disconnect: ->
    @ws.onclose = ->
    # disable onclose handler first
    @ws.close()
    @state = SocketControl.DISCONNECTED
    @update()
    return
  connect: ->
    scope = this
   
    @ws = new WebSocket('ws://localhost:' + @op.socket_port)

    scope.state = @ws.readyState

    @ws.onopen = ->
      scope.state = SocketControl.CONNECTED
      scope.update()
      return

    @ws.onclose = ->
      scope.state = SocketControl.DISCONNECTED
      scope.update()
      return

    @ws.onerror = ->
      scope.state = SocketControl.ERROR
      scope.update()
      return

    @ws.onmessage = (evt) ->
      if evt.data
        _.each scope.subscribers, (fan)->
          data= evt.data.replace("\n", "").trim();
          parse = data.split(":")
          if parse.length != 2
            console.log '↑', evt.data
          else
            flag = parse[0].toUpperCase()
            args = parse[1].split(" ")
            args = _.map args, (arg)->
              if _.isString(arg) then return arg.toUpperCase()
              else if _.isNumber(arg) then return parseInt(arg)            
            # DELAY TRIGGER DETECTED
            if flag == "T"
              scope.sendMessageAt(["f ", args[0].toLowerCase(), "\n"].join(""), args[1])
              return
            fan({flag: flag, args: args})
          return
        scope.update()
      return
   
    return
  sendUpdateMsg: (delay = 0) ->
    @sendMessageAt 'u\n', delay
    return
  didYouSaySomething: (message)->
    @sendMessage(message + "\n");
  sendMessage: (msgString) ->
    if @state != SocketControl.CONNECTED
      return
    try
      @ws.send msgString
      console.log '↓', msgString
    catch e
      console.error 'ERROR SENSING', msgString
    true
  sendMessageAt: (msgString, timeFromNow, updateFN) ->
    `var updateFN`
    if _.isUndefined(updateFN)
      updateFN = ->

    if timeFromNow == 0
      @sendMessage msgString
      updateFN()
      return
    scope = this
    
    msgFN = ->
      scope.sendMessage msgString
      updateFN()
      return

    _.delay(msgFN, timeFromNow)
    return
  _noports_func: () ->
    console.warn 'NO PORTS'
    @op.trigger.removeClass('btn-default btn-success').addClass('btn-danger').find('span').removeClass('glyphicon-send glyphicon-ok').addClass 'glyphicon-remove'
    @op.selector.prop 'disabled', 'disabled'
    @op.status.html 'RECONNECT DEVICE?'
    return
  _connect_func: () ->
    port = @op.selector.val()
    @op.trigger.removeClass('btn-danger btn-success').addClass('btn-default').find('span').removeClass('glyphicon-send glyphicon-remove').addClass 'glyphicon-remove'
    @op.selector.prop 'disabled', 'disabled'
    @op.status.html port
    return
  _error_func: () ->
    @op.trigger.removeClass('btn-default btn-success').addClass('btn-danger').find('span').removeClass('glyphicon-send glyphicon-ok').addClass 'glyphicon-remove'
    @op.status.html 'ARDUINO SERVER IS OFF?'
    return
  _disconnect_func: (dom) ->
    @op.trigger.removeClass('btn-danger btn-default').addClass('btn-success').find('span').removeClass('glyphicon-ok glyphicon-remove').addClass 'glyphicon-send'
    @op.selector.prop 'disabled', false
    @op.status.html '–'
    return
  processPorts: ->
    @ports = _.map(@op.ports, (el, i, arr) ->
      name = el.split('/')
      name = name[name.length - 1]
      {
        name: name
        value: el
      }
    )
    if _.isEmpty @ports
      ports = [ {name: 'NO PORTS DETECTED', value: null} ] 
      @_noports_func()
      return false
    return true

window.SocketControl.DISCONNECTED = 0
window.SocketControl.ERROR = -1
window.SocketControl.CONNECTED = 1