var host = '192.168.1.12:9080';

var simulationDefaults = {
    robotsManagers: {
        main: {
            url: "http://" + host + "/update",
            robots: [
                { 
                    id: 'one',
                    name: "First",
                    owner: 'Player One',
                    class: 'ThreeWheelDistanceSensingRobot',
                    controllerUrl: '../controllers/robot.html?server=http://' + host + '/update',
                    initialValues: {
                        position: new THREE.Vector3 ( -20, 5, 10 ),
                        chassis: {
                            color: 0x008000
                        }
                    }
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
        }/*,
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
        }*/
    },
    
    scene: {
        gravity: new THREE.Vector3(0, -30, 0),
    },
    mainCamera: {
        fov: 16,
        aspect: window.innerWidth / window.innerHeight,
        near: 1,
        far: 1000,
//        position: new THREE.Vector3 ( 43, 120, 164 ),
        position: new THREE.Vector3 ( 129, 115, 50 ),
        lookAt: new THREE.Vector3( 0, 0, 0 )
    },
    light: {
        color: 0xFFFFFF,
        intensity: 2,
        position: new THREE.Vector3( 24, 150, 80 ),
        near: 11,
        far: 600
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
                sizeX: 240,
                sizeY: 2,
                sizeZ: 240,
                position: new THREE.Vector3( 0, -1, 0 )
            },
            leftBorder: {
                sizeX: 4,
                sizeY: 4,
                sizeZ: 240,
                position: new THREE.Vector3( -122, 2, 0 )
            },
            rightBorder: {
                sizeX: 4,
                sizeY: 4,
                sizeZ: 240,
                position: new THREE.Vector3( 122, 2, 0 )
            },
            topBorder: {
                sizeX: 248,
                sizeY: 4,
                sizeZ: 4,
                position: new THREE.Vector3( 0, 2, -122 )
            },
            bottomBorder: {
                sizeX: 248,
                sizeY: 4,
                sizeZ: 4,
                position: new THREE.Vector3( 0, 2, 122 )
            },
            wall_1: {  
                sizeX: 80,
                sizeY: 16,
                sizeZ: 4,
                position: new THREE.Vector3( 2, 8, -40 ),
                color: 0xADD8E6 /*,
                rotation: new THREE.Vector3( 0, Math.PI / 10, 0 )*/
            },
            wall_2: {
                sizeX: 4,
                sizeY: 16,
                sizeZ: 80,
                position: new THREE.Vector3( -40, 8, -2 ), 
                color: 0xFCB6FC,
                opacity: 0.4,
                mass: 100
            },
            wall_3: {
                sizeX: 4,
                sizeY: 16,
                sizeZ: 80,
                position: new THREE.Vector3( 40, 8, 2 ), 
                color: 0xD5FDD5,
                opacity: 0.4
            }/*,
            wall_4: {
                sizeX: 80,
                sizeY: 16,
                sizeZ: 4,
                position: new THREE.Vector3( -2, 8, 40 ), 
                color: 0xFFD891,
                opacity: 0.4
            }*/
        }
    }
    
}

