/**
 * Módulo de Captura e Gestão de Evidências Fotográficas
 * Suporte a Câmera Real (Webcam/Mobile), Upload de Arquivos e Compressão Canvas
 */

export const CameraManager = {
  currentStream: null,
  activeTargetCallback: null,

  /**
   * Abre a câmera real do dispositivo em modal
   */
  async openLiveCamera(videoElement, preferredFacingMode = 'environment') {
    if (this.currentStream) {
      this.stopLiveCamera();
    }

    try {
      const constraints = {
        video: {
          facingMode: { ideal: preferredFacingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.currentStream = stream;
      videoElement.srcObject = stream;
      await videoElement.play();
      return true;
    } catch (err) {
      console.warn('Não foi possível acessar a câmera física do dispositivo:', err);
      return false;
    }
  },

  /**
   * Captura frame atual do vídeo da câmera e comprime
   */
  captureFromVideo(videoElement, equipmentTag = 'LOCAR', itemLabel = 'Inspeção') {
    const canvas = document.createElement('canvas');
    const vw = videoElement.videoWidth || 960;
    const vh = videoElement.videoHeight || 720;
    const maxDim = 1280;
    let w = vw;
    let h = vh;

    if (w > maxDim || h > maxDim) {
      if (w > h) {
        h = Math.round((h * maxDim) / w);
        w = maxDim;
      } else {
        w = Math.round((w * maxDim) / h);
        h = maxDim;
      }
    }

    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

    // Adiciona marca d'água técnica de evidência
    this.drawTechnicalWatermark(ctx, canvas.width, canvas.height, equipmentTag, itemLabel);

    return canvas.toDataURL('image/jpeg', 0.82);
  },

  /**
   * Para streaming da câmera
   */
  stopLiveCamera() {
    if (this.currentStream) {
      this.currentStream.getTracks().forEach(track => track.stop());
      this.currentStream = null;
    }
  },

  /**
   * Processa arquivo de foto enviado via input file e comprime com proteção de memória e EXIF
   */
  async processUploadedFile(file, equipmentTag = 'LOCAR', itemLabel = 'Inspeção') {
    if (!file || !file.type.startsWith('image/')) {
      throw new Error('Arquivo selecionado não é uma imagem válida.');
    }

    // Protege contra estouro de memória no navegador móvel ao subir fotos ultra pesadas
    if (file.size > 25 * 1024 * 1024) {
      throw new Error('O arquivo excede o limite operacional de 25MB.');
    }

    const maxDim = 1200;
    let sourceWidth, sourceHeight, drawSource;
    let cleanup = null;

    try {
      // 1. Tenta createImageBitmap moderno que preserva a orientação EXIF correta em smartphones
      if (typeof createImageBitmap === 'function') {
        const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
        sourceWidth = bitmap.width;
        sourceHeight = bitmap.height;
        drawSource = bitmap;
        cleanup = () => bitmap.close && bitmap.close();
      } else {
        // Fallback clássico via Image e Object URL
        const url = URL.createObjectURL(file);
        cleanup = () => URL.revokeObjectURL(url);
        const img = await new Promise((resolve, reject) => {
          const image = new Image();
          image.onload = () => resolve(image);
          image.onerror = () => reject(new Error('Erro ao carregar a imagem do arquivo.'));
          image.src = url;
        });
        sourceWidth = img.width;
        sourceHeight = img.height;
        drawSource = img;
      }

      let width = sourceWidth;
      let height = sourceHeight;

      if (width > height) {
        if (width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        }
      } else {
        if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(drawSource, 0, 0, width, height);

      // Marca d'água técnica de perícia industrial
      this.drawTechnicalWatermark(ctx, width, height, equipmentTag, itemLabel);

      return canvas.toDataURL('image/jpeg', 0.82);
    } finally {
      if (cleanup) cleanup();
    }
  },

  /**
   * Aplica marca d'água com dados forenses da vistoria
   */
  drawTechnicalWatermark(ctx, width, height, equipmentTag, itemLabel) {
    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-BR');
    const timeStr = now.toLocaleTimeString('pt-BR');

    // Faixa preta semitransparente na base
    ctx.fillStyle = 'rgba(10, 13, 18, 0.85)';
    ctx.fillRect(0, height - 38, width, 38);

    // Faixa amarela oficial Locar no topo da faixa
    ctx.fillStyle = '#FFF212';
    ctx.fillRect(0, height - 38, width, 2);

    // Texto da marca d'água
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '10px "Segoe UI", Arial, monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`TAG: ${equipmentTag} | DATA: ${dateStr} ${timeStr} | LOCAR INSPEÇÃO REAL`, 12, height - 16);

    ctx.fillStyle = '#FFF212';
    ctx.textAlign = 'right';
    ctx.fillText('EVIDÊNCIA AUDITÁVEL', width - 12, height - 16);
  }
};
