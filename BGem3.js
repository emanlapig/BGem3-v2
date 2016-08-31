var BGem3 = {};

BGem3.Scene = function( options ) {
	this.objs = [];
	this.cams = [];
	this.bg = options.bg || [ 142, 214, 255 ];
	this.fog = options.fog || true;
	this.fogColor = options.fogColor || options.bg || [ 142, 214, 255 ];
	this.fogDist = 800; // distance at which objects disappear
	this.clipDist = 50; // buffer distance for clipping objects behind us
};

BGem3.Camera = function( options ) {
	this.position = options.pos || [ 0, 0, 0 ];
	this.rotation = options.rot || [ 0, 0, 0 ];
	this.focalLen = options.fl || 800;
	this.friction = options.fr || 0.2;
	this.speed = options.speed || 1; // cam movement velocity
	this.w = 0;
	this.a = 0;
	this.s = 0;
	this.d = 0;
	this.u = 0; // up
	this.o = 0; // down
	this.l = 0; // left
	this.r = 0; // right
};

BGem3.Obj3D = function( mesh ) {
	this.mesh = mesh;
	this.visible = true;
};

BGem3.Mesh = function() {
	this.rotation = [ 0, 0, 0 ];
	this.rotation = [ 0, 0, 0 ];
	this.vertices3D = [];
	this.vertices2D = [];
	this.transform = [];
	this.faces = [];
	this.fill = false;
	this.stroke = true;
};

BGem3.CubeMesh = function( options ) {
	BGem3.Mesh.apply( this, arguments );
	this.size = options.size || 5;
	this.rotation = options.rot || [ 0, 0, 0 ];
	this.position = options.pos || [ 0, 0, 0 ];
	this.color = options.color || [ 102, 45, 145 ];
	this.textured = options.textured || false;
	this.fill = options.fill || true;
	this.stroke = options.stroke || true;
	this.shine = options.shine || true;
	this.shadow = options.shadow || true;
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
};
BGem3.CubeMesh.prototype = new BGem3.Mesh();

