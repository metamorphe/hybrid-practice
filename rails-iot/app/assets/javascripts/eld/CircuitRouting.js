function CircuitRouting(){}

CircuitRouting.generateNodes = function(nodes, callbackFN) {
    var c = new Artwork("/components/APA102C_opt.svg", function(footprint) {
        square = footprint.queryPrefix("SMD");
        square[0].remove();
        nodes = _.map(nodes, function(element) {
            Artwork.getPrefix(element);
            is_breakout = ["BO", "BI"].indexOf(Artwork.getPrefix(element)) != -1;

            if (is_breakout) {
                rectangle = new Path.Rectangle({
                    rectangle: element.bounds,
                    strokeColor: "black",
                    background: "white"
                });
            } else {
                var fp = footprint.clone();
                fp.svg.position = element.position;
                rectangle = fp.svg;
            }

            // Establish two circles to help with routing.
            var offset = new paper.Point(POINT_OFFSET, 0);
            var entryPoint = new Path.Circle({
                position: rectangle.bounds.leftCenter.clone().subtract(offset),
                radius: 3,
                fillColor: "blue"
            });
            var exitPoint = new Path.Circle({
                position: rectangle.bounds.rightCenter.clone().add(offset),
                radius: 3,
                fillColor: "blue"
            });
            var in_offset = new paper.Point(POINT_INNER_OFFSET, 0);
            var contactEntryPoint = new Path.Circle({
                position: rectangle.bounds.leftCenter.clone().add(in_offset),
                radius: 2,
                fillColor: "green"
            });
            var contactExitPoint = new Path.Circle({
                position: rectangle.bounds.rightCenter.clone().subtract(in_offset),
                radius: 2,
                fillColor: "green"
            });

            var group = new Group([rectangle, entryPoint, exitPoint, contactEntryPoint, contactExitPoint]);

            // group.text = pointText;
            group.lid = element.lid;
            group.rectangle = rectangle;
            group.inputPoint = entryPoint;
            group.outputPoint = exitPoint;
            group.contactInput = contactEntryPoint;
            group.contactOutput = contactExitPoint;
            return group;
        });

        callbackFN(nodes);
        footprint.remove();
    });
}

// Function to obtain cost (Path length) from node with two neighbors.
CircuitRouting.cost = function(node, paths) {
    is_breakout = _.isNull(node.left) || _.isNull(node.right);
    // console.log(node.rectangle.name,  is_breakout)
    breakout_bias = is_breakout ? 10000000000000 : 0;
    // if(node.rotation % 45 == 0 ) breakout_bias = 0;
    return breakout_bias + _.reduce(paths, function(memo, path) {
        return memo + path.length;
    }, 0);
};

// Helper Function to determine optimal routing.
CircuitRouting.bestCost = function(node) {
    is_breakout = _.isNull(node.left) || _.isNull(node.right);
    thetas = _.range(-180, 180, THETA_STEP);
    if(is_breakout) thetas = _.range(-180, 180, 180);

    var cost_table = [];
    var original_rotation = node.rotation;

    cost_table = _.map(thetas, function(theta){
        node.rotation = theta;
        var neighbors = [];

        if (!_.isNull(node.left))
            neighbors.push([node.left.outputPoint.position, node.inputPoint.position]);
        if (!_.isNull(node.right))
            neighbors.push([node.outputPoint.position, node.right.inputPoint.position]);

        neighbors = _.map(neighbors, function(neighbor) {
            return new Path(neighbor[0], neighbor[1])
        });

        result = { id: node.lid, theta: theta, cost: CircuitRouting.cost(node, neighbors) };
        _.each(neighbors, function(neighbor) { neighbor.remove() });
        return result;
    });

    node.rotation = original_rotation;

    return _.min(cost_table, function(entry) {return entry.cost });
}

// Function to route the rectangles together based on overall cost.
 CircuitRouting.route = function(nodes) {
    difference = Number.MAX_SAFE_INTEGER;
    iters = 0;

    while (difference > EPSILON && iters < OPT_MAX_ITERS) {
        result = _.map(nodes, function(node, i) {
            return CircuitRouting.bestCost(node);
        });

        difference = _.reduce(nodes, function(memo, node, i) {
            var prev = node.rotation;
            node.rotation = result[i].theta;
            return memo + Math.abs(prev - result[i].theta);
        }, 0);

        paper.view.update();
        iters++;
        console.log("OPT STEP", iters, difference);
    }
    return result;
};

