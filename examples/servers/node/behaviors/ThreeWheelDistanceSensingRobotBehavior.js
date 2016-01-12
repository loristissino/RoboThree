/**
 * @author Loris Tissino / http://loris.tissino.it
 * @package RoboThree
 * @release 0.40
 * @license The MIT License (MIT)
 * @see http://www.espruino.com/Reference
*/
var hcsr04 = require("HC-SR04");

var Sonar = function ( triggerPin, echoPin, frequency ) {
    this.triggerPin = triggerPin;
    this.echoPin = echoPin;
    this.frequency = frequency;
    this.distance = Infinity;
    this.interval = undefined;
};

Sonar.prototype.enable = function () {
    var sonar = this;
    this.connection = hcsr04.connect ( this.triggerPin, this.echoPin, function ( dist ) {
        sonar.distance = dist;
    });
    this.interval = setInterval ( function () {
        sonar.connection.trigger();
    }, this.frequency ); 
};

Sonar.prototype.disable = function () {
    if ( typeof this.interval !== 'undefined' ) {
        clearInterval( this.interval );
    }
    this.distance = Infinity;
    this.interval = undefined;
};

var Wheel = function ( enablePin, controlPins, calibrationFactor) {
    this.enablePin = enablePin;
    this.controlPins = controlPins;
    this.calibrationFactor = calibrationFactor; // a value which is multiplied by speed before applying
    this.setSpeed(0);
};

// speed is assumed to be a number between 0.0 and 1.0
Wheel.prototype.setSpeed = function ( speed ) {
    this._speed = speed;
    analogWrite( this.enablePin, this._speed * this.calibrationFactor, { freq: 100 } );
    return this;
};

Wheel.prototype.getSpeed = function () {
    return this._speed;
};

Wheel.prototype.writeToControlPins = function (v0, v1) {
    this.controlPins[0].write(v0);
    this.controlPins[1].write(v1);
};

Wheel.prototype.forward = function () {
    this.writeToControlPins( 0, 1 );
};

Wheel.prototype.backward = function () {
    this.writeToControlPins( 1, 0 );
};

Wheel.prototype.stop = function () {
    this.writeToControlPins( 0, 0 );
};

var Led = function ( pin, blinkingTime ) {
    this.pin = pin;
    this.blinkingTime = blinkingTime;
    this.status = 0;
    this.pin.write( this.status );
    this.interval = undefined;
};

Led.prototype.toggle = function () {
    this.pin.write( this.status = 1 - this.status );
};

Led.prototype.clearInterval = function () {
    clearInterval ( this.interval );
    this.interval = undefined;
}

Led.prototype.switchOn = function () {
    this.pin.write( this.status = 1 );
    this.clearInterval();
};

Led.prototype.switchOff = function () {
    this.pin.write( this.status = 0 );
    this.clearInterval();
};

var ThreeWheelDistanceSensingRobotBehavior = function ( id ) {
    this.id = id;
    this.data = {};
    this.config = {};
};

ThreeWheelDistanceSensingRobotBehavior.prototype.setup = function ( options ) {
    this.infraredReader = {
        pin: B3,
        code: 0, 
        lastTime: undefined,
        watchOn: undefined,
        watchOff: undefined,
        codesMap: {
            '16605343': 'moveForward',
            '16607383': 'moveBackward',
            '16603813': 'turnLeft',
            '16635943': 'turnRight',
            '16603303': 'stop',
            '66502975': 'decreaseSpeed',
            '66462175': 'increaseSpeed',
            '66478495': 'stop',
            '0'       : 'stop',
            '16597693': 'toggleLedBlinking1',
            '16581373': 'toggleLedBlinking2',
            '16629823': 'toggleLedBlinking3',
            '16599733': 'rightForward',
            '16607893': 'rightBackward',
            '16631863': 'leftForward',
            '16640023': 'leftBackward'
        }
    };
    this.leftWheel = new Wheel ( A2, [ A4, A3 ], 1);
    this.rightWheel = new Wheel ( A7, [ A5, A6 ], 0.98);
    this.speed = 0;
    this.leds = {
        '1': new Led ( LED1, 700 ),
        '2': new Led ( LED2, 500 ),
        '3': new Led ( LED3, 300 )
    };
    this.sonars = {
        'left': new Sonar ( C1, C0, 1000 ),
        'front': new Sonar ( C3, C2, 1000 ),
        'right': new Sonar ( C4, C5, 1000 )
    };
    
    return this;
};

ThreeWheelDistanceSensingRobotBehavior.prototype.enableInfraredReader = function () {
    console.log ( 'enabling infraredReader...');
    this.infraredReader.watchOn = setWatch(
        this.handleInfraredReaderOn.bind(this),
        this.infraredReader.pin,
        { repeat:true, edge: "rising" }
    );
    this.infraredReader.watchOff = setWatch(
        this.handleInfraredReaderOff.bind(this),
        this.infraredReader.pin,
        { repeat:true, edge: "falling" }
    );
    return this;
};

