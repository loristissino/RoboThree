/**
 * @author Loris Tissino / http://loris.tissino.it
 * @package RoboThree
 * @release 0.50
 * @license The MIT License (MIT)
*/

var http = require('http');
var extend = require('extend');

var ThreeWheelDistanceSensingRobotBehavior = require('../behaviors/ThreeWheelDistanceSensingRobotBehavior');
var ThreeWheelDistanceSensingRobotVirtualizer = require('../virtualizers/ThreeWheelDistanceSensingRobotVirtualizer');

extend ( ThreeWheelDistanceSensingRobotBehavior.prototype, ThreeWheelDistanceSensingRobotVirtualizer.prototype );
extend ( global, require('EspruinoSimulator') );

'use strict';

var port = process.argv[2] || 9080;

var robots = {
    green: new ThreeWheelDistanceSensingRobotBehavior('green'),
    red: new ThreeWheelDistanceSensingRobotBehavior('red')/*,
    blue: new BasicRobot('blue'),
    yellow: new BasicRobot('yellow')*/
};

for (var id in robots) {
    robots[id]
        .createPins()
        .setup()
        .enableInfraredReader()
        .setSpeed(0.8)
        .enableSonars()
        .addVirtualPen()
        .addCommands();
    console.log ( "Activated robot: «" + id + "»" );
}


var mainServer = http.createServer(function (request, response) {
    if (request.method !== 'POST') {
        response.writeHead(405, { 'content-type': 'text/plain' });
        response.write('Method Not Allowed');
        response.end();
        return;
    }

    if (request.url == '/update') {
        var content = '';
        request.on('data', function (data) {
            content += data;
        });
        request.on('end', function () {
            var values = JSON.parse( content );
            var updatedValues = {};
            
            for (var id in robots) {
                updatedValues[id] = robots[id].update( values[id] );
            }
            response.writeHead(200, { 'content-type': 'text/json', 'Access-Control-Allow-Origin': '*' });
            var text = JSON.stringify( updatedValues );
            response.write(text);
            response.end();
        })
    }
    else if (request.url == '/exec') {
        var content = '';
        request.on('data', function (data) {
            content += data;
        });
        request.on('end', function () {
            var values = JSON.parse( content );
            console.log ('[manager] values: ');
            console.log ( values );
            if ( typeof values.robotId !== 'undefined' ) {
                console.log('[manager] Execution of ' + values.command + ' called... ');
                console.log('[manager] Parameters: ');
                console.log(values.parameters);
                robots[values.robotId].exec( values.command, values.parameters, response ); // we delegate the response to the robot
            }
            else {
                response.writeHead(404, { 'content-type': 'text/plain' });
                response.write('Robot not found');
                response.end();
            }
        })
    }
});

mainServer.listen( port );

console.log ( "Listening on port " + port );