BGem3.Renderer = function( scene, options ) {
	this.fps = options.fps;
	this.interval = 1/this.fps * 1000;
	this.maxWidth = options.maxWidth;
	this.maxHeight = options.maxHeight;
	this.centerX = options.maxWidth/2;
	this.centerY = options.maxHeight/2;
	this.ctx = options.ctx;
	this.texture = options.texture;

	var _scene = scene;
	var _renderer = this;

	this.camera = _scene.cams[0];

	this.queue = [
		'make_transform',
		'interpret_cam',
		'translate_scene',
 		'project2d',
 		'z_sort',
		'draw'
 	];

	this.render = function() { // kick off the callback chain
		this.queue.forEach( function( index ) {
			_renderer.tasks[ index ]();
		});
	}
	this.tasks = {
		make_transform: function() { // make copy of each obj's vertices3D array for transforms
			for ( var i=0; i<_scene.objs.length; i++ ) {
				_scene.objs[i].mesh.transform = JSON.parse( JSON.stringify( _scene.objs[i].mesh.vertices3D ) );
			}
		},
		interpret_cam: function() { // apply user input to camera position/rotation
			var camera = _renderer.camera;
			var friction = camera.friction;
			var angle = camera.rotation[1]; // y rotation (look L/R)
			// camera position
			if ( camera.w > 0 ) {
				camera.position[2] += Math.cos( Maths.radians( angle ) ) * camera.w;
				camera.position[0] -= Math.sin( Maths.radians( angle ) ) * camera.w;
				if ( camera.w < 1 ) {
					camera.w -= friction;
				}
			}
			if ( camera.s > 0 ) {
				camera.position[2] -= Math.cos( Maths.radians( angle ) ) * camera.s;
				camera.position[0] += Math.sin( Maths.radians( angle ) ) * camera.s;
				if ( camera.s < 1 ) {
					camera.s -= friction;
				}
			}
			if ( camera.a > 0 ) {
				camera.position[2] -= Math.sin( Maths.radians( angle ) ) * camera.a;
				camera.position[0] -= Math.cos( Maths.radians( angle ) ) * camera.a;
				if ( camera.a < 1 ) {
					camera.a -= friction;
				}
			}
			if ( camera.d > 0 ) {
				camera.position[2] += Math.sin( Maths.radians( angle ) ) * camera.d;
				camera.position[0] += Math.cos( Maths.radians( angle ) ) * camera.d;
				if ( camera.d < 1 ) {
					camera.d -= friction;
				}
			}
			// camera rotation
			if ( camera.u > 0 ) {
				camera.rotation[0] += camera.u;
				if ( camera.u < 1 ) {
					camera.u -= friction;
				}
			}
			if ( camera.o > 0 ) {
				camera.rotation[0] -= camera.o;
				if ( camera.o < 1 ) {
					camera.o -= friction;
				}
			}
			if ( camera.l > 0 ) {
				camera.rotation[1] += camera.l;
				if ( camera.l < 1 ) {
					camera.l -= friction;
				}
			}
			if ( camera.r > 0 ) {
				camera.rotation[1] -= camera.r;
				if ( camera.r < 1 ) {
					camera.r -= friction;
				}
			}
		},
		translate_scene: function() { // perform object and camera transforms
			for ( var i=0; i<_scene.objs.length; i++ ) {
				var transform = _scene.objs[i].mesh.transform.slice();
				_scene.objs[i].mesh.transform = Maths.rotate( transform, _scene.objs[i].mesh.rotation );
				_scene.objs[i].mesh.transform = Maths.translate( transform, _scene.objs[i].mesh.position );
				_scene.objs[i].mesh.transform = Maths.translate( transform, _renderer.camera.position );
				_scene.objs[i].mesh.transform = Maths.rotate( transform, _renderer.camera.rotation );
			}
		},
		project2d: function() { // convert 3D coordinates to 2D coordinates
			for ( var i=0; i<_scene.objs.length; i++ ) {
				for ( var j=0; j<_scene.objs[i].mesh.transform.length; j++ ) {
					if ( scene.objs[i].mesh.transform[j][2] >= 0 ) { // z 3D
						var scaleRatio = _renderer.camera.focalLen * -scene.objs[i].mesh.transform[j][2];
					} else {
						var scaleRatio = _renderer.camera.focalLen / scene.objs[i].mesh.transform[j][2];
					}
					var x = Maths.round2( scene.objs[i].mesh.transform[j][0] * scaleRatio + _renderer.centerX );
					var y = Maths.round2( scene.objs[i].mesh.transform[j][1] * scaleRatio + _renderer.centerY );
					_scene.objs[i].mesh.vertices2D.push( [x,y] );
				}
			}
		},
		z_sort: function() { // sort objects by z-index and set face rendering options
			_renderer.zSort = [];
			for ( var i=0; i<_scene.objs.length; i++ ) {
				for ( var j=0; j<_scene.objs[i].mesh.faces.length; j++ ) {
					var zIndex = 0;
					var zObj = [];
					// get z-index by adding total z of all face points
					for ( var k=0; k<_scene.objs[i].mesh.faces[j].length; k++ ) {
						var index = _scene.objs[i].mesh.faces[j][k];
						zIndex += _scene.objs[i].mesh.transform[ index ][2];
						zObj.push( _scene.objs[i].mesh.vertices2D[ index ] ); // zSort[i][0 - 3]: face vertices
					}
					zObj.push( zIndex ); // zSort[i][4]: z-index

					// don't draw objects behind us
					if ( zIndex < -_scene.clipDist ) {
						zObj.push( true ); // zSort[i][5]: visible?
					} else {
						zObj.push( false );
					}

					var tri = [
							_scene.objs[i].mesh.transform[ _scene.objs[i].mesh.faces[j][0] ],
							_scene.objs[i].mesh.transform[ _scene.objs[i].mesh.faces[j][1] ],
							_scene.objs[i].mesh.transform[ _scene.objs[i].mesh.faces[j][2] ]
						];
					var normal = Maths.get_normal( tri );

					var options = {
						color: _scene.objs[i].mesh.color,
						shine: _scene.objs[i].mesh.shine,
						shadow: _scene.objs[i].mesh.shadow,
						shineWidth: _scene.objs[i].mesh.shineWidth,
						shineStren: _scene.objs[i].mesh.shineStren,
						normal: normal,
						textured: _scene.objs[i].mesh.textured,
						fill: _scene.objs[i].mesh.fill,
						stroke: _scene.objs[i].mesh.stroke
					}
					zObj.push( options ); // zSort[i][6]: render options

					_renderer.zSort.push( zObj );
				}
				_scene.objs[i].mesh.transform = [];
				_scene.objs[i].mesh.vertices2D = [];
			}
			_renderer.zSort.sort(function(a,b) {
				return a[4] - b[4];
			});
		},
		draw: function() { // draw to the canvas
			var ctx = _renderer.ctx;
			ctx.clearRect( 0, 0, _renderer.maxWidth, _renderer.maxHeight ); // clear canvas
			ctx.fillStyle="rgb("+_scene.bg[0]+","+_scene.bg[1]+","+_scene.bg[2]+")";
			ctx.fillRect( 0, 0, _renderer.maxWidth, _renderer.maxHeight ); // fill background color
			for ( var i=0; i<_renderer.zSort.length; i++ ) {
				if ( _renderer.zSort[i][5] ) { // if face is visible
					_renderer.zSort[i][5] = Maths.backface_cull( _renderer.zSort[i] ); // backface cull
					if ( _renderer.zSort[i][5] ) { // if face is visible after backface cull
						var pts = [
							_renderer.zSort[i][0],
							_renderer.zSort[i][1],
							_renderer.zSort[i][2],
							_renderer.zSort[i][3]
						];
						ctx.beginPath();
						ctx.moveTo( pts[0][0], pts[0][1] );
						ctx.lineTo( pts[1][0], pts[1][1] );
						ctx.lineTo( pts[2][0], pts[2][1] );
						ctx.lineTo( pts[3][0], pts[3][1] );
						ctx.lineTo( pts[0][0], pts[0][1] );
						ctx.closePath();
						var color = _renderer.zSort[i][6].color,
							r = color[0],
							g = color[1],
							b = color[2];
						if ( _renderer.zSort[i][6].shadow ) { // if shadows are enabled
							var normal = _renderer.zSort[i][6].normal;
							var shineWidth = _renderer.zSort[i][6].shineWidth,
								shineStren = _renderer.zSort[i][6].shineStren,
								shade = 1 - ( normal/Math.PI ),
								shine = 1 - ( normal/Math.PI ) * shineWidth;
							r = Math.floor( color[0]*shade ) + Math.floor( color[0]*shine + shineStren*shine ),
							g = Math.floor( color[1]*shade ) + Math.floor( color[1]*shine + shineStren*shine ),
							b = Math.floor( color[2]*shade ) + Math.floor( color[2]*shine + shineStren*shine );
							if ( _scene.fog ) { // if fog is enabled
								var dist = -_renderer.zSort[i][4] / 4; // object distance from cam
								var fogRatio = dist / _scene.fogDist;
								if (fogRatio>1) {
									fogRatio=1;
								}
								// figure out the difference between current color and fog color, multiply the difference by the fogRatio, then apply that difference to the color
								var Rdiff = r - _scene.fogColor[0];
								r = Math.floor( r - ( Rdiff*fogRatio ) );
								var Gdiff = g - _scene.fogColor[1];
								g = Math.floor( g - ( Gdiff*fogRatio ) );
								var Bdiff = b - _scene.fogColor[2];
								b = Math.floor( b - ( Bdiff*fogRatio ) );
							}
						}
						if ( _renderer.zSort[i][6].fill ) {
							ctx.fillStyle="rgb("+r+","+g+","+b+")";
							ctx.fill();
						}
						if ( _renderer.zSort[i][6].stroke ) {
							ctx.strokeStyle="rgb("+r+","+g+","+b+")";
							ctx.stroke();
						}
						ctx.restore();
					}
				}
			}
			_renderer.zSort = [];
		}
	}
};

