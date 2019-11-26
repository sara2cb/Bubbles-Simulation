"use strict";
const anglePoints = 10;
const angle = 370;
const gravity = 9.8;
const heightTopCup = 90;
const heightBottomCup = -100;
const radiusCup = 50;

var howMany = 1;
var toIncreaseHowMany = 1;
var bubbleData;

var edges = [radiusCup/9,radiusCup*(3/4), radiusCup*(4/5), radiusCup];
var MAXIMUMBUBBLESIZE = 2.5;
var MINIMUMBUBBLESIZE = 0.4;
var noParticles = 400;
var sideSpeed = 0.2;
var DENSITY = 1;
var VISCOSITY = 2.5;

const maxTimeOut = 4000;

function getTopBubbleMove(Cx, Cy, Px, Py, r){
  var den = Math.sqrt((Px-Cx)*(Px-Cx) + (Py-Cy)*(Py-Cy))


  var tempGr = Math.max(Px, Cx);
  var tempSm = Math.min(Px, Cx);

  if(Px<0){
    tempGr = Math.min(Px, Cx);
    tempSm = Math.max(Px, Cx);
  }

  var Rx = Cx + r * ((tempGr-tempSm)/den);

  tempGr = Math.max(Py, Cy);
  tempSm = Math.min(Py, Cy);
  if(Py<0){
    tempGr = Math.min(Py, Cy);
    tempSm = Math.max(Py, Cy);
  }
  var Ry = Cy + r * ((tempGr-tempSm)/den);

  return [Rx, Ry];
}

function getRandomPositionAndSizeInCup(){
  var random = Math.random();
    var maxRadCup = edges[3];
    var minRadCup = edges[2];
    var maxRadBubble = MAXIMUMBUBBLESIZE;
    var minRadBubble = MAXIMUMBUBBLESIZE - (MAXIMUMBUBBLESIZE-MINIMUMBUBBLESIZE)/3;
    if(random<3/10){
      minRadCup = edges[0];
      maxRadCup = edges[1];
      maxRadBubble = MINIMUMBUBBLESIZE + (MAXIMUMBUBBLESIZE-MINIMUMBUBBLESIZE)/3;
      minRadBubble = MINIMUMBUBBLESIZE;
    }else if(random<9/10){
      minRadCup = edges[1];
      maxRadCup = edges[2];
      maxRadBubble = MAXIMUMBUBBLESIZE - (MAXIMUMBUBBLESIZE-MINIMUMBUBBLESIZE)/3;
      minRadBubble = MINIMUMBUBBLESIZE + (MAXIMUMBUBBLESIZE-MINIMUMBUBBLESIZE)/3;
    }

    var u = Math.random()+Math.random();
    var theta = Math.random() * 2 * Math.PI
    var r = u;
    if(u>1){ r = 2-u; }
    else{ r = u;}

    if(r<minRadCup){ r = minRadCup+r*((maxRadCup-minRadCup)/minRadCup);}

    var centerX = r * Math.sin(theta)
    var centerZ = r * Math.cos(theta)
    var radiusBubble =  Math.random() * (maxRadBubble - minRadBubble) + minRadBubble;

    return [centerX, centerZ, radiusBubble];
}

function closestCirclePoint(Cx, Cy, Px, Py, rad){
    var den = Math.sqrt((Px-Cx)*(Px-Cx)+(Py-Cy)*(Py-Cy));
    var Rx = Cx + rad * ((Px-Cx)/den);
    var Ry = Cy + rad * ((Py-Cy)/den);
    return[Rx, Ry]
}

function velocity(p,R,v){
  return (2/9)*((p*gravity*R*2)/v);
}

function radian (degree) {
  var rad = degree * (Math.PI / 180);
  return rad;
}

function setViscosity(){
  var visc =  parseFloat(document.getElementById("liquidViscosity").value);
  if(visc<=0 || !visc ||visc >20){
    document.getElementById("liquidViscosity").className = "error";
    console.log("HEY");
  }else{
    VISCOSITY = visc;
  }
  
  console.log(VISCOSITY);
}

function setNoParticles(){
  var part =  parseInt(document.getElementById("noParticles").value);
  if(part<1 || !part ||part > 1000000){
    document.getElementById("noParticles").className = "error";
    console.log("HEY");
  }else{
    noParticles = part;
    // noParticles++;
  }
  console.log(part);
  
  console.log(noParticles);
}

function setBubbleSizes(){
  var max = parseFloat(document.getElementById("maxBubbleSize").value);
  var min = parseFloat(document.getElementById("minBubbleSize").value);
  if(max<0.1 || !max ||max > 10 || min<0.1 || !min ||min > 10 || min>max){
    document.getElementById("maxBubbleSize").className = "error";
    document.getElementById("minBubbleSize").className = "error";
  }else{
    MAXIMUMBUBBLESIZE = max;
    MINIMUMBUBBLESIZE = min;
  }
  
  console.log(MAXIMUMBUBBLESIZE);
  console.log(MINIMUMBUBBLESIZE);
}

