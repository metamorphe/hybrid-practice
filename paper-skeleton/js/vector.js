<!DOCTYPE html>
<html>
	<head>
		<title>Vector.</title>
		<script type="text/javascript" src="libs/jquery.min.js"></script>
		<script type="text/javascript" src="libs/paper-full.min.js"></script>
		<script type="text/javascript" src="libs/bootstrap.min.js"></script>
		<script type="text/javascript" src="libs/underscore.js"></script>
		<script type="text/javascript" src="libs/math.js"></script>

		<script type="text/javascript" src="js/artwork.js"></script>
		<script type="text/javascript" src="js/ruler.js"></script>
		<link rel="stylesheet" type="text/css" href="css/bootstrap.css"></style>

		<script type="text/javascript">
		 	var nineSegment;
			$(function(){
				// MAIN FUNCTION
				$('#downloadButton').click(function(){
					console.log("clicked");
					$(this).attr('href', $('#myCanvas')[0].toDataURL("image/png") ).attr('download', 'mymodel.png');
				});
				$('#myCanvas').attr('height', $(window).height());
				$('#myCanvas').attr('width', $(window).width());
	

				paper.install(window);
				paper.setup('myCanvas');			
				//img/nine-segment.svg

					display = null;
					runScript(display);
			});
			function runScript(display){
				var vectorStart, vector, vectorPrevious;
				var vectorItem; items = []; dashedItems = [];

				//Example usage of drawVector
				// position = view.center.clone();
				// var from = position; var to = position.add(new Point(-90, -11));
				// var line = new Path.Line(from, to);
				// line.strokeColor = 'black'; line.strokeWidth = 1;
				// drawVector(line.segments[0].point, line.segments[1].point, line);

				var values = {
					fixLength: false,
					fixAngle: false,
					showCircle: false,
					showAngleLength: true,
					showCoordinates: false
				};


				function processVector(event, drag) {
					vector = event.point - vectorStart;
					if (vectorPrevious) {
						if (values.fixLength && values.fixAngle) {
							vector = vectorPrevious;
						} else if (values.fixLength) {
							vector.length = vectorPrevious.length;
						} else if (values.fixAngle) {
							vector = vector.project(vectorPrevious);
						}
					}
					drawVector(drag);
				}

				function drawVector(vectorStart, vectorEnd, vector) {

					drawLength(vectorStart, vectorEnd, vector.angle < 0 ? -1 : 1, true);
					
				}

				function drawAngle(center, vector, label) {
					var radius = 25, threshold = 10;
					if (vector.length < radius + threshold || Math.abs(vector.angle) < 15)
						return;
					var from = new Point(radius, 0);
					var through = from.rotate(vector.angle / 2);
					var to = from.rotate(vector.angle);
					var end = center + to;
					dashedItems.push(new Path.Line(center,
							center + new Point(radius + threshold, 0)));
					dashedItems.push(new Path.Arc(center + from, center + through, end));
					var arrowVector = to.normalize(7.5).rotate(vector.angle < 0 ? -90 : 90);
					dashedItems.push(new Path([
							end + arrowVector.rotate(135),
							end,
							end + arrowVector.rotate(-135)
					]));
					if (label) {
						// Angle Label
						var text = new PointText(center
								+ through.normalize(radius + 10) + new Point(0, 3));
						text.content = Math.floor(vector.angle * 100) / 100 + '°';
						text.fillColor = 'black';
						items.push(text);
					}
				}

				function drawLength(from, to, sign, label, value, prefix) {
					var lengthSize = 5;
					if ((to - from).length < lengthSize * 4)
						return;
					var vector = to.subtract(from);
					var awayVector = vector.normalize(lengthSize).rotate(90 * sign);
					var upVector = vector.normalize(lengthSize).rotate(45 * sign);
					var downVector = upVector.rotate(-90 * sign);
					var lengthVector = vector.normalize(
							vector.length / 2 - lengthSize * Math.sqrt(2));
					var line = new Path();
					line.add(from.add(awayVector));
					line.lineBy(upVector);
					line.lineBy(lengthVector);
					line.lineBy(upVector);
					var middle = line.lastSegment.point;
					line.lineBy(downVector);
					line.lineBy(lengthVector);
					line.lineBy(downVector);
					dashedItems.push(line);
					if (label) {
						// Length Label
						var textAngle = Math.abs(vector.angle) > 90
								? textAngle = 180 + vector.angle : vector.angle;
						// Label needs to move away by different amounts based on the
						// vector's quadrant:
						var away = (sign >= 0 ? [1, 4] : [2, 3]).indexOf(vector.quadrant) != -1
								? 8 : 0;
						value = value || vector.length;
						var text = new PointText({
							point: middle + awayVector.normalize(away + lengthSize),
							content: (prefix || '') + Math.floor(value * 1000) / 1000,
							fillColor: 'black',
							justification: 'center'
						});
						text.rotate(textAngle);
						items.push(text);
					}
				}

				var dashItem;

				// function onMouseDown(event) {
				// 	var end = vectorStart + vector;
				// 	var create = false;
				// 	if (event.modifiers.shift && vectorItem) {
				// 		vectorStart = end;
				// 		create = true;
				// 	} else if (vector && (event.modifiers.option
				// 			|| end && end.getDistance(event.point) < 10)) {
				// 		create = false;
				// 	} else {
				// 		vectorStart = event.point;
				// 	}
				// 	if (create) {
				// 		dashItem = vectorItem;
				// 		vectorItem = null;
				// 	}
				// 	processVector(event, true);
				// //	document.redraw();
				// }

				// function onMouseDrag(event) {
				// 	if (!event.modifiers.shift && values.fixLength && values.fixAngle)
				// 		vectorStart = event.point;
				// 	processVector(event, event.modifiers.shift);
				// }

				// function onMouseUp(event) {
				// 	processVector(event, false);
				// 	if (dashItem) {
				// 		dashItem.dashArray = [1, 2];
				// 		dashItem = null;
				// 	}
				// 	vectorPrevious = vector;
				// }

				// function onMouseDrag(event) {
				// 	if (!event.modifiers.shift && values.fixLength && values.fixAngle)
				// 		vectorStart = event.point;
				// 	processVector(event, event.modifiers.shift);
				// }

				//combine onMouseDown and onMouseUp logic
				function displayAngle() {
					var end = vectorStart + vector;
					var create = false;
					if (vectorItem) {
					// if (event.modifiers.shift && vectorItem) {
						vectorStart = end;
						create = true;
					} else if (vector && (event.modifiers.option
							|| end && end.getDistance(event.point) < 10)) {
						create = false;
					} else {
						vectorStart = event.point;
					}
					if (create) {
						dashItem = vectorItem;
						vectorItem = null;
					}
					processVector(event, true);
				//	document.redraw();
				}

				
			}
				

		</script>
	</head>
	<body>
		<div class="container">
			<canvas id="myCanvas" style="position:absolute" id="canvas"></canvas>
			<a id="downloadButton" class='btn btn-default'> DOWNLOAD </a>
		</div>
	</body>
</html>

<style> 
	#downloadButton{
		position: absolute;
		top: 20px;
		left: 20px;
	}
	body, html{
		margin: 0;
		padding: 0;
		background: none;
	}
</style>