BGem3.Controller = function( scene, renderer ) {
	var _scene = scene;
	var _renderer = renderer;
	this.init = function() {
		var camera = _renderer.camera;
		var speed = camera.speed;
		var friction = camera.friction;
		window.addEventListener( "keydown", function( event ) {
			switch ( event.keyCode ) {
				case 87: // W
					camera.w = speed;
					break;
				case 65: // A
					camera.a = speed;
					break;
				case 83: // S
					camera.s = speed;
					break;
				case 68: // D
					camera.d = speed;
					break;
				case 38: // up
					camera.u = speed;
					break;
				case 40: // down
					camera.o = speed;
					break;
				case 37: // left
					camera.l = speed;
					break;
				case 39: // right
					camera.r = speed;
					break;
			}
		});
		window.addEventListener( "keyup", function( event ) {
			switch ( event.keyCode ) {
				case 87: // W
					camera.w -= friction;
					break;
				case 65: // A
					camera.a -= friction;
					break;
				case 83: // S
					camera.s -= friction;
					break;
				case 68: // D
					camera.d -= friction;
					break;
				case 38: // up
					camera.u = 0;
					break;
				case 40: // down
					camera.o = 0;
					break;
				case 37: // left
					camera.l = 0;
					break;
				case 39: // right
					camera.r = 0;
					break;
			}
		});
	}
};

