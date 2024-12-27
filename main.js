class BrowserFingerprint {
  async generateFingerprint() {
    const components = await this.collectComponents();
    return this.hashComponents(components);
  }

  async collectComponents() {
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      colorDepth: window.screen.colorDepth,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      canvas: await this.getCanvasFingerprint(),
      webgl: await this.getWebGLFingerprint(),
      fonts: await this.getFonts(),
      audio: await this.getAudioFingerprint(),
      plugins: this.getPlugins(),
      hardware: {
        cores: navigator.hardwareConcurrency,
        memory: navigator.deviceMemory,
      },
      touchSupport: this.getTouchSupport(),
    };
  }

  async getCanvasFingerprint() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = 200;
    canvas.height = 50;
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125,1,62,20);
    ctx.fillStyle = '#069';
    ctx.fillText('Hello, world!', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('Hello, world!', 4, 17);
    
    return canvas.toDataURL();
  }

  async getWebGLFingerprint() {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return null;

    return {
      vendor: gl.getParameter(gl.VENDOR),
      renderer: gl.getParameter(gl.RENDERER),
      extensions: gl.getSupportedExtensions(),
    };
  }

  async getFonts() {
    try {
      const fonts = [
        'Arial', 'Arial Black', 'Arial Narrow', 'Calibri', 
        'Cambria', 'Comic Sans MS', 'Courier', 'Courier New', 
        'Georgia', 'Helvetica', 'Impact', 'Tahoma', 
        'Times New Roman', 'Trebuchet MS', 'Verdana'
      ];
      const available = await Promise.all(fonts.map(async font => {
        const result = await document.fonts.check(`12px "${font}"`);
        return result ? font : null;
      }));
      return available.filter(font => font !== null);
    } catch (e) {
      return null; // または既定値
    }
  }

  async getAudioFingerprint() {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const analyser = audioContext.createAnalyser();
      const gainNode = audioContext.createGain();
      const scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1);

      gainNode.gain.value = 0;
      oscillator.type = 'triangle';
      oscillator.connect(analyser);
      analyser.connect(scriptProcessor);
      scriptProcessor.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.start(0);
      const audioData = new Float32Array(analyser.frequencyBinCount);
      analyser.getFloatFrequencyData(audioData);
      oscillator.stop();
      audioContext.close();
      return Array.from(audioData.slice(0, 10));
    } catch (e) {
      return null;
    }
  }

  getPlugins() {
    try {
      const plugins = [];
      for (let i = 0; i < navigator.plugins.length; i++) {
        const plugin = navigator.plugins[i];
        plugins.push({
          name: plugin.name,
          description: plugin.description,
          filename: plugin.filename,
        });
      }
      return plugins;
    } catch (e) {
      return null;
    }
  }

  getTouchSupport() {
    return {
      maxTouchPoints: navigator.maxTouchPoints || 0,
      touchEvent: 'ontouchstart' in window,
      touchPoints: navigator.msMaxTouchPoints || 0,
    };
  }

  hashComponents(components) {
    const stringifiedComponents = JSON.stringify(components);
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(stringifiedComponents))
    .then(hashBuffer => {
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    });
  }
}