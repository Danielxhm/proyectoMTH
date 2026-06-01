const HomeScreen = {
    async init() {
        if (this.initPromise) return this.initPromise;

        this.initPromise = this.setup();
        return this.initPromise;
    },

    async setup() {
        // Configuramos los assets de la animación y dónde va el menú
        this.MENU_AX = 0.65;
        this.MENU_AY = 0.57;
        this.TOTAL_FRAMES = 300;
        this.LOOP_START_FRAME = 212;
        this.LOOP_CROSSFADE_FRAMES = 12;
        this.FPS = 24;
        this.FRAME_MS = 1000 / this.FPS;
        this.PRELOAD_AHEAD = 20;
        this.SAFE_TAIL = 5;

        this.texFrames = new Array(this.TOTAL_FRAMES).fill(null);
        this.loading = new Array(this.TOTAL_FRAMES).fill(false);

        this.currentFrame = 0;
        this.mainSprite = null;
        this.loopPreviewSprite = null;
        this.elapsedMs = 0;
        this.isStreaming = false;

        this.loaderEl = document.getElementById('home-loader');
        this.loadProgressEl = document.getElementById('home-load-progress');
        this.menuOverlayEl = document.getElementById('menu-overlay');
        this.menuContentEl = document.getElementById('menu-content');
        this.pixiContainer = document.getElementById('pixi-bg');
        this.btnAudio = document.getElementById('btn-audio');
        this.homeContainer = document.getElementById('home-container');
        
        // Nos aseguramos que empiece bien guardadito si no se tiene que ver
        if (!this.homeContainer.classList.contains('is-visible')) {
            this.homeContainer.setAttribute('inert', '');
        }

        this.createPixiApp();
        this.setupAudioButton();
        await this.loadInitialFrames();
    },

    createPixiApp() {
        this.app = new PIXI.Application({
            resizeTo: window,
            backgroundColor: 0x000000,
            antialias: false,
            resolution: 1,
            autoDensity: false
        });

        this.pixiContainer.appendChild(this.app.view);
    },

    setupAudioButton() {
        this.audioEnabled = true;

        this.btnAudio.addEventListener('click', () => {
            this.audioEnabled = !this.audioEnabled;
            this.btnAudio.classList.toggle('muted', !this.audioEnabled);
        });
    },

    startGame(level) {
        if (window.GameScreen) {
            window.GameScreen.start(level);
            this.menuOverlayEl.classList.remove('visible');
            this.menuOverlayEl.setAttribute('inert', '');
            this.menuOverlayEl.setAttribute('aria-hidden', 'true');
        } else {
            console.error('El GameScreen no aparece, saber qué ondas');
        }
    },

    showMenu() {
        this.menuOverlayEl.classList.add('visible');
        this.menuOverlayEl.removeAttribute('inert');
        this.menuOverlayEl.setAttribute('aria-hidden', 'false');
        
        // Ponemos el foco en el primer botón para que el usuario empiece de un solo
        const firstBtn = this.menuOverlayEl.querySelector('button');
        if (firstBtn) firstBtn.focus();
    },

    frameUrl(i) {
        // Armamos la dirección de cada dibujito de la animación
        return `assets/home/frame_${String(i).padStart(4, '0')}.webp`;
    },

    nextFrameIndex(frame) {
        // Esta función decide qué cuadro sigue, y si ya llegamos al final, lo regresa al punto de inicio del loop
        return frame + 1 >= this.TOTAL_FRAMES
            ? this.LOOP_START_FRAME
            : frame + 1;
    },

    frameAhead(frame, steps) {
        let next = frame;

        for (let i = 0; i < steps; i++) {
            next = this.nextFrameIndex(next);
        }

        return next;
    },

    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    },

    smoothstep(value) {
        const t = this.clamp(value, 0, 1);

        return t * t * (3 - 2 * t);
    },

    syncLoopPreview() {
        if (!this.mainSprite || !this.loopPreviewSprite) return;

        this.loopPreviewSprite.scale.copyFrom(this.mainSprite.scale);
        this.loopPreviewSprite.x = this.mainSprite.x;
        this.loopPreviewSprite.y = this.mainSprite.y;
    },

    updateLoopPreview(frameProgress = 0) {
        // Aquí hacemos para que el final de la animación se mezcle suave con el inicio del loop
        if (!this.loopPreviewSprite || !this.texFrames[this.LOOP_START_FRAME]) return;

        const fadeStart = this.TOTAL_FRAMES - this.LOOP_CROSSFADE_FRAMES;
        const rawAlpha = this.currentFrame >= fadeStart
            ? (this.currentFrame - fadeStart + frameProgress) / this.LOOP_CROSSFADE_FRAMES
            : 0;

        this.loopPreviewSprite.texture = this.texFrames[this.LOOP_START_FRAME];
        this.loopPreviewSprite.alpha = this.smoothstep(rawAlpha);
    },

    requestFrame(i) {
        // Pedimos un cuadro de la animación si no lo tenemos todavía
        if (this.texFrames[i] || this.loading[i]) return;

        this.loading[i] = true;

        PIXI.Assets.load(this.frameUrl(i))
            .then(texture => {
                this.texFrames[i] = texture;
                this.loading[i] = false;
            })
            .catch(() => {
                this.loading[i] = false;
            });
    },

    releaseOldFrames() {
        // Borramos los cuadros viejos que ya pasaron para que no nos acaben la memoria del cel o la compu
        for (let i = 1; i <= this.SAFE_TAIL + 2; i++) {
            const old =
                (this.currentFrame - this.SAFE_TAIL - i + this.TOTAL_FRAMES)
                % this.TOTAL_FRAMES;

            if (this.texFrames[old]) {
                PIXI.Assets.unload(this.frameUrl(old)).catch(() => {});
                this.texFrames[old] = null;
                this.loading[old] = false;
            }
        }
    },

    streamStep() {
        // Esta onda se encarga de ir pidiendo los cuadros que vienen en camino para que el video no se trabe
        if (!this.isStreaming) return;

        for (let i = 0; i < this.PRELOAD_AHEAD; i++) {
            this.requestFrame(this.frameAhead(this.currentFrame, i));
        }

        this.releaseOldFrames();
        setTimeout(() => this.streamStep(), 80);
    },

    resize() {
        // Si cambian el tamaño de la ventana, acomodamos el video y el menú para que sigan viéndose de toque
        if (!this.mainSprite || !this.mainSprite.texture) return;

        const sw = this.app.screen.width;
        const sh = this.app.screen.height;
        const vidW = this.mainSprite.texture.orig.width;
        const vidH = this.mainSprite.texture.orig.height;

        if (!vidW || !vidH) return;

        const ratio = Math.max(sw / vidW, sh / vidH);

        this.mainSprite.scale.set(ratio);
        this.mainSprite.x = (sw - this.mainSprite.width) / 2;
        this.mainSprite.y = 0;

        this.syncLoopPreview();

        const screenX = this.mainSprite.x + this.MENU_AX * vidW * ratio;
        const screenY = this.MENU_AY * vidH * ratio;

        this.menuContentEl.style.left = `${screenX}px`;
        this.menuContentEl.style.top = `${screenY}px`;
    },

    startTicker() {
        // El motor que hace que los cuadros vayan pasando uno tras otro
        this.app.ticker.add(() => {
            this.elapsedMs += this.app.ticker.elapsedMS;
            this.updateLoopPreview(this.elapsedMs / this.FRAME_MS);

            if (this.elapsedMs < this.FRAME_MS) return;

            this.elapsedMs -= this.FRAME_MS;

            const next = this.nextFrameIndex(this.currentFrame);

            if (this.texFrames[next]) {
                this.currentFrame = next;
                this.mainSprite.texture = this.texFrames[this.currentFrame];
                this.updateLoopPreview();
            }
        });
    },

    async loadInitialFrames() {
        // Cargamos los primeritos cuadros para que el usuario no se quede viendo a la nada mucho tiempo
        try {
            let settled = 0;

            const batch = Array.from(
                { length: this.PRELOAD_AHEAD },
                (_, i) => {
                    this.loading[i] = true;

                    return PIXI.Assets
                        .load(this.frameUrl(i))
                        .then(texture => {
                            this.texFrames[i] = texture;
                            this.loading[i] = false;
                            settled++;
                            this.loadProgressEl.textContent =
                                `${Math.round((settled / this.PRELOAD_AHEAD) * 100)}%`;
                        })
                        .catch(() => {
                            this.loading[i] = false;
                        });
                }
            );

            await Promise.all(batch);

            const firstTex = this.texFrames[0] || this.texFrames.find(Boolean);

            if (!firstTex) {
                throw new Error('No hay cuadros, saber qué pasó');
            }

            this.mainSprite = new PIXI.Sprite(firstTex);
            this.app.stage.addChild(this.mainSprite);

            this.loopPreviewSprite = new PIXI.Sprite(firstTex);
            this.loopPreviewSprite.alpha = 0;
            this.app.stage.addChild(this.loopPreviewSprite);

            this.requestFrame(this.LOOP_START_FRAME);
            this.resize();

            window.addEventListener('resize', () => this.resize());

            this.startTicker();
            this.isStreaming = true;
            this.streamStep();

            this.loaderEl.classList.add('is-hidden');

            setTimeout(() => {
                this.loaderEl.style.display = 'none';
                this.showMenu();
            }, 800);
        } catch (err) {
            console.error('Error cargando los cuadros:', err);
            this.loaderEl.classList.add('is-hidden');
            setTimeout(() => {
                this.loaderEl.style.display = 'none';
                this.showMenu();
            }, 800);
        }
    },

    async reveal() {
        // Esta función hace la magia de mostrar el menú con una animación chiva al principio
        await this.init();

        this.homeContainer.classList.add('is-visible');
        this.homeContainer.removeAttribute('inert');
        this.homeContainer.classList.remove('reveal-lock');
        this.homeContainer.classList.remove('reveal-finished');

        this.homeContainer.getBoundingClientRect();
        this.homeContainer.classList.add('reveal-lock');

        this.homeContainer.addEventListener(
            'animationend',
            () => {
                this.homeContainer.classList.add('reveal-finished');
            },
            { once: true }
        );
    }
};

window.HomeScreen = HomeScreen;
