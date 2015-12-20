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
                30,
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
 
        this.meshColor = "#ffae23";
        
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
                200
            );
            setPosAndShade(sphere);
            simulator.scene.add(sphere);
        };

        /*
        this.openController = function () {
          window.open('../controllers/robot.html', 'Sample Controller', 'width=200, height=400');
          };
        */
        
        this.useMainCamera = function() {
            simulator.usedCamera = simulator.mainCamera;
        }

        this.useRobotCamera = function() {
            var robot = simulator.getRobotById('one');
            console.log ( robot );
            simulator.usedCamera = simulator.getRobotById('one').camera;
        }
        
        this.takeScreenshot = function() {
          var dataUrl = renderer.domElement.toDataURL("image/png");
          console.log (dataUrl);
          }

        this.simulate = false;
        
        this.showAxis = false;
        
        this.showSonarDetection = false;
    }
    
    var gui = new dat.GUI();
    
    function addRobotsToGui( simulator, gui ) {
        console.log ( 'adding robots...' );
        $.each ( gui.userData.managersSubfolders, function ( index, manager ) {
            
            $.each ( manager.userData.robotsManager.robots, function ( index, robot ) {
                var property = 'buildRobot: '+robot.id;
                controls[property] = function () {
                    robot.build();
                                
                    if ( typeof robot.initialValues !== 'undefined' ) {
                        if ( typeof robot.initialValues.position !== 'undefined' ) {
                            robot.move ( robot.initialValues.position, false );
                        }
                    }
                    
                }
                manager.add(controls, property);
                if ( robot.hasController() ) {
                    property = 'controller: ' + robot.id;
                    controls[property] = function () {
                        window.open(robot.controllerUrl, '', 'width=200, height=400');
                    }
                    manager.add(controls, property);
                }
                
            });
        });
    }
    
    gui.userData = {
        controls: controls,
    };
    
    var camera = gui.addFolder("Camera");
    
    camera.add(controls, 'camPositionX', -300, 300).onChange(controls.changeCamera);
    camera.add(controls, 'camPositionY', 0, 300).onChange(controls.changeCamera);
    camera.add(controls, 'camPositionZ', -300, 300).onChange(controls.changeCamera);
    camera.add(controls, 'camFov', 1, 100).onChange(controls.changeCamera);
    camera.add(controls, 'camLookAtX', -300, 300).onChange(controls.changeCamera);
    camera.add(controls, 'camLookAtY', -300, 300).onChange(controls.changeCamera);
    camera.add(controls, 'camLookAtZ', -300, 300).onChange(controls.changeCamera);
    /*
    camera.add(controls, 'camRotationX', -Math.PI, Math.PI).step(.05).onChange(controls.changeCamera);
    camera.add(controls, 'camRotationY', -Math.PI, Math.PI).step(.05).onChange(controls.changeCamera);
    camera.add(controls, 'camRotationZ', -Math.PI, Math.PI).step(.05).onChange(controls.changeCamera);
    */
    
    var light = gui.addFolder("Light");
    light.add(controls, 'lightPositionX', -300, 300).onChange(controls.changeLight);
    light.add(controls, 'lightPositionY', 0, 300).onChange(controls.changeLight);
    light.add(controls, 'lightPositionZ', -300, 300).onChange(controls.changeLight);
    light.add(controls, 'lightIntensity', 0, 4).onChange(controls.changeLight);

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
    
//    gui.add(controls, 'openController');
    gui.add(controls, 'useMainCamera');
    gui.add(controls, 'useRobotCamera');
    gui.add(controls, 'takeScreenshot');
    
    var debug = gui.addFolder("Debug");
    debug.add(controls, 'simulate');
    debug.add(controls, 'showAxis');
    debug.add(controls, 'showSonarDetection');
    debug.open();
    
    
    console.log ( "adding actual robots..." );
    setTimeout ( addRobotsToGui, 5000, simulator, gui );
    
    console.log(gui.userData);
    return gui;
};