var circuit_solution = [];
var circuit_nodes = null;
var circuit_solution_energy = 1000000;

CircuitRouting.generateNeighbor = function(){
    _.each(circuit_solution, function(cs){
         var node = CanvasUtil.query(paper.project, {id: cs.id});
         node.rotation = cs.rotation;
   });
   var angle_range =  NEARNESS_CRITERIA * 360;
   console.log(angle_range);
   var half_range = angle_range / 2.0;
    _.each(circuit_nodes, function(node){
        var move = angle_range * Math.random();
        var move = move - half_range;
        node.rotation += move;
    });
    return CircuitRouting.energy();
}


CircuitRouting.generateNewSolution = function(){
    _.each(circuit_nodes, function(node){
        node.rotation = (Math.random() * 360) - 180;
    });
    return CircuitRouting.energy();
}

CircuitRouting.acceptNeighbor = function(){
    circuit_solution_energy = CircuitRouting.energy();
    circuit_solution = _.map(circuit_nodes, function(node){
        return {id: node.id, rotation: node.rotation};
    });
}


CircuitRouting.energy = function(){    
    // console.log()
    pts = _.chain(circuit_nodes)
           .map(function(node, i, arr) {  
                if (!_.isNull(node.right))
                    return [node.contactOutput.position, node.outputPoint.position, node.right.inputPoint.position, node.right.contactInput.position];
            })
           .flatten()
           .compact()
           .value();
    path = new paper.Path({
        segments: _.flatten(pts),
    });
    n = path.length;
    path.remove();
    return n;
}

var nodes;
CircuitRouting.anneal = function(){
    var options = {
        initialTemperature:  100,
        initialStabilizer:   30,
        coolingFactor:       0.5,
        stabilizingFactor:   1.00,
        freezingTemperature: 0, 
        generateNewSolution: CircuitRouting.generateNewSolution, 
        generateNeighbor: CircuitRouting.generateNeighbor, 
        acceptNeighbor: CircuitRouting.acceptNeighbor
    };

    SimulatedAnnealing.Initialize(options);
    
    console.log("System – T:", SimulatedAnnealing.GetCurrentTemperature().toFixed(2), "E:", SimulatedAnnealing.GetCurrentEnergy().toFixed(2));

    
    steps = 0;
    intervalId = setInterval(function(){
        done = false;
        while(! done){
            var done = SimulatedAnnealing.Step();
            steps ++; 
            console.log("System – T:", SimulatedAnnealing.GetCurrentTemperature().toFixed(2), "E:", SimulatedAnnealing.GetCurrentEnergy().toFixed(2), "SE:", circuit_solution_energy);
            paper.view.update();
        }
        if(done == true){
           console.log("SOLUTION", circuit_solution, circuit_solution_energy);
           _.each(circuit_solution, function(cs){
             var node = CanvasUtil.query(paper.project, {id: cs.id});
             node.rotation = cs.rotation;
             CircuitRouting.connect_the_dots(circuit_nodes);
           });
           clearInterval(intervalId);
        }
    }, 50);
}




CircuitRouting.connect_the_dots = function(nodes) {
    pts = []
    var lines = new paper.Group({ name: "TRACE: Trace Expansion" });
    _.each(nodes, function(node, i, arr) {
        var neighbors = [];

        if (!_.isNull(node.right))
            neighbors.push([node.contactOutput.position, node.outputPoint.position, node.right.inputPoint.position, node.right.contactInput.position]);

        neighbors = _.map(neighbors, function(neighbor, i, arr) {
            pts.push(neighbor);

            return new paper.Path({
                parent: lines,
                segments: neighbor,
                strokeColor: "blue",
                strokeWidth: 3
            })
        });
    });
    bgPath = new paper.Path({
        strokeColor: "yellow",
        segments: _.flatten(pts),
        strokeWidth: Ruler.mm2pts(8.5)
    });
    bgPath.sendToBack();
}

CircuitRouting.cleanup = function(nodes, e) {
    var ngroup = new paper.Group(nodes);
    _.each(nodes, function(node) {
        node.inputPoint.remove();
        node.outputPoint.remove();
        node.contactInput.remove();
        node.contactOutput.remove();
    });
    var invisible = _.compact(_.flatten([e.art, e.dds, e.leds, e.cp, e.bi, e.bo, e.diff]));
    Pipeline.set_visibility(invisible, false);
}