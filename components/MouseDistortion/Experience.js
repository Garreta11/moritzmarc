import * as THREE from "three";
import { GUI } from 'lil-gui';
import vertexShader from "./shaders/vertex.glsl";
import fragmentShader from "./shaders/fragment.glsl";

export default class Experience {
  static instance = null;

  constructor(container, videoSrc = null) {
    // Singleton pattern implementation
    if (Experience.instance) {
      return Experience.instance;
    }
    Experience.instance = this;

    // Core properties
    this.container = container;
    this.videoSrc = videoSrc;
    this.isDestroyed = false;
    this.animationId = null;

    // Mouse/touch tracking
    this.mouse = new THREE.Vector2(0.5, 0.5);
    this.targetMouse = new THREE.Vector2(0.5, 0.5);
    this.isInteracting = false;
    this.isMouseMoving = false;
    this.lastInteractionTime = 0;

    this.mouseIdleProgress = 1;
    this.mouseDecayDuration = 800; // 0.8 seconds

    // Performance tracking
    this.frameCount = 0;
    this.lastFPSUpdate = performance.now();
    this.fps = 60;

    // GUI parameters with better defaults
    this.guiParams = {
      rippleStrength: 0.04,
      rippleSpeed: 0.0,
      rippleRadius: 0.18,
      mouseSmoothing: 0.08,
      autoPlay: true,
      showStats: false,
      backgroundColor: '#1a1a1a'
    };

    // Initialize components
    this.init();
  }

  async init() {
    try {
      this.setConfig();
      this.setScene();
      this.setCamera();
      this.setRenderer();
      this.setLights();
      this.setPlane();
      this.setupEventListeners();
      this.setupResizeObserver();

      //this.createGUI();
      
      // Load video if provided
      if (this.videoSrc) {
        await this.loadVideo(this.videoSrc);
      }

      // Start render loop
      this.startRenderLoop();
      
      console.log('Experience initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Experience:', error);
    }
  }

  setConfig() {
    this.config = {
      pixelRatio: Math.min(window.devicePixelRatio || 1, 2),
      maxPixelRatio: 2,
      antialias: window.devicePixelRatio <= 1
    };

    this.updateSize();
  }

  updateSize() {
    const bounds = this.container.getBoundingClientRect();
    this.config.width = bounds.width || window.innerWidth;
    this.config.height = bounds.height || window.innerHeight;
    this.config.aspect = this.config.width / this.config.height;
  }

  setScene() {
    this.scene = new THREE.Scene();
    this.updateBackgroundColor();
  }

  updateBackgroundColor() {
    this.scene.background = new THREE.Color(this.guiParams.backgroundColor);
  }

  setCamera() {
    const { aspect } = this.config;
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

    this.camera.position.set(0, 0, 1);
    this.scene.add(this.camera);
  }

  setRenderer() {
    this.renderer = new THREE.WebGLRenderer({ 
      alpha: true,
      antialias: this.config.antialias,
      powerPreference: 'high-performance'
    });
    
    this.renderer.setSize(this.config.width, this.config.height);
    this.renderer.setPixelRatio(this.config.pixelRatio);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    
    this.container.appendChild(this.renderer.domElement);
  }

  setLights() {
    // Simplified lighting for better performance
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    this.scene.add(this.ambientLight);
  }

  setPlane() {
    // Create geometry with appropriate segments for shader effects
    this.planeGeometry = new THREE.PlaneGeometry(
      2 * this.config.aspect, 
      2, 
      64, // Add segments for better shader quality
      64
    );
    
    this.createPlaneMaterial();
    this.plane = new THREE.Mesh(this.planeGeometry, this.planeMaterial);
    this.scene.add(this.plane);
  }

