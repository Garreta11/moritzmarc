import * as THREE from "three";
import { GUI } from 'lil-gui';
import vertexShader from "./shaders/vertex.glsl";
import fragmentShader from "./shaders/fragment.glsl";

export default class Experience {

  static instance

  constructor(container, videoSrc = null) {
    if (Experience.instance) {
      return Experience.instance;
    }
    Experience.instance = this;

    this.container = container;
    this.videoSrc = videoSrc;

    this.mouse = new THREE.Vector2();

    // GUI parameters
    this.guiParams = {
      rippleStrength: 0.1,
      rippleSpeed: 2.5,
      rippleRadius: 0.15
    };

    this.setConfig();
    this.setScene();
    this.setCamera();
    this.setRenderer();
    this.setLights();
    this.setPlane();
    // this.setGUI();

    if (this.videoSrc) {
      this.loadVideo(this.videoSrc);
    }

    // Bind event handlers
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onTouchStart = this.onTouchStart.bind(this);
    this.onTouchMove = this.onTouchMove.bind(this);
    this.onTouchEnd = this.onTouchEnd.bind(this);
    
    // Mouse and Touch events
    window.addEventListener("mousemove", this.onMouseMove);
    window.addEventListener("touchstart", this.onTouchStart, { passive: false });
    window.addEventListener("touchmove", this.onTouchMove, { passive: false });
    window.addEventListener("touchend", this.onTouchEnd, { passive: false });
    window.addEventListener("touchcancel", this.onTouchEnd, { passive: false });

    // resize
    this.onResize();
    // update
    this.update();

  }

  setConfig() {
    this.config = {};

    // Pixel ratio
    this.config.pixelRatio = Math.min(Math.max(window.devicePixelRatio, 1), 2);

    // Width and height
    const boundings = this.container.getBoundingClientRect();
    this.config.width = boundings.width;
    this.config.height = boundings.height || window.innerHeight;

    // Compute aspect ratio
    this.config.aspect = this.config.width / this.config.height;
  }

  setScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x222222);
  }

  setCamera() {
    const aspect = this.config.aspect;
    const frustumHeight = 2;
    const frustumWidth = frustumHeight * aspect;

    this.camera = new THREE.OrthographicCamera(
      -frustumWidth / 2,
      frustumWidth / 2,
      frustumHeight / 2,
      -frustumHeight / 2,
      0.1,
      1000
    );

    this.camera.position.z = 1; // Move the camera forward to see the plane

    this.scene.add(this.camera);
  }

  setRenderer() {
    this.renderer = new THREE.WebGLRenderer({ 
      alpha: true,
      antialias: true 
    });
    this.renderer.setSize(this.config.width, this.config.height);
    this.renderer.setPixelRatio(this.config.pixelRatio);
    this.renderer.render(this.scene, this.camera);

    this.container.appendChild(this.renderer.domElement);
  }

  setLights() {
    // Add ambient light for better visibility
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(this.ambientLight);
    
    // Add directional light
    this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    this.directionalLight.position.set(1, 1, 1);
    this.scene.add(this.directionalLight);
  }

  setPlane() {
    this.planeGeometry = new THREE.PlaneGeometry(2 * this.config.aspect, 2); // Made it larger
    this.planeMaterial = new THREE.ShaderMaterial({
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      uniforms: {
        u_mouse: { value: this.mouse },
        u_time: { value: 0 },
        u_rippleStrength: { value: this.guiParams.rippleStrength },
        u_rippleSpeed: { value: this.guiParams.rippleSpeed },
        u_rippleRadius: { value: this.guiParams.rippleRadius }
      }
    });
    this.plane = new THREE.Mesh(this.planeGeometry, this.planeMaterial);
    this.scene.add(this.plane);
  }

  setGUI() {
    this.gui = new GUI();
    this.gui.title('Water Effect Controls');
    
    // Create a folder for ripple controls
    const rippleFolder = this.gui.addFolder('Ripple Parameters');
    
    // Ripple Strength control
    rippleFolder
      .add(this.guiParams, 'rippleStrength')
      .min(0.0)
      .max(0.2)
      .step(0.005)
      .name('Ripple Strength')
      .onChange((value) => {
        this.planeMaterial.uniforms.u_rippleStrength.value = value;
      });
    
    // Ripple Speed control
    rippleFolder
      .add(this.guiParams, 'rippleSpeed')
      .min(0.5)
      .max(8.0)
      .step(0.1)
      .name('Ripple Speed')
      .onChange((value) => {
        this.planeMaterial.uniforms.u_rippleSpeed.value = value;
      });
    
    // Ripple Radius control
    rippleFolder
      .add(this.guiParams, 'rippleRadius')
      .min(0.05)
      .max(1.0)
      .step(0.05)
      .name('Ripple Radius')
      .onChange((value) => {
        this.planeMaterial.uniforms.u_rippleRadius.value = value;
      });
    
    // Open the folder by default
    rippleFolder.open();
    
    // Add a reset button
    this.gui.add({
      reset: () => {
        this.guiParams.rippleStrength = 0.05;
        this.guiParams.rippleSpeed = 2.0;
        this.guiParams.rippleRadius = 0.2;
        
        this.planeMaterial.uniforms.u_rippleStrength.value = this.guiParams.rippleStrength;
        this.planeMaterial.uniforms.u_rippleSpeed.value = this.guiParams.rippleSpeed;
        this.planeMaterial.uniforms.u_rippleRadius.value = this.guiParams.rippleRadius;
        
        this.gui.updateDisplay();
      }
    }, 'reset').name('Reset to Defaults');
  }

  loadVideo(videoSrc) {
    // Create video element
    this.video = document.createElement('video');
    this.video.src = videoSrc;
    this.video.crossOrigin = 'anonymous';
    this.video.loop = true;
    this.video.muted = true; // Needed for autoplay in browsers
    this.video.playsInline = true; // For mobile devices
    
    // Video event handlers
    this.video.addEventListener('loadeddata', () => {
      console.log('Video loaded successfully');
      this.createVideoTexture();
    });
    
    this.video.addEventListener('error', (e) => {
      console.error('Error loading video:', e);
    });
    
    // Try to load and play the video
    this.video.load();
  }

  createVideoTexture() {
    if (!this.video) return;
    
    // Create video texture
    this.videoTexture = new THREE.VideoTexture(this.video);
    this.videoTexture.minFilter = THREE.LinearFilter;
    this.videoTexture.magFilter = THREE.LinearFilter;
    this.videoTexture.format = THREE.RGBFormat;
    
    // Update material with video texture
    this.planeMaterial.dispose(); // Clean up old material
    this.planeMaterial = new THREE.ShaderMaterial({
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      uniforms: {
        u_videoTexture: { value: this.videoTexture },
        u_mouse: { value: this.mouse },
        u_time: { value: 0 },
        u_rippleStrength: { value: this.guiParams.rippleStrength },
        u_rippleSpeed: { value: this.guiParams.rippleSpeed },
        u_rippleRadius: { value: this.guiParams.rippleRadius }
      }
    });
    
    this.plane.material = this.planeMaterial;
    
    // Adjust plane size to match video aspect ratio
    this.adjustPlaneToVideoAspect();
    
    console.log('Video texture applied to plane');
  }

  adjustPlaneToVideoAspect() {
    if (!this.video) return;
    
    const videoAspect = this.video.videoWidth / this.video.videoHeight;
    const maxSize = 1.2; // Maximum size for the plane
    
    let width, height;
    if (videoAspect > 1) {
      // Landscape video
      width = maxSize;
      height = maxSize / videoAspect;
    } else {
      // Portrait video
      height = maxSize;
      width = maxSize * videoAspect;
    }
    
    // this.plane.scale.set(width / 1.5, height / 1.5, 1);

    this.video.play();
  }

  updatePointerPosition(clientX, clientY) {
    const rect = this.container.getBoundingClientRect();
    this.mouse.x = (clientX - rect.left) / rect.width;
    this.mouse.y = 1.0 - ((clientY - rect.top) / rect.height);
    
    this.planeMaterial.uniforms.u_mouse.value = this.mouse;
  }

  onMouseMove(event) {
    this.updatePointerPosition(event.clientX, event.clientY);
  }

  onTouchStart(event) {
    // Prevent default to avoid scrolling and other touch behaviors
    event.preventDefault();
    
    if (event.touches.length > 0) {
      const touch = event.touches[0];
      this.updatePointerPosition(touch.clientX, touch.clientY);
    }
  }

  onTouchMove(event) {
    // Prevent default to avoid scrolling
    event.preventDefault();
    
    if (event.touches.length > 0) {
      const touch = event.touches[0];
      this.updatePointerPosition(touch.clientX, touch.clientY);
    }
  }

  onTouchEnd(event) {
    // Prevent default
    event.preventDefault();
    
    // Optional: You could add some behavior when touch ends
    // For example, gradually fade out the ripple effect
    // or reset the mouse position to a neutral state
  }

  onResize() {
    window.addEventListener("resize", () => {
      this.setConfig();
      this.renderer.setSize(this.config.width, this.config.height);
      this.camera.aspect = this.config.aspect;
      this.camera.updateProjectionMatrix();
    });
  }

  update() {
    if (this.isDestroyed) return;

    this.planeMaterial.uniforms.u_time.value += 0.01;
    this.planeMaterial.uniforms.u_mouse.value = this.mouse;
    
    this.renderer.render(this.scene, this.camera);
    
    // Continue the animation loop
    requestAnimationFrame(() => this.update());
  }

  destroy() {
    this.renderer.dispose();
  }
}