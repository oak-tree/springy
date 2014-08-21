//update nodes point. get row points and trasnfer them to notes Object points
Layout.ForceDirected.prototype.updateNodes = function(nodePoints) {
	for (var i in nodePoints) {
		nodePoints[i] = this.pointHelper(nodePoints[i]);	
	}
	return nodePoints;
}

//update nodes point. get row points and trasnfer them to notes Object points
Layout.ForceDirected.prototype.updateSprings = function(edgeSprings) {
	for (var i in edgeSprings) {
		var spring = edgeSprings[i];
		var point1 = this.pointHelper(spring.point1);
		var point2 = this.pointHelper(spring.point2);
		edgeSprings[i] = new Layout.ForceDirected.Spring(point1,point2,spring.length,spring.k);
	}
	return edgeSprings;
}


//get raw point return it in Point Object
Layout.ForceDirected.prototype.pointHelper = function(point){
	var a = point.a;
	var p = point.p;
	var v = point.v;
	
	position = new Vector(p.x,p.y);
	a 		 = new Vector(a.x,a.y);
	v 		  = new Vector(v.x,v.y);
	return new Layout.ForceDirected.Point(position,point.mass,v,a);

}