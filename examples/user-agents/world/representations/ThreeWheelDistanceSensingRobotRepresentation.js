'use strict';

/**
 * @classdesc Class representing a three-wheeled distance-sensing robot's representation.
 * @constructor
 * @author Loris Tissino (http://loris.tissino.it)
 * @release 0.71
 * @license MIT
 * @extends RobotRepresentation
 */
var ThreeWheelDistanceSensingRobotRepresentation = function () {
};

$.extend ( ThreeWheelDistanceSensingRobotRepresentation.prototype, RobotRepresentation.prototype );

/**
 * Builds the robot's representation.
 * @returns {boolean} - Whether the robot's representation could be built
 */
ThreeWheelDistanceSensingRobotRepresentation.prototype.build = function build () {
    
    if ( !this.isBuilt ) {
        console.log( "Building robot: " + this.id );
        this
            .addBody()
            .addFrontWheel()
            .addSonars()
            .addBuzzer()
            .addVirtualLocator()
            .addVirtualCompass()
            .addVirtualScanner()
            .addVirtualPen( this.initialValues.chassis.color )
            .addVirtualCamera()
            .finalizeBody()
            .addWheels()
            //.addArm()
            ;
        this.isBuilt = true;
        return true;
    }
    else {
        console.log( "Already built: " + this.id );
        return false;
    }
}

/**
 * Adds the body of the robot to the scene
 * @returns {ThreeWheelDistanceSensingRobotRepresentation} - The robot
 */
ThreeWheelDistanceSensingRobotRepresentation.prototype.addBody = function addBody () {
    
    var values = $.extend ( {
        chassis: {
            color: 0xffffff,
            opacity: .5,
            mass: 600,
            castShadow: false,
            receiveShadow: true
        },
        board: {
            color: 0x444444,
            opacity: 1,
            mass: 50
        },
        batterypack: {
            color: 0x222222,
            opacity: 1,
            mass: 20
        }
    }, this.initialValues);

    this.chassis = new Physijs.BoxMesh(
        new THREE.BoxGeometry(16, 5, 9.7),
        this.getLambertPjsMaterial( { color: values.chassis.color, opacity: values.chassis.opacity } ),
        values.chassis.mass
    );
    this.chassis.position.set(0, 3.5, 0);
    this.chassis.name = 'chassis';
    this.chassis.castShadow = values.chassis.castShadow;
    this.chassis.receiveShadow = values.chassis.receiveShadow;

    this.board = new Physijs.BoxMesh (
        new THREE.BoxGeometry( 0.5, 4.5, 4 ),
        this.getLambertPjsMaterial( { color: values.board.color, opacity: values.board.opacity } ),
        values.board.mass
    );
    this.board.position.set( -3, 4.75, 0 );
    this.board.name = 'board';
    this.board.castShadow = true;
    this.board.receiveShadow = true;
    
    var leds = {
        led1: {
            color: 0xff0000,
            position: new THREE.Vector3 ( 0.27, 1.8, -1.6 ),
            shininess: 200
        },
        led2: {
            color: 0x00ff00,
            position: new THREE.Vector3 ( 0.27, 1.8, -1.1 ),
            shininess: 100
        },
        led3: {
            color: 0x0000ff,
            position: new THREE.Vector3 ( 0.27, 1.8, -0.6 ),
            shininess: 300
        }
    }
    
    var board = this.board; // a reference
    var robot = this;
    
    $.each ( leds, function ( name, led ) {
        board[name] = new THREE.Mesh (
            new THREE.BoxGeometry ( 0.2, 0.5, 0.5 ),
            new THREE.MeshPhongMaterial( { color: led.color, emissive: led.color, shininess: led.shininess, shading: THREE.FlatShading } )
        );
        board[name].visible = false;
        board[name].position.copy ( led.position );
        board[name].name = name;
        board.add ( board[name] );
        robot.dataPropertiesIn.push ( name );
    });
    
    this.chassis.add ( this.board );

    this.batterypack = new Physijs.BoxMesh(
        new THREE.BoxGeometry( 3, 5, 6.5 ),
        this.getLambertPjsMaterial( { color: values.batterypack.color, opacity: values.batterypack.opacity } ),
        values.batterypack.mass
    );
    this.batterypack.position.set( 5, 5, 0 );
    this.batterypack.name = 'batterypack';
    this.batterypack.castShadow = true;
    this.batterypack.receiveShadow = true;
    this.batterypack.userData.normalColor = this.batterypack.material.color.clone();
    
    this.chassis.add ( this.batterypack );

    var cylinderGeometry = new THREE.CylinderGeometry( 9, 9, 0.4, 32 /* number of "sides" */ );
    var cylinderMesh = new THREE.Mesh ( 
        cylinderGeometry,
        this.chassis.material
    );
    
    cylinderMesh.position.set ( 4, 2.5, 0 );
    
    var squareGeometry = new THREE.BoxGeometry( 18, 1, 18 );
    var squareMesh = new THREE.Mesh ( 
        squareGeometry,
        this.chassis.material
    );
    
    squareMesh.position.set ( -1, 2.5, 0 );
    
    var cylinderBSP = new ThreeBSP( cylinderMesh );
    var squareBSP = new ThreeBSP( squareMesh );

    var resultBSP = cylinderBSP.subtract ( squareBSP );
    
    var result = resultBSP.toMesh();
    result.geometry.computeFaceNormals();
    result.geometry.computeVertexNormals();
    
    this.back = new Physijs.ConvexMesh(
        result.geometry,
        this.chassis.material,
        20
    );
    
    this.back.castShadow = values.chassis.castShadow;
    this.back.receiveShadow = values.chassis.receiveShadow;
    
    this.back.position.set ( 4, 2.3, 0 );
    this.back.name = 'back';
    this.back.__dirtyPosition = true;
    this.back.__dirtyRotation = true;
    
    this.centralPoint = new THREE.Object3D();
    this.centralPoint.position.set( 4.5, 3.6, 0 );  // the point between the wheels
    this.chassis.add ( this.centralPoint );
    
    this.chassis.add ( this.back );
    
    return this;
}

