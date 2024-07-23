'use strict';

/*
 * Base class for the background animations that use three.js
 */

const Animation = require("./animation");

class ThreejsAnimation extends Animation {
    constructor(canvas, colors, colorsAlt, bgColor,
                name = "",
                file = "",
                description = "",
                seed = "random") {
        super(canvas, colors, colorsAlt, bgColor, name, file, description, seed, null);

        // Create a WebGL renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, canvas: canvas });

        // Set the size of the renderer to the size of the window
        this.renderer.setSize(canvas.width / canvas.height);
        
        // Create a new scene
        this.scene = new THREE.Scene();

        // Create a camera, which determines what we'll see when we render the scene
        this.camera = new THREE.PerspectiveCamera(75, canvas.width / canvas.height, 1, 1000);
        this.camera.position.set(0, 0, 5);

        //this.renderer.setClearColor(0xFFFFFF);
    }

    update(elapsed){
        super.update(elapsed);
    }

    draw() {
        this.renderer.render(this.scene, this.camera);
    }

    resize(){
        const width = this.canvas.width,
              height = this.canvas.height;
        this.renderer.setSize(width, height);
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
    }

    getCodeUrl(){
        return "https://github.com/mwydmuch/mwydmuch.github.io/blob/master/js/threejs-animations" + this.file;
    }
}

module.exports = ThreejsAnimation;
