/**
 * MÓDULO DE ASSINATURA DIGITAL TOUCH (LOCAR DIGITAL SIGNATURE)
 * Locar Guindastes e Transportes Intermodais
 * 
 * Permite que o inspetor assine diretamente na tela touch ou com o mouse
 * antes de finalizar a inspeção ou emitir o Laudo Pericial.
 */

export class SignaturePad {
    constructor(canvasId) {
        this.canvasId = canvasId;
        this.canvas = null;
        this.ctx = null;
        this.isDrawing = false;
        this.hasSignature = false;
        this.lastX = 0;
        this.lastY = 0;
    }

    init() {
        this.canvas = document.getElementById(this.canvasId);
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.resize();

        // Configuração do traço da caneta digital
        this.ctx.lineWidth = 2.5;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.strokeStyle = '#101318';

        this._bindEvents();
    }

    resize() {
        if (!this.canvas) return;
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width || 380;
        this.canvas.height = rect.height || 140;
        this.clear();
    }

    _bindEvents() {
        if (!this.canvas) return;

        const getPos = (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            return {
                x: clientX - rect.left,
                y: clientY - rect.top
            };
        };

        const start = (e) => {
            e.preventDefault();
            this.isDrawing = true;
            const pos = getPos(e);
            this.lastX = pos.x;
            this.lastY = pos.y;
        };

        const move = (e) => {
            if (!this.isDrawing) return;
            e.preventDefault();
            const pos = getPos(e);
            this.ctx.beginPath();
            this.ctx.moveTo(this.lastX, this.lastY);
            this.ctx.lineTo(pos.x, pos.y);
            this.ctx.stroke();
            this.lastX = pos.x;
            this.lastY = pos.y;
            this.hasSignature = true;
        };

        const end = (e) => {
            if (this.isDrawing) {
                e.preventDefault();
                this.isDrawing = false;
            }
        };

        // Mouse events
        this.canvas.addEventListener('mousedown', start);
        this.canvas.addEventListener('mousemove', move);
        window.addEventListener('mouseup', end);

        // Touch events (Mobile/Tablet no pátio)
        this.canvas.addEventListener('touchstart', start, { passive: false });
        this.canvas.addEventListener('touchmove', move, { passive: false });
        window.addEventListener('touchend', end, { passive: false });
    }

    clear() {
        if (!this.canvas || !this.ctx) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.hasSignature = false;
    }

    getImageData() {
        if (!this.hasSignature || !this.canvas) return null;
        return this.canvas.toDataURL('image/png');
    }
}
