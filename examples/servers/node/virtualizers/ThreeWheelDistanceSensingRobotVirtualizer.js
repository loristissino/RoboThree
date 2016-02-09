var extend = require('extend');

/**
 * @classdesc Mixin providing methods for the virtualization of a robot's behavior.
 * @mixin
 * @author Loris Tissino (http://loris.tissino.it)
 * @release 0.70
 * @license MIT
 * @constructor
 */
var ThreeWheelDistanceSensingRobotVirtualizer = function ( ) {
};

/**
 * Creates the pins needed.
 * @return {ThreeWheelDistanceSensingRobotBehavior} - The behavior
 */
ThreeWheelDistanceSensingRobotVirtualizer.prototype.createPins = function createPins () {
    var availablePins = ['B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B9', 'B12', 'C12', 'C15', 'C0', 'C1', 'C2', 'C3', 'A0', 'A1', '3.3', 'A15', 'A14', 'A13', 'A10', 'A9', 'A8', 'C11', 'C10', 'C9', 'C8', 'C7', 'C6', 'C5', 'C4', 'B15', 'B14', 'B13', '3.3', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'B0', 'B1', 'B10', 'B11', 'A11', 'A12', 'C13', 'C14', 'D0', 'D1', 'D2'];
    var aliases = [
        { source: 'LED1', target: 'A13' }, 
        { source: 'LED2', target: 'A14' },
        { source: 'LED3', target: 'A15' },
        { source: 'BTN1', target: 'B12' },
        { source: 'BTN',  target: 'B12' },
        { source: 'BOOT1', target: 'B2' },
    ]
    
    for ( var i = 0; i<availablePins.length; i++ ) {
        global[availablePins[i]] = new Pin( availablePins[i] );
    }
    for ( i = 0; i<aliases.length; i++ ) {
        global[aliases[i].source] = global[aliases[i].target];
    }
    this.registeredCallBacks = {};
    console.log ('pins created');
    return this;
}

/**
 * Enables the infrared reader.
 * @override
 * @return {ThreeWheelDistanceSensingRobotBehavior} - The behavior
 */
ThreeWheelDistanceSensingRobotVirtualizer.prototype.enableInfraredReader = function enableInfraredReader () {
    this.infraredReader.code = -1;
    this.registeredCallBacks.infraredReader = this.handleInfraredReaderCode.bind(this);
    return this;
}

/**
 * Disables the infrared reader.
 * @override
 * @return {ThreeWheelDistanceSensingRobotBehavior} - The behavior
 */
ThreeWheelDistanceSensingRobotVirtualizer.prototype.disableInfraredReader = function disableInfraredReader () {
    delete this.registeredCallBacks.infraredReader;
    return this;
}

/**
 * Adds a virtual pen.
 * @return {ThreeWheelDistanceSensingRobotBehavior} - The behavior
 */
ThreeWheelDistanceSensingRobotVirtualizer.prototype.addVirtualPen = function addVirtualPen () {
    this.infraredReader.codesMap['16619623'] = { exec: 'togglePen', repeatOnKeptPressed: false };
    this.pen = { enabled: false };
    return this;
}

/**
 * Toggles the virtual pen.
 * @return {ThreeWheelDistanceSensingRobotBehavior} - The behavior
 */
ThreeWheelDistanceSensingRobotVirtualizer.prototype.togglePen = function () {
    this.pen.enabled = !this.pen.enabled;
}

/**
 * Adds commands.
 * @return {ThreeWheelDistanceSensingRobotBehavior} - The behavior
 */
