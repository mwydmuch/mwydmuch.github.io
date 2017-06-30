var THREE = require('three');
var HELPERS = require('./helpers');

var dat = require('../../node_modules/three/examples/js/libs/dat.gui.min.js');
var Stats = require('../../node_modules/three/examples/js/libs/stats.min.js');

// THREE extensions adds new properties to global object THREE
window.THREE = THREE;
require('../../node_modules/three/examples/js/controls/OrbitControls.js');

require('../../node_modules/three/examples/js/shaders/CopyShader.js');
require('../../node_modules/three/examples/js/shaders/BokehShader.js');
require('../../node_modules/three/examples/js/shaders/FXAAShader.js');
require('../../node_modules/three/examples/js/shaders/SMAAShader.js');
require('../../node_modules/three/examples/js/shaders/ConvolutionShader.js'); // required by UnrealBloomPass
require('../../node_modules/three/examples/js/shaders/LuminosityHighPassShader.js'); // required by UnrealBloomPass

require('../../node_modules/three/examples/js/postprocessing/EffectComposer.js');
require('../../node_modules/three/examples/js/postprocessing/RenderPass.js');
require('../../node_modules/three/examples/js/postprocessing/ShaderPass.js');
require('../../node_modules/three/examples/js/postprocessing/MaskPass.js');
require('../../node_modules/three/examples/js/postprocessing/BokehPass.js');
require('../../node_modules/three/examples/js/postprocessing/SMAAPass.js');
require('../../node_modules/three/examples/js/postprocessing/UnrealBloomPass.js');




// Some globals
// ---------------------------------------------------------------------------------------------------------------------

// Colors
var clearColor = 0x280765;

var colorPalete = [
    0xAAE96E,
    0xF7861F,
    0x42EAF7,
    0x91196B,
    0xD13142,
    0x2CABB8,
    0xEB9578
];

// General
var group;
var container, controls, stats;
var camera, scene, renderer;
var aaPass, bloomPass, renderScene;
var composer;

var maxParticles = 128;
var particleCount = maxParticles;

var r = 960;
var rHalf = r / 2;
var maxV = 0.25;
var helperMesh;

// Particles
var particlesData = [];
var pointsMesh;
var particlesPositions;
var particlesColors;

// Connections - lines mesh
var linesMesh;
var linesPositions;
var linesColors;
var maxLines = maxParticles * maxParticles;

// Connections - triangles
var maxTris = maxParticles * maxParticles;
var trisMesh;
var trisPositions;
var trisColors;

//TODO: Clean up
var controller = {
    showHelper: false,
    showParticles: true,
    showLines: true,
    showTris: true,
    minDistance: 216,
    limitConnections: false,
    maxConnections: 6,
    particleCount: 128,
    projection: 'normal',
    background: false,
    exposure: 1.0,
    bloomStrength: 1.5,
    bloomThreshold: 0.75,
    bloomRadius: 0.75
};


// Windows events handlers
// ---------------------------------------------------------------------------------------------------------------------

var mouseX = 0;
var mouseY = 0;

var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;

function onDocumentMouseMove(event) {
    mouseX = event.clientX - windowHalfX;
    mouseY = event.clientY - windowHalfY;
}

function onDocumentTouchStart(event) {
    if (event.touches.length === 1) {
        event.preventDefault();
        mouseX = event.touches[0].pageX - windowHalfX;
        mouseY = event.touches[0].pageY - windowHalfY;
    }
}

function onDocumentTouchMove(event) {
    if (event.touches.length === 1) {
        event.preventDefault();
        mouseX = event.touches[0].pageX - windowHalfX;
        mouseY = event.touches[0].pageY - windowHalfY;
    }
}

function onWindowResize() {
    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
    //aaPass.uniforms['resolution'].value.set(1 / window.innerWidth, 1 / window.innerHeight );
}


// Dev GUI
// ---------------------------------------------------------------------------------------------------------------------

var devGUI = false;