/**
 * Adds the driving wheels of the robot to the scene.
 * @returns {ThreeWheelDistanceSensingRobotRepresentation} - The robot
 */
ThreeWheelDistanceSensingRobotRepresentation.prototype.addWheels = function addWheels () {
    
    var color = 0xD9D900;
    
    var wheels = {
        left: {
            position: new THREE.Vector3( this.centralPoint.position.x, this.centralPoint.position.y, 6.5 ),
        },
        right: {
            position: new THREE.Vector3( this.centralPoint.position.x, this.centralPoint.position.y, -6.5 ),
        }
    }
    
    var robot = this;  // a reference
    
    $.each ( wheels, function ( name, wheel ) {
        var wheelName = name + 'Wheel';
        var constraintName = wheelName + 'Constraint';
        
        robot.dataPropertiesIn.push ( wheelName );

        robot[wheelName] = robot.createWheel ({
            position: wheel.position,
            radius: robot.centralPoint.position.y, // assuming that the wheel touches the bottom
            thickness: 2.5,
            mass: 500,
            color: color
        });
        robot[wheelName].name = wheelName;
        robot.scene.add ( robot[wheelName] );

        robot[constraintName] = robot.createDOFConstraint ( robot.chassis, robot[wheelName], wheel.position );
        robot.scene.addConstraint ( robot[constraintName], true );
        
        robot[constraintName].setAngularLowerLimit({x: 0, y: 0, z: 0});
        robot[constraintName].setAngularUpperLimit({x: 0, y: 0, z: 0});
        robot[constraintName].configureAngularMotor(2, 0.1, 0, 0, 1500);
        robot[constraintName].enableAngularMotor(2);
        
        robot.components.push ( robot[wheelName] );

    });
    
    return this;
}

