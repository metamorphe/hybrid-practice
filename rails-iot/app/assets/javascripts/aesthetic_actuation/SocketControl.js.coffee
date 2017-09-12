class window.USBControl
  @constructor: ()->
    
class window.SocketControl
  @debug: true
  @DISCONNECTED: 0
  @ERROR : 1
  @CONNECTED: 1
  @LOG: true
  constructor: (@op) ->
    console.info '✓ Socket Control '
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
      alertify.notify "<b>Look at the device.</b> Things won't update on the screen anymore.", 'success', 4
      scope.update()
      return

    @ws.onclose = ->
      scope.state = SocketControl.DISCONNECTED
      scope.update()
      return

    @ws.onerror = ->
      scope.state = SocketControl.ERROR
      alertify.notify "<b> HOLD ON! </b>It looks like the server can't connect. Try restarting it.", 'error', 4
      scope.update()
      return

    @ws.onmessage = (evt) ->
      if evt.data
        _.each scope.subscribers.input, (fan)->
          command = scope.stringToCommand(evt.data)
          # console.log evt.data
          if _.isNull command then console.log '↑', evt.data
          else
            # DELAY TRIGGER DETECTED
            switch command.flag
              when "T"
                forceTrigger = {flag: "F", args: command.args[0].toLowerCase()}
                scope.sendMessageAt(forceTrigger, {delay: args[1]})
                # if command
                # fan({flag: flag, args: args})  
              when "G"
                command.args = _.map command.args, (arg)-> return parseFloat(arg)
                fan(command)
              when "M"
                command.args = _.map command.args, (arg)-> return parseFloat(arg)
                fan(command)
              when "V"
                command.args = _.map command.args, (arg)-> return parseFloat(arg)
                fan(command)
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
          alertify.notify "<b> HEADS UP! </b> You are not connected to a device.", 'error', 4
          return
        else 
          scope.ws.send msgString
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
    if SocketControl.debug
      str = str.replace("\n", "").trim();
      parse = str.split(":")
      if parse.length != 2 
        return null        
      else
        flag = parse[0].toUpperCase().trim()
        args = parse[1].trim().split(" ")
        args = _.map args, (arg)->
          if _.isString(arg) then return arg.toUpperCase()
          else if _.isNumber(arg) then return parseInt(arg)            
        return {flag: flag, args: args}
    else
      console.log "TODO: hex read strings"
      
  commandToString: (command) ->
    if SocketControl.debug
      c = [command.flag.toLowerCase().trim(), command.args.join(' ')].join(" ") + "\n"
      return c
    else
      hex = _.flatten([command.flag.toLowerCase().trim().charCodeAt, command.args, "\n".charCodeAt(0)])
      byteArray = new Uint8Array(hex.length)
      return byteArray.buffer
    