function initGUI() {
    var gui = new dat.GUI();
    gui.add( controller, "showHelper" ).onChange( function( value ) { helperMesh.visible = value; } );
    gui.add( controller, "showParticles" ).onChange( function( value ) { pointsMesh.visible = value; } );
    gui.add( controller, "showLines" ).onChange( function( value ) { linesMesh.visible = value; } );
    gui.add( controller, "showTris" ).onChange( function( value ) { trisMesh.visible = value; } );
    gui.add( controller, "minDistance", 10, 400 );
    gui.add( controller, "limitConnections" );
    gui.add( controller, "maxConnections", 0, 30, 1 );
    gui.add( controller, "particleCount", 0, maxParticles, 1 ).onChange( function( value ) {
        particleCount = parseInt( value );
        pointsMesh.geometry.setDrawRange( 0, particleCount );
    });

    gui.add( controller, 'exposure', 0.1, 2 );
    gui.add( controller, 'bloomThreshold', 0.0, 1.0 ).onChange( function(value) { bloomPass.threshold = Number(value); });
    gui.add( controller, 'bloomStrength', 0.0, 3.0 ).onChange( function(value) { bloomPass.strength = Number(value); });
    gui.add( controller, 'bloomRadius', 0.0, 1.0 ).onChange( function(value) { bloomPass.radius = Number(value); });
}


// Rendering
// ---------------------------------------------------------------------------------------------------------------------

function init() {

    container = document.getElementById( 'container' );

    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 1000 );
    camera.position.z = 320;

    scene = new THREE.Scene();
    group = new THREE.Group();
    scene.add( group );

    helperMesh = new THREE.BoxHelper(new THREE.Mesh( new THREE.BoxGeometry( r, r, r )));
    helperMesh.material.color.setHex(0x080808);
    helperMesh.material.blending = THREE.AdditiveBlending;
    helperMesh.material.transparent = true;
    helperMesh.visible = false;
    group.add(helperMesh);


    // Init particles
    var material = new THREE.PointsMaterial( {
        vertexColors: THREE.VertexColors,
        size: 8,
        blending: THREE.AdditiveBlending,
        transparent: true,
        sizeAttenuation: false
    });

    var geometry = new THREE.BufferGeometry();
    particlesPositions = new Float32Array( maxParticles * 3 );
    particlesColors = new Float32Array( maxParticles * 3 );
    for ( var i = 0; i < maxParticles; i++ ) {
        particlesPositions[i * 3] = HELPERS.randomRange(-rHalf, rHalf); // x
        particlesPositions[i * 3 + 1] = HELPERS.randomRange(-rHalf, rHalf); // y
        particlesPositions[i * 3 + 2] = HELPERS.randomRange(-rHalf, rHalf); // z

        particlesData.push({
            velocity: new THREE.Vector3(HELPERS.randomRange(-maxV, maxV), HELPERS.randomRange(-maxV, maxV), HELPERS.randomRange(-maxV, maxV)),
            connectionCount: 0
        });

        var color = new THREE.Color(HELPERS.randomElement(colorPalete));
        particlesColors[i * 3] = color.r;
        particlesColors[i * 3 + 1] = color.g;
        particlesColors[i * 3 + 2] = color.b;
    }

    geometry.addAttribute('position', new THREE.BufferAttribute(particlesPositions, 3).setDynamic(true));
    geometry.addAttribute('color', new THREE.BufferAttribute(particlesColors, 3));
    geometry.computeBoundingSphere();
    geometry.setDrawRange(0, controller.particleCount);

    pointsMesh = new THREE.Points(geometry, material);
    group.add(pointsMesh);


    // Init connections - lines
    linesPositions = new Float32Array(maxLines * 3);
    linesColors = new Float32Array(maxLines * 3);
    HELPERS.arraySet(linesColors, 0, 1.0, linesColors.length);
    geometry = new THREE.BufferGeometry();
    geometry.addAttribute('position', new THREE.BufferAttribute(linesPositions, 3).setDynamic(true));
    geometry.addAttribute('color', new THREE.BufferAttribute(linesColors, 3).setDynamic(true));
    geometry.computeBoundingSphere();
    geometry.setDrawRange(0, 0);
    material = new THREE.LineBasicMaterial({
        vertexColors: THREE.VertexColors,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthTest: false
    });
    linesMesh = new THREE.LineSegments(geometry, material);
    group.add(linesMesh);


    // Init connections - triangles
    trisPositions = new Float32Array(maxTris * 3 * 3);
    trisColors = new Float32Array(maxTris * 3 * 4);

    geometry = new THREE.BufferGeometry();
    geometry.addAttribute('position', new THREE.BufferAttribute(trisPositions, 3).setDynamic(true));
    geometry.addAttribute('color', new THREE.BufferAttribute(trisColors, 4).setDynamic( true ));
    geometry.computeBoundingSphere();
    geometry.setDrawRange(0, 0);
    material = new THREE.RawShaderMaterial({
        uniforms: {
            time: { value: 1.0 }
        },
        vertexShader: document.getElementById( 'trisVertexShader' ).textContent,
        fragmentShader: document.getElementById( 'trisFragmentShader' ).textContent,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthTest: false
    });
    trisMesh = new THREE.Mesh( geometry, material );
    group.add( trisMesh );


    renderer = new THREE.WebGLRenderer({ antialias: false });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(clearColor, 1.0 );
    renderer.gammaInput = true;
    renderer.gammaOutput = true;
    renderer.domElement.id = "background";
    renderer.domElement.setAttribute("style", "animation-name: opacity-animation; animation-duration: 5s; animation-timing-function: ease;");
    container.appendChild(renderer.domElement);


    renderScene = new THREE.RenderPass(scene, camera);
    renderScene.clear = true;

    // TODO: Check performance of AA
    //aaPass = new THREE.ShaderPass(THREE.FXAAShader);
    //aaPass.uniforms['resolution'].value.set(1 / window.innerWidth, 1 / window.innerHeight );
    //aaPass = new THREE.SMAAPass( window.innerWidth, window.innerHeight );
    //aaPass.renderToScreen = true;

    var copyShader = new THREE.ShaderPass(THREE.CopyShader);
    copyShader.renderToScreen = true;
    bloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.3, 0.85, 0.85);
    composer = new THREE.EffectComposer(renderer);
    composer.setSize(window.innerWidth, window.innerHeight);
    composer.addPass(renderScene);
    //composer.addPass(aaPass);
    composer.addPass(bloomPass);
    composer.addPass(copyShader);


    if(devGUI){
        initGUI();
        stats = new Stats();
        container.appendChild(stats.dom);
    }

    // TODO: Mouse control
    // document.addEventListener('mousemove', onDocumentMouseMove, false);
    // document.addEventListener('touchstart', onDocumentTouchStart, false);
    // document.addEventListener('touchmove', onDocumentTouchMove, false);
    window.addEventListener('resize', onWindowResize, false);

    animate();
}

