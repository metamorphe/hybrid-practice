class window.USBControl
  @constructor: ()->
    
class window.SocketControl
  @DISCONNECTED: 0
  @ERROR : 1
  @CONNECTED: 1
  @LOG: true
  constructor: (@op) ->
    console.info 'ENABLING SOCKET COMMUNICATION'
    @subscribers = {
      input: {}, 
      output: {}
    }
    @state = SocketControl.DISCONNECTED
    @init()
    return
  subscribe:(channel, fn)->
    id = guid()
    @subscribers[channel][id] = fn
    return id
  unsubscribe: (channel, id)->
    delete @subscribers[channel][id]
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
        $(this).blur()
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
    
    params = GET()
    @host = if GET().ip then GET().ip else "localhost"
    @host = if _.contains @host, ":" then "localhost" else @host
    @ws = new WebSocket('ws://'+ @host+':' + @op.socket_port)

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
        _.each scope.subscribers.input, (fan)->
          command = scope.stringToCommand(evt.data)
          if _.isNull command then console.log '↑', evt.data
          else
            # DELAY TRIGGER DETECTED
            if command.flag == "T"
              forceTrigger = {flag: "F", args: command.args[0].toLowerCase()}
              scope.sendMessageAt(forceTrigger, {delay: args[1]})
            fan({flag: flag, args: args})  
        scope.update()
      return
    return
  sendMessage: (command, op) ->
    scope = this
    f = ()->
      msgString = scope.commandToString(command)
      _.each scope.subscribers.output, (fan)->
        fan(command)  
      if op.live
        if not scope.ws 
          Alerter.warn
            strong: "HEADS UP"
            msg: "NOT CONNECTED TO A WEBSOCKET"
            delay: 2000
          return
        else scope.ws.send msgString
      if op.update then op.update()
      if not op.delay then op.delay = 0
      if scope.LOG then console.log '↓', msgString
    _.delay(f, op.delay)
  sendUpdateMsg: (op) ->
    @sendMessage({flag: 'u', args: []}, op)
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
  stringToCommand: (str)->
    str = str.replace("\n", "").trim();
    parse = str.split(":")
    if parse.length != 2 
      return null        
    else
      flag = parse[0].toUpperCase().trim()
      args = parse[1].split(" ")
      args = _.map args, (arg)->
      if _.isString(arg) then return arg.toUpperCase()
      else if _.isNumber(arg) then return parseInt(arg)            
      return {flag: flag, args: args}
      
  commandToString: (command) ->
    c = [command.flag.toLowerCase().trim(), command.args.join(' ')].join(" ") + "\n"
    return c