class window.Composition
  @constructor: (@op)->
    @initEditor()
    @initEditorButton()
  initEditor:()->
    editor = ace.edit(@op.editor)
    editor.setTheme 'ace/theme/monokai'
    # var JavaScriptMode = ace.require("ace/mode/javascript").Mode;
    # editor.session.setMode(new JavaScriptMode());
    newSession = ace.createEditSession('', 'ace/mode/javascript')
    editor.setSession newSession
    editor.$blockScrolling = Infinity
    editor
  initEditorButton:()->
    # scope = this;
    # editor = scope.editor
    # $('button.sexy').click ->
    #   newSession = ace.createEditSession('', 'ace/mode/javascript')
    #   editor.setSession newSession
     
    #   ts = scope.getActiveTimeSignal()
    #   commands = ts.command_list.apply(ts)
    #   editor.insert 'function myBehavior(){\n'
      
    #   _.each commands, (command) ->
    #     txt = scope.sendCommand(scope, command.param)
    #     editor.insert txt
    #     editor.insert '\u0009delay(' + command.duration.toFixed(0) + ');\n'
    #     return
    #   editor.insert '}\n'

    #   _.each commands, (command) ->
    #     _.delay(scope.sendCommand, command.t, scope, command.param) 
    #     return
