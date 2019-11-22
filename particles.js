"use strict";
const anglePoints = 10;
const angle = 370;

const heightTopCup = 90;
const heightBottomCup = -100;
const radiousCup = 50;

var bubbleData;
var noParticles = 100;
function radian (degree) {
  var rad = degree * (Math.PI / 180);
  return rad;
}

function main() {
  // Get A WebGL context
  /** @type {HTMLCanvasElement} */
  var canvas = document.getElementById("glcanvas");
  var gl = canvas.getContext("webgl");
  if (!gl) {
    return;
  }

  // setup GLSL program
  var program = webglUtils.createProgramFromScripts(gl, ["3d-vertex-shader", "3d-fragment-shader"]);

  // look up where the vertex data needs to go.
  var positionLocation = gl.getAttribLocation(program, "a_position");
  var colorLocation = gl.getAttribLocation(program, "a_color");

  // lookup uniforms
  var matrixLocation = gl.getUniformLocation(program, "u_matrix");


  //BUBBLES----------------------------------------------------------------------------------------------

  bubbleData = new Array(noParticles);

  var show = true;

  for(var i = 0; i<noParticles; i++){
    bubbleData[i] = {};

    var r = (radiousCup-radiusBubble) * Math.sqrt(Math.random())
    var theta = Math.random() * 2 * Math.PI
    var centerX = r * Math.sin(theta)
    var centerZ = r * Math.cos(theta)

    var placeInGlass  =Math.sqrt(centerX*centerX + centerZ*centerZ);
    var radiusBubble = 2;

    if(placeInGlass < radiousCup/4){
      radiusBubble = 0.5;
    }else if(placeInGlass < (radiousCup*(3/4))){
      radiusBubble = 1;
    }
    // Create a buffer to put positions in
    bubbleData[i]["PositionBuffer"] = gl.createBuffer();
    // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = bubblePositionBuffer)
    gl.bindBuffer(gl.ARRAY_BUFFER, bubbleData[i]["PositionBuffer"]);

    var bubblePoints = createCirclePoints({x: centerX, y: heightBottomCup + radiusBubble, z:centerZ-360}, radiusBubble, 0, 0, 0, {x: 0, y:100, z:200});+

    // Put geometry data into buffer
    setBubbleGeometry(gl, bubblePoints);

    // Create a buffer to put colors in
    bubbleData[i]["ColourBuffer"] = gl.createBuffer();
    // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = colorBuffer)
    gl.bindBuffer(gl.ARRAY_BUFFER, bubbleData[i]["ColourBuffer"]);
    // Put geometry data into buffer
    setBubbleColors(gl, bubblePoints);

    bubbleData[i]["locations"] = [centerX, centerZ];
  }

  //CUP---------------------------------------------------------------------------------------------------

  var cupsInfo = new Array(2);


  cupsInfo[1] = {};

  // Create a buffer to put positions in
  cupsInfo[1]['posbuf'] = gl.createBuffer();
  // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = bubblePositionBuffer)
  gl.bindBuffer(gl.ARRAY_BUFFER, cupsInfo[1]['posbuf']);

  var cupBigPoints = createCupPoints(radiousCup+10, heightTopCup+20, heightBottomCup-10, [200,200,200]);

  // Put geometry data into buffer
  setCupGeometry(gl, cupBigPoints);


  // Create a buffer to put colors in
  cupsInfo[1]['colbuf'] = gl.createBuffer();
  // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = colorBuffer)
  gl.bindBuffer(gl.ARRAY_BUFFER, cupsInfo[1]['colbuf']);
  // Put geometry data into buffer
  setCupColors(gl, cupBigPoints);

  cupsInfo[0] = {};

  // Create a buffer to put positions in
  cupsInfo[0]['posbuf'] = gl.createBuffer();
  // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = bubblePositionBuffer)
  gl.bindBuffer(gl.ARRAY_BUFFER, cupsInfo[0]['posbuf']);

  var cupPoints = createCupPoints(radiousCup, heightTopCup, heightBottomCup, [0,100,200]);

  // Put geometry data into buffer
  setCupGeometry(gl, cupPoints);

  // Create a buffer to put colors in
  cupsInfo[0]['colbuf'] = gl.createBuffer();
  // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = colorBuffer)
  gl.bindBuffer(gl.ARRAY_BUFFER, cupsInfo[0]['colbuf']);
  // Put geometry data into buffer
  setCupColors(gl, cupPoints);


  function radToDeg(r) {
    return r * 180 / Math.PI;
  }

  function degToRad(d) {
    return d * Math.PI / 180;
  }

  var translation = [10, 0, 0];
  var rotation = [degToRad(190), degToRad(40), degToRad(320)];
  var fieldOfViewRadians = degToRad(60);
  var rotationSpeed = 0.7;

  drawScene();

  var howMany = noParticles/8;
  var counter = 0;
  // Draw the scene.
  function drawScene() {

    webglUtils.resizeCanvasToDisplaySize(gl.canvas);

    // Tell WebGL how to convert from clip space to pixels
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.clearColor(0.0, 0.0, 0.0, 0.9);  // Clear to black, fully opaque

    // Clear the canvas AND the depth buffer.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Turn on culling. By default backfacing triangles
    // will be culled.
    gl.enable(gl.CULL_FACE);

    // Enable the depth buffer
    gl.enable(gl.DEPTH_TEST);

    // Tell it to use our program (pair of shaders)
    gl.useProgram(program);


    cupShape(cupsInfo[1]);
    cupShape(cupsInfo[0]);

    translation[0] = translation[0] + rotationSpeed
    if(translation[0] > heightTopCup-radiusBubble){
      translation[0] = heightBottomCup + radiusBubble;
    }

    for(var i = 0; i<howMany; i++){
      animationCircle(bubbleData[i], bubbleData[i]["PositionBuffer"], bubbleData[i]["ColourBuffer"]);
    }

    counter++;
    if(counter == 50 && howMany< noParticles){
      howMany += noParticles/20;
      if(howMany>noParticles){
        howMany = noParticles-1;
      }
      counter = 0;
    }
    // Call drawScene again next frame
    requestAnimationFrame(drawScene);
  }

  function animationCircle(data, bubblePositionBuffer, colorBubbleBuffer){

    data["locations"][1] = data["locations"][1] + rotationSpeed
    if( data["locations"][1] > (heightTopCup-radiusBubble)*2){
      data["locations"][1] = 0;
    }

    // Turn on the position attribute
    gl.enableVertexAttribArray(positionLocation);

    // Bind the position buffer.
    gl.bindBuffer(gl.ARRAY_BUFFER, bubblePositionBuffer);

    // Tell the position attribute how to get data out of bubblePositionBuffer (ARRAY_BUFFER)
    var size = 3;          // 3 components per iteration
    var type = gl.FLOAT;   // the data is 32bit floats
    var normalize = false; // don't normalize the data
    var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
    var offset = 0;        // start at the beginning of the buffer
    gl.vertexAttribPointer(
        positionLocation, size, type, normalize, stride, offset);

    // Turn on the color attribute
    gl.enableVertexAttribArray(colorLocation);

    // Bind the color buffer.
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBubbleBuffer);

    // Tell the attribute how to get data out of colorBubbleBuffer (ARRAY_BUFFER)
    var size = 3;                 // 3 components per iteration
    var type = gl.UNSIGNED_BYTE;  // the data is 8bit unsigned values
    var normalize = true;         // normalize the data (convert from 0-255 to 0-1)
    var stride = 0;               // 0 = move forward size * sizeof(type) each iteration to get the next position
    var offset = 0;               // start at the beginning of the buffer
    gl.vertexAttribPointer(
        colorLocation, size, type, normalize, stride, offset);

    // Compute the matrices
    var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    var matrix = m4.perspective(fieldOfViewRadians, aspect, 1, 2000);
    
    matrix = m4.translate(matrix, translation[1],  data["locations"][1], translation[2]);
    gl.uniformMatrix4fv(matrixLocation, false, matrix);

    

    // Draw the geometry.
    var primitiveType = gl.LINES;
    var offset = 0;
    var count = (angle/anglePoints) *2;
    gl.drawArrays(primitiveType, offset, count);
  }


  function cupShape(cups){

    // Turn on the position attribute
    gl.enableVertexAttribArray(positionLocation);

    // Bind the position buffer.
    gl.bindBuffer(gl.ARRAY_BUFFER, cups['posbuf']);

    // Tell the position attribute how to get data out of bubblePositionBuffer (ARRAY_BUFFER)
    var size = 3;          // 3 components per iteration
    var type = gl.FLOAT;   // the data is 32bit floats
    var normalize = false; // don't normalize the data
    var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
    var offset = 0;        // start at the beginning of the buffer
    gl.vertexAttribPointer(
        positionLocation, size, type, normalize, stride, offset);

    // Turn on the color attribute
    gl.enableVertexAttribArray(colorLocation);

    // Bind the color buffer.
    gl.bindBuffer(gl.ARRAY_BUFFER, cups['colbuf']);

    // Tell the attribute how to get data out of colorBubbleBuffer (ARRAY_BUFFER)
    var size = 3;                 // 3 components per iteration
    var type = gl.UNSIGNED_BYTE;  // the data is 8bit unsigned values
    var normalize = true;         // normalize the data (convert from 0-255 to 0-1)
    var stride = 0;               // 0 = move forward size * sizeof(type) each iteration to get the next position
    var offset = 0;               // start at the beginning of the buffer
    gl.vertexAttribPointer(
        colorLocation, size, type, normalize, stride, offset);

    // Compute the matrices
    var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    var matrix = m4.perspective(fieldOfViewRadians, aspect, 1, 2000);
    matrix = m4.translate(matrix, 0, 0, -360);
    gl.uniformMatrix4fv(matrixLocation, false, matrix);

    // Draw the geometry.
    var primitiveType = gl.LINES;
    var offset = 0;
    var count = ((angle/anglePoints) * 3) + 5;
    gl.drawArrays(primitiveType, offset, count);

  }

}



