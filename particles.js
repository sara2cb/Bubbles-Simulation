var MAXIMUMBUBBLESIZE = 2;
var MINIMUMBUBBLESIZE = 0.7;
var NOPARTICLES = 400;
var DENSITY = 1;
var VISCOSITY = 2.5;
const GRAVITY = 9.8;

const heightTopCup = 90;
const heightBottomCup = -100;
const radiusCup = 50;
const noBubblePoints = 20;
const noGlassPoints = 37;

var bubbleData;

var isGreatChange = false;
var howManyBefore;
const maxTimeOut = 100;
var frameCount = 1;

//BUFFERS INFORMATION--------------------------------------------------------------------------------------------------------

function createCupPoints(radius, top, bottom, colour, noBack){

  var base = createCirclePoints({x: 0, y: bottom, z:0}, radius, 90, 0, 0, {x: colour[0], y:colour[1], z:colour[2]}, 37);
  var top = createCirclePoints({x: 0, y: top, z:0}, radius, 90, 0, 0, {x: colour[0], y:colour[1], z:colour[2]}, 37);

  var noPoints = (base.p.length/3);
  var iniPoint = Math.round(noPoints/4)*3;
  var midPoint = Math.round(noPoints/4)*3;
  var secondPoint = noPoints*3-Math.round(noPoints/4)*3+3;

  if(noBack){
    iniPoint = Math.round(noPoints/4)*3+3;
    midPoint = noPoints*3-Math.round(noPoints/4)*3+3;
    var finPoint = (noPoints)*3;
    secondPoint = iniPoint-3;
    base.p = base.p.slice(0, iniPoint).concat(base.p.slice(midPoint, finPoint));
    base.c = base.c.slice(0, iniPoint).concat(base.c.slice(midPoint, finPoint));
  }

  var final = {p:base.p.concat(top.p), c:base.c.concat(top.c)};
  final.p.push(base.p[iniPoint], base.p[iniPoint+1], base.p[iniPoint+2]);
  final.p.push(top.p[midPoint], top.p[midPoint+1], top.p[midPoint+2]);
  final.p.push(base.p[secondPoint], base.p[secondPoint+1], base.p[secondPoint+2]);
  final.p.push(top.p[secondPoint], top.p[secondPoint+1], top.p[secondPoint+2]);
  for(var i = 0; i<4; i++){
    final.c.push(colour[0], colour[1], colour[2]);
  }
  return final;
}

function setGeometry(gl, cupPoints) {
  gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(
        cupPoints
        ),
      gl.STATIC_DRAW);
}

// Fill the buffer with colors for the 'F'.
function setColors(gl, cupCol) {
  gl.bufferData(
      gl.ARRAY_BUFFER,
      new Uint8Array(
        cupCol
        ),
      gl.STATIC_DRAW);
}

var den;
var tempGr;
var tempSm;
var Rx;
var Ry
function getTopBubbleMove(Cx, Cy, Px, Py, r){
  den = Math.sqrt((Px-Cx)*(Px-Cx) + (Py-Cy)*(Py-Cy))


  tempGr = Math.max(Px, Cx);
  tempSm = Math.min(Px, Cx);

  if(Px<0){
    tempGr = Math.min(Px, Cx);
    tempSm = Math.max(Px, Cx);
  }

  Rx = Cx + r * ((tempGr-tempSm)/den);

  tempGr = Math.max(Py, Cy);
  tempSm = Math.min(Py, Cy);
  if(Py<0){
    tempGr = Math.min(Py, Cy);
    tempSm = Math.max(Py, Cy);
  }
  Ry = Cy + r * ((tempGr-tempSm)/den);

  return [Rx, Ry];
}