ThreeWheelDistanceSensingRobotBehavior.prototype.disableInfraredReader = function () {
    console.log ( 'disabled from original...');
    clearWatch ( this.infraredReader.watchOn );
    clearWatch ( this.infraredReader.watchOff );
    return this;
};

ThreeWheelDistanceSensingRobotBehavior.prototype.handleInfraredReaderOn = function ( e ) {
    // adapted from http://www.espruino.com/Infrared+Remote+Control
    // (not fully working, unfortunately)
    this.infraredReader.code = ( this.infraredReader.code * 2) | (( e.time - this.infraredReader.lastTime ) > 0.0008);
    if ( typeof this.infraredReader.timeout !== "undefined") {
        clearTimeout( this.infraredReader.timeout );
    }
    this.infraredReader.timeout = setTimeout( this.handleInfraredReaderCode.bind(this), 20);
    this.infraredReader.lastTime = e.time;
    console.log (e.time);
};

ThreeWheelDistanceSensingRobotBehavior.prototype.handleInfraredReaderOff = function ( e ) {
    this.infraredReader.lastTime = e.time;
    console.log (e.time);
};

ThreeWheelDistanceSensingRobotBehavior.prototype.handleInfraredReaderCode = function () {
    if ( typeof this.infraredReader.code === 'undefined') {
        return;
    }
    if ( this.infraredReader.codesMap.hasOwnProperty ( this.infraredReader.code ) ) {
        this[this.infraredReader.codesMap[this.infraredReader.code]]();
    }
    else {
        console.log ( 'IR code read: ' + this.infraredReader.code + ' (not handled)');
    }
    delete this.infraredReader.timeout;
    this.infraredReader.code = 0;
};

ThreeWheelDistanceSensingRobotBehavior.prototype.moveForward = function () {
    console.log ( 'moving forward');
    this.leftWheel.forward();
    this.rightWheel.forward();
};

ThreeWheelDistanceSensingRobotBehavior.prototype.moveBackward = function () {
    console.log ( 'moving backward' );
    this.leftWheel.backward();
    this.rightWheel.backward();
};

ThreeWheelDistanceSensingRobotBehavior.prototype.turnLeft = function () {
    console.log ( 'turning left' );
    this.leftWheel.backward();
    this.rightWheel.forward();
};

ThreeWheelDistanceSensingRobotBehavior.prototype.turnRight = function () {
    console.log ( 'turning right' );
    this.leftWheel.forward();
    this.rightWheel.backward();
};

ThreeWheelDistanceSensingRobotBehavior.prototype.leftForward = function () {
    console.log ( 'only left forward ' );
    this.leftWheel.forward();
};

ThreeWheelDistanceSensingRobotBehavior.prototype.leftBackward = function () {
    console.log ( 'only left backward ' );
    this.leftWheel.backward();
};

ThreeWheelDistanceSensingRobotBehavior.prototype.rightForward = function () {
    console.log ( 'only right forward ' );
    this.rightWheel.forward();
};

ThreeWheelDistanceSensingRobotBehavior.prototype.rightBackward = function () {
    console.log ( 'only right backward ' );
    this.rightWheel.backward();
};

ThreeWheelDistanceSensingRobotBehavior.prototype.stop = function stop () {
    console.log ( 'stopping' );
    this.leftWheel.stop();
    this.rightWheel.stop();
};

ThreeWheelDistanceSensingRobotBehavior.prototype.setSpeed = function ( speed ) {
    this.speed = E.clip ( speed, 0.0, 1.0 );
    console.log ( 'setting speed to: ' + this.speed );
    this.leftWheel.setSpeed(this.speed);
    this.rightWheel.setSpeed(this.speed);
    return this;
};

ThreeWheelDistanceSensingRobotBehavior.prototype.decreaseSpeed = function ( ) {
    return this.setSpeed ( this.speed - 0.05 );
};

ThreeWheelDistanceSensingRobotBehavior.prototype.increaseSpeed = function ( ) {
    return this.setSpeed ( this.speed + 0.05 );
};

ThreeWheelDistanceSensingRobotBehavior.prototype.toggleLedBlinking = function ( led ) {
    var robot = this;
    if ( typeof this.leds[led].interval === 'undefined' ) {
        console.log ( 'starting blinking led ' + led );
        this.leds[led].interval = setInterval ( function() {
            robot.leds[led].toggle();
        }, this.leds[led].blinkingTime );
    }
    else {
        console.log ( 'stopping blinking led ' + led );
        robot.leds[led].switchOff();
        clearInterval ( this.leds[led].interval );
        this.leds[led].interval = undefined;
    }
    return this;
};

ThreeWheelDistanceSensingRobotBehavior.prototype.toggleLedBlinking1 = function ( ) {
    return this.toggleLedBlinking( '1' );
};

ThreeWheelDistanceSensingRobotBehavior.prototype.toggleLedBlinking2 = function ( ) {
    return this.toggleLedBlinking( '2' );
};

ThreeWheelDistanceSensingRobotBehavior.prototype.toggleLedBlinking3 = function ( ) {
    return this.toggleLedBlinking( '3' );
};

module.exports = ThreeWheelDistanceSensingRobotBehavior;
