/**
 * @author Loris Tissino / http://loris.tissino.it
 * @package RoboThree
 * @release 0.51
 * @license The MIT License (MIT)
*/

'use strict';

var BasicRobot = function () {}

BasicRobot.prototype.setId = function setId ( id ) {
    this.id = id;
    this.isBuilt = false;
    this.components = [];  // we keep track of components with constraints here, because we need to move the separetely
    this.data = {};  // the data sent and received when updating with HTTP posts
    this.dataPropertiesIn  = [];
    this.registeredProcessFunctions = [];
    this.debugging = false;
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

    var wheel_geometry = new THREE.CylinderGeometry( values.radius, values.radius, values.thickness, 24 /* number of "sides" */ );
    
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

BasicRobot.prototype.updateWheelSpeed = function updateWheelSpeed ( wheel, speed ) {
    if ( typeof speed !== 'undefined' ) {
        this[wheel + 'WheelConstraint'].configureAngularMotor(2, 0.1, 0, 5*speed, 15000);
    }
}

BasicRobot.prototype.createDOFConstraint = function createDOFConstraint ( mainObject, constrainedObject, position ) {
    return new Physijs.DOFConstraint( mainObject, constrainedObject, position );
}

BasicRobot.prototype.createHingeConstraint = function createHingeConstraint ( mainObject, constrainedObject, position, axis ) {
    return new Physijs.HingeConstraint(
        mainObject, // First object to be constrained
        constrainedObject, // OPTIONAL second object - if omitted then physijs_mesh_1 will be constrained to the scene
        position, // point in the scene to apply the constraint
        axis // Axis along which the hinge lies - in this case it is the X axis
    );
}

BasicRobot.prototype.build = function build () {
    throw "Error: this should be implemented in the actual robot class";
}

BasicRobot.prototype.update = function update ( data ) {
    throw "Error: this should be implemented in the actual robot class";
}

BasicRobot.prototype.manageCommunicationFailure = function manageCommunicationFailure () {
    throw "Error: this should be implemented in the actual robot class";
}

BasicRobot.prototype.move = function move ( vector, relative ) {
    // vector is a THREE.Vector3 object
    // relative is a boolean: if true, the vector is considered a change from current position, else a final destination
    console.log ('moving to: ');
    console.log ( vector );
    var offset;
    
    if ( typeof relative === 'undefined' ) {
        relative = false;
    }
    
    offset = relative ? vector : vector.sub ( this.chassis.position );
    
    this.chassis.position.add ( offset );
    this.chassis.__dirtyPosition = true;
    this.chassis.__dirtyRotation = true;
    
    $.each ( this.components, function ( index, component ) {
       component.position.add( offset );
       component.__dirtyPosition = true;
       component.__dirtyRotation = true;
    });
    
    return this;
}

BasicRobot.prototype.rotateOnAxis = function rotateOnAxis ( axis, angle ) {
    this.chassis.rotateOnAxis ( axis, angle );
    this.chassis.__dirtyPosition = true;
    this.chassis.__dirtyRotation = true;
    return this;
}

BasicRobot.prototype.getAngle = function getAngle ( pos1, pos2, axes ) {
    return Math.PI + Math.atan2 ( pos1[axes[0]] - pos2[axes[0]], pos1[axes[1]] - pos2[axes[1]] );
}

BasicRobot.prototype.getAbsolutePositionForObject = function getAbsolutePositionForObject( obj, forceUpdate ) {
    if ( typeof obj.userData.absolutePosition === 'undefined' ) {
        obj.userData.absolutePosition = new THREE.Vector3();
    }
    else {
        if ( forceUpdate === false ) {
            return obj.userData.absolutePosition;
        }
    }
    obj.userData.absolutePosition.setFromMatrixPosition( obj.matrixWorld );
    return obj.userData.absolutePosition;
}

BasicRobot.prototype.getBottomImagePixelCoordinatesForObject = function getBottomImagePixelCoordinatesForObject( obj, forceUpdate ) {
    var coords = this.getAbsolutePositionForObject( obj, forceUpdate );
    return new THREE.Vector2 (
        Math.round( THREE.Math.mapLinear (
            coords.x,
            - this.robotsManager.simulator.bottom.width / 2,
            this.robotsManager.simulator.bottom.width / 2,
            0,
            this.robotsManager.simulator.bottom.canvas.width
        )),
        Math.round( THREE.Math.mapLinear (
            coords.z,
            - this.robotsManager.simulator.bottom.height / 2,
            this.robotsManager.simulator.bottom.height / 2,
            0,
            this.robotsManager.simulator.bottom.canvas.height
        ))
    );
}

var RobotsManager = function ( values, simulator ) {
    console.log(values);
    this.values = values;
    this.url = values.url;
    this.simulator = simulator;
    this.robots = [];
    this.data = {};
};

RobotsManager.prototype.addRobot = function ( robot ) {
    console.log ( 'adding robot ' + robot.id );
    console.log ( robot.class );
    
    var rm = this; // a reference
    
    var url = 'representations/' + robot.class + '.js';

    console.log ( 'Loading script file...' );
    
    // TODO avoid multiple loading of the same file
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
    
    this.release = '0.51';
    
    this.defaults = defaults;

    this.robotsManagers = {};
    
    this.loader = new THREE.TextureLoader();

    this.initRenderer = function initRenderer ( options ) {
        var values = $.extend ( {}, this.defaults.renderer, options );
        this.renderer = new THREE.WebGLRenderer( {antialias: values.antialias, preserveDrawingBuffer: true, alpha: true } );
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor( values.backgroundColor, 1 );
        this.renderer.shadowMap.enabled = values.shadows;
        $('#viewport').append(this.renderer.domElement);
        return this;
    };

    this.initAltRenderer = function initAltRenderer () {
        this.altRenderer = new THREE.WebGLRenderer( {antialias: false, preserveDrawingBuffer: true, alpha: false } );
        this.altRenderer.setSize(160, Math.round( 160 * this.renderer.getSize().height / this.renderer.getSize().width ));
        this.altRenderer.setClearColor( this.renderer.getClearColor(), 1);
        this.altRenderer.shadowMap.enabled = this.renderer.shadowMapEnabled;
        this.altRenderer.domElement.style.position = 'absolute';
        this.altRenderer.domElement.style.top = '60px';
        this.altRenderer.domElement.style.left = '1px';
        this.altRenderer.domElement.style.zIndex = 100;
        this.altRenderer.domElement.style['border-style'] = 'double';
        this.altRenderer.domElement.style['border-color'] = '#000000';
        this.altRenderer.domElement.style.visibility = 'hidden';
        $('#viewport').append(this.altRenderer.domElement);
        return this;
    };

    this.initRenderStats = function initRenderStats () {
        this.renderStats = new Stats();
        this.renderStats.setMode( this.defaults.stats.mode ); 
        this.renderStats.domElement.style.position = 'absolute';
        this.renderStats.domElement.style.top = '1px';
        this.renderStats.domElement.style.left = '1px';
        this.renderStats.domElement.style.zIndex = 100;
        $('#viewport').append(this.renderStats.domElement);
        return this;
    };
    
    this.addInfoBox = function addInfoBox() {
        this.infoBox = $( '<div />' );
        this.infoBox
            .attr('id', 'infobox')
            .html('<a title="RoboThree Project Website" target="_blank" href="https://github.com/loristissino/RoboThree/">RoboThree ' + this.release + '</a>')
            .css('top', (window.innerHeight - 20 ) +'px')
            ;
        $('#viewport').append( this.infoBox );
        this.debugBox = $('<span />');
        this.infoBox.append ( this.debugBox );
        this.debugBoxTexts = {};
        return this;
    }
    
    this.pushDebugText = function addDebugText ( obj ) {
        $.extend( this.debugBoxTexts, obj );
    }
    
    this.renderDebugText = function renderDebugText () {
        if ( this.gui.userData.controls.showDebugText ) {
            if ( Object.keys( this.debugBoxTexts ).length > 0 ) {
                this.debugBox.text( [ '', JSON.stringify( this.debugBoxTexts ) ].join( ' - ' ) );
            }
        }
        else {
            this.debugBox.text( '' );
        }
        this.debugBoxTexts = {};
    }
    
    this.onUpdate = function onUpdate() {
        // added as event listener of the scene, "this" refers to it
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
        this.mainCamera.name = "main";
        this.scene.add( this.mainCamera );
        
        this.availableCameras = {};
        this.availableCameras[this.mainCamera.uuid] = this.mainCamera;
        
        this.usedCamera = this.mainCamera; // we keep a reference to the camera that is actually used for each frame
        return this;
    };

    this.addLight = function addLight ( options ) {
        
        var values = $.extend ( {}, this.defaults.light, options );
        
        this.light = new THREE.SpotLight( values.color, values.intensity );
        this.light.position.copy( values.position );
        this.light.castShadow = true;
        //this.light.shadowMapDebug = true;
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
        
        this.bottom = {};
        
        // Material
        this.loader.load(
            values.texture,
            // Function called when the resource is loaded
            function ( texture ) {

                simulator.bottom.canvasElement = $('<canvas />');
                simulator.bottom.canvasElement.attr('id', 'mycanvas');
                simulator.bottom.canvas = simulator.bottom.canvasElement[0];
                simulator.bottom.canvas.width = texture.image.width;
                simulator.bottom.canvas.height = texture.image.height;
                simulator.bottom.canvas.getContext( '2d' ).drawImage( texture.image, 0, 0, texture.image.width, texture.image.height );
    
                var mesh, geometry;
                
                simulator.bottom.canvasMap = new THREE.Texture( simulator.bottom.canvas );
                simulator.bottom.canvasMap.needsUpdate = true;
                
                var texturedMaterial = new THREE.MeshBasicMaterial( { map: simulator.bottom.canvasMap, overdraw: 0.5 } );

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
                    if ( name == 'bottom' ) {
                        simulator.bottom.width = piece.sizeX;
                        simulator.bottom.height = piece.sizeZ;
                        simulator.bottom.mesh = mesh;
                    }
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
            .initAltRenderer()
            .initRenderStats()
            .addInfoBox()
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
        if ( simulationManager.gui.userData.controls.enableAltCamera && simulationManager.usedCamera.name !== 'main' ) {
            simulationManager.altRenderer.render ( simulationManager.scene, simulationManager.mainCamera );
            simulationManager.altRenderer.domElement.style.visibility = 'visible';
        }
        else {
            simulationManager.altRenderer.domElement.style.visibility = 'hidden';
        }
        simulationManager.axisHelper.visible = simulationManager.gui.userData.controls.showAxis;
        simulationManager.renderStats.update();
        simulationManager.renderDebugText();        
    };

    Physijs.scripts.worker = 'libs/vendor/physijs_worker.js';
    Physijs.scripts.ammo = 'ammo.js';

    var simulationManager = new SimulationManager( simulationDefaults );
    simulationManager.initSimulation();
    
    render();
});