ThreeWheelDistanceSensingRobotRepresentation.prototype.addArm = function addArm () {
    
    // this is an experiment, not yet completed
    
    this.arm = new Physijs.BoxMesh(
        new THREE.BoxGeometry( 100, 5, 1 ),
        this.getLambertPjsMaterial( { color: 0x333333, opacity: 0.5 } ),
        20
    );
    this.arm.position.set( 3, 14, 0 );
    this.arm.name = 'arm';
    this.arm.castShadow = true;
    this.arm.receiveShadow = true;
    this.arm.__dirtyPosition = true;
    this.arm.__dirtyRotation = true;

    //this.chassis.add ( this.arm );
    this.scene.add (this.arm);
    
    var constraintPosition = this.arm.position.clone().add( new THREE.Vector3 ( 0, -2.5, 0 ) );
    
    this.armConstraint = this.createDOFConstraint( this.chassis, this.arm, constraintPosition, new THREE.Vector3 ( 0, 1, 0 ));
    
    this.scene.addConstraint( this.armConstraint, true );
    
    this.armConstraint.setLinearLowerLimit( new THREE.Vector3( 0, 0, 0 ) ); // sets the lower end of the linear movement along the x, y, and z axes.
    this.armConstraint.setLinearUpperLimit( new THREE.Vector3( 0, 0, 0 ) ); // sets the upper end of the linear movement along the x, y, and z axes.
    this.armConstraint.setAngularLowerLimit( new THREE.Vector3( 0, -Math.PI, 0 ) ); // sets the lower end of the angular movement, in radians, along the x, y, and z axes.
    this.armConstraint.setAngularUpperLimit( new THREE.Vector3( 0, Math.PI, 0 ) ); // sets the upper end of the angular movement, in radians, along the x, y, and z axes.
    /*
    this.armConstraint.configureAngularMotor(
        which, // which angular motor to configure - 0,1,2 match x,y,z
        low_limit, // lower limit of the motor
        high_limit, // upper limit of the motor
        velocity, // target velocity
        max_force // maximum force the motor can apply
    );
    */
    // this.armConstraint.enableAngularMotor( which ); // which angular motor to configure - 0,1,2 match x,y,z
    // this.armConstraint.disableAngularMotor( which ); /
        
    this.components.push ( this.arm );
    
    return this;

}

/**
 * Adds the front (not driving) wheel of the robot to the scene.
 * @returns {ThreeWheelDistanceSensingRobotRepresentation} - The robot
 */
ThreeWheelDistanceSensingRobotRepresentation.prototype.addFrontWheel = function addFrontWheel () {

    this.frontWheel = new Physijs.BoxMesh(
        new THREE.BoxGeometry( 1, 1, 1) ,
        this.getLambertPjsMaterial( { color: 0xE5E5E5, opacity: 1 , friction: 0.01 } ),
        20
    );
    this.frontWheel.position.set( -7.5, -3, 0 );
    this.frontWheel.name = 'frontWheel';
    this.frontWheel.castShadow = true;
    this.frontWheel.receiveShadow = true;
    
    this.chassis.add ( this.frontWheel );

    // without this, the robot does a wheelie every time it starts moving forward. 
    this.counterBalanceWheel = new Physijs.BoxMesh(
        new THREE.BoxGeometry( 1, 1, 1) ,
        this.getLambertPjsMaterial( { color: 0xE5E5E5, opacity: 0 , friction: 0.01 } ),
        2
    );
    this.counterBalanceWheel.position.set( 9, -3, 0 );
    this.counterBalanceWheel.name = 'counterBalanceWheel';
    this.counterBalanceWheel.castShadow = false;
    this.counterBalanceWheel.receiveShadow = false;
    
    this.chassis.add ( this.counterBalanceWheel );

    return this;
}

/**
 * Adds the sonars of the robot to the scene and registers their process function.
 * @returns {ThreeWheelDistanceSensingRobotRepresentation} - The robot
 */