function animate() {

    var linesVertexPos = 0;
    var linesColorPos = 0;
    var lineCount = 0;

    var trisVertexPos = 0;
    var trisColorPos = 0;
    var triCount = 0;

    for (var i = 0; i < controller.particleCount; ++i) {
        // Get the particle
        var particleData = particlesData[i];

        // Update velocity
        particlesPositions[i * 3] += particleData.velocity.x;
        particlesPositions[i * 3 + 1] += particleData.velocity.y;
        particlesPositions[i * 3 + 2] += particleData.velocity.z;

        if (particlesPositions[i * 3 + 1] < -rHalf || particlesPositions[ i * 3 + 1 ] > rHalf)
            particleData.velocity.y = -particleData.velocity.y;

        if (particlesPositions[i * 3] < -rHalf || particlesPositions[ i * 3 ] > rHalf)
            particleData.velocity.x = -particleData.velocity.x;

        if (particlesPositions[i * 3 + 2] < -rHalf || particlesPositions[ i * 3 + 2 ] > rHalf)
            particleData.velocity.z = -particleData.velocity.z;

        // Reset connections
        particleData.connectionCount = 0;
    }

    for (var i = 0; i < controller.particleCount; ++i){
        var particleData = particlesData[i];
        var i3 = i * 3;

        // Update connections

        var particlePosition = new THREE.Vector3(particlesPositions[i3], particlesPositions[i3 + 1], particlesPositions[i3 + 2]);
        particlePosition.multiply(group.matrixWorld);

        if (particlePosition.z > 160)
            continue;

        if (controller.limitConnections && particleData.connectionCount >= controller.maxConnections)
            continue;

        for (var j = i + 1; j < controller.particleCount; ++j) {
            var particleDataB = particlesData[j];
            var j3 = j * 3;

            if ( controller.limitConnections && particleDataB.connectionCount >= controller.maxConnections)
                continue;

            var distAB = HELPERS.arrayDist3D(particlesPositions, i3, particlesPositions, j3);

            if (lineCount < maxLines && distAB < controller.minDistance) {
                ++particleData.connectionCount;
                ++particleDataB.connectionCount;

                var alpha = 1.0 - distAB / controller.minDistance;

                HELPERS.arrayCopy(linesPositions, linesVertexPos, particlesPositions, i3, 3);
                linesVertexPos+=3;
                HELPERS.arrayCopy(linesPositions, linesVertexPos, particlesPositions, j3, 3);
                linesVertexPos+=3;
                HELPERS.arraySet(linesColors, linesColorPos, alpha, 6);
                linesColorPos+=6;

                ++lineCount;

                if (triCount >= maxTris)
                    continue;

                for (var k = j + 1; k < controller.particleCount; ++k) {
                    var particleDataC = particlesData[k];
                    var k3 = k * 3;

                    if ( controller.limitConnections && particleDataC.connectionCount >= controller.maxConnections)
                        continue;

                    var distAC = HELPERS.arrayDist3D(particlesPositions, i3, particlesPositions, k3);
                    var distBC = HELPERS.arrayDist3D(particlesPositions, j3, particlesPositions, k3);

                    if (distAC < controller.minDistance && distBC < controller.minDistance) {

                        ++particleDataC.connectionCount;

                        HELPERS.arrayCopy(trisPositions, trisVertexPos, particlesPositions, i3, 3);
                        trisVertexPos+=3;
                        HELPERS.arrayCopy(trisPositions, trisVertexPos, particlesPositions, j3, 3);
                        trisVertexPos+=3;
                        HELPERS.arrayCopy(trisPositions, trisVertexPos, particlesPositions, k3, 3);
                        trisVertexPos+=3;

                        HELPERS.arrayCopy(trisColors, trisColorPos, particlesColors, i3, 3);
                        trisColorPos+=3;
                        trisColors[trisColorPos++] = 1.0 - Math.max(distAB / controller.minDistance, distAC / controller.minDistance);
                        HELPERS.arrayCopy(trisColors, trisColorPos, particlesColors, j3, 3);
                        trisColorPos+=3;
                        trisColors[trisColorPos++] = 1.0 - Math.max(distAB / controller.minDistance, distBC / controller.minDistance);
                        HELPERS.arrayCopy(trisColors, trisColorPos, particlesColors, k3, 3);
                        trisColorPos+=3;
                        trisColors[trisColorPos++] = 1.0 - Math.max(distAC / controller.minDistance, distBC / controller.minDistance);

                        ++triCount;
                    }
                }
            }
        }
    }

    var time = Date.now() * 0.001;
    group.rotation.y = time * 0.05;

    linesMesh.geometry.setDrawRange(0, lineCount * 2);
    linesMesh.geometry.attributes.position.needsUpdate = true;
    linesMesh.geometry.attributes.color.needsUpdate = true;

    trisMesh.geometry.setDrawRange(0, triCount * 3);
    trisMesh.geometry.attributes.position.needsUpdate = true;
    trisMesh.geometry.attributes.color.needsUpdate = true;
    trisMesh.material.uniforms.time.value = time * 0.1;

    pointsMesh.geometry.attributes.position.needsUpdate = true;

    requestAnimationFrame(animate);
    render();
}

function render() {

    // TODO: Mouse control
    // camera.position.x += (mouseX - camera.position.x) * 0.0005;
    // camera.position.y += (-mouseY - camera.position.y) * 0.0005;
    // camera.lookAt(scene.position);

    //renderer.render( scene, camera );
    if(devGUI) stats.update();
    composer.render();
}

module.exports = init;
