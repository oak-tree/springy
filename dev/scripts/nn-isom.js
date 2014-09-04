var layout = null;

var Springy = {};
importScripts('helpers.js');
importScripts('math.js');
importScripts('graph.js');
importScripts('protocol.js');


/**
 * helper function to create the layout
 * @method createLayout
 */
var createLayout = function(params){
	/*create the layout object */
	return  new Layout.ISOM(new Graph(params.graph),
			params.options, params.graph.nodePoints,
			params.boundingBox)

}

Layout = {}

var Layout = Springy.Layout = {};

Layout.ISOM = function(graph, options, nodePoints, boudingBox) {
	this.graph = graph;
	this.runs = 0;
	this.graph = graph;
	this.options = options;
	this.epoch = options.epoch;
	this.coolingFactor = options.coolingFactor;
	this.minAdaption = options.minAdaption;
	this.maxAdaption = options.maxAdaption;
	this.interval = options.interval;
	this.minRadius = options.minRadius;
	this.maxRadius = options.maxRadius;// stop

	this.nodePoints = {};
	this._started = false; 
	var DEFAULT_LAYOUT_STR = "",DEFAULT_LAYOUT_SIZE  = 5;
	this.layoutType = options.layoutType || DEFAULT_LAYOUT_STR;
	this.layoutSize = options.layoutSize || DEFAULT_LAYOUT_SIZE;
	console.log(this.layoutType)

	/*
	 * calculate distance of each two vertex pairs
	 */
	this.floydWarshall();
};

/**
 * capture change message and check if there is something to change
 * @param node
 */
Layout.ISOM.prototype.change = function(eventname,obj){
	switch (eventname){
		case "springy:add:node":
			this.addNode(obj);
		break;
		
		case "springy:remove:node":
			this.removeNode(obj)
		break;
		
		case "springy:deattach:node":
			this.deattachNode(obj)
		break;
		
		case "springy:add:edge":
			this.addEdge(obj);
		break;
		
		case "springy:remove:edge":
			this.removeEdge(obj);
		break;
	}
}

/**
 * add new node - new point
 * @param node
 */
Layout.ISOM.prototype.addNode = function(node)  {
	this.graph.addNode(node);
	//
}
/**
 * make sure to remove node point and then detach it from all other nodes/springs
 * @param node
 */
Layout.ISOM.prototype.removeNode = function(node)  {
	this.graph.removeNode(node);
	delete this.nodePoints[node.id]
	//TODO update graph distance matrix
}
/**
 * make sure to remove all springs related to this node
 * @method deattachNode
 */
Layout.ISOM.prototype.deattachNode = function(node) {
	this.graph.detachNode(node);
	//TODO update graph distance matrix
}

/**
 * remove the spring related to this edge
 * @param edge
 */
Layout.ISOM.prototype.removeEdge = function(edge) {
	this.graph.removeEdge(edge);
	//TODO update graph distance matrix
}

/**
 * add a spring for this edge
 * @param edge
 */
Layout.ISOM.prototype.addEdge = function(edge) {
	this.graph.addEdge(edge);
	//TODO update graph distance matrix
}


//update node while running the simulation
Layout.ISOM.prototype.update = function(nodeData) {
	var node = nodeData.node;
	var point = nodeData.point
	if (!(node.id in this.nodePoints)) {
		return;
	}
	this._wait = true; // tell step to wait with update
	this.nodePoints[node.id].m = point.m;
	this.nodePoints[node.id].p.x =  point.p.x;
	this.nodePoints[node.id].p.y =  point.p.y;
	this._wait = false;
	
}

Layout.ISOM.prototype.softRestart = function(options) {
	var options = options || this.options;
	this.epoch = options.epoch;
	this.coolingFactor = options.coolingFactor;
	this.minAdaption = options.minAdaption;
	this.maxAdaption = options.maxAdaption;
	this.interval = options.interval;
	this.minRadius = options.minRadius;
	this.maxRadius = options.maxRadius;// stop
	this.start();
	
}

Layout.ISOM.prototype.getRuns = function() {
	return this.runs;
}

Layout.ISOM.prototype.isFirstRun = function() {
	return this.runs === 1;
}

Layout.ISOM.prototype.anotherRun = function() {
	this.runs++;
	return this.runs;
}

/**
 * get a union distribute random points for all nodes
 */
