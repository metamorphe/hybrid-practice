//= require jquery
//= require jquery_ujs
//= require jquery-ui
//= require bootstrap-sprockets
//= require underscore
//= require_self

_.mixin(isColorString: (str)->
  return typeof str == 'string' && str[0] == "#" && str.length == 7)

window.rgb2hex = (rgb) ->
  rgb = rgb.match(/^rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?/i)
  if rgb and rgb.length == 4 then '#' + ('0' + parseInt(rgb[1], 10).toString(16)).slice(-2) + ('0' + parseInt(rgb[2], 10).toString(16)).slice(-2) + ('0' + parseInt(rgb[3], 10).toString(16)).slice(-2) else ''

window.rgb2hex2 = (rgb) ->
  rgb = rgb.match(/^rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?/i)
  if rgb and rgb.length == 4 then '0x' + ('0' + parseInt(rgb[1], 10).toString(16)).slice(-2) + ('0' + parseInt(rgb[2], 10).toString(16)).slice(-2) + ('0' + parseInt(rgb[3], 10).toString(16)).slice(-2) else ''

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

window.Utility.paperSetup = (id) ->
  dom = if typeof id == 'string' then $('#' + id) else id
  w = dom.parent().height()
  h = dom.parent().width()
  dom.attr 'height', w
  dom.attr 'width', h
  paper.install window
  myPaper = new (paper.PaperScope)
  myPaper.setup dom[0]
  if typeof id == 'string'
    console.info 'Paper.js installed on', id, w, 'x', h
  else
    console.info 'Paper.js installed:', w, 'x', h
  myPaper





