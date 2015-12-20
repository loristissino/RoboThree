var simulationDefaults = {
    robotsManagers: {
        main: {
            url: "http://127.0.0.1:9080/update",
            robots: [
                { 
                    id: 'one',
                    name: "First",
                    owner: 'Player One',
                    class: 'ThreeWheelDistanceSensingRobot',
                    controllerUrl: '../controllers/robot.html',
                }/*,
                {
                    id: 'two',
                    name: "Second",
                    owner: 'Player Two',
                    class: 'ThreeWheelDistanceSensingRobot',
                    initialValues: {
                        position: new THREE.Vector3 ( 30, 4, 30 ),
                        chassis: {
                            color: 0x008000
                        }
                    }
                }*/
            ]
        },
        alternative: {
            url: "http://127.0.0.1:9080/update",
            robots: [
                {
                    id: 'three', 
                    name: "Third",
                    owner: 'Player Three', 
                    class: 'ThreeWheelDistanceSensingRobot',
                    initialValues: {
                        position: new THREE.Vector3 ( 30, 5, 40 ),
                        chassis: {
                            color: 0x000080
                        }
                    }
                }
            ]
        }
    },
    
    scene: {
        gravity: new THREE.Vector3(0, -30, 0),
    },
    mainCamera: {
        fov: 35,
        aspect: window.innerWidth / window.innerHeight,
        near: 1,
        far: 1000,
        position: new THREE.Vector3 ( 43, 120, 164 ),
        lookAt: new THREE.Vector3(0, 0, 0)
    },
    light: {
        color: 0xFFFFFF,
        intensity: 2,
        position: new THREE.Vector3(24, 70, 80),
        near: 11,
        far: 400
    },
    axisHelper: {
        visible: true,
        length: 10
    },
    ground: {
        texture: 'assets/textures/general/floor-wood.jpg',
        friction: 1.0,
        restitution: 0.1,
        pieces: {
            bottom: {
                sizeX: 120,
                sizeY: 2,
                sizeZ: 120,
                position: new THREE.Vector3( 0, -1, 0 )
            },
            leftBorder: {
                sizeX: 4,
                sizeY: 4,
                sizeZ: 120,
                position: new THREE.Vector3( -62, 2, 0 )
            },
            rightBorder: {
                sizeX: 4,
                sizeY: 4,
                sizeZ: 120,
                position: new THREE.Vector3( 62, 2, 0 )
            },
            topBorder: {
                sizeX: 128,
                sizeY: 4,
                sizeZ: 4,
                position: new THREE.Vector3( 0, 2, -62 )
            },
            bottomBorder: {
                sizeX: 128,
                sizeY: 4,
                sizeZ: 4,
                position: new THREE.Vector3( 0, 2, 62 )
            },
            wall_1: {
                sizeX: 60,
                sizeY: 30,
                sizeZ: 2,
                position: new THREE.Vector3( -10, 15, -35 ),
                color: 0xff0ff0,
                rotation: new THREE.Vector3( 0, Math.PI / 10, 0 )
            },
            wall_2: {
                sizeX: 4,
                sizeY: 30,
                sizeZ: 40,
                position: new THREE.Vector3( -40, 15, 0 ),
                color: 0xffff00,
                opacity: 0.4
            }
        }
    }
    
}

