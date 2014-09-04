
/**
 * @class Springy.Graph
 * @events
 * springy:add:node,node
 * springy:add:edge,edge
 * springy:remove:edge,edge
 * springy:deattach:node,node
 */
var Graph = Springy.Graph = function(graph) {
		graph = graph || {};
		this.nodeSet = {};
		this.nodes = graph.nodes ||[];
		this.edges = graph.edges || [];
		this.adjacency = graph.adjacency || {};
		this.reverseAdj  = graph.reverseAdj || {};

		this.nextNodeId = 0;
		this.nextEdgeId = 0;
		this.eventListeners = [];
	};

	//function to update graph data
	Graph.prototype.updateData = function(adjacency, nodes,edges,reverseAdj) {
		this.adjacency = adjacency;
		this.nodes = nodes;
		this.edges = edges;
		this.reverseAdj = reverseAdj;

	}
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

		this.notify("springy:add:node",node);
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
	
	Graph.prototype.addEdgeToreverseAdj = function(edge) {
		
		if (!(edge.target.id in this.reverseAdj)) {
			this.reverseAdj[edge.target.id] = {};
		}
		if (!(edge.source.id in this.reverseAdj[edge.target.id])) {
			this.reverseAdj[edge.target.id][edge.source.id] = [];
		}

		var exists = false;
		this.reverseAdj[edge.target.id][edge.source.id].forEach(function(e) {
			if (edge.id === e.id) {
				exists = true;
			}
		});

		if (!exists) {
			this.reverseAdj[edge.target.id][edge.source.id].push(edge);
		}
		
	}
	Graph.prototype.removeEdgeToreverseAdj = function(edge) {
		
		
		for ( var x in this.reverseAdj) {
			for ( var y in this.reverseAdj[x]) {
				var edges = this.reverseAdj[x][y];

				for (var j = edges.length - 1; j >= 0; j--) {
					if (this.reverseAdj[x][y][j].id === edge.id) {
						this.reverseAdj[x][y].splice(j, 1);
					}
				}

				// Clean up empty edge arrays
				if (this.reverseAdj[x][y].length == 0) {
					delete this.reverseAdj[x][y];
				}
			}

			// Clean up empty objects
			if (isEmpty(this.reverseAdj[x])) {
				delete this.reverseAdj[x];
			}
		}

	}
	
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
		
		this.addEdgeToreverseAdj(edge)

		this.notify("springy:add:edge",edge);
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

		this.notify("springy:remove:node",node);
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

		this.notify("springy:deattach:node",node);
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
		
		this.removeEdgeToreverseAdj(edge);
		
		this.notify("springy:remove:edge",edge);
		
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
		var args = arguments;
		this.eventListeners.forEach(function(obj) {
			obj.callback.apply(obj.context,args);
		});
	};