ThreeWheelDistanceSensingRobotRepresentation.prototype.addSonars = function addSonars () {

    this.frontSonarReference = new THREE.Object3D();
    this.frontSonarReference.position.set ( 0, 3.5, 0 );
    this.chassis.add ( this.frontSonarReference );
    
    this.dataPropertiesIn.push ( 'sonars' );
    this.data.sonars = {};

    this.sonars = {
        left:  {
            geometry: new THREE.BoxGeometry( 4.5, 2, 1),
            position: new THREE.Vector3 ( -5.5, 3.5, 4.35 ),
            reference: 'rightSonar'
        },
        front: {
            geometry: new THREE.BoxGeometry( 1, 2, 4.5),
            position: new THREE.Vector3 ( -7.5, 3.5, 0 ),
            reference: 'frontSonarReference'
        },
        right:  {
            geometry: new THREE.BoxGeometry( 4.5, 2, 1),
            position: new THREE.Vector3 ( -5.5, 3.5, -4.35 ),
            reference: 'leftSonar'
        }
    }
    
    var robot = this; // a reference

    this.sonarData = {
        variants : [
            { type: 'none', color: 0x000000 },
            { type: 'horizontal', axis: new THREE.Vector3 ( 0, 1, 0 ), color: 0xff0000, value: 0.087 },
            { type: 'horizontal', axis: new THREE.Vector3 ( 0, 1, 0 ), color: 0x00ff00, value: -0.087 },
            { type: 'vertical', color: 0x0000ff, value: 0.087 },
            { type: 'vertical', color: 0xff00ff, value: -0.087 }
        ]
    };
    
    $.each ( this.sonars, function ( key, sonar ) {
        var name = key + 'Sonar';
        robot[name] = new Physijs.BoxMesh(
            sonar.geometry,
            robot.getLambertPjsMaterial( { color: 0xBFBFBF, opacity: 1.0 } ),
            40
        );
        robot[name].position.copy( sonar.position );
        robot[name].name = name;
        robot[name].castShadow = true;
        robot[name].receiveShadow = true;
        robot[name].userData.reference = sonar.reference;
        robot[name].userData.raycasters = [];
        robot.chassis.add ( robot[name] );
        
        for ( var i=0; i < robot.sonarData.variants.length; i++ ) {
            robot[name].userData.raycasters[i] = {
                raycaster: new THREE.Raycaster(),
                direction: new THREE.Vector3( -1, 0, 0)
            };
            robot[name].userData.raycasters[i].arrowHelper = new THREE.ArrowHelper( 
                robot[name].userData.raycasters[i].direction,
                robot[name].position,
                30,
                robot.sonarData.variants[i].color
            );
            robot[name].userData.raycasters[i].arrowHelper.visible = false;
            robot.scene.add( robot[name].userData.raycasters[i].arrowHelper );
        };
        
        robot[name].userData.matchArrowHelper = new THREE.ArrowHelper( new THREE.Vector3 ( 0, 1, 0), robot[name].position, 1, 0x111111, 1, 1 );
        robot.scene.add( robot[name].userData.matchArrowHelper );
        robot[name].userData.matchArrowHelper.visible = false;
    });

    this.registeredProcessFunctions.push ( function ( ) {
        var intersects;
        $.each ( robot.sonars, function ( key, name ) {
            
            var i;
            var name = key + 'Sonar';
            if ( robot.data.sonars[key].enabled ) {
                var asp = robot.getAbsolutePositionForObject( robot[name], true );
                var ref = robot.getAbsolutePositionForObject( robot[robot[name].userData.reference], true );
                var dir = asp.clone().sub(ref).normalize();
                robot.data.sonars[key].distance = Infinity;

                for ( i=0; i < robot.sonarData.variants.length; i++ ) {
                    robot[name].userData.raycasters[i].direction = dir.clone();
                    
                    switch ( robot.sonarData.variants[i].type ) {
                        case 'none':
                            break;
                        case 'horizontal':
                            robot[name].userData.raycasters[i].direction.applyAxisAngle (
                                robot.sonarData.variants[i].axis,
                                robot.sonarData.variants[i].value
                            )
                            break;
                        case 'vertical':
                            robot[name].userData.raycasters[i].direction.y = Math.sin ( Math.asin ( robot[name].userData.raycasters[i].direction.y ) + robot.sonarData.variants[i].value );
                            break;
                        default:
                            // should never happen
                    }
                    
                    robot[name].userData.raycasters[i].direction.normalize();
                    
                    robot[name].userData.raycasters[i].raycaster.set ( asp, robot[name].userData.raycasters[i].direction, 3, 600 );

                    robot[name].userData.raycasters[i].arrowHelper.visible = robot.robotsManager.simulator.gui.userData.controls.showSonarDetection;

                    if ( robot[name].userData.raycasters[i].arrowHelper.visible ) {
                        robot[name].userData.raycasters[i].arrowHelper.position.copy ( asp );
                        robot[name].userData.raycasters[i].arrowHelper.setDirection ( robot[name].userData.raycasters[i].direction );
                    }

                    intersects = robot[name].userData.raycasters[i].raycaster.intersectObjects( robot.scene.children );

                    if ( intersects.length > 0 )
                    {
                        if ( intersects[0].distance <  robot.data.sonars[key].distance ) {
                            robot.data.sonars[key].distance = intersects[0].distance;
                            robot[name].userData.matchArrowHelper.position.copy ( intersects[0].point );
                            robot[name].userData.matchArrowHelper.setDirection ( robot[name].userData.raycasters[i].direction.negate() );
                            robot[name].userData.matchArrowHelper.setColor ( robot.sonarData.variants[i].color );
                        }
                    }
                    robot[name].userData.matchArrowHelper.visible = isFinite( robot.data.sonars[key].distance ) && robot[name].userData.raycasters[i].arrowHelper.visible;
                }
            }
            else {
                for ( i=0; i < robot.sonarData.variants.length; i++) {
                    robot[name].userData.raycasters[i].arrowHelper.visible = false;
                }
                robot[name].userData.matchArrowHelper.visible = false;
            }
            
        });
    } );

    return this;
}

