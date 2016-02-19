
module jsnips {
    type ITreeData = State.ITree
    export function generate_simple_tree(svg: d3.Selection<any>,cwidth:number,cheight:number, root:ITreeData,shouldReverse=true,foreignRoot?:ITreeData):ITreeData{
        // ************** Generate simple tree  diagram	 *****************
        root.isRoot = true
        var return_root:ITreeData
        var level_text_box
        var tree = d3.layout.tree()
	    .size([cheight, (cwidth/2)-50])
        if(shouldReverse){
            var htmlClass =  " reversed "
        }else{
            var htmlClass =  " not_reversed "
        }
        var nodes = tree.nodes(root)
        var links = tree.links(nodes)
        nodes.forEach(function(d:any) {
            // console.log(d.y)
            // d.y = d.depth * 180 *  0.618
            // d.y = d.depth * 360
            if(shouldReverse){
                d.y = -d.y
            }
            d.y = d.y + cwidth/2
        });
        // Manage distance between elements
        var diagonal = d3.svg.diagonal()
            .source(function(d:any){
                var source:State.ITree = d.source
                // if foreign root, store it to let another sub tree use
                if(d.source.isRoot){
                    return_root = d.source
                }
                // we use other's main node to adjust current data
                if(d.source.isRoot && (foreignRoot != undefined)){
                    var source = foreignRoot
                    // var shouldReverse = false
                    // debugger
                }
                var inc_width = source.bbox.width
                // null is root
                if(shouldReverse){
                    return {x:source.x, y:source.y-inc_width/2}
                }else{
                    return {x:source.x, y:source.y+inc_width/2}
                }
            })
            .target(function(d:any){
                var target:State.ITree = d.target
                var inc_width = target.bbox.width
                if(shouldReverse){
                    return {x:d.target.x, y:d.target.y+inc_width/2}
                }else{
                   return {x:d.target.x, y:d.target.y-inc_width/2}
                }
            })
            .projection(function(d) {
                return [d.y, d.x];
            });
        // just node rendering
        var node = svg.selectAll(".node" + htmlClass)
            .data(nodes)
            .enter()
            .append("g")
            .attr("class", "node" + htmlClass)
            .attr("transform", function(d) {
                return "translate(" + d.y + "," + d.x + ")";
            })
        // text rendering
        node.append("text")
            .attr("dy", function(d:any){return d.font_size/3})
            .style("text-anchor", function(d) { return  "middle"}) 
            .style("font-size",function(d:any){return d.font_size + 'px'})
            .text(function(d:ITreeData) {return d.name})
            .each(function(d:any){
                d.bbox = this.getBBox()
            })
        // link(Important, must be last, so bbox will be populated)
        var link = svg
            .selectAll(".link" + htmlClass)
            .data(links)
            .enter()        
            .append("path")
            .attr("class", "link" + htmlClass)
            .attr("d", diagonal)
            .style("stroke-width", function(d:any) {
                return (d.target.font_size)/3
            })
        svg.selectAll("path.link" +htmlClass).data(links).exit().remove()
        svg.selectAll("g.node text"+ htmlClass).data(nodes).exit().remove()
        return root
        
    }
    export function generate_round_tree(root:ITreeData){
        // ************** Generate round tree  diagram	 *****************
        // proudly taken from http://bl.ocks.org/mbostock/4339607
        // deps: d3.min.js
        var radius = 960 / 2;

        var cluster = d3.layout.cluster()
            .size([360, radius - 120]);

        var diagonal = d3.svg.diagonal.radial()
            .projection(function(d) { return [d.y, d.x / 180 * Math.PI]; });
        
        var svg = d3.select("body").append("svg")
            .attr("width", radius * 2)
            .attr("height", radius * 2)
            .append("g")
            .attr("transform", "translate(" + radius + "," + radius + ")");

        var nodes = cluster.nodes(root);

        var link = svg.selectAll("path.link")
            .data(cluster.links(nodes))
            .enter().append("path")
            .attr("class", "link")
            .attr("d", diagonal);

        var node = svg.selectAll("g.node")
            .data(nodes)
            .enter().append("g")
            .attr("class", "node")
            .attr("transform", function(d) { return "rotate(" + (d.x) + ")translate(" + d.y + ")"; })

        node.append("circle")
            .attr("r", 4.5);

        node.append("text")
            .attr("dy", ".31em")
            .attr("text-anchor", function(d) { return d.x < 180 ? "start" : "end"; })
            .attr("transform", function(d) { return d.x < 180 ? "translate(8)" : "rotate(180)translate(-8)"; })
            .text(function(d:ITreeData) { return d.name; });
        d3.select(self.frameElement).style("height", radius * 2 + "px");
    }
    
