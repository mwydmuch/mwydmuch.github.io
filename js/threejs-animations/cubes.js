'use strict';

const NAME = "Cubes animation",
      FILE = "cubes.js",
      DESC = `
Just cubes animation.
`;

const ThreejsAnimation = require("../threejs-animation");

class CubesAnimation extends ThreejsAnimation {
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

        this.cubeCount = 1000;
     
        const geometry = new THREE.BoxGeometry(),
              material = new THREE.MeshPhysicalMaterial();
        this.cubes = new THREE.InstancedMesh(geometry, material, this.cubeCount);
        this.cubes.instanceMatrix.setUsage( THREE.DynamicDrawUsage ); // will be updated every frame        
        this.scene.add(this.cubes);
    }

    update(elapsed){
        super.update(elapsed);

        let dummy = new THREE.Object3D();
        for(let i = 0; i < this.cubeCount; ++i){
            dummy.position.set(i , i , i);
            dummy.rotation.x = Math.sin(i + this.time);
            //dummy.rotation.z = dummy.rotation.y * 2;
            dummy.updateMatrix();
            this.cubes.setMatrixAt(i, dummy.matrix);
        }
        this.cubes.instanceMatrix.needsUpdate = true;
    }
}

module.exports = CubesAnimation;
