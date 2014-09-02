// Vector
var Vector = Springy.Vector = function(x, y) {
	this.x = x;
	this.y = y;
};

Vector.random = function() {
	return new Vector(10.0 * (Math.random() - 0.5),
			10.0 * (Math.random() - 0.5));
};


var random = function(x,y){
	var seed = Math.random();
	return y*seed + (1-seed) * x;
}

Vector.randomOnCircle = function(radius) {
	
	var angle = Math.random()*Math.PI*2;
	var x = Math.cos(angle)*radius;
	var y = Math.sin(angle)*radius;
	return new Vector(x,y)
};


Vector.randomOnDisc = function(minRadius, maxRadius) {
	
	var angle = Math.random()*Math.PI*2;
	var radius = random(minRadius, maxRadius);
	console.log(radius);
	var x = Math.cos(angle)*radius;
	var y = Math.sin(angle)*radius;
	return new Vector(x,y)
};

Vector.randomOnSquare = function(size) {
	
	
	var cos = Math.cos(angle);
	var sin = Math.sin(angle);
	
	
	return new Vector(x,y)
}

Vector.randomInSquare = function(size) {
	return new Vector(size * (Math.random() - 0.5),
			size * (Math.random() - 0.5));
}




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