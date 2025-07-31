import { 
    Clock,
    PerspectiveCamera, 
    Scene, 
    WebGLRenderer 
} from "three";
import Stats from "stats.js";
import { OrbitControls } from "three/examples/jsm/Addons.js";
import { AxolotlScene } from "./AxolotlScene";
import { EffectComposer } from "postprocessing";

export class App {
    _renderer;
    _camera;
    _scene;
    _composer;
    _clock;
    _stats;
    _controls;

    constructor() {
        this._init();
        this._initScene();
        this._initEvents();
        this._animate();
    }

    _init() {
        this._renderer = new WebGLRenderer({
            canvas: document.querySelector("#canvas")
        });
        this._renderer.shadowMap.enabled = true;
        this._composer = new EffectComposer(this._renderer);

        this._camera = new PerspectiveCamera(70, undefined, 0.1, 10000);
        // this._camera.position.set(2, 2, 2);
        this._camera.position.set(-4, 1, -4);
        this._camera.lookAt(0, 0, 0);

        this._resize();

        this._clock = new Clock();
        this._clock.autoStart = true;

        this._stats = new Stats();
        document.body.appendChild(this._stats.dom);

        this._controls = new OrbitControls(
            this._camera,
            this._renderer.domElement
        );
    }

    _initScene() {
        this._scene = new AxolotlScene(this._renderer, this._camera);
        this._scene.addPostProcessing(this._composer);
    }

    _initEvents() {
        window.addEventListener('resize', this._resize.bind(this));
    }

    _resize() {
        // Resize canvas
        this._renderer.setSize(window.innerWidth, window.innerHeight);
        this._composer.setSize(window.innerWidth, window.innerHeight);

        // Set device pixel ratio
        this._renderer.setPixelRatio(window.devicePixelRatio);

        // Resize camera
        this._camera.aspect = window.innerWidth / window.innerHeight; 
        this._camera.updateProjectionMatrix();
    }

    _animate() {
        this._stats.begin();

        this._scene.animate(this._clock);

        // this._renderer.render(this._scene.getScene(), this._camera);
        this._composer.render();

        this._stats.end();
        window.requestAnimationFrame(this._animate.bind(this));
    }
}