//var host = '127.0.0.1:9080';
var host = '192.168.1.12:9080';

var simulationDefaults = {
    stats: {
        mode: 0 // 0: fps, 1: ms, 2: mb (see http://github.com/mrdoob/stats.js)
        },
    robotsManagers: {
        main: {
            url: "http://" + host + "/update",
            failureColor: 0xffaaaa,
            robots: [
                { 
                    id: 'green',
                    name: "First",
                    owner: 'Player One',
                    class: 'ThreeWheelDistanceSensingRobotRepresentation',
                    controllerUrl: '../remote-controls/infrared.html?server=http://' + host + '/update&codes=nexPRO&color=00bb00&posX=10&posY=280',
                    initialValues: {
                        position: new THREE.Vector3 ( 0, 3.5, 0 ),
                        chassis: {
                            color: 0x00bb00
                        },
                        debugging: true
                    }
                },
                {
                    id: 'red',
                    name: "Second",
                    owner: 'Player Two',
                    class: 'ThreeWheelDistanceSensingRobotRepresentation',
                    controllerUrl: '../remote-controls/infrared.html?server=http://' + host + '/update&codes=nexPRO&color=bb0000&posX=150&posY=280',
                    initialValues: {
                        position: new THREE.Vector3 ( 30, 3.5, 30 ),
                        chassis: {
                            color: 0xbb0000
                        },
                        debugging: false
                    }
                }/*,
                {
                    id: 'blue',
                    name: "Third",
                    owner: 'Player Three',
                    class: 'ThreeWheelDistanceSensingRobotRepresentation',
                    controllerUrl: '../remote-controls/infrared.html?server=http://' + host + '/update&codes=nexPRO&color=0000ff',
                    initialValues: {
                        position: new THREE.Vector3 ( 70, 3.5, 10 ),
                        chassis: {
                            color: 0x0000ff
                        }
                    }
                }/*,
                {
                    id: 'yellow',
                    name: "Fourth",
                    owner: 'Player Four',
                    class: 'ThreeWheelDistanceSensingRobotRepresentation',
                    controllerUrl: '../remote-controls/infrared.html?server=http://' + host + '/update&codes=nexPRO&color=ffff00',
                    initialValues: {
                        position: new THREE.Vector3 ( 70, 3.5, 40 ),
                        chassis: {
                            color: 0xffff00
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
                    class: 'ThreeWheelDistanceSensingRobotRepresentation',
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
    renderer: {
        antialias: true,
        backgroundColor: 0xfac94e,
        shadows: false, 
    },
    mainCamera: {
        fov: 60,
        aspect: window.innerWidth / window.innerHeight,
        near: 1,
        far: 1000,
        position: new THREE.Vector3 ( 0, 150, 100 ),
        lookAt: new THREE.Vector3( 0, 0, 0 )
    },
    light: {
        color: 0xFFFFFF,
        intensity: 2,
        position: new THREE.Vector3( 25, 250, 80 ),
        near: 11,
        far: 600
    },
    axisHelper: {
        visible: true,
        length: 10
    },
    ground: {
        texture: 'assets/textures/general/floor-wood-256.png',
        friction: 1.0,
        restitution: 0.1,
        pieces: {
            bottom: {
                sizeX: 256,
                sizeY: 2,
                sizeZ: 256,
                position: new THREE.Vector3( 0, -1, 0 )
            },
            leftBorder: {
                sizeX: 4,
                sizeY: 4,
                sizeZ: 256,
                position: new THREE.Vector3( -130, 2, 0 ),
                color: 0xE8AE8A
            },
            rightBorder: {
                sizeX: 4,
                sizeY: 4,
                sizeZ: 256,
                position: new THREE.Vector3( 130, 2, 0 ),
                color: 0xE8AE8A
            },
            topBorder: {
                sizeX: 264,
                sizeY: 4,
                sizeZ: 4,
                position: new THREE.Vector3( 0, 2, -130 ),
                color: 0xE8AE8A
            },
            bottomBorder: {
                sizeX: 264,
                sizeY: 4,
                sizeZ: 4,
                position: new THREE.Vector3( 0, 2, 130 ),
                color: 0xE8AE8A
            },/*
            wall_1: {  
                sizeX: 160,
                sizeY: 16,
                sizeZ: 4,
                position: new THREE.Vector3( 2, 8, -80 ),
                color: 0xADD8E6,
                // rotation: new THREE.Vector3( 0, Math.PI / 10, 0 )
            },
            wall_2: {
                sizeX: 4,
                sizeY: 16,
                sizeZ: 160,
                position: new THREE.Vector3( -80, 8, -2 ), 
                color: 0xFCB6FC,
                opacity: 0.4,
                mass: 100
            },
            wall_3: {
                sizeX: 4,
                sizeY: 16,
                sizeZ: 160,
                position: new THREE.Vector3( 80, 8, 2 ), 
                color: 0xD5FDD5,
                opacity: 0.4
            },
            wall_4: {
                sizeX: 160,
                sizeY: 16,
                sizeZ: 4,
                position: new THREE.Vector3( -2, 8, 80 ), 
                color: 0xFFD891,
                opacity: 0.4
            }*/
        }
    }
    
}

