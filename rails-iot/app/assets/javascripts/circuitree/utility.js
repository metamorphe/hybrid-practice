// utility
function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
}

function getBattery(components){
	return battery = _.find(components, function(el, i, arr){
		return !_.isUndefined(el.physical.voltage);
	});	
}

function listToString(list){
	return _.map(list, function(el){ return el.level + " " + el.id;}).join(', ');
}

function printComponent(travelled_from, el, level){
		// console.log(el.id);
		var li = $("<li></li>").addClass('list-group-item');
		var name = $("<h4></h4>").addClass('list-group-item-heading').html(el.id);
	
		var swatch = $('<span></span>').addClass('badge pull-right')
									   .html(el.physical.voltage)
									   .css('background', el.style.color)
									   .appendTo(name);
		var terminalsPolar = ["+", "-"];
		var terminals = ["A", "B"];

		var terms = el.digital.polarity == 1 ? terminals : terminalsPolar;

		var volt = $("<p></p>").addClass('list-group-item-text').html( "voltage: " +  el.physical.voltage);
		
		var physical = _.map(el.physical, function(el, i, arr){
			return 	$("<p></p>").addClass('list-group-item-text').html( i + ": " +  el);
		});

		var items = _.map(el.overlaps, function(el2, i, arr){
			return $("<p></p>").addClass('list-group-item-text').html( terms[i] + " " + listToString(el2) );
		});
		li.append(name, physical, items);
		return li;
	}