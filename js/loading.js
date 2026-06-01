const LoadingScreen = {
    init() {
        this.promptScreen = document.getElementById('fullscreen-prompt');
        this.loadingScreen = document.getElementById('loading-screen');
        this.loadingContainer = document.getElementById('loading-container');
        this.progressFill = document.getElementById('progress-fill');
        this.statusText = document.getElementById('status-text');
        this.flashOverlay = document.getElementById('flash-overlay');
        this.videoScreen = document.getElementById('video-screen');
        this.video = document.getElementById('intro-video');

        // Al principio los dejamos quietos para que no estorben
        this.loadingScreen.setAttribute('inert', '');
        this.videoScreen.setAttribute('inert', '');

        this.messages = [
            'Iniciando motores...',
            'Cargando texturas...',
            'Sincronizando shaders...',
            'Preparando el mundo...',
            'Casi listo...'
        ];

        this.progress = 0;
        this.started = false;
        this.onVideoStarted = null;
        this.onVideoFinished = null;

        this.promptScreen.addEventListener('click', () => this.start());
    },

    async start() {
        if (this.started) return;

        this.started = true;
        await this.enterFullscreen();
        this.showLoading();
    },

    async enterFullscreen() {
        if (document.fullscreenElement) return;

        try {
            await document.documentElement.requestFullscreen();
        } catch (err) {
            console.error(`No se pudo poner en pantalla completa, saber qué ondas: ${err.message}`);
        }
    },

    showLoading() {
        this.promptScreen.classList.add('is-fading-out');
        this.promptScreen.setAttribute('inert', '');

        setTimeout(() => {
            this.promptScreen.classList.remove('is-visible');
            this.promptScreen.classList.remove('is-fading-out');
            this.loadingScreen.classList.add('is-visible');
            this.loadingScreen.removeAttribute('inert');
            this.updateLoading();
        }, 800);
    },

    updateLoading() {
        if (this.progress >= 100) {
            this.startVideoTransition();
            return;
        }

        this.progress = Math.min(100, this.progress + Math.random() * 1.5);
        this.progressFill.style.width = `${this.progress}%`;

        const messageIndex = Math.min(
            this.messages.length - 1,
            Math.floor((this.progress / 101) * this.messages.length)
        );

        this.statusText.textContent = this.messages[messageIndex];

        setTimeout(
            () => this.updateLoading(),
            50 + Math.random() * 100
        );
    },

    startVideoTransition() {
        this.flashOverlay.classList.add('is-active');

        setTimeout(() => {
            this.loadingScreen.classList.add('is-fading-out');
            this.loadingScreen.setAttribute('inert', '');
            this.videoScreen.classList.add('is-visible');
            this.videoScreen.removeAttribute('inert');
            this.playVideo();
        }, 400);

        setTimeout(() => {
            this.loadingScreen.classList.remove('is-visible');
            this.loadingScreen.classList.remove('is-fading-out');
            this.flashOverlay.classList.remove('is-active');
        }, 2600);
    },

    playVideo() {
        if (this.onVideoStarted) {
            this.onVideoStarted();
        }

        // Vamos adelantando el trabajo de cargar el juego mientras el usuario ve el video
        if (window.GameScreen && typeof window.GameScreen.init === 'function') {
            window.GameScreen.init().catch(e => console.error("No se pudo ir cargando el juego de antemano:", e));
        }

        const playPromise = this.video.play();

        if (playPromise) {
            playPromise.catch(err => {
                console.error(`El video se trabó, qué mala onda: ${err.message}`);
                this.finishVideo();
            });
        }

        this.video.addEventListener(
            'ended',
            () => this.finishVideo(),
            { once: true }
        );
    },

    finishVideo() {
        this.video.pause();
        this.videoScreen.classList.remove('is-visible');
        this.videoScreen.setAttribute('inert', '');

        if (this.onVideoFinished) {
            this.onVideoFinished();
        }
    }
};

window.LoadingScreen = LoadingScreen;
