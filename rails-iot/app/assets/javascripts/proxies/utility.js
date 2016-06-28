// db    db d888888b d888888b db      d888888b d888888b db    db 
// 88    88 `~~88~~'   `88'   88        `88'   `~~88~~' `8b  d8' 
// 88    88    88       88    88         88       88     `8bd8'  
// 88    88    88       88    88         88       88       88    
// 88b  d88    88      .88.   88booo.   .88.      88       88    
// ~Y8888P'    YP    Y888888P Y88888P Y888888P    YP       YP

function Utility(){

}

Utility.unpackChildren = function(parent, arr){
	if(_.isUndefined(parent.children)){
		arr.push(parent);
		return arr;
	}
	else{
		for(var i = 0; i < parent.children.length; i++){
			Utility.unpackChildren(parent.children[i], arr);
		}
	}
	return arr;
}
function shoelace(pta, ptb){
	return (pta.x - ptb.x) * (pta.y + ptb.y);
}

function addPoints(pta, ptb){
	return new paper.Point(pta.x + ptb.x, pta.y + ptb.y);
}
function subPoints(pta, ptb){
	return new paper.Point(pta.x - ptb.x, pta.y - ptb.y);
}    
                                
function closest_in_array(arr, goal){
	var closestIDX = arr.reduce(function (prev, curr) {
					  return (Math.abs(curr - goal) < Math.abs(prev - goal) ? curr : prev);
					});
	return closestIDX;
}
function getFirst(pt, intersections){
	if (intersections.length == 0) return -1;
	var min_idx = -1;
	var min_dist = 1000000000;
	for(var i in intersections){

		var dist = pt.getDistance(intersections[i].point);
		if(dist < min_dist){
			min_dist = dist;
			min_idx = i;
		}
	}
	return intersections[min_idx].point;
}