var edges = [0,radiusCup*(1/3), radiusCup*(4/5), radiusCup];
var random;
var maxRadCup;
var minRadCup;
var maxRadBubble;
var minRadBubble;
var radiusBubble;
var theta;
var w;
var r;
var centerX;
var centerZ
function getRandomPositionAndSizeInCup(){
  random = Math.random();
  maxRadCup = edges[3];
  minRadCup = edges[2];
  maxRadBubble = MAXIMUMBUBBLESIZE;
  minRadBubble = MAXIMUMBUBBLESIZE - (MAXIMUMBUBBLESIZE-MINIMUMBUBBLESIZE)/3;
  if(random<3/10){
    minRadCup = edges[0];
    maxRadCup = edges[1];
    maxRadBubble = MINIMUMBUBBLESIZE + (MAXIMUMBUBBLESIZE-MINIMUMBUBBLESIZE)/3;
    minRadBubble = MINIMUMBUBBLESIZE;
  }else if(random<7/10){
    minRadCup = edges[1];
    maxRadCup = edges[2];
    maxRadBubble = MAXIMUMBUBBLESIZE - (MAXIMUMBUBBLESIZE-MINIMUMBUBBLESIZE)/3;
    minRadBubble = MINIMUMBUBBLESIZE + (MAXIMUMBUBBLESIZE-MINIMUMBUBBLESIZE)/3;
  }
    
  radiusBubble =  Math.random() * (maxRadBubble - minRadBubble) + minRadBubble;

  theta = Math.random() * (2*Math.PI);
  w = Math.random() * 1.1;
  if(maxRadCup == edges[3]) maxRadCup = radiusCup - radiusBubble;
  
  r = Math.sqrt( (1 - w) * minRadCup * minRadCup + w * maxRadCup * maxRadCup );
  centerX = r * Math.sin(theta)
  centerZ = r * Math.cos(theta)
  return [centerX, centerZ, radiusBubble];
}

var i;
var values;
var centerX;
var centerZ;
var radiusBubble;
function addBubble(){
  bubbleData.push({});
  i =bubbleData.length-1;

  values = getRandomPositionAndSizeInCup();
  centerX = values[0];
  centerZ = values[1];

  radiusBubble = values[2];

  bubbleData[i]["locations"] = [centerX, radiusBubble, centerZ];
  bubbleData[i]["radius"] = radiusBubble;
  bubbleData[i]["timeOut"] = -1
}


