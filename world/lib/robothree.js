/**
 * @author Loris Tissino / http://loris.tissino.it
*/

'use strict';

/*
var BasicRobot = function ( values ) {
    this.id = values.id;
    this.name = values.name;
    this.owner = values.owner;
    this.class = values.class;
    this.modelUrl = values.modelUrl;
    this.data = {
        dist: 300
    };   
};
*/

var BasicRobot = function () {

}

BasicRobot.prototype.setId = function setId ( id ) {
    this.id = id;
    this.isBuilt = false;
    this.components = [];  // since we cannot use groups in Physijs scenes, we keep track of them here...
    this.data = {};  // the data sent and received when updating with HTTP posts
    return this;
}

BasicRobot.prototype.setInitialValues = function setInitialValues ( values ) {
    this.initialValues = values;
    return this;
}

BasicRobot.prototype.setRobotManager = function setRobotsManager ( robotsManager ) {
    this.robotsManager = robotsManager;
    this.scene = this.robotsManager.simulator.scene; // a shortcut reference
    return this;
}

BasicRobot.prototype.setControllerUrl = function setControllerUrl ( url ) {
    this.controllerUrl = url;
    return this;
}

BasicRobot.prototype.hasController = function hasController () {
    return typeof this.controllerUrl !== 'undefined';
}

BasicRobot.prototype.hasCamera = function hasCamera () {
    return typeof this.camera !== 'undefined';
}

BasicRobot.prototype.show = function show () {
    console.log ( "I am a robot, id: " + this.id );
}

BasicRobot.prototype.getLambertPjsMaterial = function getMaterial ( options ) {

    var values = $.extend ({
        color: 0xC1F5F6,
        opacity: 0.4,
        transparent: true,
        friction: .5,
        restitution: .5
        }, options );

    return Physijs.createMaterial(
            new THREE.MeshLambertMaterial( {color: values.color, opacity: values.opacity, transparent: values.transparent} ),
            values.friction,
            values.restitution
    );
}

BasicRobot.prototype.createWheel = function createWheel ( options ) {
    // position, radius, thickness, mass

    var values = $.extend ({
        color: 0x000000,
        position: new THREE.Vector3 ( 0, 0, 0) ,
        radius: 10,
        thickness: 2,
        transparent: false,
        mass: 32,
        friction: .99,  // high friction
        restitution: .01  // low restition
        }, options );
  
    var wheel_material = this.getLambertPjsMaterial( { color: values.color, transparent: values.transparent, friction: values.friction, restitution: values.restitution } );

    var wheel_geometry = new THREE.CylinderGeometry( values.radius, values.radius, values.thickness, 32 /* number of "sides" */ );
    
    var wheel = new Physijs.CylinderMesh(
        wheel_geometry,
        wheel_material,
        values.mass
        );

    wheel.rotation.x = Math.PI / 2;
    wheel.castShadow = true;
    wheel.receiveShadow = true;
    wheel.position.copy( values.position );
    return wheel;
}

BasicRobot.prototype.createDOFConstraint = function createDOFConstraint ( mainObject, constrainedObject, position ) {
    return new Physijs.DOFConstraint( mainObject, constrainedObject, position );
}
/*
BasicRobot.prototype.createFixedConstraint = function createFixedConstraint ( mainObject, constrainedObject, position ) {
    // used to keep two objects together, with no movement
    var constraint = new Physijs.SliderConstraint(
        mainObject,
        constrainedObject,
        position,
        new THREE.Vector3( 0, 0, 1 ) // Axis along which the hinge lies
    );
    constraint.setLimits( 0, 0, 0, 0 );
    return constraint;
}
*/

BasicRobot.prototype.build = function build () {
    throw "Error: this should be implemented in the actual robot class";
}

BasicRobot.prototype.update = function update ( data ) {
    throw "Error: this should be implemented in the actual robot class";
    /*
    if ( typeof data !== 'undefined' )
    {
        console.log( "processing upcoming data:" );
        console.log(data);
        this.data.lw0 = data.lw0;
        this.data.lw1 = data.lw1;
        this.data.rw0 = data.rw0;
        this.data.rw1 = data.rw1;
    }
    this.data.dist -= 1;
    return this.data;
    */
}

BasicRobot.prototype.manageCommunicationFailure = function manageCommunicationFailure () {
    throw "Error: this should be implemented in the actual robot class";
    //this.data.sensors.led = 0;
    //this.data.actuators.wheel = 0;
    //console.log(this);
    /*
    return this.data;
    */
}

