/**
 * @author Loris Tissino / http://loris.tissino.it
 * @package RoboThree
 * @release 0.40
 * @license The MIT License (MIT)
*/

var extend = require('extend');

var ThreeWheelDistanceSensingRobotVirtualizer = function ( ) {
};

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
    return this;
}

ThreeWheelDistanceSensingRobotVirtualizer.prototype.enableInfraredReader = function enableInfraredReader () {
    this.infraredReader.code = -1;
    this.registeredCallBacks.infraredReader = this.handleInfraredReaderCode.bind(this);
    return this;
}

ThreeWheelDistanceSensingRobotVirtualizer.prototype.disableInfraredReader = function disableInfraredReader () {
    delete this.registeredCallBacks.infraredReader;
    return this;
}

ThreeWheelDistanceSensingRobotVirtualizer.prototype.addVirtualPen = function addVirtualPen () {
    this.infraredReader.codesMap['16619623'] = 'togglePen';
    this.pen = { enabled: false };
}

ThreeWheelDistanceSensingRobotVirtualizer.prototype.togglePen = function () {
    this.pen.enabled = !this.pen.enabled;
}

ThreeWheelDistanceSensingRobotVirtualizer.prototype.update = function update ( values ) {    
    if ( typeof values !== 'undefined' )
    {
        // inputs we don't want to overwite our data
        if ( typeof values.dist !== 'undefined' ) {
            this.dist = values.dist;
        }
        
        // inputs that can overwrite our data or setting them to undefined
        // this.sonars = values.sonars;
        this.infraredReader.code = values.ir;
    }  
    else {
        values = {};
    }

    for (var f in this.registeredCallBacks) {
        this.registeredCallBacks[f]();
    }

    values.leftWheel = this.leftWheel.getSpeed() * ( this.leftWheel.controlPins[0].xGetLastOutput() - this.leftWheel.controlPins[1].xGetLastOutput() );
    values.rightWheel = this.rightWheel.getSpeed() * ( this.rightWheel.controlPins[0].xGetLastOutput() - this.rightWheel.controlPins[1].xGetLastOutput() );
    
    // are the sonars activated?
    
    values.sonars = {
        left:  { enabled: typeof this.sonars.left.interval !== 'undefined' },
        front: { enabled: typeof this.sonars.front.interval !== 'undefined' },
        right: { enabled: typeof this.sonars.right.interval !== 'undefined' } 
    };

    values.led1 = this.leds['1'].status;
    values.led2 = this.leds['2'].status;
    values.led3 = this.leds['3'].status;
    values.pen = this.pen;
    
    return values;
}

module.exports = ThreeWheelDistanceSensingRobotVirtualizer;