    export function generate_expanding_tree(treeData:ITreeData){
        // ************** Generate the tree diagram	 *****************
        // proudly taken from  http://bl.ocks.org/d3noob/8375092
        // deps: d3.min.js
        var margin = {top: 20, right: 120, bottom: 20, left: 120},
	    width = 960 - margin.right - margin.left,
	    height = 500 - margin.top - margin.bottom;
        var i = 0,
	    duration = 750,
	    root;

        var tree = d3.layout.tree()
	    .size([height, width]);
        
        var diagonal:any = d3.svg.diagonal()
	    .projection(function(d) { return [d.y, d.x]; });

        var svg = d3.select("body").append("svg")
	    .attr("width", width + margin.right + margin.left)
	    .attr("height", height + margin.top + margin.bottom)
            .append("g")
	    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        root = treeData[0];
        root.x0 = height / 2;
        root.y0 = 0;
        
        update(root);

        d3.select(self.frameElement).style("height", "500px");

        function update(source) {

            // Compute the new tree layout.
            var nodes = tree.nodes(root).reverse(),
	        links = tree.links(nodes);

            // Normalize for fixed-depth.
            nodes.forEach(function(d) { d.y = d.depth * 180; });

            // Update the nodes…
            var node = svg.selectAll("g.node")
	        .data(nodes, function(d:any) { return d.id || (d.id = ++i); });

            // Enter any new nodes at the parent's previous position.
            var nodeEnter = node.enter().append("g")
	        .attr("class", "node")
	        .attr("transform", function(d) { return "translate(" + source.y0 + "," + source.x0 + ")"; })
	        .on("click", click);

            nodeEnter.append("circle")
	        .attr("r", 1e-6)
	        .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });

            nodeEnter.append("text")
	        .attr("x", function(d) { return d.children || d._children ? -13 : 13; })
	        .attr("dy", ".35em")
	        .attr("text-anchor", function(d) { return d.children || d._children ? "end" : "start"; })
	        .text(function(d) { return d.name; })
	        .style("fill-opacity", 1e-6);

            // Transition nodes to their new position.
            var nodeUpdate = node.transition()
	        .duration(duration)
	        .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });

            nodeUpdate.select("circle")
	        .attr("r", 10)
	        .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });

            nodeUpdate.select("text")
	        .style("fill-opacity", 1);

            // Transition exiting nodes to the parent's new position.
            var nodeExit = node.exit().transition()
	        .duration(duration)
	        .attr("transform", function(d) { return "translate(" + source.y + "," + source.x + ")"; })
	        .remove();

            nodeExit.select("circle")
	        .attr("r", 1e-6);

            nodeExit.select("text")
	        .style("fill-opacity", 1e-6);

            // Update the links…
            var link = svg.selectAll("path.link")
	        .data(links, function(d:any) { return d.target.id; });

            // Enter any new links at the parent's previous position.
            link.enter().insert("path", "g")
	        .attr("class", "link")
	        .attr("d", function(d:any) {
		    var o = {x: source.x0, y: source.y0};
		    return diagonal({source: o, target: o});
	        });

            // Transition links to their new position.
            link.transition()
	        .duration(duration)
	        .attr("d", diagonal);

            // Transition exiting nodes to the parent's new position.
            link.exit().transition()
	        .duration(duration)
	        .attr("d", function(d) {
		    var o = {x: source.x, y: source.y};
		    return diagonal({source: o, target: o});
	        })
	        .remove();

            // Stash the old positions for transition.
            nodes.forEach(function(d) {
	        d["x0"] = d.x;
	        d["y0"] = d.y;
            });
        }

        // Toggle children on click.
        function click(d) {
            if (d.children) {
	        d._children = d.children;
	        d.children = null;
            } else {
	        d.children = d._children;
	        d._children = null;
            }
            update(d);
        }
    }
}
