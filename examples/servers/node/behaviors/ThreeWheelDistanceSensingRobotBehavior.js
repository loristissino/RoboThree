/**
 * @author Loris Tissino / http://loris.tissino.it
 * @package RoboThree
 * @release 0.61
 * @license The MIT License (MIT)
 * @see http://www.espruino.com/Reference
*/

var hcsr04 = require("HC-SR04");
var ir = require("IRReceiver");

var IRR = function ( pin, codesMap, leftSubtract ) {
    this.codesMap = codesMap;
    this.pin = pin;
    this.received = '';
    this.leftSubtract = leftSubtract;
    this.code = '';  // we keep track of the last code executed for managing kept pressed keys
    this.interval = false;
    var self = this;
};

IRR.prototype.enable = function ( callback ) {
    var self = this;
    this.callback = callback;
    ir.connect(this.pin, function ( receivedCode ) {
        self.received = receivedCode;
		if ( self.received.length > 1 ) {
			// new code
			var decimalValue = parseInt(self.received.substring(self.leftSubtract), 2);
			if ( decimalValue > 1 ) {
				self.code = decimalValue.toString();
			}
		}
    });
    this.interval = setInterval ( function () {
		if ( self.received == '1' ) {
			self.received = '';
		}
		else if (self.received.length <= 1) {
			self.code = '0';
		}
		self.callback();
			
	}, 200);
};

var Sonar = function ( triggerPin, echoPin, frequency ) {
    this.triggerPin = triggerPin;
    this.echoPin = echoPin;
    this.frequency = frequency;
    this.distance = Infinity;
    this.interval = false;
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
    if ( this.interval !== false ) {
        clearInterval( this.interval );
    }
    this.distance = Infinity;
    this.interval = false;
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
    this.interval = false;
};

Led.prototype.toggle = function () {
    this.pin.write( this.status = 1 - this.status );
};

Led.prototype.clearInterval = function () {
    console.log ( this );
    if ( this.interval !== false ) {
        clearInterval ( this.interval );
    }
    this.interval = false;
};

Led.prototype.switchOn = function () {
    this.pin.write( this.status = 1 );
    this.clearInterval();
};

Led.prototype.switchOff = function () {
    this.pin.write( this.status = 0 );
    this.clearInterval();
};

var Buzzer = function ( pin, frequency, duration ) {
    this.pin = pin;
    this.defaultFrequency = frequency;
    this.defaultDuration = duration;
    this.status = 0;  // 0: off;  1: beeping;  2: replicated
};

Buzzer.prototype.beep = function ( frequency, duration ) {
    var self = this;
    this.frequency = frequency || this.defaultFrequency;
    this.duration = duration || this.defaultDuration;
    if ( this.status !== 1 ) {
        analogWrite(self.pin, 0.5, { freq: self.frequency } );
        this.status = 1;
        setTimeout ( function() {
            digitalWrite(self.pin, 0);
            this.status = 0;
        }, self.duration );
    }
};

var ThreeWheelDistanceSensingRobotBehavior = function ( id ) {
    this.id = id;
    this.data = {};
    this.config = {};
    this.playing = false;
};

ThreeWheelDistanceSensingRobotBehavior.prototype.setup = function ( options ) {
    this.infraredReader = new IRR ( B3, {
            '16605343': { exec: 'moveForward', repeatOnKeptPressed: true },
            '16607383': { exec: 'moveBackward', repeatOnKeptPressed: true },
            '16603813': { exec: 'turnLeft', repeatOnKeptPressed: true },
            '16635943': { exec: 'turnRight', repeatOnKeptPressed: true },
            '16603303': { exec: 'stop', repeatOnKeptPressed: false },
            '66502975': { exec: 'decreaseSpeed', repeatOnKeptPressed: true },
            '66462175': { exec: 'increaseSpeed', repeatOnKeptPressed: true },
            '66478495': { exec: 'stop', repeatOnKeptPressed: false },
            '0'       : { exec: 'stop', repeatOnKeptPressed: false },
            '16597693': { exec: 'toggleLedBlinking1', repeatOnKeptPressed: false },
            '16581373': { exec: 'toggleLedBlinking2', repeatOnKeptPressed: false },
            '16629823': { exec: 'toggleLedBlinking3', repeatOnKeptPressed: false },
            '16599733': { exec: 'rightForward', repeatOnKeptPressed: true },
            '16607893': { exec: 'rightBackward', repeatOnKeptPressed: true },
            '16631863': { exec: 'leftForward', repeatOnKeptPressed: true },
            '16640023': { exec: 'leftBackward', repeatOnKeptPressed: true },
            '16609423': { exec: 'play', repeatOnKeptPressed: false },
            '16599223': { exec: 'pause', repeatOnKeptPressed: false },
        },
        1
    );
    this.leftWheel = new Wheel ( A2, [ A4, A3 ], 1);
    this.rightWheel = new Wheel ( A7, [ A5, A6 ], 0.75);
    this.speed = 0;
    this.leds = {
        '1': new Led ( LED1, 700 ),
        '2': new Led ( LED2, 500 ),
        '3': new Led ( LED3, 300 )
    };
    this.sonars = {
        'left': new Sonar ( C1, C0, 250 ),
        'front': new Sonar ( C3, C2, 250 ),
        'right': new Sonar ( C4, C5, 250 )
    };
    this.buzzer = new Buzzer( B6, 110, 100 );
    
    this.checkForObstacles = { enabled: false };
    
    return this;
};

