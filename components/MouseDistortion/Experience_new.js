import * as THREE from "three";
import { GUI } from 'lil-gui';

// shaders
import vertexShader from "./shaders/vertex.glsl";
import fragmentShader from "./shaders/fragment.glsl";
import trailVertexShader from "./shaders/trailVertexShader.glsl";
import trailFragmentShader from "./shaders/trailFragmentShader.glsl";
import blurVertexShader from "./shaders/blurVertexShader.glsl";
import blurFragmentShader from "./shaders/blurFragmentShader.glsl";
import compositeVertexShader from "./shaders/compositeVertexShader.glsl";
import compositeFragmentShader from "./shaders/compositeFragmentShader.glsl";

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
    this.previousMouse = new THREE.Vector2();
    this.isMouseActive = true;

    // GUI parameters
    this.guiParams = {
      trailRadius: 0.05,
      fadeSpeed: 0.02,
      trailIntensity: 1.0,
      blurRadius: 2.0,
      trailBlend: 0.5,
      trailColorR: 1.0,
      trailColorG: 0.5,
      trailColorB: 0.0
    };

    this.setConfig();
    this.setScene();
    this.setCamera();
    this.setRenderer();
    this.setupGPGPU();
    this.setLights();
    this.setPlane();
    this.setGUI();

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

  setupGPGPU() {
    // Create render targets for trail simulation
    const rtOptions = {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      type: THREE.FloatType
    };
    
    this.trailRT1 = new THREE.WebGLRenderTarget(this.config.width, this.config.height, rtOptions);
    this.trailRT2 = new THREE.WebGLRenderTarget(this.config.width, this.config.height, rtOptions);
    
    // Blur render targets
    this.blurRT1 = new THREE.WebGLRenderTarget(this.config.width, this.config.height, rtOptions);
    this.blurRT2 = new THREE.WebGLRenderTarget(this.config.width, this.config.height, rtOptions);
    
    // Create scenes for GPGPU
    this.trailScene = new THREE.Scene();
    this.blurScene = new THREE.Scene();
    
    // Orthographic camera for render targets
    this.orthoCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    
    // Create plane geometry for full-screen quad
    this.quadGeometry = new THREE.PlaneGeometry(2, 2);
    
    // Trail material
    this.trailMaterial = new THREE.ShaderMaterial({
      vertexShader: trailVertexShader,
      fragmentShader: trailFragmentShader,
      uniforms: {
        u_previousTrail: { value: this.trailRT1.texture },
        u_mouse: { value: this.mouse },
        u_previousMouse: { value: this.previousMouse },
        u_time: { value: 0 },
        u_trailRadius: { value: this.guiParams.trailRadius },
        u_fadeSpeed: { value: this.guiParams.fadeSpeed },
        u_intensity: { value: this.guiParams.trailIntensity },
        u_isActive: { value: this.isMouseActive }
      }
    });
    
    // Blur materials
    this.blurMaterialH = new THREE.ShaderMaterial({
      vertexShader: blurVertexShader,
      fragmentShader: blurFragmentShader,
      uniforms: {
        u_inputTexture: { value: this.trailRT1.texture },
        u_resolution: { value: new THREE.Vector2(this.config.width, this.config.height) },
        u_blurRadius: { value: this.guiParams.blurRadius },
        u_horizontal: { value: true }
      }
    });
    
    this.blurMaterialV = new THREE.ShaderMaterial({
      vertexShader: blurVertexShader,
      fragmentShader: blurFragmentShader,
      uniforms: {
        u_inputTexture: { value: this.blurRT1.texture },
        u_resolution: { value: new THREE.Vector2(this.config.width, this.config.height) },
        u_blurRadius: { value: this.guiParams.blurRadius },
        u_horizontal: { value: false }
      }
    });
    
    // Create meshes
    this.trailMesh = new THREE.Mesh(this.quadGeometry, this.trailMaterial);
    this.blurMeshH = new THREE.Mesh(this.quadGeometry, this.blurMaterialH);
    this.blurMeshV = new THREE.Mesh(this.quadGeometry, this.blurMaterialV);
    
    this.trailScene.add(this.trailMesh);
    this.blurScene.add(this.blurMeshH);
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
    this.planeGeometry = new THREE.PlaneGeometry(2 * this.config.aspect, 2);
    
    // Create a simple material for when no video is loaded
    this.createDefaultMaterial();
    
    this.plane = new THREE.Mesh(this.planeGeometry, this.planeMaterial);
    this.scene.add(this.plane);
  }

  createDefaultMaterial() {
    this.planeMaterial = new THREE.ShaderMaterial({
      vertexShader: compositeVertexShader,
      fragmentShader: compositeFragmentShader,
      uniforms: {
        u_videoTexture: { value: this.createDefaultTexture() },
        u_trailTexture: { value: this.blurRT2.texture },
        u_trailIntensity: { value: this.guiParams.trailIntensity },
        u_trailBlend: { value: this.guiParams.trailBlend },
        u_trailColor: { 
          value: new THREE.Vector3(
            this.guiParams.trailColorR,
            this.guiParams.trailColorG,
            this.guiParams.trailColorB
          ) 
        }
      }
    });
  }

  createDefaultTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    // Create a gradient background
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#2a2a2a');
    gradient.addColorStop(1, '#1a1a1a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    return texture;
  }

  setGUI() {
    this.gui = new GUI();
    this.gui.title('Mouse Trail Controls');
    
    const trailFolder = this.gui.addFolder('Trail Parameters');
    
    trailFolder
      .add(this.guiParams, 'trailRadius')
      .min(0.01)
      .max(0.2)
      .step(0.005)
      .name('Trail Radius')
      .onChange((value) => {
        this.trailMaterial.uniforms.u_trailRadius.value = value;
      });
    
    trailFolder
      .add(this.guiParams, 'fadeSpeed')
      .min(0.005)
      .max(0.1)
      .step(0.005)
      .name('Fade Speed')
      .onChange((value) => {
        this.trailMaterial.uniforms.u_fadeSpeed.value = value;
      });
    
    trailFolder
      .add(this.guiParams, 'trailIntensity')
      .min(0.1)
      .max(3.0)
      .step(0.1)
      .name('Trail Intensity')
      .onChange((value) => {
        this.trailMaterial.uniforms.u_intensity.value = value;
        this.planeMaterial.uniforms.u_trailIntensity.value = value;
      });
    
    const blurFolder = this.gui.addFolder('Blur Parameters');
    
    blurFolder
      .add(this.guiParams, 'blurRadius')
      .min(0.5)
      .max(5.0)
      .step(0.1)
      .name('Blur Radius')
      .onChange((value) => {
        this.blurMaterialH.uniforms.u_blurRadius.value = value;
        this.blurMaterialV.uniforms.u_blurRadius.value = value;
      });
    
    const colorFolder = this.gui.addFolder('Trail Color');
    
    colorFolder
      .add(this.guiParams, 'trailColorR')
      .min(0.0)
      .max(1.0)
      .step(0.01)
      .name('Red')
      .onChange(() => this.updateTrailColor());
    
    colorFolder
      .add(this.guiParams, 'trailColorG')
      .min(0.0)
      .max(1.0)
      .step(0.01)
      .name('Green')
      .onChange(() => this.updateTrailColor());
    
    colorFolder
      .add(this.guiParams, 'trailColorB')
      .min(0.0)
      .max(1.0)
      .step(0.01)
      .name('Blue')
      .onChange(() => this.updateTrailColor());
    
    colorFolder
      .add(this.guiParams, 'trailBlend')
      .min(0.0)
      .max(1.0)
      .step(0.01)
      .name('Blend Mode')
      .onChange((value) => {
        this.planeMaterial.uniforms.u_trailBlend.value = value;
      });
  }

  updateTrailColor() {
    this.planeMaterial.uniforms.u_trailColor.value.set(
      this.guiParams.trailColorR,
      this.guiParams.trailColorG,
      this.guiParams.trailColorB
    );
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
    
    this.videoTexture = new THREE.VideoTexture(this.video);
    this.videoTexture.minFilter = THREE.LinearFilter;
    this.videoTexture.magFilter = THREE.LinearFilter;
    this.videoTexture.format = THREE.RGBFormat;
    
    // Update the video texture uniform
    this.planeMaterial.uniforms.u_videoTexture.value = this.videoTexture;
    
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
    
    // Store previous mouse position
    this.previousMouse.copy(this.mouse);
    
    // Update current mouse position
    this.mouse.x = (clientX - rect.left) / rect.width;
    this.mouse.y = 1.0 - ((clientY - rect.top) / rect.height);
    
    // Update uniforms
    this.trailMaterial.uniforms.u_mouse.value = this.mouse;
    this.trailMaterial.uniforms.u_previousMouse.value = this.previousMouse;
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
      
      // Resize render targets
      this.trailRT1.setSize(this.config.width, this.config.height);
      this.trailRT2.setSize(this.config.width, this.config.height);
      this.blurRT1.setSize(this.config.width, this.config.height);
      this.blurRT2.setSize(this.config.width, this.config.height);
      
      // Update resolution uniforms
      this.blurMaterialH.uniforms.u_resolution.value.set(this.config.width, this.config.height);
      this.blurMaterialV.uniforms.u_resolution.value.set(this.config.width, this.config.height);
    });
  }

  update() {
    if (this.isDestroyed) return;
    
    // Update time
    this.trailMaterial.uniforms.u_time.value += 0.01;
    this.trailMaterial.uniforms.u_isActive.value = this.isMouseActive;
    
    // 1. Update trail simulation
    this.renderer.setRenderTarget(this.trailRT2);
    this.trailMaterial.uniforms.u_previousTrail.value = this.trailRT1.texture;
    this.renderer.render(this.trailScene, this.orthoCamera);
    
    // 2. Apply horizontal blur
    this.renderer.setRenderTarget(this.blurRT1);
    this.blurMaterialH.uniforms.u_inputTexture.value = this.trailRT2.texture;
    this.blurScene.remove(this.blurMeshV);
    this.blurScene.add(this.blurMeshH);
    this.renderer.render(this.blurScene, this.orthoCamera);
    
    // 3. Apply vertical blur
    this.renderer.setRenderTarget(this.blurRT2);
    this.blurMaterialV.uniforms.u_inputTexture.value = this.blurRT1.texture;
    this.blurScene.remove(this.blurMeshH);
    this.blurScene.add(this.blurMeshV);
    this.renderer.render(this.blurScene, this.orthoCamera);
    
    // 4. Render final scene
    this.renderer.setRenderTarget(null);
    this.planeMaterial.uniforms.u_trailTexture.value = this.blurRT2.texture;
    this.renderer.render(this.scene, this.camera);
    
    // Swap render targets for next frame
    [this.trailRT1, this.trailRT2] = [this.trailRT2, this.trailRT1];
    
    requestAnimationFrame(() => this.update());
  }

  destroy() {
    this.isDestroyed = true;
    
    // Dispose of render targets
    this.trailRT1?.dispose();
    this.trailRT2?.dispose();
    this.blurRT1?.dispose();
    this.blurRT2?.dispose();
    
    // Remove event listeners
    window.removeEventListener("mousemove", this.onMouseMove);
    window.removeEventListener("touchstart", this.onTouchStart);
    window.removeEventListener("touchmove", this.onTouchMove);
    window.removeEventListener("touchend", this.onTouchEnd);
    window.removeEventListener("touchcancel", this.onTouchEnd);
    
    this.renderer.dispose();
    this.gui?.destroy();
  }
}