import { createNoise2D } from "simplex-noise";
import { 
    AdditiveBlending, 
    AmbientLight, 
    AnimationMixer, 
    BufferAttribute, 
    BufferGeometry, 
    Color, 
    DirectionalLight, 
    Fog, 
    Mesh, 
    MeshBasicMaterial, 
    MeshStandardMaterial, 
    PlaneGeometry, 
    Points, 
    PointsMaterial, 
    PMREMGenerator,
    Scene, 
    SphereGeometry, 
    Vector3,
    TextureLoader,
    DoubleSide,
    DirectionalLightHelper,
    CameraHelper,
} from "three";
import { EXRLoader, GLTFLoader, Water } from "three/examples/jsm/Addons.js";
import { addNoiseToPlaneGeometry } from "./helpers";
import { BloomEffect, EffectPass, GodRaysEffect, RenderPass } from "postprocessing";
import { randFloat, randInt } from "three/src/math/MathUtils.js";
import { CustomGlitchEffect } from "./PostProcessing/CustomGlitchEffect";

const gltfLoader = new GLTFLoader();
const exrLoader = new EXRLoader();
const TL = new TextureLoader();

export class AxolotlScene {
    _camera
    _scene
    _mixer
    _water
    _sand
    _particles
    _effects

    constructor(renderer, camera) {
        this._pmrem = new PMREMGenerator(renderer);
        this._pmrem.compileEquirectangularShader();
        this._camera = camera;
        this._effects = {};
        this._init();
    }

    getScene() {
        return this._scene;
    }

    _init() {
        this._scene = new Scene();
        this._scene.background = new Color(0x002f4b);
        this._scene.fog = new Fog(0x002f4b, 0, 15);

        gltfLoader.load(
            '/pink_axolotl/scene.gltf',
            (axolotl) => exrLoader.load('/envmap.exr', (texture) => {
                const envMap = this._pmrem.fromEquirectangular(texture).texture;
                this._initAxolotl(axolotl, envMap);
            })
        );

        this._initWater();
        this._initSand();
        this._initParticles();
        this._initLights();
        this._initEvents();
    }

    _initAxolotl(axolotl, envMap) {
        console.debug(axolotl);
        axolotl.scene.rotateY(-Math.PI / 2);
        axolotl.scene.castShadow = true;
        axolotl.scene.traverse((el) => {
            if (el.isMesh) {
                el.castShadow = true;

                if (el.material && el.material.isMeshStandardMaterial) {
                    el.material.roughness = 0.1;
                    el.material.metalness = 0.1;
                    el.material.envMapIntensity = 0.1;
                    el.material.envMap = envMap;
                }
            }
        })
        this._scene.add(axolotl.scene);
        this._mixer = new AnimationMixer(axolotl.scene);
        this._mixer.clipAction(axolotl.animations[3]).play();

    }

    _initWater() {
        const displacementMap = TL.load('/HQ_Noise.jpg');
        const geo = new PlaneGeometry(40, 40, 100, 100);
        const mat = new MeshStandardMaterial({
            color: new Color(0x88ccee),
            transparent: true,
            opacity: 0.8,
            metalness: 0.2,
            roughness: 0.6,
            emissive: new Color(0x113344),
            emissiveIntensity: 0.05,
            depthWrite: false,
            side: DoubleSide,
            displacementMap,
            displacementScale: 0.3,
        });
        const mesh = new Mesh(geo, mat);
        mesh.rotateX(-Math.PI / 2);
        mesh.position.y = 2;
        this._scene.add(mesh);
        this._water = mesh;
    }

    _initSand() {
        const geo = new PlaneGeometry(40, 40, 300, 300);
        const mat = new MeshStandardMaterial({ color: new Color(0xcbbd93)});
        const mesh = new Mesh(geo, mat);
        mesh.rotateX(-Math.PI / 2)
        mesh.translateZ(-4)
        mesh.receiveShadow = true;

        const noise = createNoise2D();
        addNoiseToPlaneGeometry(noise, mesh.geometry, 0);

        this._scene.add(mesh);
        this._sand = mesh;
    }

