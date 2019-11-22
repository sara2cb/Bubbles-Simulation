var can = document.getElementById("glcanvas");
var xRotation = 0;
var yRotation = 0;
var totalParticles = 1;
let positions = [];
// Vertex shader program

var vsSource = 
  // 'attribute vec3 coordinates;'+
  // 'uniform mat4 mvp;'+
  // 'void main(void) {'+
  // '  gl_Position = mvp * vec4(coordinates.x, coordinates.y, coordinates.z, 1.0);'+
  // '}'
  'attribute vec3 coordinates; '+
  'uniform mat4 mvp;'+
  'void main(void) { '+
  'gl_Position = mvp * vec4(coordinates.x, coordinates.y, coordinates.z, 1.0);'+
  'gl_PointSize = 10.0;}'
;

  // Fragment shader program

  var fsSource = 
    'void main(void) {' +
    'gl_FragColor = vec4(1.0, 1.0, 1.0, 0.1);' +
  '}'
  ;

main();

function Particle(x, y, life, angle, speed) {
  this.position = {
    x: x,
    y: y
  };

  this.life = life;

  var angleInRadians = angle * Math.PI / 180;
  this.velocity = {
    x: speed * Math.cos(angleInRadians),
    y: -speed * Math.sin(angleInRadians)
  }
  this.update = function(dt) {
    this.life -= dt;
  
    if(this.life > 0) {
      this.position.x += this.velocity.x * dt;
      this.position.y += this.velocity.y * dt;
    }else{

    }
  };
}

// Particle.prototype.update = function(dt) {
//   this.life -= dt;

//   if(this.life > 0) {
//     this.position.x += this.velocity.x * dt;
//     this.position.y += this.velocity.y * dt;
//   }
// };

function Emitter() {
  this.particlePool = [];

  this.update = function(delta) {
    
    currentParticlesNo =this.particlePool.length;
    if( totalParticles > currentParticlesNo) {
      this.particlePool.push(new Particle(0,0,5,20,0.002));
      
    }
    
    particleIndex = 0
    positions = [];
    while(particleIndex < currentParticlesNo) {
      var particle = this.particlePool[particleIndex];
      
      if(particle.life > 0) {
        particle.update(delta);
        particleIndex++;
        positions.push(particle.position.x, particle.position.y, 0);
      } else {
        this.particlePool.splice(particleIndex, 1);
        currentParticlesNo--;
      }
      
    }
  };

  this.getNumberParticles = function() {
    return this.particlePool.length;
  };

  this.getParticle= function(index) {
    return this.particlePool[index];
  };
}

function resize(canvas) {
   // Lookup the size the browser is displaying the canvas.
   var displayWidth  = canvas.clientWidth;
   var displayHeight = canvas.clientHeight;

   // Check if the canvas is not the same size.
   if (canvas.width  !== displayWidth ||
       canvas.height !== displayHeight) {

     // Make the canvas the same size
     canvas.width  = displayWidth;
     canvas.height = displayHeight;
   }
};
//
// Start here
//
function main() {
  const canvas = document.querySelector('#glcanvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

  // If we don't have a GL context, give up now

  if (!gl) {
    alert('Unable to initialize WebGL. Your browser or machine may not support it.');
    return;
  }

  // look up where the vertex data needs to go.
  var positionLocation = gl.getAttribLocation(program, "a_position");
  var colorLocation = gl.getAttribLocation(program, "a_color");

  // lookup uniforms
  var matrixLocation = gl.getUniformLocation(program, "u_matrix");
  
  // var isDragging = false

  // var lastMouseX = 0;
  // var lastMouseY = 0;

  // canvas.onmousedown = function (e) {
  //   isDragging = true;
  //   lastMouseX = e.pageX;
  //   lastMouseY = e.pageY;
  // }
  // canvas.onmousemove = function (e) {
  //   if (isDragging) {
  //     xRotation += (e.pageY - lastMouseY) / 50;
  //     yRotation += (e.pageX - lastMouseX) / 50;

  //     xRotation = Math.min(xRotation, Math.PI / 2.5);
  //     xRotation = Math.max(xRotation, -Math.PI / 2.5);

  //     lastMouseX = e.pageX;
  //     lastMouseY = e.pageY;
  //     // Initialize a shader program; this is where all the lighting
  //     // for the vertices and so forth is established.
  //     const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

  //     // Here's where we call the routine that builds all the
  //     // objects we'll be drawing.
  //     const buffers = initBuffers(gl, shaderProgram);

  //     // Draw the scene repeatedl
  //     drawScene(gl, buffers);
  //   }
  // }
  // canvas.onmouseup = function (e) {
  //   isDragging = false;
  // }
  // canvas.addEventListener('touchstart', function (e) {
  //   lastMouseX = e.touches[0].clientX
  //   lastMouseY = e.touches[0].clientY
  // })
  // canvas.addEventListener('touchmove', function (e) {
  //   e.preventDefault();
  //   xRotation += (e.touches[0].clientY - lastMouseY) / 50;
  //   yRotation -= (e.touches[0].clientX - lastMouseX) / 50;

  //   xRotation = Math.min(xRotation, Math.PI / 2.5);
  //   xRotation = Math.max(xRotation, -Math.PI / 2.5);

  //   lastMouseX = e.touches[0].clientX;
  //   lastMouseY = e.touches[0].clientY;
    
  // })

  // // Initialize a shader program; this is where all the lighting
  // // for the vertices and so forth is established.
  // const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

  const emitter = new Emitter();
  
  // Initialize a shader program; this is where all the lighting
  // for the vertices and so forth is established.
  const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

  initBuffers(gl, shaderProgram, emitter);

  
  
  gl.clearColor(0.0, 0.0, 0.0, 0.9);  // Clear to black, fully opaque
  // gl.clearDepth(1.0);                 // Clear everything
  gl.enable(gl.DEPTH_TEST);           // Enable depth testing
  // gl.depthFunc(gl.LESS);            // Near things obscure far thing
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  drawScene();
  //
  // Draw the scene.
  //
  function drawScene() {


    // Tell WebGL how to convert from clip space to pixels
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // Clear the canvas AND the depth buffer.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Turn on culling. By default backfacing triangles
    // will be culled.
    gl.enable(gl.CULL_FACE);

    // Enable the depth buffer
    gl.enable(gl.DEPTH_TEST);

    // Tell it to use our program (pair of shaders)
    gl.useProgram(shaderProgram);

    // Turn on the position attribute
    gl.enableVertexAttribArray(positionLocation);

    // Bind the position buffer.
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    // Tell the position attribute how to get data out of positionBuffer (ARRAY_BUFFER)
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
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);

    // Tell the attribute how to get data out of colorBuffer (ARRAY_BUFFER)
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
    matrix = m4.translate(matrix, translation[0], translation[1], translation[2]);
    matrix = m4.xRotate(matrix, rotation[0]);
    matrix = m4.yRotate(matrix, rotation[1]);
    matrix = m4.zRotate(matrix, rotation[2]);
    matrix = m4.scale(matrix, scale[0], scale[1], scale[2]);

    // Set the matrix.
    gl.uniformMatrix4fv(matrixLocation, false, matrix);

    // Draw the geometry.
    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = 16 * 6;
    gl.drawArrays(primitiveType, offset, count);

    // Call drawScene again next frame
    requestAnimationFrame(drawScene);


    requestAnimationFrame(drawScene);

    // Draw the scene repeatedl
    resize(gl.canvas);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    
    // Now create an array of console.log(emitter);
    emitter.update(0.1);

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(coord, 3, gl.FLOAT, false, 0,0);

    gl.drawArrays(gl.POINTS, 0, emitter.getNumberParticles());
    gl.flush();

  }
}

