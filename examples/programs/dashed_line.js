var RobotCommander = require('RobotCommander');
require('extend')( global, new RobotCommander( 'green', '127.0.0.1:9080' ).functions );

for ( var i = 0; i<3; i++ ) {
    penDown();
    moveForward(20);
    penUp();
    moveForward(20);
}