/**
 * Finalizes the body of the robot. After calling this function, no other object can be added to the chassis.
 * @returns {ThreeWheelDistanceSensingRobotRepresentation} - The robot
 */
ThreeWheelDistanceSensingRobotRepresentation.prototype.finalizeBody = function finalizeBody () {
    this.scene.add ( this.chassis );
    return this;
}

/**
 * Adds the buzzer and registers its process function.
 * @returns {ThreeWheelDistanceSensingRobotRepresentation} - The robot
 */
ThreeWheelDistanceSensingRobotRepresentation.prototype.addBuzzer = function addBuzzer () {
    // see https://developer.mozilla.org/en/docs/Web/API/AudioContext
    // see http://chimera.labs.oreilly.com/books/1234000001552/ch01.html
    // http://shop.oreilly.com/product/0636920025948.do
    var robot = this;
    this.buzzer = {
        audioCtx: new (window.AudioContext || window.webkitAudioContext || window.audioContext)
    };
    this.buzzer.beep = function beep ( duration, frequency, volume, type, callback ) {
        var oscillator = robot.buzzer.audioCtx.createOscillator();
        var gainNode = robot.buzzer.audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(robot.buzzer.audioCtx.destination);
        if ( volume ) { gainNode.gain.value = volume; };
        if ( frequency ) { oscillator.frequency.value = frequency; }
        if ( type ) { oscillator.type = type; }
        if ( callback ) { oscillator.onended = callback; }
        oscillator.start();
        setTimeout( function() {
            oscillator.stop();
        }, (duration ? duration : 500) );
    };
    robot.dataPropertiesIn.push ( 'buzzer' );
    robot.registeredProcessFunctions.push ( function () {
        if ( robot.data.buzzer.status == 1 ) {
            robot.buzzer.beep ( robot.data.buzzer.duration, robot.data.buzzer.frequency );
            robot.data.buzzer.status = 2;
        }
    } );
    return this;
};

/**
 * Adds the virtual camera and registers its process function.
 * @returns {ThreeWheelDistanceSensingRobotRepresentation} - The robot
 */
