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
            .addFrontWheel()
            .addSonars()
            .finalizeBody()
            .addWheels()
            //.addArm()
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
            color: 0xffffff,
            opacity: .5,
            mass: 600
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
    this.chassis.castShadow = false;
    this.chassis.receiveShadow = true;

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
        red: {
            color: 0xff0000,
            position: new THREE.Vector3 ( 0.27, 1.8, -1.6 ),
            shininess: 200
        },
        green: {
            color: 0x00ff00,
            position: new THREE.Vector3 ( 0.27, 1.8, -1.1 ),
            shininess: 100
        },
        blue: {
            color: 0x0000ff,
            position: new THREE.Vector3 ( 0.27, 1.8, -0.6 ),
            shininess: 300
        }
    }
    
    var board = this.board; // a reference
    
    $.each ( leds, function ( index, led ) {
        var name = index + 'Led';
        board[name] = new THREE.Mesh (
            new THREE.BoxGeometry ( 0.2, 0.5, 0.5 ),
            new THREE.MeshPhongMaterial( { color: led.color, emissive: led.color, shininess: led.shininess, shading: THREE.FlatShading } )
        );
        board[name].visible = false;
        board[name].position.copy ( led.position );
        board[name].name = name;
        board.add ( board[name] );
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
    
    var cylinderBSP = new ThreeBSP(cylinderMesh);
    var squareBSP = new ThreeBSP(squareMesh);

    var resultBSP = cylinderBSP.subtract ( squareBSP );
    
    var result = resultBSP.toMesh();
    result.geometry.computeFaceNormals();
    result.geometry.computeVertexNormals();
    
    this.back = new Physijs.ConvexMesh(
        result.geometry,
        this.chassis.material,
        20
    );
    
    this.back.castShadow = false;
    this.back.receiveShadow = true;
    
    this.back.position.set ( 4, 2.3, 0 );
    this.back.name = 'back';
    this.back.__dirtyPosition = true;
    this.back.__dirtyRotation = true;
    
    this.chassis.add ( this.back );
    
    return this;
}

ThreeWheelDistanceSensingRobot.prototype.addWheels = function addWheels () {
    
    var xo = 4.5, yo = 3.6, color = 0xFFFF00;
    
    var wheels = {
        left: {
            position: new THREE.Vector3(xo, yo, -6.5),
        },
        right: {
            position: new THREE.Vector3(xo, yo, 6.5),
        }
    }
    
    var robot = this;  // a reference
    
    $.each ( wheels, function ( name, wheel ) {
        var wheelName = name + 'Wheel';
        var constraintName = wheelName + 'Constraint';

        robot[wheelName] = robot.createWheel ({
            position: wheel.position,
            radius: 3.6,
            thickness: 2.5,
            mass: 500,
            color: color
        });
        robot[wheelName].name = wheelName;
        robot.scene.add ( robot[wheelName] );

        robot[constraintName] = robot.createDOFConstraint ( robot.chassis, robot[wheelName], wheel.position );
        robot.scene.addConstraint ( robot[constraintName], true );
        
        console.log ( robot[constraintName ] );
        robot[constraintName].setAngularLowerLimit({x: 0, y: 0, z: 0});
        robot[constraintName].setAngularUpperLimit({x: 0, y: 0, z: 0});
        robot[constraintName].configureAngularMotor(2, 0.1, 0, 0, 1500);
        robot[constraintName].enableAngularMotor(2);
        
        robot.components.push ( robot[wheelName] );

    });
    
    return this;
}

ThreeWheelDistanceSensingRobot.prototype.addArm = function addArm () {
    
    // this is an experiment, not yet completed
    
    this.arm = new Physijs.BoxMesh(
        new THREE.BoxGeometry( 40, 5, 1 ),
        this.getLambertPjsMaterial( { color: 0x333333, opacity: 0.5 } ),
        20
    );
    this.arm.position.set( 3, 14, 0 );
    this.arm.name = 'arm';
    this.arm.castShadow = true;
    this.arm.receiveShadow = true;

    this.scene.add ( this.arm );
    
    var constraintPosition = this.arm.position.clone().add( new THREE.Vector3 ( 0, -2.5, 0 ) );
    
    this.armConstraint = this.createDOFConstraint( this.chassis, this.arm, constraintPosition, new THREE.Vector3 ( 0, 1, 0 ));
    console.log ( this.armConstraint );
    
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

ThreeWheelDistanceSensingRobot.prototype.addFrontWheel = function addFrontWheel () {

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


ThreeWheelDistanceSensingRobot.prototype.addSonars = function addSonars () {

    this.frontSonarReference = new THREE.Object3D();
    this.frontSonarReference.position.set ( 0, 3.5, 0 );
    this.chassis.add ( this.frontSonarReference );

    var sonars = {
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
    
    $.each ( sonars, function ( key, sonar ) {
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
        robot.chassis.add ( robot[name] );
    });
    
    this.activateSonar( 'frontSonar' );
    
    this.sonarData = {
        raycasters: [],
        variants : [
            { type: 'none', color: 0x000000 },
            { type: 'horizontal', axis: new THREE.Vector3 ( 0, 1, 0 ), color: 0xff0000, value: 0.087 },
            { type: 'horizontal', axis: new THREE.Vector3 ( 0, 1, 0 ), color: 0x00ff00, value: -0.087 },
            { type: 'vertical', color: 0x0000ff, value: 0.087 },
            { type: 'vertical', color: 0xff00ff, value: -0.087 }
        ]
    };
    
    for ( var i=0; i < this.sonarData.variants.length; i++ ) {
        this.sonarData.raycasters[i] = {
            raycaster: new THREE.Raycaster(),
            direction: new THREE.Vector3( -1, 0, 0)
        };
        this.sonarData.raycasters[i].arrowHelper = new THREE.ArrowHelper( 
            this.sonarData.raycasters[i].direction,
            this.activeSonar.position,
            30,
            this.sonarData.variants[i].color
        );
        this.sonarData.raycasters[i].arrowHelper.visible = true;
        this.scene.add( this.sonarData.raycasters[i].arrowHelper );
    };
    
    this.activeSonarMatchArrowHelper = new THREE.ArrowHelper( new THREE.Vector3 ( 0, 1, 0), this.activeSonar.position, 1, 0x111111, 1, 1 );
    this.scene.add( this.activeSonarMatchArrowHelper );

    return this;
}

ThreeWheelDistanceSensingRobot.prototype.activateSonar = function activateSonar ( name ) {
    this.activeSonar = this[name];
}

ThreeWheelDistanceSensingRobot.prototype.finalizeBody = function finalizeBody () {
    this.scene.add ( this.chassis );
    return this;
}


ThreeWheelDistanceSensingRobot.prototype.addCamera = function addCamera () {

    this.camera = new THREE.PerspectiveCamera(
        35,
        window.innerWidth / window.innerHeight,
        1,
        1000
    );
    
    this.cameraPosition = new THREE.Object3D();
    this.cameraPosition.position.set ( -3, 6.5, 0 );
    this.chassis.add ( this.cameraPosition );
    
    this.cameraReference = new THREE.Object3D();
    this.cameraReference.position.set ( -6, 6.5, 0 );
    this.chassis.add ( this.cameraReference );

    this.scene.add( this.camera );
    
    this.robotsManager.simulator.availableCameras[this.camera.uuid] = this.camera;
    return this;
}

ThreeWheelDistanceSensingRobot.prototype.process = function process () {
    
    /* manage inputs */
    this['leftWheelConstraint'].configureAngularMotor(2, 0.1, 0, 5*(this.data.lw0 - this.data.lw1), 15000);
    this['rightWheelConstraint'].configureAngularMotor(2, 0.1, 0, 5*(this.data.rw0 - this.data.rw1), 15000);
    
    /* manage outputs */
    
    var intersects;

    var asp = new THREE.Vector3();  // active sonar's position
    asp.setFromMatrixPosition( this.activeSonar.matrixWorld );
    var ref = new THREE.Vector3();
    ref.setFromMatrixPosition( this[this.activeSonar.userData.reference].matrixWorld );

    var dir = asp.clone().sub(ref).normalize();

    //console.log ( 'degrees: ' + this.horizontalAngleFromVector3( dir ) * 180 / Math.PI );
    
    this.data.dist = 9999;
    
    for ( var i=0; i < this.sonarData.raycasters.length; i++) {
        this.sonarData.raycasters[i].direction = dir.clone();
        
        switch ( this.sonarData.variants[i].type ) {
            case 'none':
                break;
            case 'horizontal':
                this.sonarData.raycasters[i].direction.applyAxisAngle (
                    this.sonarData.variants[i].axis,
                    this.sonarData.variants[i].value
                )
                break;
            case 'vertical':
                this.sonarData.raycasters[i].direction.y = Math.sin ( Math.asin ( this.sonarData.raycasters[i].direction.y ) + this.sonarData.variants[i].value );
                break;
            default:
                // should never happen
        }
        
        this.sonarData.raycasters[i].direction.normalize();
        
        this.sonarData.raycasters[i].arrowHelper.position.copy ( asp );
        this.sonarData.raycasters[i].arrowHelper.setDirection ( this.sonarData.raycasters[i].direction );

        this.sonarData.raycasters[i].raycaster.set ( asp, this.sonarData.raycasters[i].direction, 3, 600 );

        intersects = this.sonarData.raycasters[i].raycaster.intersectObjects( this.scene.children );

        if ( intersects.length > 0 )
        {
            if ( intersects[0].distance < this.data.dist ) {
                this.data.dist = intersects[0].distance;
                this.activeSonarMatchArrowHelper.position.copy ( intersects[0].point );
                this.activeSonarMatchArrowHelper.setDirection ( this.sonarData.raycasters[i].direction.negate() );
                this.activeSonarMatchArrowHelper.setColor ( this.sonarData.variants[i].color );
            }
        }
        this.activeSonarMatchArrowHelper.visible = this.data.dist < 9999;
    }

    this.board['redLed'].visible = this.data.led1 === 1;
    this.board['greenLed'].visible = this.data.led2 === 1;
    this.board['blueLed'].visible = this.data.led3 === 1;
    
    /*
    this.arm.rotateOnAxis ( new THREE.Vector3(0, 1, 0), 0.01 );
    this.arm.__dirtyPosition = true;
    this.arm.__dirtyRotation = true;
    */
    
    var cref = new THREE.Vector3(); 
    cref.setFromMatrixPosition( this.cameraReference.matrixWorld );

    var cpos = new THREE.Vector3(); 
    cpos.setFromMatrixPosition( this.cameraPosition.matrixWorld );

    this.camera.position.copy ( cpos );
    this.camera.lookAt ( cref );
    
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
        this.data.led1 = data.led1;
        this.data.led2 = data.led2;
        this.data.led3 = data.led3;
        this.process();
    }
    // this.data.dist -= 1;
    
    if ( this.isBuilt ) {
        // visual feedback for the fact that the communication happened correctly
        this.batterypack.material.color.copy ( this.batterypack.userData.normalColor );
    }
    
    return this.data;
}

ThreeWheelDistanceSensingRobot.prototype.manageCommunicationFailure = function manageCommunicationFailure () {
    if ( this.isBuilt ) {
        this.batterypack.material.color.setHex( 0xffaaaa );
    }
    return this.data;
}

window["ThreeWheelDistanceSensingRobot"] = ThreeWheelDistanceSensingRobot;  // we need a reference to this function to be shared through a global object.