Layout.ISOM.prototype.initialize = function() {
	this.eachNode(function() {
		// TODO set random position for this node
	})
};
Layout.ISOM.prototype.path = function(node,walked,radius, maxRadius,callback){
	/* do not walked more than the max radius distance */
	if (radius > maxRadius) return 
	/* if walked already do not walked again */
	if (node.id in walked) return
	/* mark as walked */
	walked[node.id]  = 1;
	/*
	 * for each edge of this node find the target node *
	 * 
	 */
	var adj = this.graph.adjacency;
	if (node.id in adj) {
		for (var a in adj[node.id]){
			this.path(adj[node.id][a][0].target,walked,radius + 1 ,maxRadius,callback);
		}
	}
	
	var reverseAdj = this.graph.reverseAdj;
	if (node.id in reverseAdj) {
		for (var a in reverseAdj[node.id]){
			this.path(reverseAdj[node.id][a][0].source,walked,radius + 1 ,maxRadius,callback);
		}
	}
	
	/* fire the callback on this node */
	callback.call(this,node,this.point(node),radius);
	
}
Layout.ISOM.prototype.floydWarshall = function() {

	var N = this.graph.nodes.length;
	var n = 0;
	var nodes = this.nodes = {};
	/* give an order to all nodes */
	this.graph.nodes.forEach(function(v) {
		v._uid = n;
		nodes[v.id] = n;
		n++;
		// nodes[v.id] = v;

	});

	var dist = Springy.Matrix.infinity(N, N);
	/*
	 * for each vertex v dist[v][v] = 0;
	 */
	for (var i = 0; i < N; i++) {
		;
		dist.set(i, i, 0);
	}

	this.graph.nodes.forEach(function(v) {
		v._uid = n;
		n++;
	});

	/*
	 * for each edge (u,v) dist[u][v] = w(u,v)
	 */
	this.graph.edges.forEach(function(e) {
		e._uid = n;
		n++;
		var source = nodes[e.source.id], target = nodes[e.target.id];
		dist.set(source, target, 1);
		dist.set (target,source, 1);
	});

	/*
	 * update distance
	 */
	for (var k = 0; k < N; k++) {
		for (var i = 0; i < N; i++) {
			for (var j = 0; j < N; j++) {
				// if (dist[i][j] > dist[i][k] + dist[k][j]) {
				// dist[i][j] = dist[i][k] + dist[k][j];
				// }

				if (dist.get(i, j) > dist.get(i, k) + dist.get(k, j)) {
					dist.set(i, j, dist.get(i, k) + dist.get(k, j))
				}
			}
		}
	}
	this.dist = dist;
}

Layout.ISOM.prototype.point = function(node) {
	if (!this.startPoint) {
		this.startPoint = Vector.random();
	}

	if (!(node.id in this.nodePoints)) {
		var mass = (node.data.mass !== undefined) ? node.data.mass : 1.0;
		this.nodePoints[node.id] = new Layout.ISOM.Point(Vector.random(), mass);
		this.nodePoints[node.id] = new Layout.ISOM.Point(new Vector(0,0), mass);
		this.nodePoints[node.id] = new Layout.ISOM.Point(this.getNewCoordinate(), mass);
//		 this.nodePoints[node.id] = new Layout.ISOM.Point(
//		Vector.randomOnCircle(3), mass);

	}

	return this.nodePoints[node.id];
};

// callback should accept two arguments: Node, Point
Layout.ISOM.prototype.eachNode = function(callback) {
	var t = this;
	this.graph.nodes.forEach(function(n) {
		callback.call(t, n, t.point(n));
	});
};