BGem3.Maths = function() {
	this.translate = function( target, vector ) {
		for ( var i=0; i<target.length; i++ ) {
			target[i][0] += vector[0];
			target[i][1] += vector[1];
			target[i][2] += vector[2];
		}
		return target;
	}
	this.rotate = function( target, vector ) {
		// y axis
		for ( var i=0; i<target.length; i++ ) {
			var vx = target[i][0];
			var vz = target[i][2];
			var angle = Maths.get_angle( [0,0], [vx,vz] );
			var angle2 = angle - Maths.radians( vector[1] );
			if ( angle2 > 2*Math.PI ) {
				angle2 -= 2*Math.PI;
			}
			var r = Maths.get_dist( [0,0], [vx,vz] );
			target[i][0] = Math.cos( angle2 ) * r;
			target[i][2] = Math.sin( angle2 ) * r;
		}
		// z axis
		for ( var j=0; j<target.length; j++ ) {
			var vx = target[j][0];
			var vy = target[j][1];
			var angle = Maths.get_angle( [0,0], [vx,vy] );
			var angle2 = angle - Maths.radians( vector[2] );
			if ( angle2 > 2*Math.PI ) {
				angle2 -= 2*Math.PI;
			}
			var r = Maths.get_dist( [0,0], [vx,vy] );
			target[j][0] = Math.cos( angle2 ) * r;
			target[j][1] = Math.sin( angle2 ) * r;
		}
		// x axis
		for ( var k=0; k<target.length; k++ ) {
			var vy = target[k][1];
			var vz = target[k][2];
			var angle = Maths.get_angle( [0,0], [vy,vz] );
			var angle2 = angle - Maths.radians( vector[0] );
			if ( angle2 > 2*Math.PI ) {
				angle2 -= 2*Math.PI;
			}
			var r = Maths.get_dist( [0,0], [vy,vz] );
			target[k][1] = Math.cos( angle2 ) * r;
			target[k][2] = Math.sin( angle2 ) * r;
		}
		return target;
	}
	this.radians = function( deg ) {
		return deg * Math.PI/180;
	}
	this.get_angle = function( p1, p2 ) {
		var angle,
			x1 = p1[0],
			x2 = p2[0],
			y1 = p1[1],
			y2 = p2[1];
		if ( x2>x1 && y2>=y1 ) { // quad i
			angle = Math.atan( (y2-y1)/(x2-x1) ); 
		}
		else if ( x2<=x1 && y2>y1 ) { // quad ii
			angle = 0.5*Math.PI - Math.atan( (x2-x1)/(y2-y1) );
		}
		else if ( x2<x1 && y2<=y1 ) { // quad iii
			angle = Math.PI + Math.atan( (y2-y1)/(x2-x1) );
		}
		else if ( x2>=x1 && y2<y1 ) { // quad iv
			angle = 1.5*Math.PI - Math.atan( (x2-x1)/(y2-y1) );
		}
		return angle;
	}
	this.get_dist = function( p1, p2 ) {
		var dx = p1[0] - p2[0],
			dy = p1[1] - p2[1],
			dist = Math.sqrt( dx*dx + dy*dy );
		return dist;
	}
	this.random = function( a, b ) {
		var c = b - a;
		return Math.floor( Math.random()*c+a );
	}
	this.round2 = function( num ) {
	    return Math.round((num + 0.00001) * 100) / 100;
	}
	this.backface_cull = function( face ) {
		var a = face[0],
			b = face[1],
			c = face[2],
			ax = b[0] - a[0],
			ay = b[1] - a[1],
			bx = b[0] - c[0],
			by = b[1] - c[1],
			z = (ax*by) - (ay*bx);
		if ( z<0 ) {
			return true;
		} else {
			return false;
		}
	}
	this.get_normal = function( face ) {
		var light = [ 100, 200, 50 ];
		var p1 = face[0],
			p2 = face[1],
			p3 = face[2];
		var Ax = p2[0] - p1[0],
			Ay = p2[1] - p1[1],
			Az = p2[2] - p1[2],
			Bx = p3[0] - p1[0],
			By = p3[1] - p1[1],
			Bz = p2[2] - p1[2];
		var Cx = Ay*Bz - Az*By,
			Cy = Az*Bx - Ax*Bz,
			Cz = Ax*By - Ay*Bx;
		var ax = Cx,
			ay = Cy,
			az = Cz,
			bx = light[0],
			by = light[1],
			bz = light[2];
		var angle = Math.acos( (ax*bx+ay*by+az*bz) / Math.sqrt((ax*ax+ay*ay+az*az)*(bx*bx+by*by+bz*bz)) );
		return angle;
	}
};

var Maths = new BGem3.Maths();

// the end.