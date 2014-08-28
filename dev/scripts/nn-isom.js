var layout = null;

var Springy = {};
importScripts('math.js');
importScripts('basicgraph.js');

self.addEventListener('message', function(event) {

	/* get graph data from event.data.graph */
	var data = {}

	switch (event.data.type) {
	case "start":
		data.layout = JSON.parse(event.data.layout);
		/* create the layout object */
		layout = self.layout = new Layout.ISOM(new Graph(data.layout.graph),
				data.layout.options, data.layout.graph.nodePoints,
				data.layout.boundingBox)

		/* run it */
		layout.start();
		break;
	case "restart":
		if (!layout._started) {
			layout.start()
		}
		break;
	case "stop":
		/* stop layout */
		layout.stop();
		break;
	case "destroy":
		/* stop layout */
		self.close();
		break;
	case "update":
		var nodeData = JSON.parse(event.data.nodeData);
		layout.update(nodeData);
		/* update graph data */
		// TODO update the graph data
	}
});

Layout = {}

var Layout = Springy.Layout = {};

Layout.ISOM = function(graph, options, nodePoints, boudingBox) {
	this.graph = graph;

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

	/*
	 * calculate distance of each two vertex pairs
	 */
	this.floydWarshall();
};

/**
 * get a union distribute random points for all nodes
 */
Layout.ISOM.prototype.initialize = function() {
	this.eachNode(function() {
		// TODO set random position for this node
	})
};

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
// update node while running the simulation
Layout.ISOM.prototype.update = function(nodeData) {
	var node = nodeData.node;
	var point = nodeData.point
	if (!(node.id in this.nodePoints)) {
		return;
	}
	this._wait = true; // tell step to wait with update
	this.nodePoints[node.id].m = point.m;
	this.nodePoints[node.id].p.x = point.p.x;
	this.nodePoints[node.id].p.y = point.p.y;
	this._wait = false;

}

Layout.ISOM.prototype.point = function(node) {
	if (!this.startPoint) {
		this.startPoint = Vector.random();
	}

	if (!(node.id in this.nodePoints)) {
		var mass = (node.data.mass !== undefined) ? node.data.mass : 1.0;
		this.nodePoints[node.id] = new Layout.ISOM.Point(Vector.random(), mass);
		this.nodePoints[node.id] = new Layout.ISOM.Point(new Vector(0,0), mass);
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
Layout.ISOM.prototype.updatesNodesByGraphDistance = function(w, i, adapation,
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
			repulse = 50;
			var update = point.p.add(i).multiply(Math.pow(2, -1 * repulse));
			point.p = point.p.add(update);
			return;

		}
		/* check if its far from w by most distance */
		if (d > distance) {
			return;
		}

		/* if so update */
		var update = point.p.subtract(i).multiply(
				adapation * Math.pow(2, -1 * d));
		point.p = point.p.subtract(update);
	})
};

Layout.ISOM.prototype.tick = function(timestep, r) {
	var adapation = this.updateAdaption(timestep);
	var i = Vector.random();
//	nodeLocation = Math.floor((Math.random() * (this.graph.nodes.length -1)));
//	var i =  this.point[this.graph.nodes[nodeLocation]];
//	 var i = Vector.randomOnCircle(3);
	var w = this.getMinNorm(i);

	this.updatesNodesByGraphDistance(w, i, adapation, r);
	this.updateBoundingBox();

};

Layout.ISOM.prototype.stop = function() {
	this._stop = true;
}

/**
 * Start simulation if it's not running already. In case it's running then the
 * call is ignored, and none of the callbacks passed is ever executed.
 */
Layout.ISOM.prototype.start = function() {
	var t = this;

	if (this._started)
		return;
	this._started = true;
	this._stop = false;
	var DEFAULT_STEP = 0;
	var timestep = 0;
	var r = this.maxRadius;

	// while (!t._stop && (timestep < t.epoch)) {
	var step = function() {
		if (!t._wait) {
			t.tick(timestep, r);

			// message worker creator to render(with the new calculated data)
			postMessage({
				type : "update",
				calculated : {
					edgeSprings : t.edgeSprings,
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