// returns [bottomleft, topright]
Layout.ISOM.prototype.updateBoundingBox = function() {
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

// Point
Layout.ISOM.Point = function(position, mass, v, a) {
	this.p = position; // position
};

Layout.ISOM.prototype.updateAdaption = function(timestamp) {
	return Math.max(this.minAdaption, Math.exp(-1 * this.coolingFactor
			* (timestamp / this.epoch))
			* this.maxAdaption);
}
/**
 * return a set of vertex(nodes) that ||v.pos -i|| is minimal
 */
Layout.ISOM.prototype.getMinNorm = function(i) {
	var minNorm = Number.POSITIVE_INFINITY;
	var node = null
	this.eachNode(function(v, point) {
		var norm = i.subtract(point.p).magnitude();
		if (minNorm > norm) {
			minNorm = norm;
			node = v;
		}
	});

	return node;
}


/**
 * update the position of each nodes that in the ball d(w,w_i) <=r
 */
Layout.ISOM.prototype.updatesNodesByGraphDistanceMatrix = function(w, i, adapation,
		distance) {

	var isom = this;
	this.eachNode(function(v, point) {
		// TODO
		/* calcuate d(v,w) */
		var d = isom.dist.get(isom.nodes[v.id], isom.nodes[w.id]);

		/*
		 * if this node is from different group repulse it
		 */
		
		if (d === Number.POSITIVE_INFINITY) {
			repulse = 500;
			var update = point.p.subtract(i).multiply(Math.pow(2, -1 * repulse));
			point.p = point.p.add(update);
			return;

		}
		/* check if its far from w by most distance */
		if (d > distance) {
			repulse = 0.2;
			var update = point.p.subtract(i).multiply(
					adapation *repulse * Math.pow(2, -1 * d));
//			point.p = point.p.add(update);
			return;
		}

		/* if so update */
		var update = point.p.subtract(i).multiply(
				adapation * Math.pow(2, -1 * d));
		point.p = point.p.subtract(update);
	
	})
};

/**
 * update the position of each nodes that in the ball d(w,w_i) <=r
 */
Layout.ISOM.prototype.updatesNodesByGraphDistance = function(w, i, adapation,
		distance) {

	var isom = this;
	this.path(w,[],0,distance, function(v, point,d) {
		
		/* if so update */
		var update = point.p.subtract(i).multiply(
				adapation * Math.pow(2, -1 * d));
		point.p = point.p.subtract(update);
	
	})
};
Layout.ISOM.prototype.getNewCoordinate =  function() {
	var i = null;
	console.log(this.layoutType)
	switch (this.layoutType) {
		case "circle":
			i = Vector.randomOnCircle(this.layoutSize);
			console.log('point on circle')
			break;
		case "onsquare":
			i = Vector.randomOnSquare(this.layoutSize);
			break;
		case "insquare": 
			i = Vector.randomInSquare(this.layoutSize);
			break;
		case "disc":
			console.log('as');
					
			i = Vector.randomOnDisc(this.layoutSize.minRadius,this.layoutSize.maxRadius);
//			i = Vector.randomOnCircle(this.layoutSize.minRadius);
			break;
		default:
			i = Vector.random();
	}
	
	return i;
}
	
Layout.ISOM.prototype.tick = function(timestep, r) {
	var adapation = this.updateAdaption(timestep);
	var i = this.getNewCoordinate();
//	nodeLocation = Math.floor((Math.random() * (this.graph.nodes.length -1)));
//	var i =  this.point[this.graph.nodes[nodeLocation]];
//	 var i = Vector.randomOnCircle(3);
	var w = this.getMinNorm(i);

	this.updatesNodesByGraphDistance(w, i, adapation, r);
//	this.updatesNodesByGraphDistanceMatrix(w, i, adapation, r);
	this.updateBoundingBox();

};

Layout.ISOM.prototype.stop = function() {
	this._stop = true;
}

 /**
 * Start simulation if it's not running already. In case it's running then the
 * call is ignored, and none of the callbacks passed is ever executed.
 */
Layout.ISOM.prototype.start = function(timestep) {
	var t = this;

	if (this._started)
		return;
	
	this.anotherRun();
	this._started = true;
	this._stop = false;
	var DEFAULT_STEP = 0;
	var timestep = timestep || 0;
	var r = this.maxRadius;

	// while (!t._stop && (timestep < t.epoch)) {
	var step = function() {
		if (!t._wait) {
			t.tick(timestep, r);

			// message worker creator to render(with the new calculated data)
			postMessage({
				type : "update",
				calculated : {
					nodePoints : t.nodePoints,
					boundingBox : t.boundingBox
				}
			});
		}

		/* update step */
		timestep++;

		/* check if radius should go down */
		if ((r % this.interval === 0) && (r > this.minRadius)) {
			r--;
		}

		// stop simulation when energy of the system goes below a threshold
		if (t._stop || (timestep > t.epoch)) {
			t._started = false;
			postMessage({
				type : "stop"
			});
		} else {
			setTimeout(step, DEFAULT_STEP); // TODO why do settimeout and not do
											// a loop?
		}
		
	}
	step();
};



Layout.ISOM.prototype.restart = function(timestep) {
	if ((!this._started) && (this.isFirstRun())) {
		this.start()
	} else {
		console.log('soft restart');
		this.start(Math.max(this.epoch-50,0))
		//TODO soft start
	}
}