BasicRobot.prototype.move = function move ( vector, relative ) {
    // vector is a THREE.Vector3 object
    // relative is a boolean: if true, the vector is considered a change from current position, else a final destination
    
    var offset;
    
    if ( typeof relative === 'undefined' ) {
        relative = false;
    }
    
    offset = relative ? vector : vector.sub ( this.chassis.position );
    
    $.each ( this.components, function ( index, component ) {
       component.position.add( offset );
       component.__dirtyPosition = true;
       component.__dirtyRotation = true;
    });
    return this;
}


var RobotsManager = function ( values, simulator ) {
    console.log(values);
    this.url = values.url;
    this.values = values;
    this.simulator = simulator;
    this.robots = [];
    this.data = {};
};

RobotsManager.prototype.addRobot = function ( robot ) {
    console.log ( 'adding robot ' + robot.id );
    console.log ( robot.class );
    
    var rm = this; // a reference
    
    var url = 'robots/' + robot.class + '.js';

    console.log ( 'Loading script file...' );
    $.getScript( url )   // in a future version we might call the robotsManager via http for this
        .done(function( script, textStatus ) {
            console.log( textStatus );
            console.log( " Loaded class " + url);
            
            var addedRobot = new window[robot.class];
            addedRobot
                .setId ( robot.id )
                .setInitialValues ( robot.initialValues )
                .setRobotManager ( rm )
                .setControllerUrl ( robot.controllerUrl )
                ;
            
            //addedRobot.show();
            rm.robots.push ( addedRobot );
            return rm;
      })
        .fail(function( jqxhr, settings, exception ) {
            console.log ( "Error loading file: " + url );
            return rm;
    });
}

RobotsManager.prototype.addRobots = function () {
    console.log("robots to add:");
    console.log(this.values.robots);
    var rm = this; // a reference
    $.each ( rm.values.robots, function ( index, robot ) {
        rm.addRobot( robot );
    });
    return this;
}

RobotsManager.prototype.update = function () {
    var robots = this.robots; // a reference
    var rm = this; // a reference
    
    var posting = $.post( this.url, JSON.stringify( this.data ), function() {
        // the connection started, we don't need to do anything...
        //console.log("contacting url " + this.url);
        })
    .done(function(data) {
        // the connection is done;
        //console.log (data);
        $.each( robots, function ( index, robot ) {
            rm.data[robot.id] = robot.update( data[robot.id] );
        });
    })
    .fail(function() {
        //console.log(robots);
        $.each( robots, function ( index, robot ) {
            rm.data[robot.id] = robot.manageCommunicationFailure();
        });
    })
    .always(function() {
       //alert( "finished" );
    });
}



