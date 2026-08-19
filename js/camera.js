/**
 * AquaSurvey Pro - Camera Controller
 * Manages video stream, camera switcher, capture snapshots, sound synthesis, and file upload fallback.
 */

class CameraController {
  constructor() {
    this.videoElement = null;
    this.stream = null;
    this.facingMode = 'environment'; // Default to rear camera on mobile
    this.isCameraActive = false;
    this.lastCapturedBlob = null;
    this.lastCapturedDataUrl = null;
    this.audioCtx = null;
  }

  async init(videoElementId) {
    this.videoElement = document.getElementById(videoElementId);
    if (!this.videoElement) {
      console.error('Video element not found:', videoElementId);
      return;
    }

    try {
      await this.startStream();
    } catch (err) {
      console.warn('Could not auto-start camera (may require user interaction):', err);
    }
  }

  async startStream() {
    this.stopStream();

    const constraints = {
      video: {
        facingMode: { ideal: this.facingMode },
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      },
      audio: false
    };

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        this.stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (this.videoElement) {
          this.videoElement.srcObject = this.stream;
          await this.videoElement.play();
          this.isCameraActive = true;
          if (this.facingMode === 'user') {
            this.videoElement.classList.add('mirror');
          } else {
            this.videoElement.classList.remove('mirror');
          }
        }
      } else {
        throw new Error('getUserMedia not supported on this browser');
      }
    } catch (error) {
      console.warn('Camera stream error:', error);
      this.isCameraActive = false;
      this.renderSimulationFallback();
    }
  }

  stopStream() {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    this.isCameraActive = false;
  }

  async switchCamera() {
    this.facingMode = this.facingMode === 'environment' ? 'user' : 'environment';
    await this.startStream();
    return this.facingMode;
  }

  // Plays a realistic synthetic camera shutter click via Web Audio API
  playShutterSound() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      if (!this.audioCtx) this.audioCtx = new AudioContext();
      if (this.audioCtx.state === 'suspended') this.audioCtx.resume();

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, this.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, this.audioCtx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.3, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.08);
    } catch (e) {
      console.warn('Audio feedback error:', e);
    }
  }

  // Trigger flash effect animation on the screen
  triggerFlash() {
    const flashEl = document.getElementById('shutterFlash');
    if (flashEl) {
      flashEl.classList.add('flash-active');
      setTimeout(() => {
        flashEl.classList.remove('flash-active');
      }, 120);
    }
  }

  // Capture current video frame or fallback image
  captureFrame() {
    this.playShutterSound();
    this.triggerFlash();

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (this.isCameraActive && this.videoElement && this.videoElement.videoWidth > 0) {
      canvas.width = this.videoElement.videoWidth;
      canvas.height = this.videoElement.videoHeight;

      if (this.facingMode === 'user') {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }

      ctx.drawImage(this.videoElement, 0, 0, canvas.width, canvas.height);
    } else {
      // Create high-quality aesthetic fallback fishery survey background
      canvas.width = 1280;
      canvas.height = 960;
      this.drawScenicFallback(ctx, canvas.width, canvas.height);
    }

    return canvas;
  }

  // Draw an aesthetic realistic aquatic environment pattern for simulation / desktop testing
  drawScenicFallback(ctx, width, height) {
    // Water gradient
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#0f2b48');
    grad.addColorStop(0.4, '#1b4d79');
    grad.addColorStop(0.7, '#135b80');
    grad.addColorStop(1, '#0a3248');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Sun reflection / caustic waves
    ctx.fillStyle = 'rgba(0, 212, 255, 0.08)';
    for (let i = 0; i < 24; i++) {
      ctx.beginPath();
      ctx.ellipse(
        width * 0.5 + Math.sin(i * 0.5) * 200, 
        height * 0.45 + i * 18, 
        width * 0.35 - i * 10, 
        6 + (i % 4), 
        0, 0, Math.PI * 2
      );
      ctx.fill();
    }

    // Water surface line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, height * 0.4);
    for (let x = 0; x < width; x += 40) {
      ctx.quadraticCurveTo(x + 20, height * 0.4 + Math.sin(x * 0.02) * 10, x + 40, height * 0.4);
    }
    ctx.stroke();

    // Fish silhouette demonstration
    ctx.fillStyle = 'rgba(0, 245, 212, 0.25)';
    ctx.beginPath();
    const fx = width * 0.52;
    const fy = height * 0.65;
    ctx.ellipse(fx, fy, 80, 28, -0.15, 0, Math.PI * 2);
    ctx.fill();
    // Tail
    ctx.beginPath();
    ctx.moveTo(fx - 70, fy);
    ctx.lineTo(fx - 110, fy - 25);
    ctx.lineTo(fx - 100, fy);
    ctx.lineTo(fx - 110, fy + 25);
    ctx.closePath();
    ctx.fill();

    // Overlay text indicating sample photo
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '600 24px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('FIELD SURVEY CAMERA VIEW', width / 2, height * 0.25);
  }

  // Handle image file upload fallback
  async handleFileUpload(file) {
    return new Promise((resolve, reject) => {
      if (!file || !file.type.startsWith('image/')) {
        reject(new Error('Invalid image file'));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          resolve(canvas);
        };
        img.onerror = () => reject(new Error('Failed to load selected image'));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  renderSimulationFallback() {
    if (this.videoElement) {
      // In simulation mode, create canvas stream or poster
      this.videoElement.poster = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480"><rect width="100%" height="100%" fill="%230c182b"/><text x="50%" y="45%" fill="%2300d4ff" font-size="22" font-family="sans-serif" text-anchor="middle" font-weight="bold">Live Camera Simulation Mode</text><text x="50%" y="55%" fill="%238ba2c0" font-size="14" font-family="sans-serif" text-anchor="middle">Ready to snap field photo or upload file</text></svg>';
    }
  }
}

window.cameraController = new CameraController();
