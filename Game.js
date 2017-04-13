// Game.js

var Game = function( scene ) {
	var _scene = scene;
	this.play = function() {
		for ( var i=1; i<scene.objs.length; i++ ) {
			scene.objs[i].mesh.rot[0] += 1;
			if ( scene.objs[i].mesh.rot[1] > 360 ) {
				scene.objs[i].mesh.rot[1] -= 360;
			}
			if ( scene.objs[i].mesh.rot[1] < -360 ) {
				scene.objs[i].mesh.rot[1] += 360;
			}
		}
		for ( var i=0; i<scene.groups.length; i++ ) {
			scene.groups[i].rot[1] += 1;
			if ( scene.groups[i].rot[1] > 360 ) {
				scene.groups[i].rot[1] -= 360;
			}
			if ( scene.groups[i].rot[1] < -360 ) {
				scene.groups[i].rot[1] += 360;
			}
		}
	};
};