//MAIN--------------------------------------------------------------------------------------------------
function main() {
  // Get A WebGL context
  /** @type {HTMLCanvasElement} */
  var canvas = document.getElementById("glcanvas");
  var gl = canvas.getContext("webgl");
  if (!gl) {
    return;
  }

  //SET UP-----------------------------------------------------------------------------------------
  var program = webglUtils.createProgramFromScripts(gl, ["3d-vertex-shader", "3d-fragment-shader"]);
  // look up where the vertex data needs to go.
  var positionLocation = gl.getAttribLocation(program, "a_position");
  var colorLocation = gl.getAttribLocation(program, "a_color");
  // lookup uniforms
  var matrixLocation = gl.getUniformLocation(program, "u_matrix");

  document.getElementById("liquidViscosity").value = VISCOSITY;
  document.getElementById("noParticles").value = NOPARTICLES;
  document.getElementById("minBubbleSize").value = MINIMUMBUBBLESIZE;
  document.getElementById("maxBubbleSize").value = MAXIMUMBUBBLESIZE;
  document.getElementById("submitViscosity").addEventListener("click", setViscosity);
  document.getElementById("submitNoParticles").addEventListener("click", setNoParticles);
  document.getElementById("submitMin").addEventListener("click", setBubbleMin);
  document.getElementById("submitMax").addEventListener("click", setBubbleMax);


  //BUBBLES----------------------------------------------------------------------------------------------

  bubbleData = [];

  var bubblePoints = createCirclePoints({x: 0, y: heightBottomCup, z:-360}, 1, 0, 0, 0, {x: 0, y:100, z:200}, noBubblePoints);
  
  var positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  setGeometry(gl, bubblePoints.p);
  var colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  setColors(gl, bubblePoints.c);

  for(var i = 0; i<500; i++){
    addBubble();
  }

  //CUP---------------------------------------------------------------------------------------------------

  var cupsInfo = new Array(2);

  var radiusCupC = radiusCup;
  var heightTopCupC =  heightTopCup;
  var heightBottomCupC = heightBottomCup
  var colors = [0, 100,200];
  var behind = false
  for(var i = 0; i<2; i++){
    var cupBigPoints = createCupPoints(radiusCupC, heightTopCupC, heightBottomCupC,  colors, behind);

    cupsInfo[i] = {};
    cupsInfo[i]['posbuf'] = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cupsInfo[i]['posbuf']);
    setGeometry(gl, cupBigPoints.p);

    cupsInfo[i]['colbuf'] = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cupsInfo[i]['colbuf']);
    setColors(gl, cupBigPoints.c);

    radiusCupC +=10;
    heightBottomCupC -=10
    heightTopCupC +=20
    colors[0] += 200;
    colors[1] += 100;
    behind = !behind
  }

  //DRAW SCENE------------------------------------------------------------------------------------------
  var fieldOfViewRadians = degToRad(60);

  var today;
  var howMany = 1;
  var toIncreaseHowMany = 1;
  
  var tags = ["averageDurationAllParticle", "durationBufferBinding", "durationSceneTransformation", "durationSceneDrawing", "frameDuration"];
  var contentBeg = ["Particles rendering duration: ", "Buffer binding duration: ", "Tranforming scene duration: ", "Drawing Scene duration: ", "Frame Duration: "];
  var avgs = [-1,-1,-1,-1,-1];
  var times = [0,0,0,0,0];
  const DurParticles = 0;
  const DurBuffer = 1;
  const DurTrans = 2;
  const DurDraw = 3;
  const DurFrame = 4;

  drawScene();

  var bufferAcc = 0;
  var bufferTimeBef;
  var transAcc = 0;
  var transTimeBef;
  var drawAcc = 0;
  var drawTimeBef;

  var particlesTimeBef;
  var frameTimeBef;

  var timeBef;
  var timeTot = 0;
  // Draw the scene.
  function drawScene() {

    //SET UP------------------------------------------------------------
    timeBef = new Date().getTime();
    frameTimeBef = new Date().getTime();

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


    bufferAcc = 0;
    transAcc = 0;
    drawAcc = 0;
    //CUPS DRAWING--------------------------------------------------------------------------------------
    cupShape(cupsInfo[1], (noGlassPoints * 3) + 5);
    cupShape(cupsInfo[0], (noGlassPoints * 4) + 4);

    //PARTICLES DRAWING-------------------------------------------------------------------------------
    
    today = new Date().getTime();
    particlesTimeBef = today;
    bufferTimeBef = today;
    
    if(bubbleData.length < NOPARTICLES){
      lengthbubbleData = bubbleData.length;
      for(i = 0; i<NOPARTICLES-lengthbubbleData; i++){
        addBubble();
      }
    }

    // Turn on the position attribute
    gl.enableVertexAttribArray(positionLocation);

    // Bind the position buffer.
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    // Tell the position attribute how to get data out of bubblePositionBuffer (ARRAY_BUFFER)
    size = 3;          // 3 components per iteration
    type = gl.FLOAT;   // the data is 32bit floats
    normalize = false; // don't normalize the data
    stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
    offset = 0;        // start at the beginning of the buffer
    gl.vertexAttribPointer(
        positionLocation, size, type, normalize, stride, offset);

    // Turn on the color attribute
    gl.enableVertexAttribArray(colorLocation);

    // Bind the color buffer.
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);

    

    // Tell the attribute how to get data out of colorBubbleBuffer (ARRAY_BUFFER)
    type = gl.UNSIGNED_BYTE;  // the data is 8bit unsigned values
    normalize = true;         // normalize the data (convert from 0-255 to 0-1)
    gl.vertexAttribPointer(
        colorLocation, size, type, normalize, stride, offset);

    bufferAcc += new Date().getTime()- bufferTimeBef;

    for(i = 0; i<howMany; i++){
      animationCircle(bubbleData[i]);
    }
      //UPDATE DATA
    times[DurParticles] = new Date().getTime() - particlesTimeBef;
    times[DurBuffer] = bufferAcc;
    times[DurTrans] = transAcc;
    times[DurDraw] = drawAcc;

    if(NOPARTICLES-howMany>200 && !isGreatChange){
      if(!isGreatChange){
        isGreatChange = true;
        howManyBefore = howMany
      }
      var howManyIncreases = 202 - (Math.log10(NOPARTICLES-howManyBefore)/6) * (200);
      toIncreaseHowMany = Math.round((NOPARTICLES-howManyBefore)/howManyIncreases);
    }else if(!isGreatChange){
      toIncreaseHowMany = 1;
    }
    howMany += toIncreaseHowMany

    if(howMany > NOPARTICLES){
      if(howMany > NOPARTICLES+1){
        frameCount = 0;
      }
      howMany = NOPARTICLES;
      if(isGreatChange) isGreatChange = false;
      toIncreaseHowMany = 1;
    }else{
      frameCount = 0;
    }
    document.getElementById("particlesTag").innerHTML = "Number of Particles: " + howMany;

    today = new Date().getTime();
    times[DurFrame] = today - frameTimeBef;
    timeTot += today - timeBef;
    
    if(timeTot >200 || frameCount==1){
      updateLabels();
      timeTot = 0;
      if(frameCount > 1000){
        frameCount = 1;
      }
    }
    updateStats();

    frameCount++;
    

    // Call drawScene again next frame
    requestAnimationFrame(drawScene);
  }

  var maxMovement;
  var curDistance;
  var movementBubbleTop;
  var now;
  var values;
  var size = 3;          // 3 components per iteration
  var type = gl.FLOAT;   // the data is 32bit floats
  var normalize = false; // don't normalize the data
  var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
  var offset = 0;        // start at the beginning of the buffer
  var aspect;
  var matrix;
  var scaleMatrix;
  var primitiveType;
  var count;
  function animationCircle(data){

    transTimeBef = new Date().getTime();
    if( data["locations"][1] > (heightTopCup-heightBottomCup)){
      if( data["timeOut"] < 0){
        data["timeOut"] = 0
        data["lastCounted"] = new Date().getTime();

        maxMovement = getTopBubbleMove(0, 0, data["locations"][0], data["locations"][2], radiusCup-data["radius"]*2);

        if(Math.abs(data["locations"][0])<Math.abs(maxMovement[0]) && Math.abs(data["locations"][2])<Math.abs(maxMovement[1])){
          curDistance =  Math.sqrt((data["locations"][0])*(data["locations"][0])+(data["locations"][2])*(data["locations"][2]));
          movementBubbleTop = getTopBubbleMove(0, 0, data["locations"][0], data["locations"][2], curDistance+ 0.1);
          data["locations"][0] = movementBubbleTop[0];
          data["locations"][2] = movementBubbleTop[1];
        }

      }else if(data["timeOut"]<maxTimeOut*(data["radius"]+VISCOSITY)){
        today = new Date().getTime();
        data["timeOut"] += today-data["lastCounted"];
        data["lastCounted"] = today;
        maxMovement = getTopBubbleMove(0, 0, data["locations"][0], data["locations"][2], radiusCup-data["radius"]*2);

        if(Math.abs(data["locations"][0])<Math.abs(maxMovement[0]) && Math.abs(data["locations"][2])<Math.abs(maxMovement[1])){
          curDistance =  Math.sqrt((data["locations"][0])*(data["locations"][0])+(data["locations"][2])*(data["locations"][2]));
          movementBubbleTop = getTopBubbleMove(0, 0, data["locations"][0], data["locations"][2], curDistance+ 1/VISCOSITY);
          data["locations"][0] = movementBubbleTop[0];
          data["locations"][2] = movementBubbleTop[1];
        }
      }
      else{
        data["locations"][1] = 0;
        values = getRandomPositionAndSizeInCup();
        data["locations"][0] = values[0];
        data["locations"][2] = values[1];
        data["radius"] = values[2];
        data["timeOut"] = -1;
      }
    }else{
      data["locations"][1] = data["locations"][1] + velocity(DENSITY,data["radius"],VISCOSITY);
    }

    // Compute the matrices
    aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    matrix = m4.perspective(fieldOfViewRadians, aspect, 1, 2000);
    
    if(data.radius<MINIMUMBUBBLESIZE)
      data.radius = MINIMUMBUBBLESIZE;
    else if(data.radius>MAXIMUMBUBBLESIZE)
      data.radius = MAXIMUMBUBBLESIZE;

    scaleMatrix = m4.scaling(data.radius,1,1);
    matrix = m4.translate(matrix, (data["locations"][0])/1,  data["locations"][1], data["locations"][2]);

    matrix = m4.multiply(matrix, scaleMatrix);
    
    gl.uniformMatrix4fv(matrixLocation, false, matrix);
    
    today = new Date().getTime();
    transAcc += today - transTimeBef;
    drawTimeBef = today;

    // Draw the geometry.
    primitiveType = gl.LINES;
    offset = 0;
    count = noBubblePoints *2;
    gl.drawArrays(primitiveType, offset, count);
    
    drawAcc += new Date().getTime() - drawTimeBef;
  }


  function cupShape(cups, noLines){

    // Turn on the position attribute
    gl.enableVertexAttribArray(positionLocation);

    // Bind the position buffer.
    gl.bindBuffer(gl.ARRAY_BUFFER, cups['posbuf']);

    // Tell the position attribute how to get data out of bubblePositionBuffer (ARRAY_BUFFER)
    size = 3;          // 3 components per iteration
    type = gl.FLOAT;   // the data is 32bit floats
    normalize = false; // don't normalize the data
    stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
    offset = 0;        // start at the beginning of the buffer
    gl.vertexAttribPointer(
        positionLocation, size, type, normalize, stride, offset);

    // Turn on the color attribute
    gl.enableVertexAttribArray(colorLocation);

    // Bind the color buffer.
    gl.bindBuffer(gl.ARRAY_BUFFER, cups['colbuf']);

    // Tell the attribute how to get data out of colorBubbleBuffer (ARRAY_BUFFER)
    type = gl.UNSIGNED_BYTE;  // the data is 8bit unsigned values
    normalize = true;         // normalize the data (convert from 0-255 to 0-1)
    gl.vertexAttribPointer(
        colorLocation, size, type, normalize, stride, offset);

    // Compute the matrices
    aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    matrix = m4.perspective(fieldOfViewRadians, aspect, 1, 2000);
    matrix = m4.translate(matrix, 0, 0, -360);
    gl.uniformMatrix4fv(matrixLocation, false, matrix);

    // Draw the geometry.
    primitiveType = gl.LINES;
    offset = 0;
    gl.drawArrays(primitiveType, offset, noLines);

  }

  function updateStats(){
    for(var i = 0; i<avgs.length; i++){
     avgs[i] = incrementalAverage(frameCount, times[i], avgs[i]);
    }
  }

  function updateLabels(){
    for(var i = 0; i<avgs.length; i++){
      if(Math.round(avgs[i]*100)/100 != Math.round(incrementalAverage(frameCount, times[i], avgs[i])*100)/100){
        document.getElementById(tags[i]).innerHTML = contentBeg[i] + Math.round(incrementalAverage(frameCount, times[i], avgs[i])*100)/100 + " ms";
        if(i == DurFrame){
          document.getElementById("framerate").innerHTML = "Framerate: " + Math.round((1/incrementalAverage(frameCount, times[i], avgs[i]))*100000)/100 + " fps";
        }
      }
    }
  }
}

