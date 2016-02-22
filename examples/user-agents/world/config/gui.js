var guiFactory = function ( simulator ) {

    //var scale = chroma.scale(['white', 'blue', 'red', 'yellow']);

    function getMaterial(color) {
        var material = Physijs.createMaterial(
                new THREE.MeshLambertMaterial(
                        {
                            //color: scale(Math.random()).hex(),
                            color: color,
                            opacity: 1,
                            transparent: true
                        }), 0.5, 0.7);

        return material;
    }

    function setPosAndShade(obj) {
        obj.position.set(
                Math.random() * 100 - 50,
                20,
                Math.random() * 100 - 50
        );

        obj.rotation.set(Math.random() * 2 * Math.PI, Math.random() * 2 * Math.PI, Math.random() * 2 * Math.PI);
        obj.castShadow = true;
        obj.receiveShadow = true;
    }
        
    var controls = new function () {
        
        this.camPositionX = simulator.mainCamera.position.x;
        this.camPositionY = simulator.mainCamera.position.y;
        this.camPositionZ = simulator.mainCamera.position.z;
        
        this.camFov = simulator.mainCamera.fov;

        this.camLookAtX = 0;
        this.camLookAtY = 0;
        this.camLookAtZ = 0;
        
        /*
        this.camRotationX = simulator.mainCamera.rotation.x;
        this.camRotationY = simulator.mainCamera.rotation.y;
        this.camRotationZ = simulator.mainCamera.rotation.z;
        */
        
        this.changeCamera = function changeCamera() {
            simulator.mainCamera.position.set( controls.camPositionX, controls.camPositionY, controls.camPositionZ );
            simulator.mainCamera.fov = controls.camFov;
            simulator.mainCamera.lookAt( new THREE.Vector3(controls.camLookAtX, controls.camLookAtY, controls.camLookAtZ ));
            simulator.mainCamera.updateProjectionMatrix();
        };
        
        
        this.lightPositionX = simulator.light.position.x;
        this.lightPositionY = simulator.light.position.y;
        this.lightPositionZ = simulator.light.position.z;
        this.lightIntensity = simulator.light.intensity;

        this.changeLight = function changeLight() {
            simulator.light.position.set( controls.lightPositionX, controls.lightPositionY, controls.lightPositionZ );
            simulator.light.intensity = controls.lightIntensity;
        };
 
        this.meshColor = "#0000dd";
        
        this.addBoxMesh = function () {
            var cube = new Physijs.BoxMesh(
                new THREE.BoxGeometry(16, 10, 14),
                getMaterial( this.meshColor ),
                100
            );
            setPosAndShade(cube);
            simulator.scene.add(cube, 2);
        };
        
        this.addSphereMesh = function () {
            var sphere = new Physijs.SphereMesh(
                new THREE.SphereGeometry(6, 32),
                getMaterial( this.meshColor ),
                50
            );
            setPosAndShade(sphere);
            simulator.scene.add(sphere);
        };

        this.selectedCamera = 'main';

        var ctrls = this; // a reference

        this.selectCamera = function() {
            console.log ( 'camera: ' );
            console.log ( ctrls.selectedCamera );
            simulator.usedCamera = simulator.availableCameras[ctrls.selectedCamera];
        }

        this.takeScreenshot = function() {
            var dataUrl = renderer.domElement.toDataURL("image/png");
            console.log (dataUrl);                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        
        }
        
        this.activateIRrcs = function() {
            for (var i=0; i< gui.userData.windows.length; i++ ) {
                gui.userData.windows[i].focus();
            }
        }
        
        this.simulate = false;
        
        this.enableAltCamera = true;
        
        this.showAxis = false;
        
        this.showSonarDetection = false;
        
        this.showDebugText = false;
    }
    
    var gui = new dat.GUI();
    
    //gui.remember ( controls );
    
    function addRobotsToGui( simulator, gui ) {
        console.log ( 'adding robots to gui list...' );
        
        $.each ( gui.userData.managersSubfolders, function ( index, manager ) {
            
            $.each ( manager.userData.robotsManager.robots, function ( index, robot ) {
                var property = 'buildRobot: '+robot.id;
                controls[property] = function () {
                    if ( robot.build() ) {
                        if ( robot.hasCamera() ) {
                            gui.userData.cameras[robot.id] = robot.camera.uuid;
                            
                            for (var i in gui.__controllers) {
                                // gui.__controllers[i].updateDisplay(); // does not update the list shown
                                
                                if ( gui.__controllers[i].property == 'selectedCamera' ) {
                                    
                                    var option, t, att;
                                    for ( var j in gui.userData.cameras ) {
                                        // if the camera is not in the list of options, add it
                                        if ( $("option[value='" + gui.userData.cameras[j] + "']").length === 0 ) {
                                            option = document.createElement ( 'option' );
                                            t = window.document.createTextNode ( j );
                                            option.appendChild ( t );
                                            att = document.createAttribute("value");
                                            att.value = gui.userData.cameras[j];
                                            option.setAttributeNode(att);
                                            gui.__controllers[i].__select.appendChild ( option );
                                        }
                                    }
                                }
                            }
                        }
                                    
                        if ( typeof robot.initialValues !== 'undefined' ) {
                            if ( typeof robot.initialValues.position !== 'undefined' ) {
                                robot.move ( robot.initialValues.position, false );
                            }
                        }
                    }
                }
                manager.add(controls, property);
                if ( robot.hasController() ) {
                    property = 'ir: ' + robot.id;
                    controls[property] = function () {
                        gui.userData.windows.push(window.open(robot.controllerUrl + '&id='+robot.id, robot.id, 'width=100, height=300, scrollbars=no, status=no'));
                    }
                    manager.add(controls, property);
                }
                
                property = 'move: ' + robot.id;
                controls[property] = function () {
                    robot.move ( new THREE.Vector3 ( 0, 3.5, 0 ), false );
                }
                manager.add(controls, property);

                property = 'rotate left: ' + robot.id;
                controls[property] = function () {
                    robot.rotateOnAxis ( new THREE.Vector3 ( 0, 1, 0 ), 5 * Math.PI/180 );
                }
                manager.add(controls, property);

                property = 'rotate right: ' + robot.id;
                controls[property] = function () {
                    robot.rotateOnAxis ( new THREE.Vector3 ( 0, 1, 0 ), -5 * Math.PI/180 );
                }
                manager.add(controls, property);
                
            });
        });
    }
    
    gui.userData = {
        controls: controls,
        cameras: {},
        windows: []
    };
    
    gui.userData.cameras['main'] = simulator.mainCamera.uuid;
    
    var camera = gui.addFolder("Camera");
    
    camera.add(controls, 'camPositionX', -400, 400).onChange(controls.changeCamera);
    camera.add(controls, 'camPositionY', 0, 800).onChange(controls.changeCamera);
    camera.add(controls, 'camPositionZ', -400, 400).onChange(controls.changeCamera);
    camera.add(controls, 'camFov', 1, 100).onChange(controls.changeCamera);
    camera.add(controls, 'camLookAtX', -400, 400).onChange(controls.changeCamera);
    camera.add(controls, 'camLookAtY', -400, 400).onChange(controls.changeCamera);
    camera.add(controls, 'camLookAtZ', -400, 400).onChange(controls.changeCamera);
    
    var light = gui.addFolder("Light");
    light.add(controls, 'lightPositionX', -400, 400).onChange(controls.changeLight);
    light.add(controls, 'lightPositionY', 0, 400).onChange(controls.changeLight);
    light.add(controls, 'lightPositionZ', -400, 400).onChange(controls.changeLight);
    light.add(controls, 'lightIntensity', 0, 5).onChange(controls.changeLight);

    var meshes = gui.addFolder("Meshes");
    
    meshes.addColor(controls, 'meshColor');
    meshes.add(controls, 'addBoxMesh');
    meshes.add(controls, 'addSphereMesh');
    
    var managers = gui.addFolder("Managers");

    gui.userData.managersSubfolders = [];

    $.each( simulator.robotsManagers, function ( index, robotsManager ) {
        var manager = managers.addFolder( index );
        manager.userData = { robotsManager: robotsManager };
        console.log( manager );
        gui.userData.managersSubfolders.push ( manager );
    });
    
    gui.add(controls, 'selectedCamera', gui.userData.cameras).onChange (controls.selectCamera);
    gui.add(controls, 'takeScreenshot');
    
    var debug = gui.addFolder("Debug");
    debug.add(controls, 'simulate');
    debug.add(controls, 'enableAltCamera');
    debug.add(controls, 'showAxis');
    debug.add(controls, 'showSonarDetection');
    debug.add(controls, 'showDebugText');
    debug.add(controls, 'activateIRrcs');
    debug.open();
    
    console.log ( "adding actual robots..." );
    setTimeout ( addRobotsToGui, 5000, simulator, gui );
    
    console.log(gui.userData);
    return gui;
};