    _initParticles() {
        const count = 1000;
        const geo = new BufferGeometry();
        const pos = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        for (let i = 0 ; i < count ; i++) {
            pos[i * 3] = randFloat(-10, 10);
            pos[i * 3 + 1] = randFloat(-2.5, 1.5);
            pos[i * 3 + 2] = randFloat(-10, 10);

            const variation = 0.2
            colors[i * 3] = 0.3 + randFloat(-1, 1) * variation;
            colors[i * 3 + 1] = 0.7 + randFloat(-1, 1) * variation;
            colors[i * 3 + 2] = 0.5 + randFloat(-1, 1) * variation;
        }
        geo.setAttribute('position', new BufferAttribute(pos, 3));
        geo.setAttribute('color', new BufferAttribute(colors, 3));

        const mat = new PointsMaterial({
            vertexColors: true,
            size: 0.01,
            transparent: true,
            opacity: 0.8,
            depthWrite: false,
            blending: AdditiveBlending,
        });

        this._particles = new Points(geo, mat);
        this._scene.add(this._particles);
    }

    _initLights() {
        const ambientLight = new AmbientLight(0x226666, 0.5);
        this._scene.add(ambientLight);

        const directionalLight = new DirectionalLight(0x55ccff);
        directionalLight.position.set(10, 15, 10);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 1024;
        directionalLight.shadow.mapSize.height = 1024;
        const directionalLightHelper = new DirectionalLightHelper(directionalLight);

        const size = 2;
        directionalLight.shadow.camera.aspect = 1;
        directionalLight.shadow.camera.top = size;
        directionalLight.shadow.camera.bottom = -size;
        directionalLight.shadow.camera.left = -size;
        directionalLight.shadow.camera.right = size;
        directionalLight.shadow.camera.near = 18;
        directionalLight.shadow.camera.far = 28;
        const shadowCameraHelper = new CameraHelper(directionalLight.shadow.camera);

        this._scene.add(
            directionalLight,
            // directionalLightHelper,
            // shadowCameraHelper,
        );
    }

    _initEvents() {
        window.addEventListener('mousemove', (e) => {
            const x = Math.abs(e.clientX / window.innerWidth - 0.5);
            const y = Math.abs(e.clientY / window.innerHeight - 0.5);
            if (this._effects['bloom']) {
                this._effects['bloom'].intensity = 50 * (1 - x - y);
            }
        })
    }

    addPostProcessing(composer) {
        composer.addPass(new RenderPass(this._scene, this._camera));
        composer.addPass(new EffectPass(
            this._camera,
            new CustomGlitchEffect({
                onLeave: () => {
                    this._water.position.x = 0;
                    this._water.position.z = 0;
                    this._sand.position.x = 0;
                    this._particles.position.x = 0;
                    const p = randFloat(0, 1);
                    if (p < 0.8) {
                        this._camera.position.x = randInt(-4, 4);
                        this._camera.position.z = randInt(-4, 4);
                        this._camera.position.y = randInt(-2, 1);
                    } else if (p < 0.9) {
                        this._camera.position.set(-3, -1, -3);
                    } else {
                        this._camera.position.set(-2.5, -3, -2.5);
                    }
                    this._camera.lookAt(0, 0, 0)
                },
            })
        ));
        this._effects['bloom'] = new BloomEffect({
            intensity: 15,
            luminanceThreshold: 0.3,
            luminanceSmoothing: 0.025,
        });
        composer.addPass(new EffectPass(
            this._camera,
            this._effects['bloom']
        ));
        const godRayLightSource = new Mesh(
            new SphereGeometry(1, 32, 32),
            new MeshBasicMaterial({ color: 0xffffcc })
        );
        godRayLightSource.position.set(10, 15, 10);
        this._scene.add(godRayLightSource);
        composer.addPass(new EffectPass(
            this._camera,
            new GodRaysEffect(
                this._camera,
                godRayLightSource,
                {
                    weight: 0.2,
                    density: 0.9,
                    samples: 30,
                    resolutionScale: 0.20
                }
            )
        ));
    }

    animate(clock) {
        const delta = clock.getDelta();
        
        // Animate axolotl
        if (this._mixer) {
            this._mixer.update(delta);
        }

        // Animate Water
        this._water.translateX(-delta)
        this._water.translateY(-delta)

        // Animate Sand
        this._sand.translateX(-delta);

        // Animate Particles
        this._particles.translateX(-delta);
    }
}