  createPlaneMaterial(videoTexture = null) {
    const uniforms = {
      u_mouse: { value: this.mouse },
      u_time: { value: 0 },
      u_resolution: { value: new THREE.Vector2(this.config.width, this.config.height) },
      u_rippleStrength: { value: this.guiParams.rippleStrength },
      u_rippleSpeed: { value: this.guiParams.rippleSpeed },
      u_rippleRadius: { value: this.guiParams.rippleRadius },
      u_rippleIntensity: { value: 0.0 },
    };

    if (videoTexture) {
      uniforms.u_videoTexture = { value: videoTexture };
      uniforms.u_hasVideo = { value: 1.0 };
    } else {
      uniforms.u_hasVideo = { value: 0.0 };
    }

    if (this.planeMaterial) {
      this.planeMaterial.dispose();
    }

    this.planeMaterial = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      transparent: true
    });
  }

  async loadVideo(videoSrc) {
    return new Promise((resolve, reject) => {
      this.video = document.createElement('video');
      this.video.src = videoSrc;
      this.video.crossOrigin = 'anonymous';
      this.video.loop = true;
      this.video.muted = true;
      this.video.playsInline = true;
      this.video.preload = 'metadata';

      const onLoadedData = () => {
        this.createVideoTexture();
        this.video.removeEventListener('loadeddata', onLoadedData);
        this.video.removeEventListener('error', onError);
        resolve();
      };

      const onError = (error) => {
        console.error('Video loading error:', error);
        this.video.removeEventListener('loadeddata', onLoadedData);
        this.video.removeEventListener('error', onError);
        reject(error);
      };

      this.video.addEventListener('loadeddata', onLoadedData);
      this.video.addEventListener('error', onError);
      this.video.load();
    });
  }

  createVideoTexture() {
    if (!this.video) return;

    this.videoTexture = new THREE.VideoTexture(this.video);
    this.videoTexture.minFilter = THREE.LinearFilter;
    this.videoTexture.magFilter = THREE.LinearFilter;
    this.videoTexture.format = THREE.RGBFormat;
    this.videoTexture.colorSpace = THREE.SRGBColorSpace;
    
    this.createPlaneMaterial(this.videoTexture);
    this.plane.material = this.planeMaterial;
    
    if (this.guiParams.autoPlay) {
      this.playVideo();
    }
  }

  playVideo() {
    if (this.video && this.video.paused) {
      this.video.play().catch(error => {
        console.warn('Video autoplay failed:', error);
      });
    }
  }

  pauseVideo() {
    if (this.video && !this.video.paused) {
      this.video.pause();
    }
  }

  setupEventListeners() {
    // Bind methods to maintain context
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchMove = this.handleTouchMove.bind(this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);

    // Mouse events
    this.container.addEventListener('mousemove', this.handleMouseMove, { passive: true });
    this.container.addEventListener('mouseenter', () => this.isInteracting = true);
    this.container.addEventListener('mouseleave', () => this.isInteracting = false);

    // Touch events
    this.container.addEventListener('touchstart', this.handleTouchStart, { passive: false });
    this.container.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    this.container.addEventListener('touchend', this.handleTouchEnd, { passive: true });
    this.container.addEventListener('touchcancel', this.handleTouchEnd, { passive: true });

    // Visibility change for performance optimization
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  setupResizeObserver() {
    if ('ResizeObserver' in window) {
      this.resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          if (entry.target === this.container) {
            this.handleResize();
          }
        }
      });
      this.resizeObserver.observe(this.container);
    } else {
      // Fallback for older browsers
      window.addEventListener('resize', this.handleResize.bind(this));
    }
  }

  handleResize() {
    this.updateSize();
    
    if (this.renderer && this.camera) {
      this.renderer.setSize(this.config.width, this.config.height);
      
      // Update camera
      const { aspect } = this.config;
      const frustumHeight = 2;
      const frustumWidth = frustumHeight * aspect;
      
      this.camera.left = -frustumWidth / 2;
      this.camera.right = frustumWidth / 2;
      this.camera.top = frustumHeight / 2;
      this.camera.bottom = -frustumHeight / 2;
      this.camera.updateProjectionMatrix();

      // Update geometry
      if (this.planeGeometry) {
        this.planeGeometry.dispose();
        this.planeGeometry = new THREE.PlaneGeometry(2 * aspect, 2, 64, 64);
        this.plane.geometry = this.planeGeometry;
      }

      // Update shader uniforms
      if (this.planeMaterial?.uniforms?.u_resolution) {
        this.planeMaterial.uniforms.u_resolution.value.set(
          this.config.width, 
          this.config.height
        );
      }
    }
  }
  
  updatePointerPosition(clientX, clientY) {
    const rect = this.container.getBoundingClientRect();
    const x = (clientX - rect.left) / rect.width;
    const y = 1.0 - ((clientY - rect.top) / rect.height);
    
    this.targetMouse.set(
      THREE.MathUtils.clamp(x, 0, 1),
      THREE.MathUtils.clamp(y, 0, 1)
    );
    
    this.isInteracting = true;
    this.isMouseMoving = true;
    this.lastInteractionTime = performance.now();

    this.mouseIdleProgress = 1; // Reset progress when mouse moves
  }

  handleMouseMove(event) {
    this.updatePointerPosition(event.clientX, event.clientY);
  }

  handleTouchStart(event) {
    event.preventDefault();
    if (event.touches.length > 0) {
      const touch = event.touches[0];
      this.updatePointerPosition(touch.clientX, touch.clientY);
    }
  }

  handleTouchMove(event) {
    event.preventDefault();
    if (event.touches.length > 0) {
      const touch = event.touches[0];
      this.updatePointerPosition(touch.clientX, touch.clientY);
    }
  }

  handleTouchEnd(event) {
    this.isInteracting = false;
  }

  handleVisibilityChange() {
    if (document.hidden) {
      this.pauseRenderLoop();
      this.pauseVideo();
    } else {
      this.startRenderLoop();
      if (this.guiParams.autoPlay) {
        this.playVideo();
      }
    }
  }

  startRenderLoop() {
    if (!this.animationId && !this.isDestroyed) {
      this.lastTime = performance.now();
      this.render();
    }
  }

  pauseRenderLoop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  updateFPS(currentTime) {
    this.frameCount++;
    if (currentTime - this.lastFPSUpdate >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastFPSUpdate));
      this.frameCount = 0;
      this.lastFPSUpdate = currentTime;
    }
  }

  render() {
    if (this.isDestroyed) return;

    const currentTime = performance.now();
    const deltaTime = (currentTime - (this.lastTime || currentTime)) / 1000;
    this.lastTime = currentTime;

    // Update FPS counter
    if (this.guiParams.showStats) {
      this.updateFPS(currentTime);
    }

    // Smooth mouse movement
    this.mouse.lerp(this.targetMouse, this.guiParams.mouseSmoothing);

    // Update interaction strength based on recent activity
    const timeSinceInteraction = currentTime - this.lastInteractionTime;
    const interactionDecay = Math.max(0, 1 - timeSinceInteraction / 1000); // 2 second decay
    const interactionStrength = this.isInteracting ? 1.0 : interactionDecay;

    const now = performance.now();
    const elapsed = now - this.lastInteractionTime;
    
    const t = THREE.MathUtils.clamp(1 - elapsed / this.mouseDecayDuration, 0, 1);
    this.mouseIdleProgress = t;
    
    
    
    
    // Update uniforms
    if (this.planeMaterial?.uniforms) {
      this.planeMaterial.uniforms.u_time.value += deltaTime;
      this.planeMaterial.uniforms.u_mouse.value.copy(this.mouse);
      this.planeMaterial.uniforms.u_rippleIntensity.value = this.mouseIdleProgress;
      this.planeMaterial.uniforms.u_rippleStrength.value = this.guiParams.rippleStrength;
      this.planeMaterial.uniforms.u_rippleSpeed.value = this.guiParams.rippleSpeed;
      this.planeMaterial.uniforms.u_rippleRadius.value = this.guiParams.rippleRadius;
    }

    // Render scene
    this.renderer.render(this.scene, this.camera);

    // Continue animation loop
    this.animationId = requestAnimationFrame(() => this.render());
  }

  createGUI() {
    if (this.gui) {
      this.gui.destroy();
    }

    this.gui = new GUI({ title: 'Water Effect Controls' });
    
    // Effect parameters
    const effectFolder = this.gui.addFolder('Effect Parameters');
    
    effectFolder.add(this.guiParams, 'rippleStrength', 0.0, 0.3, 0.005)
      .name('Ripple Strength');
      
    effectFolder.add(this.guiParams, 'rippleSpeed', 0.1, 10.0, 0.1)
      .name('Ripple Speed');
      
    effectFolder.add(this.guiParams, 'rippleRadius', 0.05, 1.0, 0.05)
      .name('Ripple Radius');
      
    effectFolder.add(this.guiParams, 'mouseSmoothing', 0.01, 0.2, 0.01)
      .name('Mouse Smoothing');

    // Visual settings
    const visualFolder = this.gui.addFolder('Visual Settings');
    
    visualFolder.addColor(this.guiParams, 'backgroundColor')
      .name('Background Color')
      .onChange(() => this.updateBackgroundColor());

    // Video controls
    if (this.video) {
      const videoFolder = this.gui.addFolder('Video Controls');
      
      videoFolder.add(this.guiParams, 'autoPlay')
        .name('Auto Play')
        .onChange((value) => {
          if (value) {
            this.playVideo();
          } else {
            this.pauseVideo();
          }
        });

      videoFolder.add({
        play: () => this.playVideo()
      }, 'play').name('Play Video');

      videoFolder.add({
        pause: () => this.pauseVideo()
      }, 'pause').name('Pause Video');
    }

    // Performance
    const perfFolder = this.gui.addFolder('Performance');
    
    perfFolder.add(this.guiParams, 'showStats')
      .name('Show FPS');

    // Reset function
    this.gui.add({
      reset: () => this.resetToDefaults()
    }, 'reset').name('Reset All');

    return this.gui;
  }

  resetToDefaults() {
    this.guiParams.rippleStrength = 0.08;
    this.guiParams.rippleSpeed = 2.2;
    this.guiParams.rippleRadius = 0.18;
    this.guiParams.mouseSmoothing = 0.08;
    this.guiParams.backgroundColor = '#1a1a1a';
    
    this.updateBackgroundColor();
    
    if (this.gui) {
      this.gui.updateDisplay();
    }
  }

  // Public API methods
  getGUI() {
    if (!this.gui) {
      return this.createGUI();
    }
    return this.gui;
  }

  getFPS() {
    return this.fps;
  }

  setVideoSource(videoSrc) {
    this.videoSrc = videoSrc;
    if (videoSrc) {
      this.loadVideo(videoSrc);
    }
  }

  // Cleanup
  removeEventListeners() {
    this.container.removeEventListener('mousemove', this.handleMouseMove);
    this.container.removeEventListener('touchstart', this.handleTouchStart);
    this.container.removeEventListener('touchmove', this.handleTouchMove);
    this.container.removeEventListener('touchend', this.handleTouchEnd);
    this.container.removeEventListener('touchcancel', this.handleTouchEnd);
    
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    } else {
      window.removeEventListener('resize', this.handleResize);
    }
  }

  destroy() {
    this.isDestroyed = true;
    
    // Stop render loop
    this.pauseRenderLoop();
    
    // Clean up video
    if (this.video) {
      this.video.pause();
      this.video.removeAttribute('src');
      this.video.load();
    }
    
    // Clean up GUI
    if (this.gui) {
      this.gui.destroy();
    }
    
    // Clean up Three.js objects
    if (this.planeGeometry) {
      this.planeGeometry.dispose();
    }
    
    if (this.planeMaterial) {
      this.planeMaterial.dispose();
    }
    
    if (this.videoTexture) {
      this.videoTexture.dispose();
    }
    
    if (this.renderer) {
      this.renderer.dispose();
      if (this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
      }
    }
    
    // Remove event listeners
    this.removeEventListeners();
    
    // Clear singleton instance
    Experience.instance = null;
    
    console.log('Experience destroyed');
  }
}