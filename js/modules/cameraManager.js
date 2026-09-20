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
    const w = videoElement.videoWidth || 800;
    const h = videoElement.videoHeight || 600;
    canvas.width = 800;
    canvas.height = Math.round((800 * h) / w);

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
   * Processa arquivo de foto enviado via input file e comprime
   */
  processUploadedFile(file, equipmentTag = 'LOCAR', itemLabel = 'Inspeção') {
    return new Promise((resolve, reject) => {
      if (!file || !file.type.startsWith('image/')) {
        return reject(new Error('Arquivo não é uma imagem válida.'));
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 900;
          let width = img.width;
          let height = img.height;

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

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Marca d'água técnica
          this.drawTechnicalWatermark(ctx, width, height, equipmentTag, itemLabel);

          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.82);
          resolve(compressedBase64);
        };
        img.onerror = () => reject(new Error('Erro ao carregar a imagem.'));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error('Erro ao ler o arquivo.'));
      reader.readAsDataURL(file);
    });
  },

  /**
   * Gera uma imagem técnica simulada com padrão fotográfico industrial
   * Útil para testes rápidos ou ambientes sem webcam
   */
  generateSimulatedInspectionPhoto(equipmentTag, itemLabel, status = 'conforme', detailText = '') {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');

    // Fundo industrial gradiente cinza chumbo
    const bgGrad = ctx.createLinearGradient(0, 0, 640, 480);
    bgGrad.addColorStop(0, '#1E232B');
    bgGrad.addColorStop(1, '#12151B');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 640, 480);

    // Grade técnica de mira/métrica
    ctx.strokeStyle = 'rgba(255, 184, 0, 0.15)';
    ctx.lineWidth = 1;
    for (let x = 40; x < 640; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 480);
      ctx.stroke();
    }
    for (let y = 40; y < 480; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(640, y);
      ctx.stroke();
    }

    // Moldura de foco técnico
    ctx.strokeStyle = status === 'conforme' ? '#10B981' : '#EF4444';
    ctx.lineWidth = 3;
    const pad = 45;
    // Cantoneiras de mira
    const cornerSize = 25;
    // Canto superior esquerdo
    ctx.beginPath();
    ctx.moveTo(pad, pad + cornerSize);
    ctx.lineTo(pad, pad);
    ctx.lineTo(pad + cornerSize, pad);
    ctx.stroke();
    // Canto superior direito
    ctx.beginPath();
    ctx.moveTo(640 - pad - cornerSize, pad);
    ctx.lineTo(640 - pad, pad);
    ctx.lineTo(640 - pad, pad + cornerSize);
    ctx.stroke();
    // Canto inferior esquerdo
    ctx.beginPath();
    ctx.moveTo(pad, 480 - pad - cornerSize);
    ctx.lineTo(pad, 480 - pad);
    ctx.lineTo(pad + cornerSize, 480 - pad);
    ctx.stroke();
    // Canto inferior direito
    ctx.beginPath();
    ctx.moveTo(640 - pad - cornerSize, 480 - pad);
    ctx.lineTo(640 - pad, 480 - pad);
    ctx.lineTo(640 - pad, 480 - pad - cornerSize);
    ctx.stroke();

    // Símbolo central de inspeção técnica
    ctx.fillStyle = status === 'conforme' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.18)';
    ctx.beginPath();
    ctx.arc(320, 210, 75, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = status === 'conforme' ? '#10B981' : '#EF4444';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Ícone gráfico
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 36px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(status === 'conforme' ? '✓' : '⚠', 320, 222);

    // Texto descritivo central
    ctx.font = 'bold 15px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#FFB800';
    ctx.fillText(`LOCAR GUINDASTES - EVIDÊNCIA FOTOGRÁFICA`, 320, 100);

    ctx.font = '600 13px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(itemLabel.length > 55 ? itemLabel.substring(0, 52) + '...' : itemLabel, 320, 315);

    if (detailText) {
      ctx.font = '12px "Segoe UI", Arial, sans-serif';
      ctx.fillStyle = '#CBD5E1';
      ctx.fillText(detailText.length > 50 ? detailText.substring(0, 47) + '...' : detailText, 320, 335);
    }

    // Status carimbo
    ctx.fillStyle = status === 'conforme' ? '#10B981' : '#EF4444';
    ctx.font = 'bold 14px "Segoe UI", Arial, sans-serif';
    ctx.fillText(status === 'conforme' ? '[ CONFORME COM A NORMA ]' : '[ NÃO CONFORME - REPROVADO ]', 320, 365);

    // Faixa superior de advertência de simulação (Prevenção de Fraude)
    ctx.fillStyle = '#EF4444';
    ctx.fillRect(0, 0, 640, 28);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 11px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('⚠ FOTO SIMULADA (AMBIENTE DE TESTE) - NÃO SUBSTITUI FOTO REAL DA MÁQUINA NO PÁTIO', 320, 18);

    // Marca d'água técnica inferior
    this.drawTechnicalWatermark(ctx, 640, 480, equipmentTag, itemLabel, true);

    return canvas.toDataURL('image/jpeg', 0.85);
  },

  /**
   * Aplica marca d'água com dados forenses da vistoria
   */
  drawTechnicalWatermark(ctx, width, height, equipmentTag, itemLabel, isSimulated = false) {
    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-BR');
    const timeStr = now.toLocaleTimeString('pt-BR');

    // Faixa preta semitransparente na base
    ctx.fillStyle = 'rgba(10, 13, 18, 0.85)';
    ctx.fillRect(0, height - 38, width, 38);

    // Faixa amarela oficial Locar no topo da faixa
    ctx.fillStyle = isSimulated ? '#EF4444' : '#FFF212';
    ctx.fillRect(0, height - 38, width, 2);

    // Texto da marca d'água
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '10px "Segoe UI", Arial, monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`TAG: ${equipmentTag} | DATA: ${dateStr} ${timeStr} | LOCAR INSPEÇÃO ${isSimulated ? '[SIMULADA]' : 'REAL'}`, 12, height - 16);

    ctx.fillStyle = isSimulated ? '#EF4444' : '#FFF212';
    ctx.textAlign = 'right';
    ctx.fillText(isSimulated ? 'TESTE / SIMULAÇÃO' : 'EVIDÊNCIA AUDITÁVEL', width - 12, height - 16);
  }
};
