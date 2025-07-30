import { createNoise2D } from "simplex-noise";
import { AmbientLight, AnimationMixer, CameraHelper, Color, DirectionalLight, DirectionalLightHelper, Fog, Group, Mesh, MeshStandardMaterial, PlaneGeometry, Scene } from "three";
import { GLTFLoader } from "three/examples/jsm/Addons.js";
import { addNoiseToPlaneGeometry } from "./helpers";

const gltfLoader = new GLTFLoader();

export class AxolotlScene {
    _scene
    _mixer
    _sand

    constructor() {
        this._init();
        this._initLights();
    }

    getScene() {
        return this._scene;
    }

    _init() {
        this._scene = new Scene();
        this._scene.background = new Color(0x002f4b);
        this._scene.fog = new Fog(0x002f4b, 0, 30);

        gltfLoader.load(
            '/pink_axolotl/scene.gltf',
            this._initAxolotl.bind(this)
        );

        this._initSand();
    }

    _initAxolotl(axolotl) {
        console.debug(axolotl);
        axolotl.scene.rotateY(-Math.PI / 2);
        axolotl.scene.castShadow = true;
        axolotl.scene.traverse((el) => {
            if (el.isMesh) {
                el.castShadow = true;
            }
        })
        this._scene.add(axolotl.scene);
        this._mixer = new AnimationMixer(axolotl.scene);
        this._mixer.clipAction(axolotl.animations[3]).play();

    }

    _initSand() {
        const geo = new PlaneGeometry(100, 100, 120, 120);
        const mat = new MeshStandardMaterial({ color: new Color(0xcbbd93)});
        const mesh = new Mesh(geo, mat);
        mesh.rotateX(-Math.PI / 2)
        mesh.translateZ(-3)
        mesh.receiveShadow = true;

        const noise = createNoise2D();
        addNoiseToPlaneGeometry(noise, mesh.geometry, 0);

        this._scene.add(mesh);
        this._sand = mesh;
    }

    _initLights() {
        const ambientLight = new AmbientLight(0x226666, 0.5);
        this._scene.add(ambientLight);

        const directionalLight = new DirectionalLight(0x55ccff);
        directionalLight.position.set(10, 15, 10);
        const directionalLightHelper = new DirectionalLightHelper(directionalLight);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 1024;
        directionalLight.shadow.mapSize.height = 1024;

        const size = 2;
        directionalLight.shadow.camera.aspect = 1;
        directionalLight.shadow.camera.top = size;
        directionalLight.shadow.camera.bottom = -size;
        directionalLight.shadow.camera.left = -size;
        directionalLight.shadow.camera.right = size;
        directionalLight.shadow.camera.near = 18;
        directionalLight.shadow.camera.far = 28;

        const shadowCameraHelper = new CameraHelper(directionalLight.shadow.camera);
        this._scene.add(directionalLight, directionalLightHelper, shadowCameraHelper);
    }

    animate(clock) {
        const delta = clock.getDelta();
        
        // Animate axolotl
        if (this._mixer) {
            this._mixer.update(delta);
        }

        // Animate Sand
        this._sand.translateX(-delta);
    }
}