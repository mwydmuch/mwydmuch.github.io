'use strict';

const NAME = "Test Three.js animation",
      FILE = "test.js",
      DESC = `
Just test animation.
`;

const ThreejsAnimation = require("../threejs-animation");

class TestAnimation extends ThreejsAnimation {
    constructor(canvas, colors, colorsAlt, bgColor) {
        super(canvas, colors, colorsAlt, bgColor, NAME, FILE, DESC);

        // Create a basic material and some geometries
        
        // Create basic lights
        const light = new THREE.AmbientLight(0x222222);
        light.position.set(0, 0, 0);
        this.scene.add(light);

        const pointlight = new THREE.PointLight(0xffffff, 1);     
        pointlight.position.set(200, 200, 200);
        this.scene.add(pointlight);
     
        const geometry = new THREE.BoxGeometry(),
              material = new THREE.MeshPhysicalMaterial(),
              cube = new THREE.Mesh(geometry, material);
        
        cube.position.set(0, 0, 0);
        this.scene.add(cube);
    }

    update(elapsed){
        super.update(elapsed);
        this.scene.traverse((object) => {
            if (object.isMesh) {
                object.rotation.x += 0.01;
                object.rotation.y += 0.01;
            }
        });
    }
}

module.exports = TestAnimation;
