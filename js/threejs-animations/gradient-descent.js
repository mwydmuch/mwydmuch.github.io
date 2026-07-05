'use strict';

const NAME = "3D visualization of gradient descent algorithms",
      FILE = "gradient-descent.js",
      DESC = `
Three-dimensional visualization of the gradient descent-based optimizers.
This version reuses the logic from the 2D animation while rendering the
optimized function surface using Three.js.

Coded by me (Marek Wydmuch) in 2025.
`;

const GradientDescent2D = require("../animations/gradient-descent");

const SURFACE_RESOLUTION = 96,
      SURFACE_SIZE = 12,
      SURFACE_HEIGHT = 5,
      TRACE_OFFSET = 0.06,
      MIN_CAMERA_RADIUS = 4,
      MAX_CAMERA_RADIUS = 40,
      MIN_CAMERA_PHI = 0.2,
      MAX_CAMERA_PHI = Math.PI / 2 - 0.08;

class GradientDescent3D extends GradientDescent2D {
    constructor (canvas, colors, colorsAlt, bgColor,
                functionToOptimize = "random",
                scale = 1,
                rounding = 5,
                autoRestart = true,
                autoRestartSteps = 1000){
        super(canvas, colors, colorsAlt, bgColor, functionToOptimize,
                scale, rounding, autoRestart, autoRestartSteps, null);
        this.name = NAME;
        this.file = FILE;
        this.description = DESC;

        // Create a WebGL renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, canvas: canvas, alpha: true });
        this.renderer.setSize(canvas.width, canvas.height);

        // Create a new scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(bgColor);

        // Create a camera
        this.camera = new THREE.PerspectiveCamera(50, canvas.width / canvas.height, 0.1, 1000);
        this.camera.position.set(15, 15, 15);
        this.camera.lookAt(0, 0, 0);

        // Add lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight1.position.set(10, 10, 10);
        this.scene.add(directionalLight1);

        const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.3);
        directionalLight2.position.set(-10, -10, -10);
        this.scene.add(directionalLight2);

        // Store references to 3D objects
        this.surfaceMesh = null;
        this.traceMeshes = [];
        this.optimizerMarkers = [];

        // Store trace history for each optimizer
        this.traceHistory = [];
        this.maxTraceLength = 1000;

        // Scene-space mapping for the currently selected objective.
        this.domainRange = 1;
        this.xyScale = 1;
        this.minFuncVal = 0;
        this.maxFuncVal = 1;

