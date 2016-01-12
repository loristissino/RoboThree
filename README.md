# RoboThree

A lightweight simulation environment for robots

## Introduction

_RoboThree_ aims to be a very simple 3D simulation environment for robots.

## Architecture

Basically, there is a world where robots can move. The world is represented
and managed by a Three.js web application, with an underlying Physi.js 
physics simulation engine.

Outside, there are some robots' managers, and each of them manages one or more
robots.

At each frame, the world makes an HTTP post request to each of the managers, 
which is implemented as a Node.js command line application.

In this request, the world sends a JSON-formatted array of data containing
information needed by the managed robots, and the manager sends a 
JSON-formatted array of data containing information needed to implement
the required behaviours.

## Installation

### Files

There are two main directories:

* `servers` (containing the code of the robots' managers and the code for the behaviors of robots);
* `user-agents` (containing the code meant to be used with a browser, like the simulation environment, the simulated infrared remote controls, etc.).

The application is meant to be a playground. This is why there is a separate directory, `examples`, containing configuration files, robots' sample behaviors and representations, etc. The `examples` directory contains two subdirectories, `servers` and `user-agents`, having the same structure of the main ones.

In order to let you play with the code and run your own experiments without risking of having your code
overwritten with git updates, copy the examples in the main directories, following the directory structure.
The simulated infrared remote controls need their own jQuery script and you should copy it from the directory `user-agents/world/libs/vendor/`.

You can get the whole job easily done with:

    cd examples
    for file in $(find . -type f); do cp -v  "$file" "../$file"; done
    cd ..
    cp -v user-agents/world/libs/vendor/jquery-2.1.4.min.js user-agents/remote-controls/
    

You should get something like this:

    servers/
    └── node
        ├── behaviors
        │   ├── node_modules
        │   │   └── HC-SR04.js
        │   └── ThreeWheelDistanceSensingRobotBehavior.js
        ├── managers
        │   ├── node_modules
        │   │   └── EspruinoSimulator.js
        │   └── simplemanager.js
        └── virtualizers
            ├── node_modules
            └── ThreeWheelDistanceSensingRobotVirtualizer.js
    user-agents/
    ├── remote-controls
    │   ├── codes
    │   │   └── nexPRO.json
    │   ├── infrared.html
    │   ├── jquery-2.1.4.min.js
    │   └── parseUri.js
    └── world
        ├── assets
        │   └── textures
        │       ├── general
        │       │   └── floor-wood.jpg
        │       └── robot
        │           └── wheel.png
        ├── config
        │   ├── defaults.js
        │   └── gui.js
        ├── libs
        │   ├── robothree
        │   │   └── robothree.js
        │   └── vendor
        │       ├── ammo.js
        │       ├── chroma.js
        │       ├── dat.gui.js
        │       ├── jquery-2.1.4.min.js
        │       ├── physi.js
        │       ├── physijs_worker.js
        │       ├── stats.min.js
        │       ├── ThreeBSP.js
        │       └── three.min.js
        ├── representations
        │   └── ThreeWheelDistanceSensingRobotRepresentation.js
        └── world.html

The file `world/config/defaults.js` is the place where you can tweak the main configuration of the simulation environment. Edit it at will, but pay attention to IP addresses and port numbers in order to let them match your servers.

### Running the robot's managers

You need a working version of *node* and *npm*.

To run the servers, you will need the `request` module, that you can obtain by typing

    npm install request -g

(you might need to prepend this command with `sudo`).

Go to the `servers/node/managers` and run the following command:

    node simplemanager.js

You should get an output like:

    Activated robot: «green»
    Activated robot: «red»
    Listening on port 9080

You can use a different port, just adding the number as first parameter:

    node simplemanager.js 10080

### Opening the simulation

The files of the directory `user-agents` must be served by a webserver. If you have one, configure it so that it offers the files. Otherwise, you can use a light webserver like [https://www.npmjs.com/package/http-server](node http-server). For instance, run

    cd user-agents
    http-server

On my computer, I get

    Starting up http-server, serving ./
    Available on:
      http:127.0.0.1:8081
      http:192.168.1.12:8081
    Hit CTRL-C to stop the server

Open your browser and point it to the `/world/world.html` resource.

You should be able to add meshes and robots, to open the simulated infrared remote controls, etc. Just remember that you should activate the simulation to see it action.

## Credits

Libraries:

* [Three.js](http://threejs.org/)
* [Physijs](http://chandlerprall.github.io/Physijs/)
* [Node.js](https://nodejs.org/en/)
* [dat.GUI](https://code.google.com/p/dat-gui/)
* [stats.js](http://github.com/mrdoob/stats.js)
* [ThreeBSP](https://github.com/sshirokov/ThreeBSP)
* [ammo.js](https://github.com/kripken/ammo.js/)
* [parseUri](http://blog.stevenlevithan.com/archives/parseuri)

## Reference books and web sites

* Jos Dirksen, [Learning Three.js – the JavaScript 3D Library for WebGL - Second Edition](https://www.packtpub.com/web-development/learning-threejs-javascript-3d-library-webgl-second-edition)
* [Stemkoski's Examples](http://stemkoski.github.io/Three.js/)
* [LearningThreejs.com](http://learningthreejs.com/)
* [dat.GUI Tutorial](http://workshop.chromeexperiments.com/examples/gui/#1--Basic-Usage)

## Alternatives

RoboThree aims to be lightweight and very simple in its implementation. If you are interested in something
more realistic (and more complex) you could try:

* [Autonomous Robot Simulator](http://sourceforge.net/projects/arsproject/)
* [Gazebo](http://gazebosim.org/)
* [v-rep](http://www.coppeliarobotics.com/downloads.html)

## History

* Release 0.01 (December 2nd, 2015): little more than a proof-of-concept.

* Release 0.10 (December 20th, 2015): first big refactoring, with more structured object oriented patterns.

* Release 0.20 (December 31th, 2015): some enhancements of different kinds: added sonars and leds.

* Release 0.21 (January 1st, 2016): bug fix (sonars' vertical variants).

* Release 0.30 (January 11th, 2016): second big refactoring.

* Release 0.31 (January 12th, 2016): added some documentation.

* Release 0.40 (January 12th, 2016): fixed some bugs in documentation, renamed some files, added comments in the code.
