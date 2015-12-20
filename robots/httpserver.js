var http = require('http');
var request = require('request');

/**
 * @author Loris Tissino / http://loris.tissino.it
*/

'use strict';

var BasicRobot = function ( id ) {
    this.id = id;
    this.dist = 100;
    this.inManoeuver = false;
    this.LED1 = 0;
    this.LW0 = 0; // array?
    this.LW1 = 0;
    this.RW0 = 0;
    this.RW1 = 0;
};

BasicRobot.prototype.onInit = function onInit () {
    setInterval(this.step.bind(this), 100); // check every 100ms to see if we're too close // see http://stackoverflow.com/questions/7890685/referencing-this-inside-setinterval-settimeout-within-object-prototype-methods
    this.forward();
}

BasicRobot.prototype.update = function update ( values ) {
    //console.log ( "Processing:" );
    //console.log ( values );
    if ( typeof values !== 'undefined' )
    {
        // input
        this.dist = values.dist;
    }  
    else {
        values = {};
    }
    
    // output
    values.lw0 = this.LW0;
    values.lw1 = this.LW1;
    values.rw0 = this.RW0;
    values.rw1 = this.RW1;

    return values;
}

BasicRobot.prototype.forward = function forward () {
    this.LW0 = 0;
    this.RW0 = 0;
    this.LW1 = 1;
    this.RW1 = 1;
}

BasicRobot.prototype.back = function back () {
    console.log("=======BACKING!!!");
    this.LW0 = 1;
    this.RW0 = 1;
    this.LW1 = 0;
    this.RW1 = 0;
}

BasicRobot.prototype.turn = function turn () {
    this.LW0 = 1;
    this.RW0 = 0;
    this.LW1 = 0;
    this.RW1 = 1;
}

BasicRobot.prototype.stop = function stop () {
    this.LW0 = 0;
    this.RW0 = 0;
    this.LW1 = 0;
    this.RW1 = 0;
}

BasicRobot.prototype.backup = function backup () {
    this.inManoeuver = true;
    this.back();
    var robot = this; // a reference
    setTimeout(function() {
        robot.turn();
        setTimeout(function() {
            robot.inManoeuver = false;
            robot.forward();
        }, 2500);
    }, 2500);
}

BasicRobot.prototype.step = function step () {
    // if we detect we're getting too close, turn around
    if ( this.dist < 20 && !this.inManoeuver ) {
        this.backup();
    }
}

var robots = {
    one: new BasicRobot('one')
};

for (var id in robots) {
    robots[id].onInit();
}

console.log ( robots );

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
            //console.log("Request:");
            //console.log(values);
            
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

