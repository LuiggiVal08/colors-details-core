class Toast {
    constructor(portal = document.getElementById('popup'), options = {}) {
        this.portal = portal;
        this.queue = [];
        this.toastMeta = new Map();
        this.timeTest = options.timeTest ?? 3000;
        this.zIndexBase = 999;

        // 🎵 Configuración de audio generada por código
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        this.muted = options.muted ?? false;
        this.volume = options.volume ?? 0.4;

        this.portal.addEventListener('mouseover', () => this.pauseAllToasts());
        this.portal.addEventListener('mouseout', () => this.resumeAllToasts());
    }

    generateId() {
        return `toast_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    }

    // 🔈 Genera sonido según tipo
    playSound(type) {
        if (this.muted) return;

        const ctx = this.audioCtx;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        // Configuración base
        gain.gain.value = this.volume;
        osc.connect(gain);
        gain.connect(ctx.destination);

        // 🎨 Parámetros por tipo
        const tones = {
            success: { freq: [660, 880], duration: 0.2, type: 'triangle' },
            error: { freq: [220, 160], duration: 0.25, type: 'sawtooth' },
            warning: { freq: [440, 480], duration: 0.15, type: 'square' },
            info: { freq: [520], duration: 0.12, type: 'sine' },
        };

        const t = tones[type] || tones.info;
        const now = ctx.currentTime;

        osc.type = t.type;
        osc.frequency.setValueAtTime(t.freq[0], now);

        // Si hay dos frecuencias, hacemos un pequeño sweep
        if (t.freq[1]) {
            osc.frequency.linearRampToValueAtTime(t.freq[1], now + t.duration);
        }

        // Fade out rápido
        gain.gain.setValueAtTime(this.volume, now);
        gain.gain.linearRampToValueAtTime(0, now + t.duration);

        osc.start(now);
        osc.stop(now + t.duration + 0.05);
    }

    createToast({ title, message, type = 'success', duration = 3000 }) {
        const template = document.getElementById('toast-template');
        if (!template) {
            console.error('Toast template not found');
            return;
        }
        const toast = template.content.cloneNode(true).querySelector('div');
        if (!toast) {
            console.error('No se pudo clonar el toast del template');
            return;
        }

        const id = this.generateId();
        toast.dataset.id = id;
        toast.dataset.duration = duration;

        const typeClass = {
            success: 'text-green-500',
            error: 'text-red-500',
            warning: 'text-yellow-500',
            info: 'text-blue-500',
        };

        const typeIcon = {
            success: 'check_circle',
            error: 'error',
            warning: 'warning',
            info: 'info',
        };

        const toastIco = toast.querySelector('[data-toast-ico]');
        toastIco.setAttribute('data-ico', typeIcon[type] || 'info');
        toast.classList.add(typeClass[type] || 'toast-default');
        toast.classList.add('transition-transform', 'duration-300', 'ease-in-out');

        toast.querySelector('[data-toast-title]').textContent = title?.trim() || 'Notificación';
        toast.querySelector('[data-toast-text]').textContent = message ?? 'Mensaje vacío';
        toast.classList.add('opacity-0', 'translate-x-10');

        toast.style.zIndex = this.zIndexBase + this.queue.length;

        const closeButton = toast.querySelector('button[data-close-toast]');
        const handleClose = () => this.removeToast(toast);
        closeButton.addEventListener('click', handleClose);
        toast._handleClose = handleClose;

        this.portal.prepend(toast);
        this.queue.unshift(toast);

        // 🔊 Sonido por tipo
        this.playSound(type);

        setTimeout(() => {
            toast.classList.remove('opacity-0', 'translate-x-10');
        }, 10);

        const start = Date.now();
        const timeout = this.scheduleRemoveToast(toast, duration);

        this.toastMeta.set(id, {
            start,
            duration,
            remaining: duration,
            timeout,
            closeHandler: handleClose,
        });
        this.reorganizeToasts();
    }

    pauseAllToasts() {
        for (const toast of this.queue) {
            const id = toast.dataset.id;
            const meta = this.toastMeta.get(id);
            if (!meta) continue;
            const elapsed = Date.now() - meta.start;
            meta.remaining = Math.max(meta.duration - elapsed, 0);
            clearTimeout(meta.timeout);
            this.toastMeta.set(id, meta);
        }
        this.stackToasts();
    }

    resumeAllToasts() {
        for (const toast of this.queue) {
            const id = toast.dataset.id;
            const meta = this.toastMeta.get(id);
            if (!meta) continue;
            meta.start = Date.now();
            meta.timeout = this.scheduleRemoveToast(toast, meta.remaining);
            this.toastMeta.set(id, meta);
        }
        this.reorganizeToasts();
    }

    scheduleRemoveToast(toast, duration) {
        return setTimeout(() => {
            this.removeToast(toast);
        }, duration);
    }

    stackToasts() {
        this.queue.forEach((toast, index) => {
            const height = toast.offsetHeight;
            toast.style.transform = `translateY(-${index * (height + 5)}px)`;
        });
    }

    removeToast(toast) {
        const id = toast.dataset.id;
        const closeButton = toast.querySelector('[data-close-toast]');
        const meta = this.toastMeta.get(id);
        if (closeButton) closeButton.removeEventListener('click', meta.closeHandler);
        if (meta) {
            clearTimeout(meta.timeout);
            this.toastMeta.delete(id);
        }
        toast.classList.add('opacity-0');
        setTimeout(() => {
            toast.remove();
            this.queue = this.queue.filter((t) => t !== toast);
            this.reorganizeToasts();
        }, 300);
    }

    reorganizeToasts() {
        this.queue.forEach((toast, index) => {
            toast.style.transform = `translateY(${-index * 20}px)`;
            toast.style.zIndex = this.zIndexBase - index;
        });
    }

    // 🎛 Controles
    setVolume(level) {
        this.volume = Math.min(Math.max(level, 0), 1);
    }

    mute() {
        this.muted = true;
    }

    unmute() {
        this.muted = false;
    }
}

const toast = new Toast(document.getElementById('popup'));

const showToast = ({ title, message, type = 'success', duration = 3000 }) => {
    toast.createToast({ title, message, type, duration });
};

export default showToast;