//MATHEMATICAL FUNCTIONS ------------------------------------------------------------------------
const angle = 370;
function createCirclePoints(center, radio, rotateX, rotateY, rotateZ, colours, noPoints){
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
    for(var i=0; i<angle;i+=Math.round(angle/noPoints)){ 

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

function closestCirclePoint(Cx, Cy, Px, Py, rad){
  var den = Math.sqrt((Px-Cx)*(Px-Cx)+(Py-Cy)*(Py-Cy));
  var Rx = Cx + rad * ((Px-Cx)/den);
  var Ry = Cy + rad * ((Py-Cy)/den);
  return[Rx, Ry]
}

function velocity(p,R,v){
  return (2/9)*((p*GRAVITY*R*R)/v);
}

function radian (degree) {
  var rad = degree * (Math.PI / 180);
  return rad;
}


function incrementalAverage(count, newValue, avg){
  if(count == 1){
    return newValue
  }else{
    return avg + ((newValue-avg)/count)
    // return ((newValue+avg)/2)
  }
}

var n = true;
function getTimeSpent(before, now){
  if(before<now){
    return now-before;
  }else if(before>now){
    if(n){
      // console.log(before);
      // console.log(now);
      // console.log((60*1000) - before) + now;
      n = false;
    }
    return ((60*1000) - before) + now;
  }else{
    return 0;
  }
}

function degToRad(d) {
  return d * Math.PI / 180;
}


//BUTTONS FUNCTIONS-----------------------------------------------------------------------------------------
function setNoParticles(){
  var part =  parseInt(document.getElementById("noParticles").value);
  if(part<1 || part > 1000000){
    document.getElementById("noParticles").className = "error";
    document.getElementById("errorNoParticles").innerHTML = "There must be between 1 to 1,000,000 particles";
  }else if(!part){
    document.getElementById("noParticles").className = "error";
    document.getElementById("errorNoParticles").innerHTML = "Field needs to be filled";
  }
  else{
    NOPARTICLES = part;
    document.getElementById("noParticles").className = "notError";
    document.getElementById("errorNoParticles").innerHTML = "";
  }
}

function setBubbleMin(){
  var min = parseFloat(document.getElementById("minBubbleSize").value);
  if(min<0.1){
    document.getElementById("minBubbleSize").className = "error";
    document.getElementById("errorMin").innerHTML = "At least 0.1";
  }else if(min>MAXIMUMBUBBLESIZE){
    document.getElementById("minBubbleSize").className = "error";
    document.getElementById("errorMin").innerHTML = "The minimum can not be greater than the maximum";
  }else if(!min){
    document.getElementById("minBubbleSize").className = "error";
    document.getElementById("errorMin").innerHTML = "Field needs to be filled";
  }else{
    document.getElementById("minBubbleSize").className = "notError";
    document.getElementById("errorMin").innerHTML = "";
    MINIMUMBUBBLESIZE = min;
  }
}

function setBubbleMax(){
  var max = parseFloat(document.getElementById("maxBubbleSize").value);
  if(max<MINIMUMBUBBLESIZE){
    document.getElementById("maxBubbleSize").className = "error";
    document.getElementById("errorMax").innerHTML = "The maximum can not be lower than the minimum";
  }else if(!max){
    document.getElementById("maxBubbleSize").className = "error";
    document.getElementById("errorMax").innerHTML = "Field needs to be filled";
  }else{
    document.getElementById("maxBubbleSize").className = "notError";
    document.getElementById("errorMax").innerHTML = "";
    MAXIMUMBUBBLESIZE = max;
    if(VISCOSITY >(10*Math.PI/(DENSITY*2*MAXIMUMBUBBLESIZE))){
      VISCOSITY =  Math.round((10*Math.PI/(DENSITY*2*MAXIMUMBUBBLESIZE))*100)/100;
      document.getElementById("liquidViscosity").value = VISCOSITY
    }
  }
}

function setViscosity(){
  var visc =  parseFloat(document.getElementById("liquidViscosity").value);
  if(visc<=0 ||visc >(10*Math.PI/(DENSITY*2*MAXIMUMBUBBLESIZE))){
    document.getElementById("liquidViscosity").className = "error";
    document.getElementById("errorViscosity").innerHTML = "Must be between 0 and " + Math.round((10*Math.PI/(DENSITY*2*MAXIMUMBUBBLESIZE))*100)/100 + " (Reynolds number)";
  }else if(!visc ){
    document.getElementById("liquidViscosity").className = "error";
    document.getElementById("errorViscosity").innerHTML = "Field needs to be filled";
  }else{
    document.getElementById("liquidViscosity").className = "notError";
    document.getElementById("errorViscosity").innerHTML = "";
    VISCOSITY = visc;
  }
}


main();
