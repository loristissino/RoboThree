# RoboThree

A lightweight simulation environment for robots

## Introduction

_RoboThree_ aims to be a very simple 3D simulation environment for robots.

## Architecture

Basically, there is a world where robots can move. The world is represented
and managed by a Three.js web application, with an underlying Physi.js 
physics simulation engine.

At each frame, the world makes an HTTP post request to the simulated robot,
which is implemented as a Node.js command line application.

In this request, the world sends a JSON-formatted array of data (for instance,
the values of the sensors) and the robot sends a JSON-formatted array of
other data (basically, the values of the actuators).

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

## History

Release 0.01: little more than a proof-of-concept.
