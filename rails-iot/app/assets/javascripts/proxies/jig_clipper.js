//    d88b d888888b  d888b   .o88b. db      d888888b d8888b. d8888b. d88888b d8888b. 
//    `8P'   `88'   88' Y8b d8P  Y8 88        `88'   88  `8D 88  `8D 88'     88  `8D 
//     88     88    88      8P      88         88    88oodD' 88oodD' 88ooooo 88oobY' 
//     88     88    88  ooo 8b      88         88    88~~~   88~~~   88~~~~~ 88`8b   
// db. 88    .88.   88. ~8~ Y8b  d8 88booo.   .88.   88      88      88.     88 `88. 
// Y8888P  Y888888P  Y888P   `Y88P' Y88888P Y888888P 88      88      Y88888P 88   YD 
JigClipper.RESOLUTION = 1;
JigClipper.WALL_HEIGHT = 5; //mm                                            
 
JigClipper.SCALE = 100;
JigClipper.TOLERANCE = 0.1;
JigClipper.WALL_THICKNESS = 20;                                                 
                                                                                  
function JigClipper(){
	this.clipper = new ClipperLib.Clipper();
}

JigClipper.subtract = function(a, b){
		var clipType = ClipperLib.ClipType.ctDifference;
		var _a = JigClipper.sample(a, JigClipper.SCALE);
		var _b = JigClipper.sample(b, JigClipper.SCALE);

		var subj = [_a];
		var clips = [_b];
		ClipperLib.JS.ScaleUpPaths(subj, JigClipper.SCALE);
		ClipperLib.JS.ScaleUpPaths(clips, JigClipper.SCALE);

		var solution = new ClipperLib.Paths();
		var c = new ClipperLib.Clipper();
	  	c.AddPaths(subj, ClipperLib.PolyType.ptSubject, true);
	  	c.AddPaths(clips, ClipperLib.PolyType.ptClip, true);
	  	c.Execute(clipType, solution);
	  	console.log("sub_sol", solution);
	  	var ps = [];
		for(var i in solution){
			var p = JigClipper.to_paper_path(solution[i]);
			p.strokeColor = 'magenta';
			ps.push(p);
			p.strokeWidth = 2;
		}
		
		paper.view.update();
		return ps;
}                              
            

JigClipper.clone = function(path){
	console.log(JigClipper.sample(path, JigClipper.RESOLUTION));
	return JigClipper.to_paper_path(JigClipper.sample(path, JigClipper.RESOLUTION));
}
JigClipper.to_paper_path = function(pts){
	var path = new paper.Path();
	path.strokeColor = 'black';
	pts.forEach(function(currentValue, index, array){
		path.add(new paper.Point(currentValue.X/JigClipper.SCALE, currentValue.Y/JigClipper.SCALE));
	});
	path.closed = true;
	return path;
}
JigClipper.sample = function(paper_path, resolution){
	var n = paper_path.length;
	var p = []; 
	for(var i = 0; i < n; i += resolution){
		var point = paper_path.getPointAt(i);
		p.push({X: point.x, Y: point.y});
	}
	return p;
}
JigClipper.custom_offset = function(path, value){
	var pts = [];
	for(var i = 0; i < path.length; i+= JigClipper.RESOLUTION){
		var pt = path.getPointAt(i);
		var normal = path.getNormalAt(i);
		
		normal.length = value;

		var result = new paper.Point(pt.x - normal.x, pt.y - normal.y);
		pts.push(result);
	}
	var p = new paper.Path(pts);
	p.closed = false;
	return p;
}

// TODO: Return all paths
JigClipper.offset = function(path, delta){
		// console.log(path.length);
		var _p = JigClipper.sample(path, JigClipper.RESOLUTION);

		paths = [_p];
		var offset_paths = new ClipperLib.Paths();

		var miterLimit = 2;
		var arcTolerance = 0.25;
		delta *= JigClipper.SCALE;
		
		ClipperLib.JS.ScaleUpPaths(paths, JigClipper.SCALE);
		var co = new ClipperLib.ClipperOffset(miterLimit, arcTolerance);
		co.AddPaths(paths, ClipperLib.JoinType.jtMiter, ClipperLib.EndType.etClosedPolygon);
		co.Execute(offset_paths, delta);

		var ps = [];
		// console.log("offset path length", offset_paths.length)
		
		for(var i in offset_paths){
			var p = JigClipper.to_paper_path(offset_paths[i]);
			// console.log("length", p.length)
			if(p.length > 10)
				ps.push(p);
			else{
				p.remove();
				// console.log("removed", p.length)
			}
		}
		
		paper.view.update();
		return ps;
}