function createCirclePoints(center, radio, rotateX, rotateY, rotateZ, colours){
   var points = [];
   var colour = [];
   var x,y,z, px, py, pz;
   px = radio * Math.sin(radian(angle));
   py = radio * Math.cos(radian(angle));
   pz = 0;

   //x
   var temp = py;
   py = py * Math.cos(radian(rotateX)) - pz * Math.sin(radian(rotateX));
   pz = temp * Math.sin(radian(rotateX)) + pz * Math.cos(radian(rotateX));

   //y
   temp = px;
   px = px * Math.cos(radian(rotateY)) + pz * Math.sin(radian(rotateY));
   pz = - temp * Math.sin(radian(rotateY)) + pz * Math.cos(radian(rotateY));

   //z
   temp = px;
   px = px * Math.cos(radian(rotateZ)) - py * Math.sin(radian(rotateZ));
   py = temp * Math.sin(radian(rotateZ)) + py * Math.cos(radian(rotateZ));
  
   px = px + center.x;
   py = py + center.y;
   pz = pz + center.z;

   // smaller the increase 
    for(var i=0; i<angle;i+=anglePoints){ //1, 5, 15 number of line draw 

      x = radio * Math.sin(radian(i));
      y = radio * Math.cos(radian(i));
      z = 0;

      //x
      temp = y;
      y = y * Math.cos(radian(rotateX)) - z * Math.sin(radian(rotateX));
      z = temp * Math.sin(radian(rotateX)) + z * Math.cos(radian(rotateX));

      //y
      temp = x
      x = x * Math.cos(radian(rotateY)) + z * Math.sin(radian(rotateY));
      z = - temp * Math.sin(radian(rotateY)) + z * Math.cos(radian(rotateY));

      //z
      temp = x;
      x = x * Math.cos(radian(rotateZ)) - y * Math.sin(radian(rotateZ));
      y = temp * Math.sin(radian(rotateZ)) + y * Math.cos(radian(rotateZ));

      x = x + center.x;
      y = y + center.y;
      z = z + center.z;

      points.push(x,y,z);
      points.push(px, py, pz)
      colour.push(colours.x, colours.y, colours.z, colours.x, colours.y, colours.z);
      px = x;
      py = y;
      pz = z;
      
   } 
   return {p: points, c: colour};
}

