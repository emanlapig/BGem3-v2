// BGem3.js
var Scene = function() {
	this.objs = [];
	this.groups = [];
	this.cams = [];
	this.fog = true;
	this.fogColor = [ 142, 214, 255 ];
	this.fogDist = 600; // distance at which objects disappear
	this.clipDist = 50; // buffer distance for clipping objects behind us
};

var Camera = function( options ) {
	this.pos = options.pos || [ 0, 0, 0 ];
	this.rot = options.rot || [ 0, 0, 0 ];
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

var Renderer = function( scene, options ) {
	this.fps = options.fps;
	this.interval = 1/this.fps * 1000;
	this.maxWidth = options.maxWidth;
	this.maxHeight = options.maxHeight;
	this.centerX = options.maxWidth/2;
	this.centerY = options.maxHeight/2;
	this.ctx = options.ctx;
	this.texture = options.texture;
	this.bg = options.bg;

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
		interpret_cam: function() { // apply user input to camera pos/rot
			var camera = _renderer.camera;
			var friction = camera.friction;
			var angle = camera.rot[1]; // y rot (look L/R)
			// camera pos
			if ( camera.w > 0 ) {
				camera.pos[2] += Math.cos( radians( angle ) ) * camera.w;
				camera.pos[0] -= Math.sin( radians( angle ) ) * camera.w;
				if ( camera.w < 1 ) {
					camera.w -= friction;
				}
			}
			if ( camera.s > 0 ) {
				camera.pos[2] -= Math.cos( radians( angle ) ) * camera.s;
				camera.pos[0] += Math.sin( radians( angle ) ) * camera.s;
				if ( camera.s < 1 ) {
					camera.s -= friction;
				}
			}
			if ( camera.a > 0 ) {
				camera.pos[2] -= Math.sin( radians( angle ) ) * camera.a;
				camera.pos[0] -= Math.cos( radians( angle ) ) * camera.a;
				if ( camera.a < 1 ) {
					camera.a -= friction;
				}
			}
			if ( camera.d > 0 ) {
				camera.pos[2] += Math.sin( radians( angle ) ) * camera.d;
				camera.pos[0] += Math.cos( radians( angle ) ) * camera.d;
				if ( camera.d < 1 ) {
					camera.d -= friction;
				}
			}
			// camera rot
			if ( camera.u > 0 ) {
				camera.rot[0] += camera.u;
				if ( camera.u < 1 ) {
					camera.u -= friction;
				}
			}
			if ( camera.o > 0 ) {
				camera.rot[0] -= camera.o;
				if ( camera.o < 1 ) {
					camera.o -= friction;
				}
			}
			if ( camera.l > 0 ) {
				camera.rot[1] += camera.l;
				if ( camera.l < 1 ) {
					camera.l -= friction;
				}
			}
			if ( camera.r > 0 ) {
				camera.rot[1] -= camera.r;
				if ( camera.r < 1 ) {
					camera.r -= friction;
				}
			}
		},
		translate_scene: function() { // perform object and camera transforms
			for ( var i=0; i<_scene.objs.length; i++ ) {
				var transform = _scene.objs[i].mesh.transform.slice();
				_scene.objs[i].mesh.transform = rotate( transform, _scene.objs[i].mesh.rot );
				_scene.objs[i].mesh.transform = translate( transform, _scene.objs[i].mesh.pos );
			}
			for ( var i=0; i<_scene.groups.length; i++ ) {
				for ( var j=0; j<_scene.groups[i].objs.length; j++ ) {
					var transform = _scene.groups[i].objs[j].mesh.transform.slice();
					_scene.groups[i].objs[j].mesh.transform = rotate( transform, _scene.groups[i].rot );
					_scene.groups[i].objs[j].mesh.transform = translate( transform, _scene.groups[i].pos );
				}
			}
			for ( var i=0; i<_scene.objs.length; i++ ) {
				var transform = _scene.objs[i].mesh.transform.slice();
				_scene.objs[i].mesh.transform = translate( transform, _renderer.camera.pos );
				_scene.objs[i].mesh.transform = rotate( transform, _renderer.camera.rot );
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
					var x = round2( scene.objs[i].mesh.transform[j][0] * scaleRatio + _renderer.centerX );
					var y = round2( scene.objs[i].mesh.transform[j][1] * scaleRatio + _renderer.centerY );
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
					var normal = get_normal( tri );

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
			if ( _renderer.bg ) {
				r_draw_bg( _renderer.bg, ctx, _renderer.camera );
			} else {
				ctx.fillStyle = "rgb(142, 214, 255)";
				ctx.fillRect( 0, 0, _renderer.maxWidth, _renderer.maxHeight ); // fill background color
			}
			for ( var i=0; i<_renderer.zSort.length; i++ ) {
				if ( _renderer.zSort[i][5] ) { // if face is visible
					_renderer.zSort[i][5] = backface_cull( _renderer.zSort[i] ); // backface cull
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
						// if shadows are enabled
						if ( _renderer.zSort[i][6].shadow ) { 
							var normal = _renderer.zSort[i][6].normal;
							var shineWidth = _renderer.zSort[i][6].shineWidth,
								shineStren = _renderer.zSort[i][6].shineStren,
								shade = 1 - ( normal/Math.PI ),
								shine = 1 - ( normal/Math.PI ) * shineWidth;
							r = Math.floor( color[0]*shade ) + Math.floor( color[0]*shine + shineStren*shine ),
							g = Math.floor( color[1]*shade ) + Math.floor( color[1]*shine + shineStren*shine ),
							b = Math.floor( color[2]*shade ) + Math.floor( color[2]*shine + shineStren*shine );
							// if fog is enabled
							if ( _scene.fog ) { 
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
						// if fill is enabled (if false shadows will also not be drawn)
						if ( _renderer.zSort[i][6].fill ) { 
							ctx.fillStyle="rgb("+r+","+g+","+b+")";
							ctx.fill();
						}
						// if stroke is enabled (currently uses shaded fill color)
						if ( _renderer.zSort[i][6].stroke ) { 
							ctx.strokeStyle="rgb("+r+","+g+","+b+")";
							ctx.stroke();
						}

						if ( _renderer.zSort[i][6].textured ) {
							r_texture( ctx, pts, _renderer );
						}
						ctx.restore();
					}
				}
			}
			_renderer.zSort = [];
		}
	}
};

function r_texture( ctx, pts, _renderer ) {
	var tris = [[0,1,3],[1,2,3]];
	var uvs = [ [0, 640], [640, 640], [640, 0], [0, 0] ];
	for (var t=0; t<tris.length; t++) {
		ctx.save();
		ctx.beginPath();
		ctx.moveTo( pts[0][0], pts[0][1] );
		ctx.lineTo( pts[1][0], pts[1][1] );
		ctx.lineTo( pts[2][0], pts[2][1] );
		ctx.lineTo( pts[3][0], pts[3][1] );
		ctx.lineTo( pts[0][0], pts[0][1] );
		ctx.closePath();
		ctx.clip();
	    var pp = tris[t],
	        p1 = pp[0], p2 = pp[1], p3 = pp[2],
	        x0 = pts[p1][0], x1 = pts[p2][0], x2 = pts[p3][0],
	        y0 = pts[p1][1], y1 = pts[p2][1], y2 = pts[p3][1],
	        u0 = uvs[p1][0], u1 = uvs[p2][0], u2 = uvs[p3][0],
	        v0 = uvs[p1][1], v1 = uvs[p2][1], v2 = uvs[p3][1];
	    // Cramer's rule
	    var delta = u0*v1 + v0*u2 + u1*v2 - v1*u2 - v0*u1 - u0*v2,
	        da = x0*v1 + v0*x2 + x1*v2 - v1*x2 - v0*x1 - x0*v2,
	        db = u0*x1 + x0*u2 + u1*x2 - x1*u2 - x0*u1 - u0*x2,
	        dc = u0*v1*x2 + v0*x1*u2 + x0*u1*v2 - x0*v1*u2 - v0*u1*x2 - u0*x1*v2,
	        dd = y0*v1 + v0*y2 + y1*v2 - v1*y2 - v0*y1 - y0*v2,
	        de = u0*y1 + y0*u2 + u1*y2 - y1*u2 - y0*u1 - u0*y2,
	        df = u0*v1*y2 + v0*y1*u2 + y0*u1*v2 - y0*v1*u2 - v0*u1*y2 - u0*y1*v2;
	    ctx.transform(
	        da/delta, dd/delta,
	        db/delta, de/delta,
	        dc/delta, df/delta
	    );
	    ctx.drawImage( _renderer.texture, 0, 0 );
		ctx.restore();
	}
};

function r_draw_bg( bg, ctx, camera ) {
	var bgctx = bg.ctx;
	var grd = ctx.createLinearGradient( 0, -maxHeight, 0, maxHeight*2 );
	var angle = camera.rot[0] + 90;
	var horizon = angle/175;
	bgctx.save();
	bgctx.clearRect( 0, 0, maxWidth, maxHeight*2 );
	grd.addColorStop( 0.2, "rgb(" + bg.top[0] + "," + bg.top[1] + "," + bg.top[2] + ")" )
	grd.addColorStop( Math.max( Math.min( horizon-0.01, 0.8 ), 0.2 ), "rgb(" + bg.sky[0] + "," + bg.sky[1] + "," + bg.sky[2] + ")" );
	grd.addColorStop( Math.max( Math.min( horizon+0.01, 0.8 ), 0.2 ), "rgb(" + bg.ground[0] + "," + bg.ground[1] + "," + bg.ground[2] + ")" );
	grd.addColorStop( 0.8, "rgb(" + bg.btm[0] + "," + bg.btm[1] + "," + bg.btm[2] + ")" );
	bgctx.fillStyle = grd;
	bgctx.fillRect( 0, -maxHeight, maxWidth, maxHeight*2 );

	ctx.drawImage( bg.can, 0, 0 );
	ctx.restore();
	bgctx.restore();
};

var Controller = function( renderer ) {
	this.init = function() {
		var camera = renderer.camera;
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

function translate( target, vector ) {
	for ( var i=0; i<target.length; i++ ) {
		target[i][0] += vector[0];
		target[i][1] += vector[1];
		target[i][2] += vector[2];
	}
	return target;
};

function rotate( target, vector ) {
	// y axis
	for ( var i=0; i<target.length; i++ ) {
		var vx = target[i][0];
		var vz = target[i][2];
		var angle = get_angle( [0,0], [vx,vz] );
		var angle2 = angle - radians( vector[1] );
		if ( angle2 > 2*Math.PI ) {
			angle2 -= 2*Math.PI;
		}
		var r = get_dist( [0,0], [vx,vz] );
		target[i][0] = Math.cos( angle2 ) * r;
		target[i][2] = Math.sin( angle2 ) * r;
	}
	// z axis
	for ( var j=0; j<target.length; j++ ) {
		var vx = target[j][0];
		var vy = target[j][1];
		var angle = get_angle( [0,0], [vx,vy] );
		var angle2 = angle - radians( vector[2] );
		if ( angle2 > 2*Math.PI ) {
			angle2 -= 2*Math.PI;
		}
		var r = get_dist( [0,0], [vx,vy] );
		target[j][0] = Math.cos( angle2 ) * r;
		target[j][1] = Math.sin( angle2 ) * r;
	}
	// x axis
	for ( var k=0; k<target.length; k++ ) {
		var vy = target[k][1];
		var vz = target[k][2];
		var angle = get_angle( [0,0], [vy,vz] );
		var angle2 = angle - radians( vector[0] );
		if ( angle2 > 2*Math.PI ) {
			angle2 -= 2*Math.PI;
		}
		var r = get_dist( [0,0], [vy,vz] );
		target[k][1] = Math.cos( angle2 ) * r;
		target[k][2] = Math.sin( angle2 ) * r;
	}
	return target;
};

function radians( deg ) {
	return deg * Math.PI/180;
};

function get_angle( p1, p2 ) {
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
};

function get_dist( p1, p2 ) {
	var dx = p1[0] - p2[0],
		dy = p1[1] - p2[1],
		dist = Math.sqrt( dx*dx + dy*dy );
	return dist;
};

function random( a, b ) {
	var c = b - a;
	return Math.floor( Math.random()*c+a );
};

function round2( num ) {
	return Math.round((num + 0.00001) * 100) / 100;
};

function backface_cull( face ) {
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
};

function get_normal( face ) {
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
};