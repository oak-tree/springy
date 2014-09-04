
//Basic Graph object to hold graph data
Graph = function(graph) {
	this.updateData(graph.adjacency, graph.nodes,graph.edges,graph.reverseAdj);
}
//function to update graph data
Graph.prototype.updateData = function(adjacency, nodes,edges,reverseAdj) {
	this.adjacency = adjacency;
	this.nodes = nodes;
	this.edges = edges;
	this.reverseAdj = reverseAdj;

}

// find the edges from node1 to node2
Graph.prototype.getEdges = function(node1, node2) {
	if (node1.id in this.adjacency
		&& node2.id in this.adjacency[node1.id]) {
		return this.adjacency[node1.id][node2.id];
	}

	return [];
};