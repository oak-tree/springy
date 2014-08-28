// -----------
	var Layout = Springy.Layout = (Springy.Layout  || {} );

	Layout.ForceDirected = function(graph, stiffness, repulsion, damping,
			minEnergyThreshold) {
		this.graph = graph;
		this.stiffness = stiffness; // spring stiffness constant
		this.repulsion = repulsion; // repulsion constant
		this.damping = damping; // velocity damping factor
		this.minEnergyThreshold = minEnergyThreshold || 0.01; // threshold
		this.iteration = 0;
		// used to
		// determine
		// render stop

		this.nodePoints = {}; // keep track of points associated with nodes
		this.edgeSprings = {}; // keep track of springs associated with edges
		this.resetBoundingBox();
	};

	/**
	 * return a string with all layout options
	 */
	Layout.ForceDirected.prototype.toString = function() {
		return "forceDirected. stiffness: {0} repulsion: {1} damping: {2} minEnergyThreshold: {3} iteration: {4}".format(
				this.stiffness ,this.repulsion ,this.damping, this.minEnergyThreshold, this.iteration);
	}


	//getter for point of node 
	Layout.ForceDirected.prototype.point = function(node) {
		if (!(node.id in this.nodePoints)) {
			return null;
		}
		return this.nodePoints[node.id];
	};
	//getter for spring of edge
	Layout.ForceDirected.prototype.spring = function(edge) {
		// why edge should be in edge Springs?
		if (!(edge.id in this.edgeSprings)) {
			return null;
		}
		return this.edgeSprings[edge.id];
	};

	// callback should accept two arguments: Node, Point
	Layout.ForceDirected.prototype.eachNode = function(callback) {
		var t = this;
		this.graph.nodes.forEach(function(n) {
			if (t.point(n) !== null)
				callback.call(t, n, t.point(n));
		});
	};

	// callback should accept two arguments: Edge, Spring
	Layout.ForceDirected.prototype.eachEdge = function(callback) {
		var t = this;
		this.graph.edges.forEach(function(e) {
			if (t.spring(e) !== null)
				callback.call(t, e, t.spring(e));
		});
	};

	var __bind = function(fn, me) {
		return function() {
			return fn.apply(me, arguments);
		};
	}; // stolen from coffeescript thanks jashkenas!
	// ;-)

	Springy.requestAnimationFrame = __bind(root.requestAnimationFrame
			|| root.webkitRequestAnimationFrame
			|| root.mozRequestAnimationFrame || root.oRequestAnimationFrame
			|| root.msRequestAnimationFrame || (function(callback, element) {
				root.setTimeout(callback, 10);
			}), root);

	// update springs and points data
	Layout.ForceDirected.prototype.copyToGraph = function(calculated) {
		this.edgeSprings = calculated.edgeSprings;
		this.nodePoints = calculated.nodePoints;
		this.boundingBox = calculated.boundingBox;
		this.iteration++;
	}

	var WebWorker = Layout.ForceDirected.WebWorker = {};

	Layout.ForceDirected.WebWorker = function(layout, graph, stiffness, repulsion, damping,
			minEnergyThreshold) {
		var physics = this.physics = new Worker('../scripts/physics.js');
		// setup worker to load its structure. but NOT yet start to calculate
		this.message('hello');

		// pass webworker the data it needs
		this.layoutData = {
			graph : {
				adjacency : graph.adjacency,
				nodes : graph.nodes,
				edges : graph.edges,
				edgeSprings: layout.edgeSprings,
				nodePoints: layout.nodePoints,
				boundingBox:layout.getBoundingBox
				
			},
			stiffness : stiffness,
			repulsion : repulsion,
			damping : damping,
			minEnergyThreshold : minEnergyThreshold
		};

		// graph update(i.e node/edge) message the webworker with the new data)
		physics.addEventListener('message', function(event) {
			console.log('Receiving from Worker: ' + event.data);
			switch (event.data.type) {
			case "update":
				// TODO update data from data.calculated
				layout.copyToGraph(event.data.calculated);
				break;
			case "stop":
				layout.stop();
				break;
			}
		});
		// TODO remove this event listener when done
	}
	Layout.ForceDirected.WebWorker.prototype.start = function() {
		this.physics.postMessage({
			type : "start",
			layout : JSON.stringify(this.layoutData)
		});
		this.started = true;
	}
	Layout.ForceDirected.WebWorker.prototype.restart = function() {
		this.message("restart");
	}
	
	Layout.ForceDirected.WebWorker.prototype.updateNode = function(node) {
		if (node === null ){
			return;
		}
		this.physics.postMessage({
			type : "update",
			nodeData : JSON.stringify(node)
		});
	}

	Layout.ForceDirected.WebWorker.prototype.stop = function() {
		this.message("stop");
		this.started = false;
	}
	Layout.ForceDirected.WebWorker.prototype.destroy = function() {
		this.message("destory");
		this.started = false;
	}

	Layout.ForceDirected.WebWorker.prototype.message = function(message) {
		this.physics.postMessage({
			type : message
		});
	}

	/**
	 * Start simulation if it's not running already. In case it's running then
	 * the call is ignored, and none of the callbacks passed is ever executed.
	 */
	Layout.ForceDirected.prototype.update = function(node){
		if (this.physics  && this.physics.started ){
			this.physics.updateNode(node);
		}
	}
	/**
	 * Start simulation if it's not running already. In case it's running then
	 * the call is ignored, and none of the callbacks passed is ever executed.
	 */
	Layout.ForceDirected.prototype.start = function(render, onRenderStop,
			onRenderStart) {
		var t = this;

		if (this._started)
			return;
		this._started = true;
		this._stop = false;

		if (onRenderStart !== undefined) {
			onRenderStart();
		}
		
		//check if worker has been loaded
		if (!this.physics) {
					this.physics = new Layout.ForceDirected.WebWorker(this, this.graph, this.stiffness,
					this.repulsion, this.damping, this.minEnergyThreshold);
		}
		
		//check if worker is runner
		if (!this.physics.started){
			//no, so start it
			this.physics.start();
		} else {
			//
			this.physics.restart();
		}
		
		
		Springy.requestAnimationFrame(function step() {
			// we dont tick it any more. just wait from webworker data

			if (render !== undefined) {
				render();
			}

			// stop simulation when user/webworker said so
			if (t._stop) {
				t._started = false;
				if (onRenderStop !== undefined) {
					onRenderStop();
				}
			} else {
				Springy.requestAnimationFrame(step);
			}
		});
	};

	Layout.ForceDirected.prototype.stop = function() {
		this._stop = true;
		if (this.physics) {
			this.physics.stop();
		}
	}

	
	//TODO maybe should move to math ?
	// Find the nearest point to a particular position
	Layout.ForceDirected.prototype.nearest = function(pos) {
		var min = {
			node : null,
			point : null,
			distance : null
		};
		var t = this;
		this.graph.nodes.forEach(function(n) {
			var point = t.point(n);
			if (point === null) {
				return
			}
			var distance = Vector.SubTract(point.p,pos).magnitude();
			
			if (min.distance === null || distance < min.distance) {
				min = {
					node : n,
					point : point,
					distance : distance
				};
			}
		});

		return min;
	};

	
	//reset the boundingBox 
	Layout.ForceDirected.prototype.resetBoundingBox = function() {
		this.boundingBox = {bottomleft: new Vector(-5.156235597282648,-3.573275251640007),
							topright :new Vector(4.924756703153252, 5.192410807451234)
		}
	}

	// returns [bottomleft, topright]
	Layout.ForceDirected.prototype.getBoundingBox = function() {
		return this.boundingBox;
	};
