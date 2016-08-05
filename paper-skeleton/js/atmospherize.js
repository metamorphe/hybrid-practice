/* Calling color_in
* 	var SHAPES = CanvasUtil.query(paper.project, {className: "Shape"}); 
	var PATHS = CanvasUtil.query(paper.project, {className: "Path"}); 
	var ELEMENTS = _.flatten([SHAPES, PATHS]);
	color_in(ELEMENTS );
 */
function atmospherize(list){
	setShadow(list);
	tint(list);
}

var MAX_SHADOW = 5;
var MAX_BLUR = 12;

function setShadow(path_list){
	_.each(path_list, function(path){
		var path_under = getPathUnderneath(path, path_list);
		var canvas_brightness = new paper.Color($("#myCanvas").css("background")).brightness;
		var difference = path_under ? path.fillColor.brightness - path_under.fillColor.brightness : canvas_brightness - path.fillColor.brightness;
	
		var comingOut = difference > 0; // true if coming out
		difference = Math.abs(difference);

		if (comingOut){
			// IF COMING OUT
			path.set({
				shadowColor: new Color(0,0,0),
				shadowBlur: difference * MAX_BLUR,
				shadowOffset: new paper.Point(MAX_SHADOW*difference, MAX_SHADOW*difference)
			});
		}else{
			// IF GOING IN
			path.set({
				shadowColor: new Color(0,0,0),
				shadowBlur: difference * MAX_BLUR,
				shadowOffset: new paper.Point(-MAX_SHADOW*difference, -MAX_SHADOW*difference)
			});
		}
	});

}

function getPathUnderneath(path, elements){
	var center = path.bounds.center;
	var candidates = _.filter(elements, function(el){
		return el.contains(center);
	});
	var index = candidates.indexOf(path);
	if (index > -1){
		candidates.splice(index, 1);
	}			
	var candidates = _.sortBy(candidates, function(c){
		return Math.abs(path.index - c.index);
	});
	var pathUnderneath = candidates[0];
	return pathUnderneath;
}
function tint(path_list){
	var saturation = 0.1;
	_.each(path_list, function(path){
		if(path.fillColor.brightness <= 0.25){
			path.fillColor.hue = 235;
			path.fillColor.saturation = saturation;
		}else if(path.fillColor.brightness > 0.25 && path.fillColor.brightness <=0.5){
			path.fillColor.hue = 182;
			path.fillColor.saturation = saturation;
		}else{
			path.fillColor.hue = 0;
			path.fillColor.saturation = saturation;
		}
	});
}