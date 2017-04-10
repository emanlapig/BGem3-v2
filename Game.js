// Game.js

var Game = function( scene ) {
	var _scene = scene;
	this.play = function() {
		for ( var i=0; i<scene.objs.length; i++ ) {
			//scene.objs[i].mesh.rot[1] += 1;
			if ( scene.objs[i].mesh.rot[1] > 360 ) {
				scene.objs[i].mesh.rot[1] -= 360;
			}
			if ( scene.objs[i].mesh.rot[1] < -360 ) {
				scene.objs[i].mesh.rot[1] += 360;
			}
		}
	};
};