function addBubbleBuffer(gl, bubblePoints){
  bubbleData.push({});
  var i =bubbleData.length-1;

  // console.log(i);

  var values = getRandomPositionAndSizeInCup();
  var centerX = values[0];
  var centerZ = values[1];

  var radiusBubble = values[2];

  // Create a buffer to put positions in
  bubbleData[i]["PositionBuffer"] = gl.createBuffer();
  // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = bubblePositionBuffer)
  gl.bindBuffer(gl.ARRAY_BUFFER, bubbleData[i]["PositionBuffer"]);

  // Put geometry data into buffer
  setBubbleGeometry(gl, bubblePoints);

  // Create a buffer to put colors in
  bubbleData[i]["ColourBuffer"] = gl.createBuffer();
  // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = colorBuffer)
  gl.bindBuffer(gl.ARRAY_BUFFER, bubbleData[i]["ColourBuffer"]);
  // Put geometry data into buffer
  setBubbleColors(gl, bubblePoints);

  bubbleData[i]["locations"] = [centerX, radiusBubble, centerZ];
  bubbleData[i]["radius"] = radiusBubble;
  bubbleData[i]["sideSpeed"] = 0.2;
  bubbleData[i]["timeOut"] = -1
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


  document.getElementById("submitViscosity").addEventListener("click", setViscosity);
  document.getElementById("submitNoParticles").addEventListener("click", setNoParticles);
  document.getElementById("submitNewSizes").addEventListener("click", setBubbleSizes);

  //BUBBLES----------------------------------------------------------------------------------------------

  // bubbleData = new Array(noParticles);
  bubbleData = [];

  var bubblePoints = createCirclePoints({x: 0, y: heightBottomCup, z:-360}, 1, 0, 0, 0, {x: 0, y:100, z:200});
  
  for(var i = 0; i<100000; i++){
    addBubbleBuffer(gl, bubblePoints);
  }

  console.log(bubbleData);
  //CUP---------------------------------------------------------------------------------------------------

  var cupsInfo = new Array(2);


  cupsInfo[1] = {};

  // Create a buffer to put positions in
  cupsInfo[1]['posbuf'] = gl.createBuffer();
  // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = bubblePositionBuffer)
  gl.bindBuffer(gl.ARRAY_BUFFER, cupsInfo[1]['posbuf']);

  var cupBigPoints = createCupPoints(radiusCup+10, heightTopCup+20, heightBottomCup-10, [200,200,200], true);

  // Put geometry data into buffer
  setCupGeometry(gl, cupBigPoints.p);


  // Create a buffer to put colors in
  cupsInfo[1]['colbuf'] = gl.createBuffer();
  // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = colorBuffer)
  gl.bindBuffer(gl.ARRAY_BUFFER, cupsInfo[1]['colbuf']);
  // Put geometry data into buffer
  setCupColors(gl, cupBigPoints.c);

  cupsInfo[0] = {};

  // Create a buffer to put positions in
  cupsInfo[0]['posbuf'] = gl.createBuffer();
  // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = bubblePositionBuffer)
  gl.bindBuffer(gl.ARRAY_BUFFER, cupsInfo[0]['posbuf']);

  var cupPoints = createCupPoints(radiusCup, heightTopCup, heightBottomCup, [0,100,200], false);

  // Put geometry data into buffer
  setCupGeometry(gl, cupPoints.p);

  // Create a buffer to put colors in
  cupsInfo[0]['colbuf'] = gl.createBuffer();
  // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = colorBuffer)
  gl.bindBuffer(gl.ARRAY_BUFFER, cupsInfo[0]['colbuf']);
  // Put geometry data into buffer
  setCupColors(gl, cupPoints.c);


  function radToDeg(r) {
    return r * 180 / Math.PI;
  }

  function degToRad(d) {
    return d * Math.PI / 180;
  }

  var translation = [0, 0, 0];
  var fieldOfViewRadians = degToRad(60);
  var rotationSpeed = 0.7;
  

  drawScene();

  
  if(howMany<1) howMany = 1;
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


    cupShape(cupsInfo[1], ((angle/anglePoints) * 3) + 5);
    cupShape(cupsInfo[0], ((angle/anglePoints) * 4) + 4);

    for(var i = 0; i<howMany; i++){
      animationCircle(bubbleData[i], bubbleData[i]["PositionBuffer"], bubbleData[i]["ColourBuffer"]);
    }

    if(noParticles-howMany>500){
      toIncreaseHowMany = Math.round((noParticles-howMany)/500);
    }else{
      toIncreaseHowMany = 1;
    }
    howMany += toIncreaseHowMany
    document.getElementById("particlesTag").innerHTML = "Number of Particles: " + howMany;
    if(howMany >= noParticles-1){
      if(bubbleData.length < noParticles){
        addBubbleBuffer()
      }else{
        howMany = noParticles-1;
      }
    }
    // Call drawScene again next frame
    requestAnimationFrame(drawScene);
  }

  function animationCircle(data, bubblePositionBuffer, colorBubbleBuffer){

    
    if( data["locations"][1] > (heightTopCup-heightBottomCup)){
      var today = new Date();
      if( data["timeOut"] < 0){
        data["timeOut"] = 0
        data["lastCounted"] = today.getMilliseconds();

        var maxMovement = getTopBubbleMove(0, 0, data["locations"][0], data["locations"][2], radiusCup-data["radius"]*2);

        if(Math.abs(data["locations"][0])<Math.abs(maxMovement[0]) && Math.abs(data["locations"][2])<Math.abs(maxMovement[1])){
          var curDistance =  Math.sqrt((data["locations"][0])*(data["locations"][0])+(data["locations"][2])*(data["locations"][2]));
          var movementBubbleTop = getTopBubbleMove(0, 0, data["locations"][0], data["locations"][2], curDistance+ 0.1);
          data["locations"][0] = movementBubbleTop[0];
          data["locations"][2] = movementBubbleTop[1];
        }

      }else if(data["timeOut"]<maxTimeOut*(data["radius"]+VISCOSITY)){
        var now = today.getMilliseconds();
        if(now<=data["lastCounted"]){
          data["timeOut"] += data["lastCounted"]-now;
        }else{
          data["timeOut"] += 999-data["lastCounted"] + now;
        }

        data["lastCounted"] = today.getMilliseconds();
        var maxMovement = getTopBubbleMove(0, 0, data["locations"][0], data["locations"][2], radiusCup-data["radius"]*2);

        if(Math.abs(data["locations"][0])<Math.abs(maxMovement[0]) && Math.abs(data["locations"][2])<Math.abs(maxMovement[1])){
          var curDistance =  Math.sqrt((data["locations"][0])*(data["locations"][0])+(data["locations"][2])*(data["locations"][2]));
          var movementBubbleTop = getTopBubbleMove(0, 0, data["locations"][0], data["locations"][2], curDistance+ 1/VISCOSITY);
          data["locations"][0] = movementBubbleTop[0];
          data["locations"][2] = movementBubbleTop[1];
        }
      }
      else{
        data["locations"][1] = 0;
        var values = getRandomPositionAndSizeInCup();
        data["locations"][0] = values[0];
        data["locations"][2] = values[1];
        data["radius"] = values[2];
        data["timeOut"] = -1;
      }
    }else{
      data["locations"][1] = data["locations"][1] + velocity(DENSITY,data["radius"],1.51)/VISCOSITY
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
    
    matrix = m4.translate(matrix, (data["locations"][0]*radiusCup)/(radiusCup-data["radius"]*3),  data["locations"][1], data["locations"][2]);
    matrix = m4.scale(matrix, data["radius"], 1,1);
    gl.uniformMatrix4fv(matrixLocation, false, matrix);

    

    // Draw the geometry.
    var primitiveType = gl.LINES;
    var offset = 0;
    var count = (angle/anglePoints) *2;
    gl.drawArrays(primitiveType, offset, count);
  }


  function cupShape(cups, noLines){

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
    gl.drawArrays(primitiveType, offset, noLines);

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

function createCupPoints(radius, heightTop, heightBottom, colour, noBack){
  
  var base = createCirclePoints({x: 0, y: heightBottom, z:0}, radius, 90, 0, 0, {x: colour[0], y:colour[1], z:colour[2]});

  var top = createCirclePoints({x: 0, y: heightTop, z:0}, radius, 90, 0, 0, {x: colour[0], y:colour[1], z:colour[2]});

  var noPoints = (base.p.length/3);

  var iniPoint = Math.round(noPoints/4)*3;
  var midPoint = Math.round(noPoints/4)*3;
  var secondPoint = noPoints*3-Math.round(noPoints/4)*3+3;

  if(noBack){
    

    iniPoint = Math.round(noPoints/4)*3+3;
    midPoint = noPoints*3-Math.round(noPoints/4)*3+3;
    var finPoint = (noPoints)*3;
    secondPoint = iniPoint-3;

    // var behp = base.p.slice(iniPoint,  midPoint);
    // var behc = base.c.slice(iniPoint,  midPoint);
    base.p = base.p.slice(0, iniPoint).concat(base.p.slice(midPoint, finPoint));
    base.c = base.c.slice(0, iniPoint).concat(base.c.slice(midPoint, finPoint));
  }

  var final = {p:base.p.concat(top.p), c:base.c.concat(top.c)};
  
  final.p.push(base.p[iniPoint], base.p[iniPoint+1], base.p[iniPoint+2]);
  final.p.push(top.p[midPoint], top.p[midPoint+1], top.p[midPoint+2]);

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
        cupPoints
        ),
      gl.STATIC_DRAW);
}

// Fill the buffer with colors for the 'F'.
function setCupColors(gl, cupCol) {
  gl.bufferData(
      gl.ARRAY_BUFFER,
      new Uint8Array(
        cupCol
        ),
      gl.STATIC_DRAW);
}

main();