//
//initBuffers
//
// Initialize the buffers we'll need. For this demo, we just
// have one object -- a simple three-dimensional cube.
//
function initBuffers(gl, shaderProgram, emitter) {
  
  // Create a buffer for the cube's vertex positions.

  const positionBuffer = gl.createBuffer();

  // Select the positionBuffer as the one to apply buffer
  // operations to from here out.

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // Now pass the list of positions into WebGL to build the
  // shape. We do this by creating a Float32Array from the
  // JavaScript array, then use it to fill the current buffer.

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  var coord = gl.getAttribLocation(shaderProgram, 'coordinates')
  if(coord == -1)
    {alert('Error during uniform address retrieval');running=false;return;}  

  
  gl.useProgram(shaderProgram);

  gl.vertexAttribPointer(coord, 3, gl.FLOAT, false, 0,0);
  gl.enableVertexAttribArray(coord);


  var amvp = gl.getUniformLocation(shaderProgram, 'mvp');
  if(amvp == -1)
    {alert('Error during uniform address retrieval');running=false;return;}  
  // Creates matrix using rotation angles
  var mat = getTransformationMatrix(xRotation, yRotation, 0);
  
  // Sets the model-view-projections matrix in the shader
  gl.uniformMatrix4fv(amvp, false, mat);

  return {buffer: positionBuffer, coord: positions};
}



//
// Initialize a shader program, so WebGL knows how to draw our data
//
function initShaderProgram(gl, vsSource, fsSource) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

  // Create the shader program

  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  // If creating the shader program failed, alert

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
    return null;
  }

  gl.validateProgram(shaderProgram);
  if (!gl.getProgramParameter(shaderProgram, gl.VALIDATE_STATUS))
  {alert("Error during program validation:\n" + gl.getProgramInfoLog(shaderProgram));return;}

  // // Use the combined shader program object
  // gl.useProgram(shaderProgram);

  return shaderProgram;
}

//
// creates a shader of the given type, uploads the source and
// compiles it.
//
function loadShader(gl, type, source) {
  const shader = gl.createShader(type);

  // Send the source to the shader object

  gl.shaderSource(shader, source);

  // Compile the shader program

  gl.compileShader(shader);

  // See if it compiled successfully

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

function getTransformationMatrix(rx, ry, rz)
{
  // Pre-computes trigonometric values (mainly for better readability)
  var cx = Math.cos(rx), sx = Math.sin(rx);
  var cy = Math.cos(ry), sy = Math.sin(ry);
  var cz = Math.cos(rz), sz = Math.sin(rz);
 
  // Returns matrix
  return new Float32Array([cy*cz, (sx*sy*cz-cx*sz), (sx*sz+cx*sy*cz), 0,
                           cy*sz, (sx*sy*sz+cx*cz), (cx*sy*sz-sx*cz), 0,
                           -sy,   sx*cy,            cx*cy,            0,
                           0,     0,                0,                1]);
}