ThreeWheelDistanceSensingRobotRepresentation.prototype.addVirtualCamera = function addVirtualCamera () {

    this.camera = new THREE.PerspectiveCamera(
        35,
        window.innerWidth / window.innerHeight,
        1,
        1000
    );
    
    this.cameraPosition = new THREE.Object3D();
    this.cameraPosition.position.set ( -3, 8, 0 );
    this.chassis.add ( this.cameraPosition );
    
    this.camera.position.copy ( this.cameraPosition );

    this.cameraReference = new THREE.Object3D();
    this.cameraReference.position.set ( -6, 8, 0 );
    this.chassis.add ( this.cameraReference );

    this.camera.lookAt ( this.cameraReference );
    this.camera.name = this.id;

    this.scene.add ( this.camera );

    /*
    this.cameraHelper = new THREE.CameraHelper( this.camera );
    this.scene.add ( this.cameraHelper );
    */
    
    this.robotsManager.simulator.availableCameras[this.camera.uuid] = this.camera;
    
    var robot = this;
    
    this.registeredProcessFunctions.push ( function () {
        var cref = robot.getAbsolutePositionForObject( robot.cameraReference, true ); 
        var cpos = robot.getAbsolutePositionForObject( robot.cameraPosition, true ); 
        robot.camera.position.copy ( cpos );
        robot.camera.lookAt ( cref );
        /* */
        // TODO: we should take care of camera rotation too.
    } );
    
    return this;
}

/**
 * Adds the virtual locator and registers its process function.
 * @returns {ThreeWheelDistanceSensingRobotRepresentation} - The robot
 */
ThreeWheelDistanceSensingRobotRepresentation.prototype.addVirtualLocator = function addVirtualLocator () {
    var robot = this;
    this.registeredProcessFunctions.push ( function () {
        var coords = robot.getAbsolutePositionForObject( robot.centralPoint, true );
        robot.data.location = { x: coords.x, y: coords.z };
        robot.initialValues.debugging && robot.robotsManager.simulator.pushDebugText( { location: { x: robot.data.location.x.toFixed(2), y: robot.data.location.x.toFixed(2) } } );
    } );
    return this;
}

/**
 * Adds the virtual compass and registers its process function.
 * @returns {ThreeWheelDistanceSensingRobotRepresentation} - The robot
 */
ThreeWheelDistanceSensingRobotRepresentation.prototype.addVirtualCompass = function addVirtualCompass () {
    var robot = this;
    this.registeredProcessFunctions.push ( function ( ) {
        var fsp = robot.getAbsolutePositionForObject( robot.frontSonar, true );
        var cpp = robot.getAbsolutePositionForObject( robot.centralPoint, false );
        robot.data.heading = robot.getAngle( fsp, cpp, ['z','x'] );
        robot.initialValues.debugging && robot.robotsManager.simulator.pushDebugText( { heading: robot.data.heading.toFixed(2) } );
        //robot.initialValues.debugging && robot.robotsManager.simulator.pushDebugText( { rotation: [ robot.chassis.rotation._x.toFixed(3), robot.chassis.rotation._y.toFixed(3), robot.chassis.rotation._z.toFixed(3)] } );
    } );
    return this;
}

/**
 * Adds the virtual scanner and registers its process function.
 * @returns {ThreeWheelDistanceSensingRobotRepresentation} - The robot
 */
ThreeWheelDistanceSensingRobotRepresentation.prototype.addVirtualScanner = function addVirtualScanner ( ) {
    var robot = this;
    this.registeredProcessFunctions.push ( function ( ) {
        var coords = robot.getBottomImagePixelCoordinatesForObject( robot.centralPoint, false );
        robot.data.pixels = robot.robotsManager.simulator.bottom.canvas.getContext('2d').getImageData(
            coords.x,
            coords.y,
            1, 1
        ).data;
    } );
    return this;
}

/**
 * Adds the virtual pen and registers its process function.
 * @returns {ThreeWheelDistanceSensingRobotRepresentation} - The robot
 */
