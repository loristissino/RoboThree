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
the simulated robot, which is implemented as a Node.js command line application.

In this request, the world sends a JSON-formatted array of data (for instance,
the values of the sensors) and the robot sends a JSON-formatted array of
other data (basically, the values of the actuators).

## Installation

Not yet, sorry.

## Credits

Libraries:

* [Three.js](http://threejs.org/)
* [Physijs](http://chandlerprall.github.io/Physijs/)
* [Node.js](https://nodejs.org/en/)
* [dat.GUI](https://code.google.com/p/dat-gui/)

Pictures and textures:

* [Texturex](http://www.texturex.com/)

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

* Release 0.20 (Decembre 31th, 2015): some enhancements of different kinds: added sonars and leds.

