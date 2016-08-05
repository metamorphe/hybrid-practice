function Graph(options){
    this.options = options;
    
    this.graph = new paper.Group({
        name: "GRAPH:" + options.name,
    });

    this.init();
    // console.log(this.graph, this.xlabels, this.ylabels)
    this.dom = new paper.Group(this.graph);
    this.dom.addChildren(this.xlabels)
    this.dom.addChildren(this.ylabels)
}

Graph.prototype = {
    init: function(){
        var scope = this;

        var bg = new paper.Path.Rectangle({
            parent: this.graph,
            position: this.options.position,
            width: this.options.size.width, 
            height: this.options.size.height, 
            strokeColor: "black", 
            fillColor: this.options.fillColor, 
            strokeWidth: 2, 
            strokeScaling: false
        });

        this.makeGrid(bg);
        this.addLabels();
    },
    makeGrid: function(bg){
        var scope = this;
        function gridify(rectangle, numP, range, color, weight) {
            var nrange = range == "x" ? "y": "x";
            var steprange = (scope.options.range[range].max - scope.options.range[range].min);
            var step = (scope.options.range[range].max - scope.options.range[range].min) / numP;
           
            if(range == "x"){
                template = new paper.Path.Line({
                    from: [0, 0], 
                    to: [0, scope.options.size.height]
                })
                stepPt = new paper.Point((step/ steprange) * scope.options.size.width, 0);  
            }
            else{
                template = new paper.Path.Line({
                    from: [0, 0], 
                    to: [scope.options.size.width, 0]
                });
                stepPt = new paper.Point(0, (step/ steprange) * scope.options.size.height);
            }
           
            // GRIDLINE STYLING
            template.set({
                    strokeScaling: false,
                    strokeColor: color,
                    strokeWidth: weight,
                    ignoreClick: true
            });

            lines = generate_lines(template, scope.options.range[range], step, stepPt);
            
            g = new paper.Group({
                children: lines, 
                parent: scope.graph,
                name: range + "GRID: " + range +" grid lines"
            });
            g.pivot = g.bounds.bottomRight;
            g.position = scope.graph.bounds.bottomRight;
            return g;
        }
        
        scope.minorY = gridify(bg, 10, "y", new paper.Color(0.8), 0.5);
        scope.majorY = gridify(bg,  2, "y", new paper.Color(0.6), 2.0);
        scope.minorX = gridify(bg, 10, "x", new paper.Color(0.8), 0.5);
        scope.majorX = gridify(bg,  2, "x", new paper.Color(0.6), 2.0);
    },
    addLabels: function(){
        var scope = this;
        // LABEL STYLE
        var label_style = { 
                fillColor: "black",
                fontFamily: 'Courier New',
                fontWeight: 'bold',
                fontSize: 8 / paper.view.zoom
                // strokeScaling: false
            }

        scope.ylabels = _.map(scope.majorY.children, function(line){
            var label = new PointText({
                name: "XLABEL: " + line.rposition,
                position: line.bounds.expand(scope.graph.bounds.width * 0.3).leftCenter, 
                content: line.rposition.toFixed(1), 
                justification: "right", 
                parent: scope.dom
            });
            label.set(label_style);
            label.position.y += label.bounds.height/4;
            return label;
        });
        scope.xlabels = _.map(scope.majorX.children, function(line){
            var label = new PointText({
                name: "YLABEL: " + line.rposition,
                position: line.bounds.expand(scope.graph.bounds.width * 0.3).bottomCenter, 
                content: line.rposition.toFixed(1), 
                justification: "center",
                parent: scope.dom
            });
            label.set(label_style);
            return label;
        });
    },
    unmapPoint: function(pt){
        pt = pt.subtract(this.graph.bounds.bottomLeft);
        var dst_range = new paper.Point(this.options.size.width, -this.options.size.height);  
        pt = pt.divide(dst_range);

        var range =  new paper.Point(
            this.options.range.x.max - this.options.range.x.min, 
            this.options.range.y.max - this.options.range.y.min
        );
       
        var p_origin = new paper.Point(this.options.range.x.min, this.options.range.y.min);      
        var pt = pt.multiply(range).add(p_origin);
        return pt;

        // var origin = this.graph.bounds.bottomLeft
    },
    mapPoint: function(pt){
        var p_origin = new paper.Point(this.options.range.x.min, this.options.range.y.min);      
        var origin = this.graph.bounds.bottomLeft;
        var valid_pt = pt.subtract(p_origin)
        if(valid_pt.x < 0 || valid_pt.y < 0) return;

        var range =  new paper.Point(
            this.options.range.x.max - this.options.range.x.min, 
            this.options.range.y.max - this.options.range.y.min
        );
        
        var target_range = new paper.Point(this.options.size.width, - this.options.size.height);  
        var normalized = pt.subtract(p_origin).divide(range);
        normalized = normalized.multiply(target_range);
        mapped = normalized.add(this.graph.bounds.bottomLeft);

        // mapped = this.graph.bounds.bottomLeft.subtract(normalized).multiply(new paper.Point(-1, 1))
      
        return mapped;
    },
    plotPoint: function(pt, options){
        pt =  new paper.Path.Circle({
            position: this.mapPoint(pt),
            // radius: 0.01,
            radius: 0.4,
            fillColor: "white",
            strokeScaling: false, 
            parent: this.graph
        });
        pt.set(options);
        return pt;
    }
}



 function generate_lines(template, range, step, stepPt){
    loop = range.identity == "x" ? loop = _.range(range.min, range.max, step): _.range(range.max, range.min, -step);
    step = range.identity == "x" ? step : -step;

    template.rposition = loop[0];
    var lines = [template];
    _.each(loop, function(i){
        nl = template.clone();
        nl.position = nl.position.add(stepPt);
        nl.rposition = i + step;
        lines.push(nl);
        template = nl;
    });
    return lines;
}
