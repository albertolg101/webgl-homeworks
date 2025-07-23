import { 
    AxesHelper,
    BoxGeometry,
    BufferAttribute,
    BufferGeometry,
    DoubleSide,
    Group,
    MathUtils,
    Mesh,
    MeshBasicMaterial, 
    MeshNormalMaterial, 
    PerspectiveCamera, 
    PlaneGeometry, 
    Quaternion, 
    Scene,
    SphereGeometry,
    TorusKnotGeometry,
    TextureLoader,
    Vector3,
    WebGLRenderer, 
    MeshMatcapMaterial,
    MeshToonMaterial,
    DirectionalLight,
    Color,
    MeshPhongMaterial,
    MeshLambertMaterial,
    MeshStandardMaterial,
    SRGBColorSpace,
    RepeatWrapping
} from "three";
import Stats from "stats.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const TL = new TextureLoader();

export class App {
    _renderer;
    _camera;
    _scene;
    _stats;
    _meshes;
    _controls;

    constructor() {
        this._init();
        this._initEvents();
        this._animate();
    }

    _init() {
        // Renderer
        this._renderer = new WebGLRenderer({
            canvas: document.querySelector("#canvas")
        });

        this._renderer.setSize(window.innerWidth, innerHeight);

        // Camera
        const aspect = window.innerWidth / window.innerHeight;
        this._camera = new PerspectiveCamera(70, aspect, 0.1, 100);
        this._camera.position.x = 3;
        this._camera.position.y = 3;
        this._camera.position.z = 3;
        this._camera.lookAt(0, 0, 0);

        // Scene
        this._scene = new Scene();
        this._scene.background = new Color(0xf0e4d7);

        // Mesh
        this._initMeshes()

        // Light
        this._initLights()

        // Stats
        this._stats = new Stats();
        document.body.appendChild(this._stats.dom);

        const axesHelper = new AxesHelper()
        this._scene.add(axesHelper);

        this._controls = new OrbitControls(
            this._camera, 
            this._renderer.domElement
        );
    }

    _initEvents() {
        window.addEventListener('resize', this._resize.bind(this));
    }

    _initMeshes() {
        this._meshes = new Group();
        const material = new MeshNormalMaterial({
            wireframe: true
        });

        // Cube
        {
            const geometry = new BoxGeometry(1, 1, 1, 3, 3, 3);
            const image = TL.load('https://i.ibb.co/yFkjhY41/map.jpg');
            const material = new MeshBasicMaterial({ map: image });
            const mesh = new Mesh(geometry, material);
            this._meshes.add(mesh);
        }
        // Sphere
        {
            const radius = 0.5;
            const geometry = new SphereGeometry(radius, 32, 32);
            const material = new MeshPhongMaterial({
                color: '#1fbeca',
                shininess: 80,
                specular: 0x383838,
            });
            const mesh = new Mesh(geometry, material);
            mesh.position.y += 0.5 + radius
            this._meshes.add(mesh);
        }
        // Plane
        {
            const geometry = new PlaneGeometry(3, 3, 10, 10);
            const material = new MeshBasicMaterial({ color: "cyan" })
            const mesh = new Mesh(geometry, material);
            mesh.rotation.x -= Math.PI / 2;
            mesh.position.y -= 0.5;
            this._meshes.add(mesh);
        }
        // Custom Mesh
        {
            const vertices = [
                [ 1,  0, -Math.SQRT1_2],
                [ 0,  1,  Math.SQRT1_2],
                [-1,  0, -Math.SQRT1_2],
                [ 0, -1,  Math.SQRT1_2],
            ];


            const triangles = [];

            for (let i = 0 ; i < vertices.length ; i++) {
                for (let j = i + 1 ; j < vertices.length ; j++) {
                    for (let k = j + 1 ; k < vertices.length ; k++) {
                        triangles.push(...vertices[i]);
                        triangles.push(...vertices[j]);
                        triangles.push(...vertices[k]);
                    }
                }
            }

            const colors = [];
            for (let i = 0 ; i < triangles.length ; i += 3) {
                const r = MathUtils.randFloat(0, 1);
                const g = MathUtils.randFloat(0, 1);
                const b = MathUtils.randFloat(0, 1);
                colors.push(r, g, b);
            }

            const geometry = new BufferGeometry();
            const geometryBuff = new BufferAttribute(new Float32Array(triangles), 3);
            geometry.setAttribute("position", geometryBuff);

            const colorBuf = new BufferAttribute(new Float32Array(colors), 3);
            geometry.setAttribute("color", colorBuf);

            const material = new MeshBasicMaterial({
                vertexColors: true,
                side: DoubleSide,
            })
            
            const mesh = new Mesh(geometry, material);

            mesh.scale.setScalar(0.3);
            mesh.position.y += (Math.sqrt(6) /  6) * 0.3 - 0.5;
            mesh.position.x -= 1;
            mesh.position.z += 1;
            mesh.rotateX(-Math.atan2(1, 2 * Math.SQRT1_2));
            // mesh.rotateX(-Math.asin(1/Math.sqrt(3)));

            this._meshes.add(mesh);
        }
        // Torus Knot
        {
            const geometry = new TorusKnotGeometry();

            // MatCap Material
            // const matcapImage = TL.load(
            // 'https://raw.githubusercontent.com/nidorx/matcaps/master/256/5E5855_C6C4CD_C89B67_8F8E98-256px.png'
            // );
            // const material = new MeshMatcapMaterial({ matcapImage });

            // Phong Material
            // const material = new MeshPhongMaterial({
            //     color: '#1fbeca',
            //     shininess: 80,
            //     specular: 0x383838,
            // });

            // Lambert Material
            // const material = new MeshLambertMaterial({
            //     color: 0x1fbeca,
            // });

            // Standard Material
            const image = TL.load('https://i.ibb.co/yFkjhY41/map.jpg');
            const normalMap = TL.load('https://i.postimg.cc/jdrbFwqN/normals.jpg');
            const roughnessMap = TL.load('https://i.postimg.cc/65LXJWTP/roughness.jpg');
            image.colorSpace = SRGBColorSpace;

            const images = [image, normalMap, roughnessMap];
            images.forEach((el) => {
            el.repeat.set(7, 1);
            el.wrapS = el.wrapT = RepeatWrapping;
            });

            const material = new MeshStandardMaterial({
                map: image,
                normalMap,
                roughnessMap,
                displacementMap: roughnessMap,
                displacementScale: 0.0,
                wireframe: false,
                side: DoubleSide,
            });

            const mesh = new Mesh(geometry, material);
            mesh.scale.setScalar(0.3);
            mesh.position.y += 2;
            this._meshes.add(mesh);
        }

        this._scene.add(this._meshes);
    }

    _initLights() {
        const light = new DirectionalLight();
        light.position.x = 5;
        light.intensity = 3;
        this._scene.add(light);
    }

    _resize() {
        // Resize canvas
        this._renderer.setSize(window.innerWidth, window.innerHeight);

        // Resize camera
        this._camera.aspect = window.innerWidth / window.innerHeight; 
        this._camera.updateProjectionMatrix();
    }

    _animate() {
        this._stats.begin();

        // this._meshes.forEach((mesh) => mesh.rotation.y -= 0.01)
        this._meshes.rotation.y += 0.01;

        this._renderer.render(this._scene, this._camera);
        this._stats.end();
        window.requestAnimationFrame(this._animate.bind(this));
    }
}