ThreeWheelDistanceSensingRobotVirtualizer.prototype.addCommands = function addCommands () {
    var robot = this;
    this.commandManager = {
        currentWait: false,
        sendHTTPResponse: function (code, type, body ) {
            robot.commandManager.originalResponse.writeHead( code, { 'content-type': type } );
            robot.commandManager.originalResponse.write( type === 'text/json' ? JSON.stringify ( body ): body );
            robot.commandManager.originalResponse.end();
        },
        commands: {
            'stop': {
                exec: function ( ) {
                    robot.stop();
                },
                wait: function ( ) {
                    if ( robot.leftWheel.status == 0 && robot.rightWheel.status == 0 ) {
                            robot.commandManager.currentWait = false;
                            robot.commandManager.sendHTTPResponse( 200, 'text/json', { stopped: true } );
                    }
                }
            },
            'moveForward': {
                exec: function ( ) {
                    if ( robot.commandManager.parameters.gap > 0 ) {
                        robot.moveForward();
                    }
                    else {
                        robot.moveBackward();
                        robot.commandManager.parameters.gap = -robot.commandManager.parameters.gap;
                    }
                },
                wait: function ( ) {
                    if ( ! robot.hasOwnProperty('location' ) ) {
                        robot.commandManager.sendHTTPResponse( 500, 'text/plain', 'Internal Error' );
                        return;
                    }
                    var current_diff = Math.sqrt (
                        Math.pow ( ( robot.location.x - robot.commandManager.initialState.location.x ), 2 ) +
                        Math.pow ( ( robot.location.y - robot.commandManager.initialState.location.y ), 2 )
                        );
                    if ( current_diff >= robot.commandManager.parameters.gap ) {
                            robot.commandManager.currentWait = false;
                            robot.commandManager.sendHTTPResponse( 200, 'text/json', { moved: true } );
                    }
                }
            },
            'penUp': {
                exec: function ( ) {
                    console.log ( 'pulling up the pen!' );
                    robot.pen.enabled = false;
                },
                wait: function ( ) {
                    if ( robot.pen.hasOwnProperty ('status') && robot.pen.status === 'up' ) {
                        robot.commandManager.currentWait = false;
                        robot.commandManager.sendHTTPResponse( 200, 'text/json', { pen: 'up' } );
                    }
                }
            },
            'penDown': {
                exec: function ( ) {
                    console.log ( 'putting down the pen!' );
                    robot.pen.enabled = true;
                },
                wait: function ( ) {
                    if ( robot.pen.hasOwnProperty ('status') && robot.pen.status === 'down' ) {
                        robot.commandManager.currentWait = false;
                        robot.commandManager.sendHTTPResponse( 200, 'text/json', { pen: 'down' } );
                    }
                }
            },
            'getHeading': {
                exec: function ( ) {
                    console.log ( 'current heading: ' + robot.heading );
                    return { heading: robot.heading };
                },
            },
            'getSpeed': {
                exec: function ( ) {
                    console.log ( 'current speed: ' + robot.speed );
                    return { heading: robot.speed };
                },
            },
            'setSpeed': {
                exec: function ( ) {
                    robot.setSpeed ( robot.commandManager.parameters.speed );
                    return { heading: robot.speed };
                },
            },
            'getSonarMeasure': {
                exec: function ( ) {
                    return { distance: robot.sonars[robot.commandManager.parameters.sonar].distance  };
                },
            },
        }
    }
    return this;
}

/**
 * Execs a command.
 * @param {string} command - The command
 * @param {Object} parameters - The parameters of the command
 * @param {http.ServerResponse} originalResponse - The response to use for the reply
 */
ThreeWheelDistanceSensingRobotVirtualizer.prototype.exec = function ( command, parameters, originalResponse ) {

    var robot = this;
    
    if ( ! this.hasOwnProperty ('commandManager') ) {
        throw "CommandManager has not been enabled for this robot";
    }

    this.commandManager.originalResponse = originalResponse;
    this.commandManager.parameters = parameters;
    
    if ( this.commandManager.currentWait !== false ) {
        robot.commandManager.sendHTTPResponse( 503, 'text/plain', 'Service Unavailable' );
        return;
    }
    
    if ( ! this.commandManager.commands.hasOwnProperty( command ) ) {
        robot.commandManager.sendHTTPResponse( 400, 'text/plain', 'Bad Request' );
        return;
    }
    
    var command = this.commandManager.commands[command];

    this.commandManager.initialState = {
        location: { x: robot.location.x, y: robot.location.y },
        heading: robot.heading
    };

    var result = command.exec();
    
    if ( command.hasOwnProperty ( 'wait' ) ) {
        this.commandManager.currentWait = command.wait;
    } else {
        robot.commandManager.sendHTTPResponse( 200, 'text/json', result );
    }
}

/**
 * Updates the robot with the information coming from the robot's manager.
 * @param {Object} values - The parameters of the command
 */
ThreeWheelDistanceSensingRobotVirtualizer.prototype.update = function update ( values ) {    
    if ( typeof values !== 'undefined' )
    {
        this.infraredReader.code = values.ir;
        this.location = values.location;
        this.heading = values.heading;
        this.pen.status = values.penStatus;
        this.leftWheel.status = values.leftWheel;
        this.rightWheel.status = values.rightWheel;
        if ( values.hasOwnProperty('sonars') ) {
            for (var key in values.sonars) {
                this.sonars[key].distance = values.sonars[key].distance;
            }
        }
        if ( values.hasOwnProperty('buzzer') ) {
            if ( values.buzzer.status == 2 ) {
                this.buzzer.status = 0;
            }
        }
    }  
    else {
        values = {};
    }
    
    if ( this.commandManager.currentWait !== false ) {
        this.commandManager.currentWait();
    }

    for (var f in this.registeredCallBacks) {
        this.registeredCallBacks[f]();
    }

    values.leftWheel = this.leftWheel.getSpeed() * ( this.leftWheel.controlPins[0].xGetLastOutput() - this.leftWheel.controlPins[1].xGetLastOutput() );
    values.rightWheel = this.rightWheel.getSpeed() * ( this.rightWheel.controlPins[0].xGetLastOutput() - this.rightWheel.controlPins[1].xGetLastOutput() );
    
    // are the sonars enabled?
    values.sonars = {
        left:  { enabled: typeof this.sonars.left.interval !== 'undefined' },
        front: { enabled: typeof this.sonars.front.interval !== 'undefined' },
        right: { enabled: typeof this.sonars.right.interval !== 'undefined' } 
    };

    values.led1 = this.leds['1'].status;
    values.led2 = this.leds['2'].status;
    values.led3 = this.leds['3'].status;
    values.pen = this.pen;
    values.buzzer = this.buzzer;
    
    return values;
}

module.exports = ThreeWheelDistanceSensingRobotVirtualizer;