// Fill the buffer with the values that define a letter 'F'.
function setBubbleGeometry(gl, initialPoints) {
  gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(
        initialPoints.p
        ),
      gl.STATIC_DRAW);
}

// Fill the buffer with colors for the 'F'.
function setBubbleColors(gl, initialPoints) {
  gl.bufferData(
      gl.ARRAY_BUFFER,
      new Uint8Array(
        initialPoints.c
        ),
      gl.STATIC_DRAW);
}

function createCupPoints(radius, heightTop, heightBottom, colour){
  
  var base = createCirclePoints({x: 0, y: heightBottom, z:0}, radius, 90, 0, 0, {x: colour[0], y:colour[1], z:colour[2]});

  var top = createCirclePoints({x: 0, y: heightTop, z:0}, radius, 90, 0, 0, {x: colour[0], y:colour[1], z:colour[2]});

  console.log(base);

  var noPoints = (base.p.length/3);

  var iniPoint = Math.round(noPoints/4)*3+3;
  var midPoint = noPoints*3-Math.round(noPoints/4)*3+3;
  var finPoint = (noPoints)*3;

  console.log(noPoints);
  console.log(iniPoint);
  console.log(midPoint);
  console.log(finPoint);

  var behp = base.p.slice(iniPoint,  midPoint);
  var behc = base.c.slice(iniPoint,  midPoint);
  base.p = base.p.slice(0, iniPoint).concat(base.p.slice(midPoint, finPoint));
  base.c = base.c.slice(0, iniPoint).concat(base.c.slice(midPoint, finPoint));

  console.log(base);

  var final = {p:base.p.concat(top.p), c:base.c.concat(top.c)};

  console.log(final);
  final.p.push(base.p[iniPoint], base.p[iniPoint+1], base.p[iniPoint+2]);
  final.p.push(top.p[midPoint], top.p[midPoint+1], top.p[midPoint+2]);

  var secondPoint = iniPoint-3;
  final.p.push(base.p[secondPoint], base.p[secondPoint+1], base.p[secondPoint+2]);
  final.p.push(top.p[secondPoint], top.p[secondPoint+1], top.p[secondPoint+2]);

  final.c.push(colour[0], colour[1], colour[2]);
  final.c.push(colour[0], colour[1], colour[2]);

  final.c.push(colour[0], colour[1], colour[2]);
  final.c.push(colour[0], colour[1], colour[2]);

  return final;

}

function setCupGeometry(gl, cupPoints) {
  gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(
        cupPoints.p
        ),
      gl.STATIC_DRAW);
}

// Fill the buffer with colors for the 'F'.
function setCupColors(gl, cupPoints) {
  gl.bufferData(
      gl.ARRAY_BUFFER,
      new Uint8Array(
        cupPoints.c
        ),
      gl.STATIC_DRAW);
}

main();
