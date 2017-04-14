// BGem3 Assets Library

var Obj3D = function( mesh ) {
	this.mesh = mesh;
	this.visible = true;
};

var ObjGroup = function( objs, options ) {
	this.objs = objs;
	this.rot = options.rot || [ 0, 0, 0 ];
	this.pos = options.pos || [ 0, 0, 0 ];
};

var Mesh = function() {
	this.rot = [ 0, 0, 0 ];
	this.pos = [ 0, 0, 0 ];
	this.vertices3D = [];
	this.vertices2D = [];
	this.transform = [];
	this.faces = [];
	this.fill = false;
	this.stroke = true;
};

var PlaneMesh = function( options ) {
	Mesh.apply( this, arguments );
	this.size = options.size/2 || 5;
	this.rot = options.rot || [ 0, 0, 0 ];
	this.pos = options.pos || [ 0, 0, 0 ];
	this.color = options.color || [ 102, 45, 145 ];
	this.textured = ( options.textured === undefined )? false : options.textured;
	this.fill = ( options.fill === undefined )? true : options.fill;
	this.stroke = ( options.stroke === undefined )? true : options.stroke;
	this.shine = ( options.shine === undefined )? true : options.shine;
	this.shadow = ( options.shadow === undefined )? true : options.shadow;
	this.shineWidth = 1.2;
	this.shineStren = 50;
	this.vertices3D = [
		[ 0, 0, 0 ], // anchor point
		[ this.size, -this.size, 0 ],
		[ -this.size, -this.size, 0 ],
		[ -this.size, this.size, 0 ],
		[ this.size, this.size, 0 ],
	];
	this.faces = [
		[ 1, 2, 3, 4 ], // front
	];

	var backside = ( options.backside === undefined )? true: options.backside;
	if ( backside ) {
		this.faces.push( [ 4, 3, 2, 1 ] );
	}
};
PlaneMesh.prototype = new Mesh();

var CubeMesh = function( options ) {
	Mesh.apply( this, arguments );
	this.size = options.size/2 || 5;
	this.rot = options.rot || [ 0, 0, 0 ];
	this.pos = options.pos || [ 0, 0, 0 ];
	this.color = options.color || [ 102, 45, 145 ];
	this.textured = ( options.textured === undefined )? false : options.textured;
	this.fill = ( options.fill === undefined )? true : options.fill;
	this.stroke = ( options.stroke === undefined )? true : options.stroke;
	this.shine = ( options.shine === undefined )? true : options.shine;
	this.shadow = ( options.shadow === undefined )? true : options.shadow;
	this.shineWidth = 1.2;
	this.shineStren = 50;

	this.vertices3D = [
		[ 0, 0, 0 ], // anchor point
		[ this.size, -this.size, -this.size ],
		[ -this.size, -this.size, -this.size ],
		[ -this.size, this.size, -this.size ],
		[ this.size, this.size, -this.size ],
		[ this.size, -this.size, this.size ],
		[ -this.size, -this.size, this.size ],
		[ -this.size, this.size, this.size ],
		[ this.size, this.size, this.size ]
	];
	this.faces = [
		[ 1, 2, 3, 4 ], // front
		[ 5, 1, 4, 8 ], // right
		[ 6, 5, 8, 7 ], // back
		[ 2, 6, 7, 3 ], // left
		[ 5, 6, 2, 1 ], // top
		[ 4, 3, 7, 8 ]  // bottom
	];

	var centered = ( options.centered === undefined )? true : options.centered;
	if ( !centered ) {
		for ( var i=1; i<this.vertices3D.length; i++ ) {
			var vert = this.vertices3D[i];
			this.pos[0] += this.size;
			this.pos[1] += this.size;
			this.pos[2] += this.size;
		}
	}
};
CubeMesh.prototype = new Mesh();

var BoxMesh = function( options ) {
	Mesh.apply( this, arguments );
	this.size = options.size || {};
	this.size[0] = round2( options.size[0]/2 );
	this.size[1] = round2( options.size[1]/2 );
	this.size[2] = round2( options.size[2]/2 );
	this.rot = options.rot || [ 0, 0, 0 ];
	this.pos = options.pos || [ 0, 0, 0 ];
	this.color = options.color || [ 102, 45, 145 ];
	this.textured = ( options.textured === undefined )? false : options.textured;
	this.fill = ( options.fill === undefined )? true : options.fill;
	this.stroke = ( options.stroke === undefined )? true : options.stroke;
	this.shine = ( options.shine === undefined )? true : options.shine;
	this.shadow = ( options.shadow === undefined )? true : options.shadow;
	this.shineWidth = 1.2;
	this.shineStren = 50;
	this.vertices3D = [
		[ 0, 0, 0 ], // anchor point
		[ this.size[0], -this.size[1], -this.size[2] ],
		[ -this.size[0], -this.size[1], -this.size[2] ],
		[ -this.size[0], this.size[1], -this.size[2] ],
		[ this.size[0], this.size[1], -this.size[2] ],
		[ this.size[0], -this.size[1], this.size[2] ],
		[ -this.size[0], -this.size[1], this.size[2] ],
		[ -this.size[0], this.size[1], this.size[2] ],
		[ this.size[0], this.size[1], this.size[2] ]
	];
	this.faces = [
		[ 1, 2, 3, 4 ], // front
		[ 5, 1, 4, 8 ], // right
		[ 6, 5, 8, 7 ], // back
		[ 2, 6, 7, 3 ], // left
		[ 5, 6, 2, 1 ], // top
		[ 4, 3, 7, 8 ]  // bottom
	];
};
BoxMesh.prototype = new Mesh();

var Background = function( options ) {
	this.top = options.top;
	this.btm = options.btm;
	this.sky = options.sky;
	this.ground = options.ground;
	this.ctx = options.ctx;
	this.can = options.can;
};