var http = require('http');
var request = require('request');

var sensors = { leftEngine: 0, rightEngine: 0, sonar: 0, orientation: 0 };
var actuators = { leftEngine: 0, rightEngine: 0, led: 0, sonarDebug: 8888, orientationDebug: 0 };

var mainServer = http.createServer(function (request, response) {

  if (request.url == '/update')
  {
     var content = '';
     request.on('data', function (data) {
       content += data;
      });
     request.on('end', function () {
       var values = JSON.parse( content );

       /*
       console.log("MAIN - values received: ");
       console.log(values);
       */
       for (var attrname in values) {
          sensors[attrname] = values[attrname];
          }
       
       /*  
       console.log("updated sensors: ");
       console.log(sensors);
       */
       
       actuators.leftEngine = sensors.leftEngine;
       actuators.rightEngine = sensors.rightEngine;
       actuators.sonarDebug = sensors.sonar;
       if (sensors.sonar < 20)
       {
          actuators.led = 1;
       }
       else
       {
          actuators.led = 0;
       }

       if (sensors.sonar < 10)
       {
         if (actuators.leftEngine > 0)
         {
            actuators.leftEngine = 0;
         }
         if (actuators.rightEngine > 0)
         {
            actuators.rightEngine = 0;
         }
       }
       
       actuators.orientationDebug = sensors.orientation;
       
       response.writeHead(200, { 'content-type': 'text/json', 'Access-Control-Allow-Origin': '*' });
       
       var text = JSON.stringify(actuators);
       
       response.write(text);
       response.end();
     })
  }

});

mainServer.listen(9080);

var timer;

var initialOrientation;
var finalOrientation;
var settings = { leftEngine: 0, rightEngine: 0 };

var initialTime;

function callAndCheck(command, settings, originalResponse)
{
  
  console.log("command: " + command);
  console.log("data to send - 1");
  console.log(settings)
  var post_data = JSON.stringify(settings);
  console.log("data to send - 2");
  console.log(post_data);
  
  request({
      url: 'http://127.0.0.1:9080/update',
      method: "POST",
      json: false,   // <--Very important!!!  // FIXME This must be checked...
      body: post_data
  }, function (error, response, body){
      //console.log("error");
      //console.log(error);
      //console.log(response);
      var values = body;
      //console.log("values received");
      console.log(values);
      v = JSON.parse(values);
      // console.log(v.orientationDebug);
      // var difference = Math.abs(v.orientationDebug - finalOrientation);
      //console.log("difference: " + difference);
      if (command == '/turnLeft')
      {
        if (v.orientationDebug < 0) v.orientationDebug += 360;
        if (Math.abs(v.orientationDebug - finalOrientation) <= 30)
        {
            console.log("This is completed...");
            originalResponse.end();  // rispondiamo all'altro...
            timer = null;
        }
      }
      else if (command == '/pause')
      {
        var t = new Date();
        
        if ((t.getTime() - initialTime.getTime()) >= 5000)
        {
            console.log("This is completed...");
            originalResponse.end();  // rispondiamo all'altro...
            timer = null;
        }
      }
      
  });


}

function waitForExecutionAndConfirm(command, response)
{
  initialOrientation = actuators.orientationDebug;
  initialTime = new Date();
  if (command == '/turnLeft') {
      finalOrientation = initialOrientation + 90;
      settings.leftEngine = -2.45;
      settings.rightEngine = 2.45;
  }
  else if (command == '/pause') {
      settings.leftEngine = 0;
      settings.rightEngine = 0;
  }
  console.log("setting timer...");
  timer = setInterval (callAndCheck, 1000, command, settings, response);
}


var robotServer = http.createServer(function (request, response) {

  //console.log("called, url=" + request.url);
  request.on('data', function (data) {
      //console.log(data);
    });
  request.on('end', function () {
    
    if (request.url == '/turnLeft')
    {
      response.writeHead(200, { 'content-type': 'text/plain' });
      response.write('OK, execution of ' + request.url + ' started... ');
      waitForExecutionAndConfirm('/turnLeft', response);
    }
    else if (request.url == '/pause')
    {
      response.writeHead(200, { 'content-type': 'text/plain' });
      response.write('OK, execution of ' + request.url + ' started... ');
      waitForExecutionAndConfirm('/pause', response);
    }
    else
    {
      response.writeHead(404, { 'content-type': 'text/plain' });
      response.write('Unrecognized command');
      response.end();
    }
    })
  });

robotServer.listen(9001);
