var layout = null;

self.addEventListener('message',  function(event){
	
	switch (event.data.type) {
			case "start":
				
				/* get graph data from event.data.graph*/
				var data = {} 
				data.layout = JSON.parse(event.data.layout);
				/*create the layout object */
				layout = self.layout = new Layout.ForceDirected(new Graph(data.layout.graph) ,data.layout.stiffness ,data.layout.repulsion ,data.layout.damping ,data.layout.minEnergyThreshold,
						data.layout.graph.edgeSprings,
						data.layout.graph.nodePoints,
						data.layout.boundingBox)
				
				/* run it */
				layout.start();
				break;
			case "stop":
				/* stop layout */
				layout.stop();
				break;
			case "update":
				/* update graph data*/
				//TODO update the graph data
	}
});



var Springy = {};

//Basic Graph object to hold graph data
Graph = function(graph) {
	this.updateData(graph.adjacency, graph.nodes,graph.edges);
}
//function to update graph data
Graph.prototype.updateData = function(adjacency, nodes,edges) {
	this.adjacency = adjacency;
	this.nodes = nodes;
	this.edges = edges;
}

// find the edges from node1 to node2
Graph.prototype.getEdges = function(node1, node2) {
	if (node1.id in this.adjacency
		&& node2.id in this.adjacency[node1.id]) {
		return this.adjacency[node1.id][node2.id];
	}

	return [];
};

// Vector
var Vector = Springy.Vector = function(x, y) {
	this.x = x;
	this.y = y;
};

Vector.random = function() {
	return new Vector(10.0 * (Math.random() - 0.5),
			10.0 * (Math.random() - 0.5));
};

Vector.prototype.add = function(v2) {
	return new Vector(this.x + v2.x, this.y + v2.y);
};

Vector.prototype.subtract = function(v2) {
	return new Vector(this.x - v2.x, this.y - v2.y);
};

Vector.prototype.multiply = function(n) {
	return new Vector(this.x * n, this.y * n);
};

Vector.prototype.divide = function(n) {
	return new Vector((this.x / n) || 0, (this.y / n) || 0); // Avoid divide
};

Vector.prototype.magnitude = function() {
	return Math.sqrt(this.x * this.x + this.y * this.y);
};

Vector.prototype.normal = function() {
	return new Vector(-this.y, this.x);
};

Vector.prototype.normalise = function() {
	return this.divide(this.magnitude());
};

Layout = {}

var Layout = Springy.Layout = {};

Layout.ForceDirected = function(graph, stiffness, repulsion, damping,
		minEnergyThreshold,edgeSprings,nodePoints,boudingBox) {
	this.graph = graph;
	this.stiffness = stiffness; // spring stiffness constant
	this.repulsion = repulsion; // repulsion constant
	this.damping = damping; // velocity damping factor
	this.minEnergyThreshold = minEnergyThreshold || 0.01; // threshold used to
															// determine render
															// stop

	this.nodePoints = edgeSprings; // keep track of points associated with nodes
	this.edgeSprings = nodePoints; // keep track of springs associated with edges
};

/**
 * Start simulation if it's not running already.
 * In case it's running then the call is ignored, and none of the callbacks passed is ever executed.
 */
Layout.ForceDirected.prototype.start = function() {
	var t = this;

	if (this._started) return;
	this._started = true;
	this._stop = false;
	var DEFAULT_STEP = 10;


	var step = function(){
		t.tick(0.03);

		//message worker creator to render(with the new calculated data)
		postMessage({type:"update",calculated:{edgeSprings:t.edgeSprings,nodePoints:t.nodePoints,boundingBox:t.boundingBox}});

		// stop simulation when energy of the system goes below a threshold
		if (t._stop || t.totalEnergy() < t.minEnergyThreshold) {
			t._started = false;
			postMessage({type:"stop"});
		} else {
			setTimeout(step,DEFAULT_STEP);
		}
	};
	
	step();
};

Layout.ForceDirected.prototype.stop = function() {
	this._stop = true;
}

Layout.ForceDirected.prototype.point = function(node) {
	if (!(node.id in this.nodePoints)) {
		var mass = (node.data.mass !== undefined) ? node.data.mass : 1.0;
		this.nodePoints[node.id] = new Layout.ForceDirected.Point(Vector.random(), mass);
	}

	return this.nodePoints[node.id];
};

Layout.ForceDirected.prototype.spring = function(edge) {
	if (!(edge.id in this.edgeSprings)) {
		var length = (edge.data.length !== undefined) ? edge.data.length : 1.0;

		var existingSpring = false;

		var from = this.graph.getEdges(edge.source, edge.target);
		from.forEach(function(e) {
			if (existingSpring === false && e.id in this.edgeSprings) {
				existingSpring = this.edgeSprings[e.id];
			}
		}, this);

		if (existingSpring !== false) {
			return new Layout.ForceDirected.Spring(existingSpring.point1, existingSpring.point2, 0.0, 0.0);
		}

		var to = this.graph.getEdges(edge.target, edge.source);
		from.forEach(function(e){
			if (existingSpring === false && e.id in this.edgeSprings) {
				existingSpring = this.edgeSprings[e.id];
			}
		}, this);

		if (existingSpring !== false) {
			return new Layout.ForceDirected.Spring(existingSpring.point2, existingSpring.point1, 0.0, 0.0);
		}

		this.edgeSprings[edge.id] = new Layout.ForceDirected.Spring(
			this.point(edge.source), this.point(edge.target), length, this.stiffness
		);
	}

	return this.edgeSprings[edge.id];
};

