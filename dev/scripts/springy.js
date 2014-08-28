/**
 * Springy v2.6.1
 * 
 * Copyright (c) 2010-2013 Dennis Hotson
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

(function() {
	// Enable strict mode for EC5 compatible browsers
	"use strict";

	// Establish the root object, `window` in the browser, or `global` on the
	// server.
	var root = this;

	// The top-level namespace. All public Springy classes and modules will
	// be attached to this. Exported for both CommonJS and the browser.
	var Springy;
	if (typeof exports !== 'undefined') {
		Springy = exports;
	} else {
		Springy = root.Springy = {};
	}

// Vector
var Vector = Springy.Vector = function(x, y) {
	this.x = x;
	this.y = y;
};

Vector.random = function() {
	return new Vector(10.0 * (Math.random() - 0.5),
			10.0 * (Math.random() - 0.5));
};

Vector.randomOnCircle = function(radius) {
	
	var angle = Math.random()*Math.PI*2;
	var x = Math.cos(angle)*radius;
	var y = Math.sin(angle)*radius;
	return new Vector(x,y)
};



Vector.SubTract = function(v1,v2) {
	return new Vector(v1.x - v2.x, v1.y - v2.y);
}

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


var Matrix = Springy.Matrix = function(rows,cols, defaultValue){
	  var arr = [];

	  // Creates all lines:
	  for(var i=0; i < rows; i++){

	      // Creates an empty line
	      arr.push([]);

	      // Adds cols to the empty line:
	      arr[i].push( new Array(cols));

	      for(var j=0; j < cols; j++){
	        // Initializes:
	        arr[i][j] = defaultValue;
	      }
	  }

	this._matrix =  arr;
}
Matrix.infinity = function( rows, cols, defaultValue){
	return new Matrix(rows,cols,Number.POSITIVE_INFINITY);
}

Matrix.prototype.get = function( row, col) {
	return this._matrix[row][col];
}

Matrix.prototype.set = function( row, col, value) {
	this._matrix[row][col] = value;
}
var Graph = Springy.Graph = function() {
		this.nodeSet = {};
		this.nodes = [];
		this.edges = [];
		this.adjacency = {};

		this.nextNodeId = 0;
		this.nextEdgeId = 0;
		this.eventListeners = [];
	};

	var Node = Springy.Node = function(id, data) {
		this.id = id;
		this.data = (data !== undefined) ? data : {};

		// Data fields used by layout algorithm in this file:
		// this.data.mass
		// Data used by default renderer in springyui.js
		// this.data.label
	};

	var Edge = Springy.Edge = function(id, source, target, data) {
		this.id = id;
		this.source = source;
		this.target = target;
		this.data = (data !== undefined) ? data : {};

		// Edge data field used by layout alorithm
		// this.data.length
		// this.data.type
	};

	Graph.prototype.addNode = function(node) {
		if (!(node.id in this.nodeSet)) {
			this.nodes.push(node);
		}

		this.nodeSet[node.id] = node;

		this.notify();
		return node;
	};

	Graph.prototype.addNodes = function() {
		// accepts variable number of arguments, where each argument
		// is a string that becomes both node identifier and label
		for (var i = 0; i < arguments.length; i++) {
			var name = arguments[i];
			var node = new Node(name, {
				label : name
			});
			this.addNode(node);
		}
	};

	Graph.prototype.addEdge = function(edge) {
		var exists = false;
		this.edges.forEach(function(e) {
			if (edge.id === e.id) {
				exists = true;
			}
		});

		if (!exists) {
			this.edges.push(edge);
		}

		if (!(edge.source.id in this.adjacency)) {
			this.adjacency[edge.source.id] = {};
		}
		if (!(edge.target.id in this.adjacency[edge.source.id])) {
			this.adjacency[edge.source.id][edge.target.id] = [];
		}

		exists = false;
		this.adjacency[edge.source.id][edge.target.id].forEach(function(e) {
			if (edge.id === e.id) {
				exists = true;
			}
		});

		if (!exists) {
			this.adjacency[edge.source.id][edge.target.id].push(edge);
		}

		this.notify();
		return edge;
	};

	Graph.prototype.addEdges = function() {
		// accepts variable number of arguments, where each argument
		// is a triple [nodeid1, nodeid2, attributes]
		for (var i = 0; i < arguments.length; i++) {
			var e = arguments[i];
			var node1 = this.nodeSet[e[0]];
			if (node1 == undefined) {
				throw new TypeError("invalid node name: " + e[0]);
			}
			var node2 = this.nodeSet[e[1]];
			if (node2 == undefined) {
				throw new TypeError("invalid node name: " + e[1]);
			}
			var attr = e[2];

			this.newEdge(node1, node2, attr);
		}
	};

	Graph.prototype.newNode = function(data) {
		var node = new Node(this.nextNodeId++, data);
		this.addNode(node);
		return node;
	};

	Graph.prototype.newEdge = function(source, target, data) {
		var edge = new Edge(this.nextEdgeId++, source, target, data);
		this.addEdge(edge);
		return edge;
	};

	// add nodes and edges from JSON object
	Graph.prototype.loadJSON = function(json) {
		/**
		 * Springy's simple JSON format for graphs.
		 * 
		 * historically, Springy uses separate lists of nodes and edges: {
		 * "nodes": [ "center", "left", "right", "up", "satellite" ], "edges": [
		 * ["center", "left"], ["center", "right"], ["center", "up"] ] }
		 * 
		 */
		// parse if a string is passed (EC5+ browsers)
		if (typeof json == 'string' || json instanceof String) {
			json = JSON.parse(json);
		}

		if ('nodes' in json || 'edges' in json) {
			this.addNodes.apply(this, json['nodes']);
			this.addEdges.apply(this, json['edges']);
		}
	}

	// find the edges from node1 to node2
	Graph.prototype.getEdges = function(node1, node2) {
		if (node1.id in this.adjacency && node2.id in this.adjacency[node1.id]) {
			return this.adjacency[node1.id][node2.id];
		}

		return [];
	};

	// remove a node and it's associated edges from the graph
	Graph.prototype.removeNode = function(node) {
		if (node.id in this.nodeSet) {
			delete this.nodeSet[node.id];
		}

		for (var i = this.nodes.length - 1; i >= 0; i--) {
			if (this.nodes[i].id === node.id) {
				this.nodes.splice(i, 1);
			}
		}

		this.detachNode(node);
	};

	// removes edges associated with a given node
	Graph.prototype.detachNode = function(node) {
		var tmpEdges = this.edges.slice();
		tmpEdges.forEach(function(e) {
			if (e.source.id === node.id || e.target.id === node.id) {
				this.removeEdge(e);
			}
		}, this);

		this.notify();
	};

	// remove a node and it's associated edges from the graph
	Graph.prototype.removeEdge = function(edge) {
		for (var i = this.edges.length - 1; i >= 0; i--) {
			if (this.edges[i].id === edge.id) {
				this.edges.splice(i, 1);
			}
		}

		for ( var x in this.adjacency) {
			for ( var y in this.adjacency[x]) {
				var edges = this.adjacency[x][y];

				for (var j = edges.length - 1; j >= 0; j--) {
					if (this.adjacency[x][y][j].id === edge.id) {
						this.adjacency[x][y].splice(j, 1);
					}
				}

				// Clean up empty edge arrays
				if (this.adjacency[x][y].length == 0) {
					delete this.adjacency[x][y];
				}
			}

			// Clean up empty objects
			if (isEmpty(this.adjacency[x])) {
				delete this.adjacency[x];
			}
		}

		this.notify();
	};

	/*
	 * Merge a list of nodes and edges into the current graph. eg. var o = {
	 * nodes: [ {id: 123, data: {type: 'user', userid: 123, displayname:
	 * 'aaa'}}, {id: 234, data: {type: 'user', userid: 234, displayname: 'bbb'}} ],
	 * edges: [ {from: 0, to: 1, type: 'submitted_design', directed: true, data:
	 * {weight: }} ] }
	 */
	Graph.prototype.merge = function(data) {
		var nodes = [];
		data.nodes.forEach(function(n) {
			nodes.push(this.addNode(new Node(n.id, n.data)));
		}, this);

		data.edges.forEach(function(e) {
			var from = nodes[e.from];
			var to = nodes[e.to];

			var id = (e.directed) ? (id = e.type + "-" + from.id + "-" + to.id)
					: (from.id < to.id) // normalise id for non-directed edges
					? e.type + "-" + from.id + "-" + to.id : e.type + "-"
							+ to.id + "-" + from.id;

			var edge = this.addEdge(new Edge(id, from, to, e.data));
			edge.data.type = e.type;
		}, this);
	};

	Graph.prototype.filterNodes = function(fn) {
		var tmpNodes = this.nodes.slice();
		tmpNodes.forEach(function(n) {
			if (!fn(n)) {
				this.removeNode(n);
			}
		}, this);
	};

	Graph.prototype.filterEdges = function(fn) {
		var tmpEdges = this.edges.slice();
		tmpEdges.forEach(function(e) {
			if (!fn(e)) {
				this.removeEdge(e);
			}
		}, this);
	};

	Graph.prototype.addGraphListener = function(obj) {
		this.eventListeners.push(obj);
	};

	Graph.prototype.notify = function() {
		this.eventListeners.forEach(function(obj) {
			obj.graphChanged();
		});
	};