var SimulationManager = function ( defaults ) {
    
    this.defaults = defaults;

    this.robotsManagers = {};
    
    this.loader = new THREE.TextureLoader();

    this.initRenderer = function initRenderer () {
        this.renderer = new THREE.WebGLRenderer( {antialias: true, preserveDrawingBuffer: true} );
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(new THREE.Color(0x000000));
        this.renderer.shadowMap.enabled = true;
        $('#viewport').append(this.renderer.domElement);
        return this;
    };

    this.initRenderStats = function initRenderStats () {
        this.renderStats = new Stats();
        this.renderStats.domElement.style.position = 'absolute';
        this.renderStats.domElement.style.top = '1px';
        this.renderStats.domElement.style.left = '1px';
        this.renderStats.domElement.style.zIndex = 100;
        $('#viewport').append(this.renderStats.domElement);
        return this;
    };

    this.onUpdate = function onUpdate() {
        $.each ( this.userData.simulator.robotsManagers, function ( id, robotManager ) {
            robotManager.update();
        });
    }

    this.initScene = function initScene ( options ) {

        var values = $.extend ( {}, this.defaults.scene, options );
        
        this.scene = new Physijs.Scene( {reportSize: 10, fixedTimeStep: 1 / 60} );
        this.scene.setGravity(values.gravity);
        this.scene.userData = { simulator: this };
        this.scene.addEventListener( 'update', this.onUpdate ); 
        return this;
    };

    this.addMainCamera = function addMainCamera ( options ) {

        var values = $.extend ( {}, this.defaults.mainCamera, options );
        
        this.mainCamera = new THREE.PerspectiveCamera ( values.fov, values.aspect, values.near, values.far );
        this.mainCamera.position.copy ( values.position );
        this.mainCamera.lookAt( values.lookAt );
        this.scene.add( this.mainCamera );
        this.usedCamera = this.mainCamera; // we keep a reference to the camera that is actually used for each frame
        return this;
    };

    this.addLight = function addLight ( options ) {
        
        var values = $.extend ( {}, this.defaults.light, options );
        
        this.light = new THREE.SpotLight( values.color, values.intensity );
        this.light.position.copy( values.position );
        this.light.castShadow = true;
        this.light.shadowMapDebug = true;
        this.light.shadowCameraNear = values.near;
        this.light.shadowCameraFar = values.far;
        this.scene.add( this.light );
        return this;
    };

    this.addAxisHelper = function addAxisHelper ( options ) {
        
        var values = $.extend ( {}, this.defaults.axisHelper, options );
        
        this.axisHelper = new THREE.AxisHelper( values.length );
        this.scene.add ( this.axisHelper );
        this.axisHelper.visible = values.visible;
        return this;
    };

    this.addGUI = function addGUI () {
        
        this.gui = guiFactory ( this );
        return this;
        
    };
    
    this.addGround = function addGround ( options ) {

        var values = $.extend ( {}, this.defaults.ground, options );

        function createPhysijsMaterial ( material ) {
            return Physijs.createMaterial (
                material,
                values.friction,
                values.restitution
            );
        }
      
        var scene = this.scene; // a reference
        var simulator = this; // a reference
        
        // Material
            this.loader.load(
                values.texture,
                // Function when resource is loaded
                function ( texture ) {

                    var mesh, geometry;
					var texturedMaterial = new THREE.MeshBasicMaterial( { map: texture, overdraw: 0.5 } );
                    var texturedPjsMaterial = createPhysijsMaterial( texturedMaterial );
                    
                    var coloredMaterial = new THREE.MeshLambertMaterial ( {
                        color: 0xffffff,
                        opacity: 1,
                        transparent: false,
                    });
                    var coloredPjsMaterial = createPhysijsMaterial( coloredMaterial );
                    
                    $.each( values.pieces, function ( name, piece ) {
                        geometry = new THREE.BoxGeometry( piece.sizeX, piece.sizeY, piece.sizeZ );
                        if ( typeof piece.color === 'undefined' ) {
                            mesh = new Physijs.BoxMesh( geometry, texturedPjsMaterial, 0 );
                        }
                        else {
                            mesh = new Physijs.BoxMesh( geometry, coloredPjsMaterial, 0 );
                            mesh.material = mesh.material.clone();
                            mesh.material.color.setHex( piece.color );
                            if ( typeof piece.opacity !== 'undefined' ) {
                                mesh.material.opacity = piece.opacity;
                            }
                        };
                        mesh.position.copy( piece.position );
                        if ( typeof piece.rotation !== 'undefined' ) {
                            mesh.rotation.setFromVector3( piece.rotation );
                        }
                        mesh.name = name;
                        mesh.receiveShadow = true;
                        mesh.castShadow = true;
                        scene.add( mesh );
                    });
                },
                // Function called when download progresses
                function ( xhr ) {
                    console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
                },
                // Function called when download errors
                function ( xhr ) {
                    console.log( 'An error happened' );
                }
            );
        return this;
    }
    
    this.addRobotsManagers = function addRobotsManagers( options ) {
        
        var values = $.extend ( {}, this.defaults.robotsManagers, options );
        
        var rm = this.robotsManagers; // a reference
        var simulator = this; // a reference
        
        $.each ( values, function ( id, robotManager ) {
            rm[id] = new RobotsManager ( robotManager, simulator );
            rm[id].addRobots();
        });
        
        return this;
    }
    
    this.initSimulation = function() {
        this
            .initRenderer()
            .initRenderStats()
            .initScene()
            .addAxisHelper()
            .addMainCamera()
            .addLight()
            .addGround()
            .addRobotsManagers()
            .addGUI();
        console.log( this );
    }
    
    this.getRobotById = function ( id ) {
        //console.log ("Looking for robots...");
        //console.log (this);
        for ( var key in this.robotsManagers ) {
            //console.log ( this.robotsManagers[key] );
            for ( var i = 0; i <  this.robotsManagers[key].robots.length; i++ ) {
                if ( this.robotsManagers[key].robots[i].id === id ) {
                    //console.log ( '   ' + this.robotsManagers[key].robots[i].id );
                    return this.robotsManagers[key].robots[i];
                    }
            }
        }
        return false;
    } 
    
};



$(function () {

    function render () {
        if ( simulationManager.gui.userData.controls.simulate )
        {
            simulationManager.scene.simulate();
        }
        requestAnimationFrame ( render );
        simulationManager.renderer.render ( simulationManager.scene, simulationManager.usedCamera );
        simulationManager.axisHelper.visible = simulationManager.gui.userData.controls.showAxis;
        simulationManager.renderStats.update();
    };

    Physijs.scripts.worker = 'libs/physijs_worker.js';
    Physijs.scripts.ammo = 'ammo.js';

    var simulationManager = new SimulationManager( simulationDefaults );
    simulationManager.initSimulation();
    render();
});

