/**
 * @author Loris Tissino / http://loris.tissino.it
*/

'use strict';

var ThreeWheelDistanceSensingRobot = function () {
};

$.extend ( ThreeWheelDistanceSensingRobot.prototype, BasicRobot.prototype );

ThreeWheelDistanceSensingRobot.prototype.build = function build () {
    
    if ( !this.isBuilt ) {
        console.log( "Building robot: " + this.id );
        this
            .addBody()
            .addWheels()
            .addSonar()
            .addCamera()
            ;
        this.isBuilt = true;
    }
    else {
        console.log( "Already built: " + this.id );
    }
    return this;
}

ThreeWheelDistanceSensingRobot.prototype.addBody = function addBody () {
    
    var values = $.extend ( {
        chassis: {
            color: 0xFF0000,
            opacity: .8,
            mass: 1000
        }
    }, this.initialValues);

    this.chassis = new Physijs.BoxMesh(
        new THREE.BoxGeometry(18.4, 5, 9.7),
        this.getLambertPjsMaterial( { color: values.chassis.color, opacity: values.chassis.opacity } ),
        values.chassis.mass
    );
    this.chassis.position.set(0, 2.5, 0);
    this.chassis.castShadow = true;
    this.chassis.receiveShadow = true;
    this.chassis.userData.normalColor = this.chassis.material.color.clone();
    
    this.scene.add ( this.chassis );
    this.components.push ( this.chassis );
    return this;
}

ThreeWheelDistanceSensingRobot.prototype.addWheels = function addWheels () {
    
    var xo = 3, yo = 3.6, color = 0xFFFF00;
    
    var wheels = {
        left: {
            position: new THREE.Vector3(xo, yo, -6.5)
        },
        right: {
            position: new THREE.Vector3(xo, yo, 6.5)
        }
    }
    
    var robot = this;  // a reference
    
    $.each ( wheels, function ( name, wheel ) {
        var wheelName = name + 'Wheel';
        var wheelConstraint = name + 'WheelConstraint';

        robot[wheelName] = robot.createWheel ({
            position: wheel.position,
            radius: 3.6,
            thickness: 2.5,
            mass: 500,
            color: color
        });
        robot.scene.add ( robot[wheelName] );
        robot.components.push ( robot[wheelName] );

        robot[wheelConstraint] = robot.createDOFConstraint ( robot.chassis, robot[wheelName], robot[wheelName].position );
        robot.scene.addConstraint ( robot[wheelConstraint], true );
    
        robot[wheelConstraint].setAngularLowerLimit({x: 0, y: 0, z: 0});
        robot[wheelConstraint].setAngularUpperLimit({x: 0, y: 0, z: 0});
        robot[wheelConstraint].configureAngularMotor(2, 0.1, 0, 0, 1500);
        robot[wheelConstraint].enableAngularMotor(2);
    });
    
    return this;
}

ThreeWheelDistanceSensingRobot.prototype.addSonar = function addSonar () {

    this.frontSonar = new Physijs.BoxMesh(
        new THREE.BoxGeometry( .6, 2, 3) ,
        this.getLambertPjsMaterial( { color: 0xffff22, opacity: 1.0 } ),
        40
    );
    this.frontSonar.position.set( -8, 6, 0 );
    this.frontSonar.castShadow = true;
    this.frontSonar.receiveShadow = true;
    
    this.scene.add ( this.frontSonar );
    this.components.push ( this.frontSonar );

    this.frontSonarConstraint = this.createDOFConstraint ( this.chassis, this.frontSonar, this.frontSonar.position );
    this.scene.addConstraint ( this.frontSonarConstraint );

    this.frontSonar.userData = {
        raycaster: new THREE.Raycaster(),
        direction: new THREE.Vector3( -1, 0, 0), 
    };
    
    this.frontSonarArrowHelper = new THREE.ArrowHelper( this.frontSonar.userData.direction, this.frontSonar.position, 30, 0x00ffff );
    this.scene.add( this.frontSonarArrowHelper );
    this.components.push ( this.frontSonarArrowHelper );
    
    return this;
}

ThreeWheelDistanceSensingRobot.prototype.addCamera = function addCamera () {

    this.camera = new THREE.PerspectiveCamera(
        35,
        window.innerWidth / window.innerHeight,
        1,
        1000
    );
    
    this.camera.position.set(0, 10, 40);
    this.camera.lookAt(new THREE.Vector3(0, 0, 0));
    this.scene.add(this.camera);
    
    return this;
}

ThreeWheelDistanceSensingRobot.prototype.process = function process () {
    
    /* manage inputs */
    this['leftWheelConstraint'].configureAngularMotor(2, 0.1, 0, 2*(this.data.lw0 - this.data.lw1), 15000);
    this['rightWheelConstraint'].configureAngularMotor(2, 0.1, 0, 2*(this.data.rw0 - this.data.rw1), 15000);
    
    /* manage outputs */

    
    this.frontSonarArrowHelper.position.copy ( this.frontSonar.position );
    
    var dir = new THREE.Vector3(
        this.frontSonar.position.x - this.chassis.position.x,
        this.frontSonar.position.y - (this.chassis.position.y + 3.5),
        this.frontSonar.position.z - this.chassis.position.z
        );
    
    this.frontSonar.userData.direction = dir.normalize();
    
    this.frontSonarArrowHelper.setDirection ( this.frontSonar.userData.direction );

    this.frontSonar.userData.raycaster.set ( this.frontSonar.position, this.frontSonar.userData.direction, 3, 600 );
    

    var intersects = this.frontSonar.userData.raycaster.intersectObjects( this.scene.children );
                
    if ( intersects.length > 0 )
    {
        this.data.dist = intersects[0].distance;
    }
    else
    {
        this.data.dist = 9999;
    }
    //console.log ( this.data.dist );
    
    return this;
}

ThreeWheelDistanceSensingRobot.prototype.update = function update ( data ) {
    if ( typeof data !== 'undefined' ) {
        /*
        console.log( "processing upcoming data:" );
        console.log(data);
        */
        this.data.lw0 = data.lw0;
        this.data.lw1 = data.lw1;
        this.data.rw0 = data.rw0;
        this.data.rw1 = data.rw1;
        this.process();
    }
    // this.data.dist -= 1;
    

    if ( this.hasCamera() ) {
        var relativeCameraOffset = new THREE.Vector3(20,5,0);

        var cameraOffset = relativeCameraOffset.applyMatrix4( this.frontSonar.matrixWorld );

        this.camera.position.copy ( cameraOffset );
        this.camera.lookAt( this.frontSonar.position );
    }
    
    if ( this.isBuilt ) {
        // visual feedback for the fact that the communication happened correctly
        this.chassis.material.color.copy ( this.chassis.userData.normalColor );
    }
    return this.data;
}

ThreeWheelDistanceSensingRobot.prototype.manageCommunicationFailure = function manageCommunicationFailure () {
    if ( this.isBuilt ) {
        this.chassis.material.color.setHex( 0x000000 );
    }
    return this.data;
}

window["ThreeWheelDistanceSensingRobot"] = ThreeWheelDistanceSensingRobot;  // we need a reference to this function to be shared through a global object.