// -----------
	var Layout = Springy.Layout = (Springy.Layout  || {} );

	Layout.ForceDirected = function(graph, stiffness, repulsion, damping,
			minEnergyThreshold) {
		this.graph = graph;
		this.stiffness = stiffness; // spring stiffness constant
		this.repulsion = repulsion; // repulsion constant
		this.damping = damping; // velocity damping factor
		this.minEnergyThreshold = minEnergyThreshold || 0.01; // threshold
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
		return "forceDirected. stiffness: {0} repulsion: {1} damping: {2} minEnergyThreshold: {3}".format(
				this.stiffness ,this.repulsion ,this.damping, this.minEnergyThreshold);
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

// -----------

	var Layout = Springy.Layout = (Springy.Layout  || {} );
	var RADIUS_MAX_INT =1
	Layout.ISOM = function(graph, options)	 {
		this.runs = 0;
		this.graph = graph;
		this.options = options;
		this.epoch = options.epoch;
		this.coolingFactor  = options.collingFactor;
		this.minAdaption = options.minAdaption;
		this.maxAdaption = options.maxAdaption;
		this.interval = options.interval;
		this.minRadius = options.minRadius;
		this.maxRadius = options.maxRadius;
		
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
		return "ISOM .epoch: {0} collingFactor: {1} minAdaption: {2} maxAdaption: {3} interval: {4} minRadius: {5} maxRadius: {6}".format(
				this.epoch, this.coolingFactor, this.minAdaption ,this.maxAdaption,
				this.interval,	this.minRadius ,this.maxRadius);
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
		
		
		if (this.isFirstRun()) {
			//
		
		
		// check if worker is runner
			if ((!this.isom.started) && this.isFirstRun()){
				// no, so start it
				this.isom.start();
			} else {
				//
				this.isom.restart();
			}
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

/**
	 * Renderer handles the layout rendering loop
	 * 
	 * @param onRenderStop
	 *            optional callback function that gets executed whenever
	 *            rendering stops.
	 * @param onRenderStart
	 *            optional callback function that gets executed whenever
	 *            rendering starts.
	 */
	var Renderer = Springy.Renderer = function(layout, clear, drawEdge,
			drawNode, onRenderStop, onRenderStart) {
		this.layout = layout;
		this.clear = clear;
		this.drawEdge = drawEdge;
		this.drawNode = drawNode;
		this.onRenderStop = onRenderStop;
		this.onRenderStart = onRenderStart;

		this.layout.graph.addGraphListener(this);
	}

	Renderer.prototype.graphChanged = function(e) {
		this.start();
	};

	/**
	 * Starts the simulation of the layout in use.
	 * 
	 * Note that in case the algorithm is still or already running then the
	 * layout that's in use might silently ignore the call, and your optional
	 * <code>done</code> callback is never executed. At least the built-in
	 * ForceDirected layout behaves in this way.
	 * 
	 * @param done
	 *            An optional callback function that gets executed when the
	 *            springy algorithm stops, either because it ended or because
	 *            stop() was called.
	 */
	Renderer.prototype.start = function(done) {
		var t = this;
		this.layout.start(function render() {
			t.clear();

			t.layout.eachEdge(function(edge, spring) {
				t.drawEdge(edge, spring.point1.p, spring.point2.p);
			});

			t.layout.eachNode(function(node, point) {
				t.drawNode(node, point.p);
			});
		}, this.onRenderStop, this.onRenderStart);
	};

	Renderer.prototype.stop = function() {
		this.layout.stop();
	};

	
//#################################################### Helpers ##################################################
	// Array.forEach implementation for IE support..
	// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/forEach
	if (!Array.prototype.forEach) {
		Array.prototype.forEach = function(callback, thisArg) {
			var T, k;
			if (this == null) {
				throw new TypeError(" this is null or not defined");
			}
			var O = Object(this);
			var len = O.length >>> 0; // Hack to convert O.length to a UInt32
			if ({}.toString.call(callback) != "[object Function]") {
				throw new TypeError(callback + " is not a function");
			}
			if (thisArg) {
				T = thisArg;
			}
			k = 0;
			while (k < len) {
				var kValue;
				if (k in O) {
					kValue = O[k];
					callback.call(T, kValue, k, O);
				}
				k++;
			}
		};
	}

	var isEmpty = function(obj) {
		for ( var k in obj) {
			if (obj.hasOwnProperty(k)) {
				return false;
			}
		}
		return true;
	};

	String.prototype.format = function() {
	    var formatted = this;
	    for (var i = 0; i < arguments.length; i++) {
	        var regexp = new RegExp('\\{'+i+'\\}', 'gi');
	        formatted = formatted.replace(regexp, arguments[i]);
	    }
	    return formatted;
	};
}).call(this);
