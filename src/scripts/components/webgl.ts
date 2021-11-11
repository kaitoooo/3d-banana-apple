import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import throttle from 'lodash.throttle';
import { isMobile } from './isMobile';
import { gsap } from 'gsap';

export default class WebGL {
    winSize: {
        [s: string]: number;
    };
    elms: {
        [s: string]: HTMLElement;
    };
    dpr: number;
    three: {
        scene: THREE.Scene;
        renderer: THREE.WebGLRenderer | null;
        clock: THREE.Clock;
        redraw: any;
        camera: THREE.PerspectiveCamera | null;
        cameraFov: number;
        cameraAspect: number;
    };
    mousePos: {
        x: number;
        y: number;
        targetX: number;
        targetY: number;
        moveX: number;
        moveY: number;
    };
    isMobile: boolean;
    meshOptions: Array<{
        obj: string;
        scale: {
            x: number;
            y: number;
            z: number;
        };
        position: {
            x: number;
            y: number;
            z: number;
        };
        rotation: {
            x: number;
            y: number;
            z: number;
        };
    }>;
    flg: {
        [s: string]: boolean;
    };
    constructor() {
        this.winSize = {
            wd: window.innerWidth,
            wh: window.innerHeight,
            halfWd: window.innerWidth * 0.5,
            halfWh: window.innerHeight * 0.5,
        };
        this.elms = {
            canvas: document.querySelector('[data-canvas]'),
            mvTwitterLink: document.querySelector('[data-mv="twitterLink"]'),
            mvHomeLink: document.querySelector('[data-mv="homeLink"]'),
            mvNoteLink: document.querySelector('[data-mv="noteLink"]'),
            mvGitLink: document.querySelector('[data-mv="gitLink"]'),
        };
        // デバイスピクセル比(最大値=2)
        this.dpr = Math.min(window.devicePixelRatio, 2);
        this.three = {
            scene: null,
            renderer: null,
            clock: null,
            redraw: null,
            camera: null,
            cameraFov: 50,
            cameraAspect: window.innerWidth / window.innerHeight,
        };
        this.mousePos = {
            x: 0,
            y: 0,
            targetX: 0,
            targetY: 0,
            moveX: 0.05,
            moveY: 0.02,
        };
        this.isMobile = isMobile();
        // 読み込む3Dモデルの設定
        this.meshOptions = [
            {
                obj: './obj/banana.glb',
                scale: {
                    x: this.isMobile ? 0.6 : 1,
                    y: this.isMobile ? 0.6 : 1,
                    z: this.isMobile ? 0.6 : 1,
                },
                position: {
                    x: this.isMobile ? -0.5 : 2,
                    y: this.isMobile ? 0 : 0,
                    z: this.isMobile ? 1 : 1,
                },
                rotation: {
                    x: 0,
                    y: this.isMobile ? -0.7 : -1,

                    z: 0,
                },
            },
            {
                obj: './obj/apple.glb',
                scale: {
                    x: this.isMobile ? 0.7 : 1,
                    y: this.isMobile ? 0.7 : 1,
                    z: this.isMobile ? 0.7 : 1,
                },
                position: {
                    x: this.isMobile ? 0.6 : 3.6,
                    y: this.isMobile ? -0.6 : -1,
                    z: this.isMobile ? 1 : 2,
                },
                rotation: {
                    x: 0.1,
                    y: 0,
                    z: -0.2,
                },
            },
        ];
        this.flg = {
            loaded: false,
        };
        this.init();
    }
    init(): void {
        this.initScene();
        this.initCamera();
        this.initClock();
        this.initRenderer();
        this.setLoading();
        this.setLight();
        this.handleEvents();
    }
    initScene(): void {
        // シーンを作成
        this.three.scene = new THREE.Scene();
    }
    initCamera(): void {
        // カメラを作成(視野角, スペクト比, near, far)
        this.three.camera = new THREE.PerspectiveCamera(this.three.cameraFov, this.winSize.wd / this.winSize.wh, this.three.cameraAspect, 1000);
        this.three.camera.position.set(0, 0, 9);
    }
    initClock(): void {
        // 時間計測用
        this.three.clock = new THREE.Clock();
    }
    initRenderer(): void {
        // レンダラーを作成
        this.three.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true, //背景色を設定しないとき、背景を透明にする
        });
        // this.three.renderer.setClearColor(0xffffff); //背景色
        this.three.renderer.setPixelRatio(this.dpr); // retina対応
        this.three.renderer.setSize(this.winSize.wd, this.winSize.wh); // 画面サイズをセット
        this.three.renderer.physicallyCorrectLights = true;
        this.three.renderer.shadowMap.enabled = true; // シャドウを有効にする
        this.three.renderer.shadowMap.type = THREE.PCFSoftShadowMap; // PCFShadowMapの結果から更に隣り合う影との間を線形補間して描画する
        this.elms.canvas.appendChild(this.three.renderer.domElement); // HTMLにcanvasを追加
        this.three.renderer.outputEncoding = THREE.GammaEncoding; // 出力エンコーディングを定義
    }
    setLight() {
        // 環境光源(色, 光の強さ)
        const ambientLight = new THREE.AmbientLight(0x666666);
        this.three.scene.add(ambientLight);

        const positionArr = [
            [0, 5, 0, 2],
            [-5, 3, 2, 2],
            [5, 3, 2, 2],
            [0, 3, 5, 1],
            [0, 3, -5, 2],
        ];

        for (let i = 0; i < positionArr.length; i++) {
            // 平行光源(色, 光の強さ)
            const directionalLight = new THREE.DirectionalLight(0xffffff, positionArr[i][3]);
            directionalLight.position.set(positionArr[i][0], positionArr[i][1], positionArr[i][2]);

            if (i == 0 || i == 2 || i == 3) {
                directionalLight.castShadow = true;
                directionalLight.shadow.camera.top = 50;
                directionalLight.shadow.camera.bottom = -50;
                directionalLight.shadow.camera.right = 50;
                directionalLight.shadow.camera.left = -50;
                directionalLight.shadow.mapSize.set(4096, 4096);
            }
            this.three.scene.add(directionalLight);
        }
    }
    setLoading() {
        // glTF形式の3Dモデルを読み込む
        const loader = new GLTFLoader();
        for (let i = 0; i < this.meshOptions.length; i++) {
            const m = this.meshOptions[i];
            const obj = m.obj;
            loader.load(obj, (data) => {
                const gltfData = data.scene;
                // サイズの設定
                gltfData.scale.set(m.scale.x, m.scale.y, m.scale.z);
                // 角度の設定
                gltfData.rotation.set(m.rotation.x, m.rotation.y, m.rotation.z);
                // 位置の設定
                gltfData.position.set(m.position.x, m.position.y, m.position.z);
                this.three.scene.add(gltfData);
                this.flg.loaded = true;
                // レンダリングを開始する
                this.rendering();
            });
        }
    }
    rendering(): void {
        // マウスの位置を取得
        this.mousePos.x += (this.mousePos.targetX - this.mousePos.x) * this.mousePos.moveX;
        this.mousePos.y += (this.mousePos.targetY - this.mousePos.y) * this.mousePos.moveY;
        // カメラの位置と回転を調整
        this.three.camera.rotation.x = this.mousePos.y * 0.04;
        this.three.camera.rotation.y = this.mousePos.x * 0.09;

        // レンダリングを実行
        requestAnimationFrame(this.rendering.bind(this));
        this.three.renderer.render(this.three.scene, this.three.camera);
        this.animate(); // アニメーション開始
    }
    animate() {
        gsap.config({
            force3D: true,
        });
        const tl = gsap.timeline({
            paused: true,
            defaults: {
                duration: 0.5,
                ease: 'power2.easeOut',
            },
        });
        tl.to(this.elms.canvas, {
            duration: 1,
            opacity: 1,
            ease: 'power2.ease',
        });
        tl.to(
            this.elms.mvTwitterLink,
            {
                opacity: 1,
            },
            1
        );
        tl.to(
            this.elms.mvHomeLink,
            {
                y: 0,
            },
            1
        );
        tl.to(
            this.elms.mvNoteLink,
            {
                y: 0,
            },
            1
        );
        tl.to(
            this.elms.mvGitLink,
            {
                y: 0,
            },
            1
        );
        tl.play();
    }
    handleEvents(): void {
        // マウスイベント
        window.addEventListener('pointermove', this.handleMouse.bind(this), false);

        // リサイズイベント登録
        window.addEventListener(
            'resize',
            throttle(() => {
                this.handleResize();
            }, 100),
            false
        );
    }
    handleMouse(event: any) {
        this.mousePos.targetX = (this.winSize.halfWd - event.clientX) / this.winSize.halfWd;
        this.mousePos.targetY = (this.winSize.halfWh - event.clientY) / this.winSize.halfWh;
    }
    handleResize(): void {
        // リサイズ処理
        this.winSize = {
            wd: window.innerWidth,
            wh: window.innerHeight,
            halfWd: window.innerWidth * 0.5,
            halfWh: window.innerHeight * 0.5,
        };
        this.dpr = Math.min(window.devicePixelRatio, 2);
        if (this.three.camera) {
            // カメラの位置更新
            this.three.camera.aspect = this.winSize.wd / this.winSize.wh;
            this.three.camera.updateProjectionMatrix();
        }
        if (this.three.renderer) {
            // レンダラーの大きさ更新
            this.three.renderer.setSize(this.winSize.wd, this.winSize.wh);
            this.three.renderer.setPixelRatio(this.dpr);
        }
    }
}
