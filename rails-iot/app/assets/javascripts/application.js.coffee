//= require jquery
//= require jquery_ujs
//= require bootstrap
//= require underscore
//= require alertify
//= require jquery-ui/core
//= require jquery-ui/widget
//= require jquery-ui/position
//= require jquery-ui/widgets/mouse
//= require jquery-ui/widgets/draggable
//= require jquery-ui/widgets/droppable
//= require jquery-ui/widgets/resizable
//= require jquery-ui/widgets/selectable
//= require jquery-ui/widgets/sortable
//= require_self

window.YELLOW = "#FF9912"
window.WHITE = "#f5f4f0"
window.BLACK = "#000000"
window.ACTIVE_STATE = YELLOW
window.INACTIVE_STATE = WHITE
window.INACTIVE_STATE_ARROW = BLACK

$(()->
  _.mixin isColorString: (str)->
    return typeof str == 'string' && str[0] == "#" && str.length == 7
  _.mixin zeros: (length)->
    return Array.apply(null, Array(length)).map(Number.prototype.valueOf,0)
  _.mixin fill: (length, v)->
    return Array.apply(null, Array(length)).map(Number.prototype.valueOf,v)
  _.mixin repeat: (func, interval)->
    args = _.last arguments, 2
    return setInterval(_.bind(func, null, args), interval);
    
  String.prototype.replaceAll = (search, replacement)->
    target = this
    return target.replace(new RegExp(search, 'g'), replacement)
  
)

window.rgb2hex = (rgb) ->
  rgb = rgb.match(/^rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?/i)
  if rgb and rgb.length == 4 then '#' + ('0' + parseInt(rgb[1], 10).toString(16)).slice(-2) + ('0' + parseInt(rgb[2], 10).toString(16)).slice(-2) + ('0' + parseInt(rgb[3], 10).toString(16)).slice(-2) else ''

window.rgb2hex2 = (rgb) ->
  rgb = rgb.match(/^rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?/i)
  if rgb and rgb.length == 4 then '0x' + ('0' + parseInt(rgb[1], 10).toString(16)).slice(-2) + ('0' + parseInt(rgb[2], 10).toString(16)).slice(-2) + ('0' + parseInt(rgb[3], 10).toString(16)).slice(-2) else ''
transformToAssocArray = (prmstr) ->
  params = {}
  prmarr = prmstr.split('&')
  i = 0
  while i < prmarr.length
    tmparr = prmarr[i].split('=')
    params[tmparr[0]] = tmparr[1]
    i++
  params
window.GET = ->
  prmstr = window.location.search.substr(1)
  if prmstr != null and prmstr != '' then transformToAssocArray(prmstr) else {}

window.guid = ->
  s4 = ->
    Math.floor((1 + Math.random()) * 0x10000).toString(16).substring 1
  s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4()

window.poly = (a, b, c, x) ->
  x ** 2 * a + x * b + c

Math.radians = (degrees) ->
  degrees * Math.PI / 180
Math.degrees = (radians) ->
  radians * 180 / Math.PI

if !Date.now
  Date.now = ->
    (new Date).getTime()

window.DOM = ->

window.DOM.tag = (tag, single) ->
  if single
    $ '<' + tag + '/>'
  else if typeof single == 'undefined'
    $ '<' + tag + '>' + '</' + tag + '>'
  else
    $ '<' + tag + '>' + '</' + tag + '>'

Object.size = (obj) ->
  size = 0
  key = undefined
  for key of obj
    `key = key`
    if obj.hasOwnProperty(key)
      size++
  size


window.Utility = ->

window.Utility.paperSetup = (id, op) ->
  dom = if typeof id == 'string' then $('#' + id) else id
  # w = dom.parent().height()
  if op and op.width then dom.parent().width(op.width+1)
  if op and op.width then dom.width(op.width+1)
  if op and op.height then dom.parent().height(op.height+1)
  if op and op.height then dom.height(op.height)
  # dom.attr 'height', w
  # dom.attr 'width', '90px'
  paper.install window
  myPaper = new (paper.PaperScope)
  myPaper.setup dom[0]
  # if typeof id == 'string'
  #   console.info 'Paper.js installed on', id, w, 'x', h
  # else
  #   console.info 'Paper.js installed:', w, 'x', h
  myPaper





