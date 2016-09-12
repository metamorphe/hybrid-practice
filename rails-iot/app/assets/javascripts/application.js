// This is a manifest file that'll be compiled into application.js, which will include all the files
// listed below.
//
// Any JavaScript/Coffee file within this directory, lib/assets/javascripts, vendor/assets/javascripts,
// or vendor/assets/javascripts of plugins, if any, can be referenced here using a relative path.
//
// It's not advisable to add code directly here, but if you do, it'll appear at the bottom of the
// compiled file.
//
// Read Sprockets README (https://github.com/sstephenson/sprockets#sprockets-directives) for details
// about supported directives.
//
//= require jquery
//= require jquery_ujs
//= require jquery-ui
//= require bootstrap
//= require Chart
// require turbolinks
// require_self
function rgb2hex(rgb){
 rgb = rgb.match(/^rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?/i);
 return (rgb && rgb.length === 4) ? "#" +
  ("0" + parseInt(rgb[1],10).toString(16)).slice(-2) +
  ("0" + parseInt(rgb[2],10).toString(16)).slice(-2) +
  ("0" + parseInt(rgb[3],10).toString(16)).slice(-2) : '';
}
function rgb2hex2(rgb){
 rgb = rgb.match(/^rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?/i);
 return (rgb && rgb.length === 4) ? "0x" +
  ("0" + parseInt(rgb[1],10).toString(16)).slice(-2) +
  ("0" + parseInt(rgb[2],10).toString(16)).slice(-2) +
  ("0" + parseInt(rgb[3],10).toString(16)).slice(-2) : '';
}

setVisibility = function(arr, isVisible){
  _.each(arr, function(el){
    el.visible = isVisible ? 1: 0;
  });
}

Math.radians = function(degrees) {
  return degrees * Math.PI / 180;
};
 
// Converts from radians to degrees.
Math.degrees = function(radians) {
  return radians * 180 / Math.PI;
};

if (!Date.now) {
    Date.now = function() { return new Date().getTime(); }
}

function GET() {
      var prmstr = window.location.search.substr(1);
      return prmstr != null && prmstr != "" ? transformToAssocArray(prmstr) : {};
}

function transformToAssocArray( prmstr ) {
    var params = {};
    var prmarr = prmstr.split("&");
    for ( var i = 0; i < prmarr.length; i++) {
        var tmparr = prmarr[i].split("=");
        params[tmparr[0]] = tmparr[1];
    }
    return params;
}


function DOM(){}
DOM.tag = function(tag, single){
	if(single) return $("<" + tag + "/>");
	else if(typeof single === "undefined") return $("<" + tag + ">" + "</" + tag + ">")
	else return $("<" + tag + ">" + "</" + tag + ">")
}

function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
}

Object.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};

function FancyPrint(){}
FancyPrint.range = function(prefix, arr){
    var min = _.min(arr);
    var max = _.max(arr);
    console.log(prefix, ": [", min.toFixed(2), ", ", max.toFixed(2), "] -->", (max-min).toFixed(2));
}
// var params = getSearchParameters();
function poly(a, b, c, x){ return Math.pow(x, 2) * a + x * b + c}
function norm(arr){
    var min = _.min(arr); 
    var max = _.max(arr);
    var range = max - min;
    return _(arr).map(function(el){ return (el - min) / range; });
}

function Utility(){}
Utility.paperSetup = function(dom){
        dom.attr('height', $(window).height());
        dom.attr('width', $(window).width());
        paper.install(window);
        paper.setup('myCanvas');
      }
