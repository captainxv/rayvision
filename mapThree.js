class MapThreeLayer {
    constructor(map) {
        this.map = map;
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true
        });

        this.init();
    }

    init() {
        // Setup renderer
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.map.getCanvasContainer().appendChild(this.renderer.domElement);
        this.renderer.domElement.style.position = 'absolute';
        this.renderer.domElement.style.top = '0';
        this.renderer.domElement.style.left = '0';
        this.renderer.domElement.style.pointerEvents = 'none';

        // Add lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight.position.set(0, -70, 100).normalize();
        this.scene.add(directionalLight);

        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize(), false);

        // Start animation loop
        this.animate();
    }

    projectToWorld(lat, lng, altitude = 0) {
        const mercator = mapboxgl.MercatorCoordinate.fromLngLat({ lng, lat }, altitude);
        return new THREE.Vector3(
            mercator.x,
            mercator.y,
            mercator.z
        );
    }

    add3DBuilding(coordinates, height) {
        const geometry = new THREE.BoxGeometry(1, 1, height);
        const material = new THREE.MeshPhongMaterial({
            color: 0x666666,
            transparent: true,
            opacity: 0.8
        });
        const building = new THREE.Mesh(geometry, material);
        
        const position = this.projectToWorld(coordinates[1], coordinates[0]);
        building.position.set(position.x, position.y, position.z);
        
        this.scene.add(building);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    update() {
        const center = this.map.getCenter();
        const zoom = this.map.getZoom();
        const bearing = this.map.getBearing();
        const pitch = this.map.getPitch();

        // Update camera
        const matrix = new THREE.Matrix4()
            .makeRotationX(pitch * Math.PI / 180)
            .multiply(new THREE.Matrix4().makeRotationZ(-bearing * Math.PI / 180));

        this.camera.position.set(0, 0, zoom);
        this.camera.lookAt(new THREE.Vector3(0, 0, 0));
        this.camera.projectionMatrix = matrix;
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.update();
        this.renderer.render(this.scene, this.camera);
    }
} 