# RoboThree

A lightweight simulation environment for robots

## Introduction

_RoboThree_ aims to be a very simple 3D simulation environment for robots.

It is JavaScript-based. The client side (the simulation environment) is implemented using *jQuery*, *Three.js* and other useful libraries (see Credits, below).
The server side (robots' behaviors) is implemented using *node.js* and emulating an [Espruino board](http://www.espruino.com/). Nothing prevents from implementing the server side in other programming languages, as long as they can read and write data in JSON format and manage a very simple HTTP server.

Simulated robots can have virtual devices (like onboard cameras, a compass, etc.) and can be programmed at low or high level.

## Setup

Info on the [wiki page](https://github.com/loristissino/RoboThree/wiki/Setup).

## Credits

Libraries:

* DOM manipulation: [jQuery](https://jquery.com/)
* 3D graphics: [Three.js](http://threejs.org/), [ThreeBSP](https://github.com/sshirokov/ThreeBSP)
* Physics engine: [Physijs](http://chandlerprall.github.io/Physijs/), [ammo.js](https://github.com/kripken/ammo.js/), [Bullet Physics](http://www.bulletphysics.org/)
* Server-side work: [Node.js](https://nodejs.org/en/)
* User Interface: [dat.GUI](https://code.google.com/p/dat-gui/)
* Utilities: [stats.js](http://github.com/mrdoob/stats.js), [parseUri](http://blog.stevenlevithan.com/archives/parseuri)

Node modules:

* [http](https://www.npmjs.com/package/http)
* [extend](https://www.npmjs.com/package/extend)

## Reference books and web sites

* Jos Dirksen, [Learning Three.js – the JavaScript 3D Library for WebGL - Second Edition](https://www.packtpub.com/web-development/learning-threejs-javascript-3d-library-webgl-second-edition)
* [Stemkoski's Examples](http://stemkoski.github.io/Three.js/)
* [LearningThreejs.com](http://learningthreejs.com/)
* [dat.GUI Tutorial](http://workshop.chromeexperiments.com/examples/gui/#1--Basic-Usage)
* [Espruino distance sensing robot](http://www.espruino.com/distance_sensing_robot)

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

* Release 0.41 (January 13th, 2016): added wiki pages to the web site.

* Release 0.50 (January 21st, 2016): added RobotCommander

* Release 0.51 (January 24th, 2016): fixed some little UI problems

* Release 0.60 (February 3rd, 2016): added buzzer and some enhacements

* Release 0.61 (February 6th, 2016): minor code enhancements