        // Lightweight orbit controls for this background animation.
        this.cameraTarget = new THREE.Vector3(0, 0, 0);
        this.cameraRadius = 13;
        this.cameraTheta = Math.PI / 4;
        this.cameraPhi = Math.PI / 3;
        this.autoRotateCamera = true;
        this.pointerState = null;
        this.suppressClickUntil = 0;
        this.raycaster = new THREE.Raycaster();
        this.pointerNdc = new THREE.Vector2();
        this.bindCanvasControls();
        this.updateCameraPosition();
    }

    update(elapsed){
        super.update(elapsed);

        if (this.autoRestart && this.frame >= this.autoRestartSteps) {
            this.start = null;
            this.resize();
            return;
        }

        // Update trace history for each optimizer
        for (let i = 0; i < this.optims.length; ++i) {
            const o = this.optims[i];
            if (!o.enabled) continue;
            const x = o.w[0];
            const y = o.w[1];
            const z = this.func.val([x, y]);

            if (!this.traceHistory[i]) {
                this.traceHistory[i] = [];
            }

            // Only add if valid and different from last point
            if (isFinite(x) && isFinite(y) && isFinite(z) &&
                !isNaN(x) && !isNaN(y) && !isNaN(z) &&
                Math.abs(x) < 1e4 && Math.abs(y) < 1e4) {

                const lastPoint = this.traceHistory[i][this.traceHistory[i].length - 1];
                if (!lastPoint || lastPoint.x !== x || lastPoint.y !== y) {
                    this.traceHistory[i].push({ x, y, z });

                    // Limit trace length
                    if (this.traceHistory[i].length > this.maxTraceLength) {
                        this.traceHistory[i].shift();
                    }
                }
            }
        }

        // Update optimizer markers
        this.updateOptimizerMarkers();

        // Update trace lines
        this.updateTraces();

        if (this.autoRotateCamera) this.cameraTheta += elapsed * 0.00006;
        this.updateCameraPosition();
    }

    draw() {
        this.renderer.render(this.scene, this.camera);
    }

    createSurface() {
        // Remove old surface if exists
        if (this.surfaceMesh) {
            this.scene.remove(this.surfaceMesh);
            this.surfaceMesh.geometry.dispose();
            this.surfaceMesh.material.dispose();
            this.surfaceMesh = null;
        }

        if (!this.func) return;

        const resolution = SURFACE_RESOLUTION;
        const range = this.domainRange;

        // Create geometry
        const geometry = new THREE.BufferGeometry();
        const vertices = [];
        const colors = [];
        const indices = [];

        // Calculate function values and find min/max for color mapping
        let minVal = Infinity;
        let maxVal = -Infinity;
        const valueGrid = [];

        for (let i = 0; i <= resolution; i++) {
            valueGrid[i] = [];
            for (let j = 0; j <= resolution; j++) {
                const x = (i / resolution - 0.5) * 2 * range;
                const y = (j / resolution - 0.5) * 2 * range;
                const z = this.func.val([x, y]);
                valueGrid[i][j] = { x, y, z };

                if (isFinite(z)) {
                    minVal = Math.min(minVal, z);
                    maxVal = Math.max(maxVal, z);
                }
            }
        }

        if (!isFinite(minVal) || !isFinite(maxVal) || minVal === maxVal) {
            minVal = 0;
            maxVal = 1;
        }

        this.minFuncVal = minVal;
        this.maxFuncVal = maxVal;

        // Create vertices with color mapping
        const mainColorRGB = this.hexToRgb(this.mainColor);
        const secColorRGB = this.hexToRgb(this.secColor);

        for (let i = 0; i <= resolution; i++) {
            for (let j = 0; j <= resolution; j++) {
                const { x, y, z } = valueGrid[i][j];
                const value = isFinite(z) ? z : maxVal;
                const height = this.valueToHeight(value);

                vertices.push(x * this.xyScale, height, y * this.xyScale);

                // Color based on height
                const t = this.normalizeValue(value);
                const r = mainColorRGB.r + (secColorRGB.r - mainColorRGB.r) * t;
                const g = mainColorRGB.g + (secColorRGB.g - mainColorRGB.g) * t;
                const b = mainColorRGB.b + (secColorRGB.b - mainColorRGB.b) * t;
                colors.push(r / 255, g / 255, b / 255);
            }
        }

        // Create indices for triangles
        for (let i = 0; i < resolution; i++) {
            for (let j = 0; j < resolution; j++) {
                const idx = i * (resolution + 1) + j;
                const idx2 = (i + 1) * (resolution + 1) + j;

                indices.push(idx, idx2, idx + 1);
                indices.push(idx2, idx2 + 1, idx + 1);
            }
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();

        // Create material with transparency
        const material = new THREE.MeshPhongMaterial({
            vertexColors: true,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.7,
            shininess: 30
        });

        this.surfaceMesh = new THREE.Mesh(geometry, material);
        this.scene.add(this.surfaceMesh);
    }

    normalizeValue(value) {
        const range = this.maxFuncVal - this.minFuncVal;
        if (!isFinite(value) || range <= 0) return 1;
        return Math.max(0, Math.min(1, (value - this.minFuncVal) / range));
    }

    valueToHeight(value) {
        return (this.normalizeValue(value) - 0.5) * SURFACE_HEIGHT;
    }

    pointToVector3(x, y, value, offset = 0) {
        return new THREE.Vector3(
            x * this.xyScale,
            this.valueToHeight(value) + offset,
            y * this.xyScale
        );
    }

    updateCameraPosition() {
        this.cameraPhi = Math.max(MIN_CAMERA_PHI, Math.min(MAX_CAMERA_PHI, this.cameraPhi));
        this.cameraRadius = Math.max(MIN_CAMERA_RADIUS, Math.min(MAX_CAMERA_RADIUS, this.cameraRadius));

        const horizontalRadius = Math.sin(this.cameraPhi) * this.cameraRadius;
        this.camera.position.set(
            this.cameraTarget.x + Math.cos(this.cameraTheta) * horizontalRadius,
            this.cameraTarget.y + Math.cos(this.cameraPhi) * this.cameraRadius,
            this.cameraTarget.z + Math.sin(this.cameraTheta) * horizontalRadius
        );
        this.camera.lookAt(this.cameraTarget);
    }

    bindCanvasControls() {
        this.canvas.addEventListener("contextmenu", (event) => event.preventDefault());

        this.canvas.addEventListener("pointerdown", (event) => {
            const mode = event.shiftKey ? "pan" : (event.button === 2 ? "rotate" : null);
            if (!mode) return;

            event.preventDefault();
            this.autoRotateCamera = false;
            this.pointerState = {
                id: event.pointerId,
                mode,
                x: event.clientX,
                y: event.clientY,
                moved: false
            };
            if (this.canvas.setPointerCapture) this.canvas.setPointerCapture(event.pointerId);
        });

        this.canvas.addEventListener("pointermove", (event) => {
            if (!this.pointerState || this.pointerState.id !== event.pointerId) return;

            event.preventDefault();
            const dx = event.clientX - this.pointerState.x,
                  dy = event.clientY - this.pointerState.y;

            if (Math.abs(dx) + Math.abs(dy) > 3) {
                this.pointerState.moved = true;
                this.suppressClickUntil = Date.now() + 250;
            }

            if (this.pointerState.mode === "rotate") {
                this.cameraTheta -= dx * 0.006;
                this.cameraPhi -= dy * 0.006;
            } else if (this.pointerState.mode === "pan") {
                this.panCamera(dx, dy);
            }

            this.pointerState.x = event.clientX;
            this.pointerState.y = event.clientY;
            this.updateCameraPosition();
        });

        const endPointerAction = (event) => {
            if (!this.pointerState || this.pointerState.id !== event.pointerId) return;
            if (this.pointerState.moved) this.suppressClickUntil = Date.now() + 250;
            if (this.canvas.releasePointerCapture) this.canvas.releasePointerCapture(event.pointerId);
            this.pointerState = null;
        };

        this.canvas.addEventListener("pointerup", endPointerAction);
        this.canvas.addEventListener("pointercancel", endPointerAction);

        this.canvas.addEventListener("wheel", (event) => {
            event.preventDefault();
            this.autoRotateCamera = false;
            this.cameraRadius *= Math.exp(event.deltaY * 0.001);
            this.updateCameraPosition();
        }, { passive: false });
    }

    panCamera(dx, dy) {
        const panScale = this.cameraRadius * 0.0015,
              right = new THREE.Vector3(-Math.sin(this.cameraTheta), 0, Math.cos(this.cameraTheta)),
              up = new THREE.Vector3(0, 1, 0),
              limit = SURFACE_SIZE;

        this.cameraTarget.addScaledVector(right, -dx * panScale);
        this.cameraTarget.addScaledVector(up, dy * panScale);
        this.cameraTarget.x = Math.max(-limit, Math.min(limit, this.cameraTarget.x));
        this.cameraTarget.y = Math.max(-SURFACE_HEIGHT, Math.min(SURFACE_HEIGHT, this.cameraTarget.y));
        this.cameraTarget.z = Math.max(-limit, Math.min(limit, this.cameraTarget.z));
    }

    pickFunctionPoint(cords) {
        if (this.surfaceMesh) {
            this.pointerNdc.set(
                (cords.x / this.canvas.width) * 2 - 1,
                -(cords.y / this.canvas.height) * 2 + 1
            );
            this.raycaster.setFromCamera(this.pointerNdc, this.camera);

            const hits = this.raycaster.intersectObject(this.surfaceMesh);
            if (hits.length > 0) {
                const point = hits[0].point;
                return [point.x / this.xyScale, point.z / this.xyScale];
            }
        }

        return [
            (cords.x / this.canvas.width - 0.5) * 2 * this.domainRange,
            -(cords.y / this.canvas.height - 0.5) * 2 * this.domainRange
        ];
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 255, g: 255, b: 255 };
    }

    updateTraces() {
        // Remove old traces
        for (const mesh of this.traceMeshes) {
            this.scene.remove(mesh);
            mesh.geometry.dispose();
            mesh.material.dispose();
        }
        this.traceMeshes = [];

        // Create new traces
        for (let i = 0; i < this.traceHistory.length; i++) {
            if (!this.optims[i].enabled) continue;
            const trace = this.traceHistory[i];
            if (trace.length < 2) continue;

            const points = trace.map(p => this.pointToVector3(p.x, p.y, p.z, TRACE_OFFSET));
            const geometry = new THREE.BufferGeometry().setFromPoints(points);

            const colorHex = this.colorsAlt[i];
            const material = new THREE.LineBasicMaterial({
                color: colorHex,
                linewidth: 2,
                transparent: false
            });

            const line = new THREE.Line(geometry, material);
            this.scene.add(line);
            this.traceMeshes.push(line);
        }
    }

    updateOptimizerMarkers() {
        // Remove old markers
        for (const marker of this.optimizerMarkers) {
            this.scene.remove(marker);
            marker.geometry.dispose();
            marker.material.dispose();
        }
        this.optimizerMarkers = [];

        // Create new markers
        for (let i = 0; i < this.optims.length; i++) {
            const o = this.optims[i];
            if (!o.enabled) continue;
            const x = o.w[0];
            const y = o.w[1];
            const z = this.func.val([x, y]);

            if (isFinite(x) && isFinite(y) && isFinite(z) &&
                !isNaN(x) && !isNaN(y) && !isNaN(z)) {

                const geometry = new THREE.SphereGeometry(0.14, 16, 16);
                const material = new THREE.MeshPhongMaterial({
                    color: this.colorsAlt[i],
                    emissive: this.colorsAlt[i],
                    emissiveIntensity: 0.5
                });

                const sphere = new THREE.Mesh(geometry, material);
                sphere.position.copy(this.pointToVector3(x, y, z, TRACE_OFFSET * 2));
                this.scene.add(sphere);
                this.optimizerMarkers.push(sphere);
            }
        }
    }

    mouseAction(cords, event) {
        if (event !== "click") return;
        if (Date.now() < this.suppressClickUntil) return;

        this.start = this.pickFunctionPoint(cords);
        this.resize();
    }

    resize(){
        console.log(`Resized 3D gradient descent animation to ${this.canvas.width}x${this.canvas.height}`);

        this.frame = 0;

        // Create the function to optimize without invoking the 2D canvas drawing path.
        const funcCls = this.funcClasses[this.funcNames.indexOf(this.functionToOptimize)];
        const newFunc = new funcCls();
        if (this.func === null || this.func.getName() !== newFunc.getName()) {
            this.func = newFunc;
            this.start = null;
        }

        this.domainRange = this.func.getScale() / this.scale;
        this.xyScale = SURFACE_SIZE / (2 * this.domainRange);

        if (this.start === null) this.start = this.func.getStartPoint();
        for (let o of this.optims) o.init(this.start);

        const width = this.canvas.width,
              height = this.canvas.height;
        this.renderer.setSize(width, height);
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();

        // Recreate surface
        this.createSurface();

        // Reset trace history
        this.traceHistory = [];
        for (let i = 0; i < this.optims.length; i++) {
            this.traceHistory[i] = [];
        }

        this.updateOptimizerMarkers();
        this.updateTraces();
    }

    updateColors(colors, colorsAlt, bgColor){
        this.colors = colors;
        this.bgColor = bgColor;
        this.mainColor = colors[0];
        this.secColor = colors[3];
        this.scene.background = new THREE.Color(bgColor);

        // Recreate surface with new colors
        if (this.func) this.createSurface();
    }

    getCodeUrl(){
        return "https://github.com/mwydmuch/mwydmuch.github.io/blob/master/js/threejs-animations/" + this.file;
    }
}

module.exports = GradientDescent3D;
