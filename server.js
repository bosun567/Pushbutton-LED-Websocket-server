//require http server, and create server with function handler()
var http = require('http').createServer(handler); 
var fs = require('fs'); //require filesystem module
//require socket.io module and pass the http object (server)
var io = require('socket.io')(http) 
//include onoff to interact with the GPIO
var Gpio = require('onoff').Gpio; 
//use GPIO pin 4 as output
var LED = new Gpio(4, 'out'); 
//use GPIO pin 17 as input, and 'both' button presses, 
//and releases should be handled
var pushButton = new Gpio(17, 'in', 'both'); 

http.listen(8080); //listen to port 8080

function handler (req, res) { //create server
  //read file index.html in public folder
  fs.readFile(__dirname + '/public/index.html', function(err, data) { 
    if (err) {
      //display 404 on error
      res.writeHead(404, {'Content-Type': 'text/html'}); 
      return res.end("404 Not Found");
    } 
    res.writeHead(200, {'Content-Type': 'text/html'}); //write HTML
    res.write(data); //write data from index.html
    return res.end();
  });
}

// WebSocket Connection
io.sockets.on('connection', function (socket) {
  // WebSocket Connection
  var lightvalue = 0; //static variable for current status
  //Watch for hardware interrupts on pushButton
  pushButton.watch(function (err, value) { 
    if (err) { //if an error
      //output error message to console
      console.error('There was an error', err); 
      return;
    }
    lightvalue = value;
    //send breadboard button status to client (i.e., the browser)
    socket.emit('light', lightvalue); 
  });
  // get light switch status from client (i.e., the browser)
  socket.on('light', function(data) { 
    lightvalue = data;
    //only change LED if status has changed
    if (lightvalue != LED.readSync()) { 
      LED.writeSync(lightvalue); //turn LED on or off
    }
  });
});

process.on('SIGINT', function () { //on ctrl+c
  LED.writeSync(0); // Turn LED off
  LED.unexport(); // Unexport LED GPIO to free resources
  pushButton.unexport(); // Unexport Button GPIO to free resources
  process.exit(); //exit completely
});
