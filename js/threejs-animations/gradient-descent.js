'use strict';

const NAME = "3D visualization of gradient descent algorithms",
      FILE = "gradient-descent.js",
      DESC = `
Three-dimensional visualization of the gradient descent-based optimizers.
This version reuses the logic from the 
[2D animation](https://mwydmuch.pl/animations?animation=gradient-descent).

You can select the starting point by clicking/touching the canvas.
Scroll or pinch to zoom, hold two fingers or the right mouse button
to rotate.

Uses Three.js
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
      MAX_CAMERA_PHI = Math.PI / 2 - 0.08,
      VIEW_SURFACE = "function surface",
      VIEW_ISOLINES = "isolines",
      VIEW_BOTH = "surface and isolines",
      ISOLINE_COUNT = 24,
      ISOLINE_OFFSET = 0.035;

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
        this.renderer.autoClear = false;
        this.renderer.setSize(canvas.width, canvas.height, false);

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
        this.isolineMesh = null;
        this.traceMeshes = [];
        this.optimizerMarkers = [];
        this.optimumMarker = null;
        this.starGeometry = this.createStarGeometry();

        // Store trace history for each optimizer
        this.traceHistory = [];
        this.maxTraceLength = 1000;
        this.functionViewNames = [VIEW_SURFACE, VIEW_ISOLINES, VIEW_BOTH];
        this.functionView = VIEW_BOTH;

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
        this.activePointers = new Map();
        this.gestureState = null;
        this.suppressClickUntil = 0;
        this.raycaster = new THREE.Raycaster();
        this.pointerNdc = new THREE.Vector2();
        this.initTextOverlay();
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
        this.updateTextOverlay();
        this.renderer.clear();
        this.renderer.render(this.scene, this.camera);
        if (this.textMesh) {
            this.renderer.clearDepth();
            this.renderer.render(this.textScene, this.textCamera);
        }
    }

    initTextOverlay() {
        if (typeof document === "undefined" ||
            !THREE.CanvasTexture ||
            !THREE.MeshBasicMaterial ||
            !THREE.OrthographicCamera ||
            !THREE.PlaneGeometry) return;

        this.textCanvas = document.createElement("canvas");
        this.textCtx = this.textCanvas.getContext("2d");
        if (!this.textCtx) return;

        this.textScene = new THREE.Scene();
        this.textCamera = new THREE.OrthographicCamera(0, 1, 1, 0, 0, 10);
        this.textCamera.position.z = 1;
        this.textTexture = new THREE.CanvasTexture(this.textCanvas);
        this.textMaterial = new THREE.MeshBasicMaterial({
            map: this.textTexture,
            transparent: true,
            depthTest: false,
            depthWrite: false
        });
        this.textMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), this.textMaterial);
        this.textScene.add(this.textMesh);
        this.resizeTextOverlay(this.canvas.width, this.canvas.height);
    }

    resizeTextOverlay(width, height) {
        if (!this.textCanvas || !this.textCamera || !this.textMesh) return;

        width = Math.max(1, width);
        height = Math.max(1, height);
        if (this.textCanvas.width !== width) this.textCanvas.width = width;
        if (this.textCanvas.height !== height) this.textCanvas.height = height;

        this.textCamera.left = 0;
        this.textCamera.right = width;
        this.textCamera.top = height;
        this.textCamera.bottom = 0;
        this.textCamera.updateProjectionMatrix();

        this.textMesh.scale.set(width, height, 1);
        this.textMesh.position.set(width / 2, height / 2, 0);
    }

    drawOverlayText(text, x, y) {
        this.textCtx.strokeText(text, x, y);
        this.textCtx.fillText(text, x, y);
    }

    updateTextOverlay() {
        if (!this.textCtx || !this.textTexture || !this.func) return;

        const width = this.canvas.width,
              height = this.canvas.height;
        this.resizeTextOverlay(width, height);

        const ctx = this.textCtx;
        ctx.clearRect(0, 0, width, height);
        let textYOffset = this.drawLegend(ctx);

        this.drawOptimizerLegend(ctx);

        this.textTexture.needsUpdate = true;
    }

    createStarGeometry() {
        if (!THREE.Shape || !THREE.ExtrudeGeometry) return null;

        const shape = new THREE.Shape(),
              outerRadius = 0.26,
              innerRadius = 0.115;
        shape.moveTo(0, -outerRadius);
        for(let i = 1; i < 10; ++i) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius,
                  angle = -Math.PI / 2 + i * Math.PI / 5;
            shape.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
        }
        shape.closePath();

        return new THREE.ExtrudeGeometry(shape, {
            depth: 0.06,
            bevelEnabled: false
        });
    }

    clearFunctionMeshes() {
        if (this.surfaceMesh) {
            this.scene.remove(this.surfaceMesh);
            this.surfaceMesh.geometry.dispose();
            this.surfaceMesh.material.dispose();
            this.surfaceMesh = null;
        }

        if (this.isolineMesh) {
            this.scene.remove(this.isolineMesh);
            this.isolineMesh.geometry.dispose();
            this.isolineMesh.material.dispose();
            this.isolineMesh = null;
        }
    }

    shouldDrawSurface() {
        return this.functionView !== VIEW_ISOLINES;
    }

    shouldDrawIsolines() {
        return this.functionView !== VIEW_SURFACE;
    }

    interpolatedIsolinePoint(a, b, level) {
        const denom = b.z - a.z,
              t = Math.abs(denom) < 1e-12 ? 0.5 : (level - a.z) / denom,
              x = a.x + (b.x - a.x) * t,
              y = a.y + (b.y - a.y) * t;
        return this.pointToVector3(x, y, level, ISOLINE_OFFSET);
    }

    addIsolineIntersection(points, a, b, level) {
        if (!isFinite(a.z) || !isFinite(b.z)) return;
        if ((a.z < level && b.z >= level) || (b.z < level && a.z >= level)) {
            points.push(this.interpolatedIsolinePoint(a, b, level));
        }
    }

    createIsolines(valueGrid) {
        const positions = [],
              resolution = valueGrid.length - 1,
              levels = this.getIsolineLevels(this.minFuncVal, this.maxFuncVal, ISOLINE_COUNT);

        for(const level of levels) {
            for(let i = 0; i < resolution; ++i) {
                for(let j = 0; j < resolution; ++j) {
                    const p00 = valueGrid[i][j],
                          p10 = valueGrid[i + 1][j],
                          p11 = valueGrid[i + 1][j + 1],
                          p01 = valueGrid[i][j + 1],
                          intersections = [];

                    this.addIsolineIntersection(intersections, p00, p10, level);
                    this.addIsolineIntersection(intersections, p10, p11, level);
                    this.addIsolineIntersection(intersections, p11, p01, level);
                    this.addIsolineIntersection(intersections, p01, p00, level);

                    if (intersections.length === 2 || intersections.length === 4) {
                        positions.push(
                            intersections[0].x, intersections[0].y, intersections[0].z,
                            intersections[1].x, intersections[1].y, intersections[1].z
                        );
                        if (intersections.length === 4) {
                            positions.push(
                                intersections[2].x, intersections[2].y, intersections[2].z,
                                intersections[3].x, intersections[3].y, intersections[3].z
                            );
                        }
                    }
                }
            }
        }

        if (positions.length === 0) return;

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));

        const material = new THREE.LineBasicMaterial({
            color: this.colors[0],
            transparent: true,
            opacity: 0.9
        });
        const LineClass = THREE.LineSegments || THREE.Line;
        this.isolineMesh = new LineClass(geometry, material);
        this.scene.add(this.isolineMesh);
    }

    createSurface() {
        this.clearFunctionMeshes();
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

        if (this.shouldDrawSurface()) {
            const material = new THREE.MeshPhongMaterial({
                vertexColors: true,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: this.shouldDrawIsolines() ? 0.58 : 0.72,
                shininess: 30
            });

            this.surfaceMesh = new THREE.Mesh(geometry, material);
            this.scene.add(this.surfaceMesh);
        } else {
            const material = new THREE.MeshPhongMaterial({ visible: false });
            this.surfaceMesh = new THREE.Mesh(geometry, material);
        }

        if (this.shouldDrawIsolines()) this.createIsolines(valueGrid);
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
        if (this.canvas.style) this.canvas.style.touchAction = "none";
        this.canvas.addEventListener("contextmenu", (event) => event.preventDefault());

        const eventToPointer = (event, moved = false) => ({
            id: event.pointerId,
            x: event.clientX,
            y: event.clientY,
            moved
        });

        const getGesturePointers = () => Array.from(this.activePointers.values()).slice(0, 2);

        const getGestureMetrics = () => {
            const pointers = getGesturePointers();
            if (pointers.length < 2) return null;

            const p1 = pointers[0],
                  p2 = pointers[1],
                  dx = p2.x - p1.x,
                  dy = p2.y - p1.y;
            return {
                distance: Math.max(1, Math.sqrt(dx * dx + dy * dy)),
                centerX: (p1.x + p2.x) / 2,
                centerY: (p1.y + p2.y) / 2
            };
        };

        const startGesture = () => {
            const metrics = getGestureMetrics();
            if (!metrics) return;

            this.autoRotateCamera = false;
            this.pointerState = null;
            this.gestureState = {
                distance: metrics.distance,
                centerX: metrics.centerX,
                centerY: metrics.centerY,
                theta: this.cameraTheta,
                phi: this.cameraPhi,
                radius: this.cameraRadius
            };
            this.suppressClickUntil = Date.now() + 250;
        };

        const updateGesture = () => {
            if (!this.gestureState || this.activePointers.size < 2) return false;

            const metrics = getGestureMetrics();
            if (!metrics) return false;

            this.cameraTheta = this.gestureState.theta - (metrics.centerX - this.gestureState.centerX) * 0.006;
            this.cameraPhi = this.gestureState.phi - (metrics.centerY - this.gestureState.centerY) * 0.006;
            this.cameraRadius = this.gestureState.radius * this.gestureState.distance / metrics.distance;
            this.suppressClickUntil = Date.now() + 250;
            this.updateCameraPosition();
            return true;
        };

        this.canvas.addEventListener("pointerdown", (event) => {
            if (event.pointerType === "touch") {
                event.preventDefault();
                this.activePointers.set(event.pointerId, eventToPointer(event));
                if (this.canvas.setPointerCapture) this.canvas.setPointerCapture(event.pointerId);
                if (this.activePointers.size >= 2) startGesture();
                return;
            }

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
            if (this.activePointers.has(event.pointerId)) {
                event.preventDefault();
                const prevPointer = this.activePointers.get(event.pointerId),
                      moved = prevPointer.moved ||
                          Math.abs(event.clientX - prevPointer.x) + Math.abs(event.clientY - prevPointer.y) > 3;
                this.activePointers.set(event.pointerId, eventToPointer(event, moved));
                if (updateGesture()) return;
            }

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
            if (this.activePointers.has(event.pointerId)) {
                const pointer = this.activePointers.get(event.pointerId),
                      shouldSuppressClick = this.gestureState || pointer.moved;
                this.activePointers.delete(event.pointerId);
                if (this.canvas.releasePointerCapture) this.canvas.releasePointerCapture(event.pointerId);
                if (this.activePointers.size < 2) {
                    this.gestureState = null;
                    if (shouldSuppressClick) this.suppressClickUntil = Date.now() + 250;
                } else {
                    startGesture();
                }
                return;
            }

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

    clearOptimumMarker() {
        if (!this.optimumMarker) return;

        this.scene.remove(this.optimumMarker);
        if (this.optimumMarker.material) this.optimumMarker.material.dispose();
        this.optimumMarker = null;
    }

    updateOptimumMarker() {
        this.clearOptimumMarker();
        if (!this.func ||
            !this.func.hasGlobalMin() ||
            !this.starGeometry) return;

        const globalMin = this.func.getGlobalMin(),
              x = globalMin[0],
              y = globalMin[1],
              z = this.func.val(globalMin);
        if (!isFinite(x) || !isFinite(y) || !isFinite(z) ||
            isNaN(x) || isNaN(y) || isNaN(z)) return;

        const material = new THREE.MeshPhongMaterial({
            color: this.optimumColor,
            emissive: this.optimumColor,
            emissiveIntensity: 0.25,
            shininess: 60
        });
        this.optimumMarker = new THREE.Mesh(this.starGeometry, material);
        this.optimumMarker.rotation.x = -Math.PI / 2;
        this.optimumMarker.position.copy(this.pointToVector3(x, y, z, TRACE_OFFSET * 2));
        this.scene.add(this.optimumMarker);
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
        this.renderer.setSize(width, height, false);
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();

        // Recreate surface
        this.createSurface();
        this.updateOptimumMarker();

        // Reset trace history
        this.traceHistory = [];
        for (let i = 0; i < this.optims.length; i++) {
            this.traceHistory[i] = [];
        }

        this.updateOptimizerMarkers();
        this.updateTraces();
    }

    updateColors(colors, colorsAlt, bgColor){
        super.updateColors(colors, colorsAlt, bgColor);

        // Recreate surface with new colors
        if (this.func) {
            this.createSurface();
            this.updateOptimumMarker();
        }
    }

    getSettings() {
        const settings = super.getSettings().filter(setting => setting.prop !== "scale"),
              insertIdx = settings.findIndex(setting => setting.prop === "selectStartingPoint");
        settings.splice(insertIdx + 1, 0, {
            prop: "functionView",
            name: "function drawing",
            icon: '<i class="fa-solid fa-paintbrush"></i>',
            type: "select",
            values: this.functionViewNames,
            toCall: "resize"
        });
        return settings;
    }

    getCodeUrl(){
        return "https://github.com/mwydmuch/mwydmuch.github.io/blob/master/js/threejs-animations" + this.file;
    }
}

module.exports = GradientDescent3D;