ThreeWheelDistanceSensingRobotRepresentation.prototype.addVirtualPen = function addVirtualPen ( color ) {
    var robot = this;
    this.pen = {
        enabled: false,
        color: new THREE.Color ( color ),
        radius: 9,
        alpha: .05,
        context: this.robotsManager.simulator.bottom.canvas.getContext('2d')
    };
    this.registeredProcessFunctions.push ( function ( ) {
        $.extend ( robot.pen, robot.receivedData.pen );
        if ( robot.pen.enabled ) {
            robot.batterypack.material.color.copy ( robot.pen.color );
        }
        if ( robot.pen.enabled && robot.isMoving ) {
            var coords = robot.getBottomImagePixelCoordinatesForObject( robot.centralPoint, false );
            robot.pen.context.fillStyle = "#" + robot.pen.color.getHexString();
            robot.pen.context.globalAlpha = robot.pen.alpha;
            robot.pen.context.beginPath();
            robot.pen.context.arc(
                coords.x,
                coords.y,
                THREE.Math.mapLinear ( robot.pen.radius, 0, robot.robotsManager.simulator.bottom.width, 0, robot.robotsManager.simulator.bottom.canvas.width ),
                0,
                2 * Math.PI,
                false
            );
            robot.pen.context.fill();
            robot.pen.context.closePath();
            robot.robotsManager.simulator.bottom.canvasMap.image = robot.robotsManager.simulator.bottom.canvas;
            robot.robotsManager.simulator.bottom.canvasMap.needsUpdate = true;
        }
        robot.data.penStatus = robot.pen.enabled ? 'down': 'up';
    } );
    return this;
}

/**
 * Processes incoming data and prepares outgoing data.
 * @returns {ThreeWheelDistanceSensingRobotRepresentation} - The robot
 */
ThreeWheelDistanceSensingRobotRepresentation.prototype.process = function process ( ) {
    
    var p;
    
    /* manage inputs */
    this.updateWheelSpeed( 'left', this.data.leftWheel );
    this.updateWheelSpeed( 'right', this.data.rightWheel );
    
    this.isMoving = this.data.leftWheel !==0 || this.data.rightWheel !==0;

    for ( var i = 1; i<=3; i++ ) {
        p = 'led' + i; 
        this.board[p].visible = this.data[p] === 1;
    }
    
    /* manage outputs */
    
    
    //this.arm.__dirtyPosition = true;
    //this.arm.__dirtyRotation = true;
    //this.arm.rotateOnAxis ( new THREE.Vector3(0, 1, 0), 0.01 );
    
    for ( var i = 0; i< this.registeredProcessFunctions.length; i++ ) {
        this.registeredProcessFunctions[i]( );
    }
    
    return this;
}

/**
 * Updates the data to/from the robot's behavior.
 * @override
 * @param {Object} data - The data received/transmitted
 */
ThreeWheelDistanceSensingRobotRepresentation.prototype.update = function update ( data ) {
    
    if ( !this.isBuilt ) {
        return;
    }
    
    this.batterypack.material.color.copy ( this.batterypack.userData.normalColor );
    
    this.receivedData = data;
    
    if ( typeof data !== 'undefined' ) {
        
        for ( var i=0; i<this.dataPropertiesIn.length; i++ ) {
            this.data[this.dataPropertiesIn[i]] = data[this.dataPropertiesIn[i]];
        }
        
        this.process( );
    }
    
    
    //console.log ( this.data );
    
    return this.data;
}

/**
 * Manages the fact that there has been a communication failure.
 * @override
 * @param {Object} data - The data received/transmitted
 */
ThreeWheelDistanceSensingRobotRepresentation.prototype.manageCommunicationFailure = function manageCommunicationFailure () {
    if ( this.isBuilt ) {
        this.batterypack.material.color.setHex( this.robotsManager.values.failureColor );
    }
    return this.data;
}

window["ThreeWheelDistanceSensingRobotRepresentation"] = ThreeWheelDistanceSensingRobotRepresentation;  // we need a reference to this function to be shared through a global object.
