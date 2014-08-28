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

	