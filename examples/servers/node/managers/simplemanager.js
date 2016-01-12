/**
 * @author Loris Tissino / http://loris.tissino.it
 * @package RoboThree
 * @release 0.40
 * @license The MIT License (MIT)
*/

var http = require('http');
var request = require('request');
var extend = require('extend');

//var BasicRobot = require('../behaviors/BasicRobot');

var ThreeWheelDistanceSensingRobotBehavior = require('../behaviors/ThreeWheelDistanceSensingRobotBehavior');
var ThreeWheelDistanceSensingRobotVirtualizer = require('../virtualizers/ThreeWheelDistanceSensingRobotVirtualizer');

extend ( ThreeWheelDistanceSensingRobotBehavior.prototype, ThreeWheelDistanceSensingRobotVirtualizer.prototype );
extend ( global, require('EspruinoSimulator') );


'use strict';


var robots = {
    green: new ThreeWheelDistanceSensingRobotBehavior('green'),
    red: new ThreeWheelDistanceSensingRobotBehavior('red')/*,
    blue: new BasicRobot('blue'),
    yellow: new BasicRobot('yellow')*/
};

for (var id in robots) {
    robots[id].createPins().setup().enableInfraredReader().setSpeed(0.8).addVirtualPen();
//    robots[id].sonars.left.enable();
//    robots[id].sonars.front.enable();
//    robots[id].sonars.right.enable();
}

var mainServer = http.createServer(function (request, response) {
    if (request.url == '/update')
    {
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
});

mainServer.listen(9080);