ThreeWheelDistanceSensingRobotBehavior.prototype.enableInfraredReader = function () {
    this.infraredReader.enable ( this.handleInfraredReaderCode.bind(this) );
    return this;
};

ThreeWheelDistanceSensingRobotBehavior.prototype.handleInfraredReaderCode = function () {
    if ( typeof this.infraredReader.code === 'undefined') {
        return;
    }
    if ( this.infraredReader.codesMap.hasOwnProperty ( this.infraredReader.code ) ) {
        var action = this.infraredReader.codesMap[this.infraredReader.code];
        if ( action.repeatOnKeptPressed === true || this.infraredReader.received != '1' ) {
            this[action.exec]();
        }
    }
    else {
        console.log ( 'IR code read: ' + this.infraredReader.code + ' (not handled)');
    }
};

ThreeWheelDistanceSensingRobotBehavior.prototype.moveForward = function () {
    this.leftWheel.forward();
    this.rightWheel.forward();
};

ThreeWheelDistanceSensingRobotBehavior.prototype.moveBackward = function () {
    this.leftWheel.backward();
    this.rightWheel.backward();
};

ThreeWheelDistanceSensingRobotBehavior.prototype.turnLeft = function () {
    this.leftWheel.backward();
    this.rightWheel.forward();
};

ThreeWheelDistanceSensingRobotBehavior.prototype.turnRight = function () {
    this.leftWheel.forward();
    this.rightWheel.backward();
};

ThreeWheelDistanceSensingRobotBehavior.prototype.leftForward = function () {
    this.leftWheel.forward();
};

ThreeWheelDistanceSensingRobotBehavior.prototype.leftBackward = function () {
    this.leftWheel.backward();
};

ThreeWheelDistanceSensingRobotBehavior.prototype.rightForward = function () {
    this.rightWheel.forward();
};

ThreeWheelDistanceSensingRobotBehavior.prototype.rightBackward = function () {
    this.rightWheel.backward();
};

ThreeWheelDistanceSensingRobotBehavior.prototype.stop = function stop () {
    this.leftWheel.stop();
    this.rightWheel.stop();
};

ThreeWheelDistanceSensingRobotBehavior.prototype.backup = function () {
    this.inManeuver = true;
    this.beep();
    var self = this;
    var lr = self.sonars.left.distance > self.sonars.right.distance ? 'L': 'R';
    self.moveBackward();
    setTimeout( function() {
        lr == 'L' ? self.turnLeft(): self.turnRight();
        setTimeout( function() {
            self.inManeuver = false;
            self.moveForward(); // forward again
        }, 500);
    }, 2000);
};

ThreeWheelDistanceSensingRobotBehavior.prototype.setSpeed = function ( speed ) {
    this.speed = E.clip ( speed, 0.0, 1.0 );
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
    if ( this.leds[led].interval === false ) {
        this.leds[led].interval = setInterval ( function() {
            robot.leds[led].toggle();
        }, this.leds[led].blinkingTime );
    }
    else {
        robot.leds[led].switchOff();
        this.leds[led].clearInterval();
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

ThreeWheelDistanceSensingRobotBehavior.prototype.enableSonars = function ( ) {
    for ( var key in this.sonars ) {
        this.sonars[key].enable();
    }
    return this;
};

ThreeWheelDistanceSensingRobotBehavior.prototype.beep = function ( ) {
    this.buzzer.beep();
    return this;
};

ThreeWheelDistanceSensingRobotBehavior.prototype.play = function () {
    var self = this;
    this.inManeuver = false;
    if (!this.playing) {
        this.moveForward();
        this.playing = setInterval(function() {
            if ( self.sonars.front.distance < 20 && !self.inManeuver ) {
                self.backup();
            }
        }, 50);
    }
    return this;
};

ThreeWheelDistanceSensingRobotBehavior.prototype.pause = function () {
    this.stop();
    if ( this.playing ) {
        clearInterval( this.playing );
        this.playing = false;
    }
    return this;
};

module.exports = ThreeWheelDistanceSensingRobotBehavior;
