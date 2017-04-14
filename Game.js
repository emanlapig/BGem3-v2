// Game.js

var Game = function( scene ) {
	this.init = function() {
		for ( var i=0; i<36; i++ ) {
			var block = this.spawn_block();
			block.pos[0] = 40 * (i%6);
			block.pos[2] = -40 * Math.floor(i/6);
			scene.groups.push( block );
		}
	}
	this.play = function() {
		for ( var i=1; i<scene.objs.length; i++ ) {
			//scene.objs[i].mesh.rot[2] += 1;
			if ( scene.objs[i].mesh.rot[1] > 360 ) {
				scene.objs[i].mesh.rot[1] -= 360;
			}
			if ( scene.objs[i].mesh.rot[1] < -360 ) {
				scene.objs[i].mesh.rot[1] += 360;
			}
		}
		for ( var i=0; i<scene.groups.length; i++ ) {
			//scene.groups[i].rot[1] += 1;
			if ( scene.groups[i].rot[1] > 360 ) {
				scene.groups[i].rot[1] -= 360;
			}
			if ( scene.groups[i].rot[1] < -360 ) {
				scene.groups[i].rot[1] += 360;
			}
		}
	}
	this.spawn_block = function() {
		var objs = [];
		for ( var i=0; i<4; i++ ) {
			var fl = new Obj3D( new PlaneMesh( {
				size: [ 10 ],
				pos: [ 8, scene.floor, 8 ],
				rot: [ -90, 0, 0 ],
				color: [ 102, 45, 145 ],
				backside: false
			} ) );

			var height = random( 5, 15 );
			var box = new Obj3D( new BoxMesh( { 
				size: [ 5, height, 5 ],
				pos: [ 8, scene.floor + ( height/2 ), 8 ],
				rot: [ 0, 0, 0 ]
			} ) );

			switch (i) {
				case 1:
					box.mesh.pos[0] *= -1;
					fl.mesh.pos[0] *= -1;
					break;
				case 2:
					box.mesh.pos[0] *= -1;
					fl.mesh.pos[0] *= -1;
					box.mesh.pos[2] *= -1;
					fl.mesh.pos[2] *= -1;
					break;
				case 3:
					box.mesh.pos[2] *= -1;
					fl.mesh.pos[2] *= -1;
					break;
			}

			if ( random( 0, 3 ) < 3 ) {
				scene.objs.push( box );
				scene.objs.push( fl );
				objs.push( box );
				objs.push( fl );
			} else {
				box = false;
				fl = false;
			}

		}

		var group = new ObjGroup( objs, {
			pos: [ 0, 0, 0 ],
			rot: [ 0, 0, 0 ]
		} );
		return group;
	}
};