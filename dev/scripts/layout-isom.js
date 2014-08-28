// -----------

	var Layout = Springy.Layout = (Springy.Layout  || {} );
	var RADIUS_MAX_INT =1
	Layout.ISOM = function(graph, options)	 {
		this.runs = 0;
		this.graph = graph;
		this.options = options;
		this.epoch = options.epoch;
		this.coolingFactor  = options.coolingFactor;
		this.minAdaption = options.minAdaption;
		this.maxAdaption = options.maxAdaption;
		this.interval = options.interval;
		this.minRadius = options.minRadius;
		this.maxRadius = options.maxRadius;
		this.iteration = 0;
		this.nodePoints = {}; // keep track of points associated with nodes
		this.resetBoundingBox();
	};

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
	 * return a string with all layout options
	 */
	Layout.ISOM.prototype.toString = function() {
		return "ISOM .epoch: {0} collingFactor: {1} minAdaption: {2} maxAdaption: {3} interval: {4} minRadius: {5} maxRadius: {6} iteration: {7}".format(
				this.epoch, this.coolingFactor, this.minAdaption ,this.maxAdaption,
				this.interval,	this.minRadius ,this.maxRadius,this.iteration);
	}
	// getter for point of node
	Layout.ISOM.prototype.point = function(node) {
		if (!(node.id in this.nodePoints)) {
			return null;
		}
		return this.nodePoints[node.id];
	};

	// callback should accept two arguments: Node, Point
	Layout.ISOM.prototype.eachNode = function(callback) {
		var t = this;
		this.graph.nodes.forEach(function(n) {
			if (t.point(n) !== null)
				callback.call(t, n, t.point(n));
		});
	};
	
	// callback should accept two arguments: Edge, Spring
	Layout.ISOM.prototype.eachEdge = function(callback) {
		var t = this;
		this.graph.edges.forEach(function(e) {
			var point1 = t.point(e.source),point2 =  t.point(e.target);
			if ((point1 === null ) || (point2 === null)) {return}
				callback.call(t, e, {point1:point1,point2:point2});
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
	Layout.ISOM.prototype.copyToGraph = function(calculated) {
		this.edgeSprings = calculated.edgeSprings;
		this.nodePoints = calculated.nodePoints;
		this.boundingBox = calculated.boundingBox;
		this.iteration++;
	}

	var WebWorker = Layout.ISOM.WebWorker = {};

	Layout.ISOM.WebWorker = function(layout, graph, options) {
		var worker = this.worker = new Worker('../scripts/nn-isom.js');
		// setup worker to load its structure. but NOT yet start to calculate
		this.message('hello');

		// pass webworker the data it needs
		this.layoutData = {
			graph : {
				adjacency : graph.adjacency,
				nodes : graph.nodes,
				edges : graph.edges,
				nodePoints: layout.nodePoints,
				boundingBox:layout.getBoundingBox
				
			},
			options : options
		};

		// graph update(i.e node/edge) message the webworker with the new data)
		worker.addEventListener('message', function(event) {
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
	Layout.ISOM.WebWorker.prototype.start = function() {
		
		
		//TODO . check if this is soft start or not
		this.worker.postMessage({
			type : "start",
			layout : JSON.stringify(this.layoutData)
		});
		this.started = true;
	}
	Layout.ISOM.WebWorker.prototype.restart = function() {
		this.message("restart");
	}
	
	Layout.ISOM.WebWorker.prototype.updateNode = function(node) {
		if (node === null ){
			return;
		}
		this.worker.postMessage({
			type : "update",
			nodeData : JSON.stringify(node)
		});
	}

	Layout.ISOM.WebWorker.prototype.stop = function() {
		this.message("stop");
		this.started = false;
	}
	Layout.ISOM.WebWorker.prototype.destroy = function() {
		this.message("destory");
		this.started = false;
	}

	Layout.ISOM.WebWorker.prototype.message = function(message) {
		this.worker.postMessage({
			type : message
		});
	}

	/**
	 * Start simulation if it's not running already. In case it's running then
	 * the call is ignored, and none of the callbacks passed is ever executed.
	 */
	Layout.ISOM.prototype.update = function(node){
		if (this.isom  && this.isom.started ){
			this.isom.updateNode(node);
		}
	}
	/**
	 * Start simulation if it's not running already. In case it's running then
	 * the call is ignored, and none of the callbacks passed is ever executed.
	 */
	Layout.ISOM.prototype.start = function(render, onRenderStop,
			onRenderStart) {
		var t = this;


		this.anotherRun();
		
		if (this._started)
			return;
		this._started = true;
		this._stop = false;

		if (onRenderStart !== undefined) {
			onRenderStart();
		}
		
		// check if worker has been loaded
		if (!this.isom) {
					this.isom = new Layout.ISOM.WebWorker(this, this.graph,this.options)
		}
		
		
//		if (this.isFirstRun()) {
			//
		
		
		// check if worker is runner
			if ((!this.isom.started) && this.isFirstRun()){
				// no, so start it
				this.isom.start();
			} else {
				//
				this.isom.restart();
			}
//		}		
		
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

	Layout.ISOM.prototype.stop = function() {
		this._stop = true;
		if (this.isom) {
			this.isom.stop();
		}
	}

	
	// TODO maybe should move to math ?
	// Find the nearest point to a particular position
	Layout.ISOM.prototype.nearest = function(pos) {
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

	
	// reset the boundingBox
	Layout.ISOM.prototype.resetBoundingBox = function() {
		this.boundingBox = {bottomleft: new Vector(-5.156235597282648,-3.573275251640007),
							topright :new Vector(4.924756703153252, 5.192410807451234)
		}
	}

	// returns [bottomleft, topright]
	Layout.ISOM.prototype.getBoundingBox = function() {
		return this.boundingBox;
	};