// callback should accept two arguments: Node, Point
Layout.ForceDirected.prototype.eachNode = function(callback) {
	var t = this;
	this.graph.nodes.forEach(function(n){
		callback.call(t, n, t.point(n));
	});
};

// callback should accept two arguments: Edge, Spring
Layout.ForceDirected.prototype.eachEdge = function(callback) {
	var t = this;
	this.graph.edges.forEach(function(e){
		callback.call(t, e, t.spring(e));
	});
};

// callback should accept one argument: Spring
Layout.ForceDirected.prototype.eachSpring = function(callback) {
	var t = this;
	this.graph.edges.forEach(function(e){
		callback.call(t, t.spring(e));
	});
};



// Calculate the total kinetic energy of the system
Layout.ForceDirected.prototype.totalEnergy = function(timestep) {
	var energy = 0.0;
	this.eachNode(function(node, point) {
		var speed = point.v.magnitude();
		energy += 0.5 * point.m * speed * speed;
	});

	return energy;
};


//returns [bottomleft, topright]
Layout.ForceDirected.prototype.updateBoundingBox = function() {
	var bottomleft = new Vector(-2, -2);
	var topright = new Vector(2, 2);

	this.eachNode(function(n, point) {
		if (point.p.x < bottomleft.x) {
			bottomleft.x = point.p.x;
		}
		if (point.p.y < bottomleft.y) {
			bottomleft.y = point.p.y;
		}
		if (point.p.x > topright.x) {
			topright.x = point.p.x;
		}
		if (point.p.y > topright.y) {
			topright.y = point.p.y;
		}
	});

	var padding = topright.subtract(bottomleft).multiply(0.07); // ~5%
	// padding

	this.boundingBox = {
		bottomleft : bottomleft.subtract(padding),
		topright : topright.add(padding)
	};
};

//Point
Layout.ForceDirected.Point = function(position, mass) {
	this.p = position; // position
	this.m = mass; // mass
	this.v = new Vector(0, 0); // velocity
	this.a = new Vector(0, 0); // acceleration
};

Layout.ForceDirected.Point.prototype.applyForce = function(force) {
	this.a = this.a.add(force.divide(this.m));
};

// Spring
Layout.ForceDirected.Spring = function(point1, point2, length, k) {
	this.point1 = point1;
	this.point2 = point2;
	this.length = length; // spring length at rest
	this.k = k; // spring constant (See Hooke's law) .. how stiff the spring is
};

Layout.ForceDirected.prototype.tick = function(timestep) {
	this.applyCoulombsLaw();
	this.applyHookesLaw();
	this.attractToCentre();
	this.updateVelocity(timestep);
	this.updatePosition(timestep);
	this.updateBoundingBox()
};

// Physics stuff
Layout.ForceDirected.prototype.applyCoulombsLaw = function() {
	this.eachNode(function(n1, point1) {
		this.eachNode(function(n2, point2) {
			if (point1 !== point2) {
				var d = point1.p.subtract(point2.p);
				var distance = d.magnitude() + 0.1; // avoid massive forces at
													// small distances (and
													// divide by zero)
				var direction = d.normalise();

				// apply force to each end point
				point1.applyForce(direction.multiply(this.repulsion).divide(
						distance * distance * 0.5));
				point2.applyForce(direction.multiply(this.repulsion).divide(
						distance * distance * -0.5));
			}
		});
	});
};

Layout.ForceDirected.prototype.applyHookesLaw = function() {
	this.eachSpring(function(spring) {
		var d = spring.point2.p.subtract(spring.point1.p); // the direction of
															// the spring
		var displacement = spring.length - d.magnitude();
		var direction = d.normalise();

		// apply force to each end point
		spring.point1.applyForce(direction.multiply(spring.k * displacement
				* -0.5));
		spring.point2.applyForce(direction.multiply(spring.k * displacement
				* 0.5));
	});
};

Layout.ForceDirected.prototype.attractToCentre = function() {
	this.eachNode(function(node, point) {
		var direction = point.p.multiply(-1.0);
		point.applyForce(direction.multiply(this.repulsion / 50.0));
	});
};

Layout.ForceDirected.prototype.updateVelocity = function(timestep) {
	this.eachNode(function(node, point) {
		// Is this, along with updatePosition below, the only places that your
		// integration code exist?
		point.v = point.v.add(point.a.multiply(timestep))
				.multiply(this.damping);
		point.a = new Vector(0, 0);
	});
};

Layout.ForceDirected.prototype.updatePosition = function(timestep) {
	this.eachNode(function(node, point) {
		// Same question as above; along with updateVelocity, is this all of
		// your integration code?
		point.p = point.p.add(point.v.multiply(timestep));
	});
};