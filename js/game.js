const GameScreen = {
    questionsByLevel: {
        lineal: [
            { fn: '4x - 9', answer: '4', options: ['4', '-9', '4x', '0'] },
            { fn: '-2x + 7', answer: '-2', options: ['-2', '2', '7', '-7'] },
            { fn: '0.5x + 3', answer: '0.5', options: ['0.5', '3', '0', '1'] },
            { fn: '13x', answer: '13', options: ['13', 'x', '1', '0'] },
            { fn: '-x - 4', answer: '-1', options: ['-1', '1', '-4', '0'] },
            { fn: '6x + 1', answer: '6', options: ['6', '1', '6x', '7'] },
            { fn: '9 - 3x', answer: '-3', options: ['-3', '3', '9', '-9'] },
            { fn: '8x - 20', answer: '8', options: ['8', '-20', '0', '20'] },
            { fn: '-11x + 2', answer: '-11', options: ['-11', '11', '2', '-2'] },
            { fn: 'x - 15', answer: '1', options: ['1', '-1', 'x', '15'] }
        ],
        cuadratica: [
            { fn: 'x^2', answer: '2x', options: ['2x', 'x', '2', 'x^2'] },
            { fn: '3x^2 - 5x', answer: '6x - 5', options: ['6x - 5', '3x - 5', '6x', '3x^2 - 5'] },
            { fn: 'x^3', answer: '3x^2', options: ['3x^2', 'x^2', '3x', 'x^3'] },
            { fn: '-2x^2 + 4', answer: '-4x', options: ['-4x', '4x', '-2x', '-4'] },
            { fn: '5x^3 + x^2', answer: '15x^2 + 2x', options: ['15x^2 + 2x', '5x^2 + 2x', '15x + 2', '15x^2 + x'] },
            { fn: '4x^2 + 6x - 8', answer: '8x + 6', options: ['8x + 6', '4x + 6', '8x', '8x - 6'] },
            { fn: '7x^3 - x', answer: '21x^2 - 1', options: ['21x^2 - 1', '7x^2 - 1', '21x - 1', '21x^2'] },
            { fn: 'x^2 - 10', answer: '2x', options: ['2x', '2x - 10', 'x', '2'] },
            { fn: '-x^3 + 2x^2', answer: '-3x^2 + 4x', options: ['-3x^2 + 4x', '-x^2 + 4x', '-3x + 4', '-3x^2'] },
            { fn: '2x^3 + 9x', answer: '6x^2 + 9', options: ['6x^2 + 9', '2x^2 + 9', '6x + 9', '6x^2 + 9x'] }
        ],
        trigonometrica: [
            { fn: 'sin(x)', answer: 'cos(x)', options: ['cos(x)', 'sin(x)', '-cos(x)', '-sin(x)'] },
            { fn: 'cos(x)', answer: '-sin(x)', options: ['-sin(x)', 'sin(x)', 'cos(x)', '-cos(x)'] },
            { fn: 'tan(x)', answer: 'sec^2(x)', options: ['sec^2(x)', 'cos^2(x)', 'cot(x)', '-sec^2(x)'] },
            { fn: '2sin(x)', answer: '2cos(x)', options: ['2cos(x)', 'cos(x)', '2sin(x)', '-2cos(x)'] },
            { fn: '-3cos(x)', answer: '3sin(x)', options: ['3sin(x)', '-3sin(x)', '-3cos(x)', '3cos(x)'] },
            { fn: 'sin(2x)', answer: '2cos(2x)', options: ['2cos(2x)', 'cos(2x)', '2sin(2x)', '-2sin(2x)'] },
            { fn: 'cos(3x)', answer: '-3sin(3x)', options: ['-3sin(3x)', '3sin(3x)', '-sin(3x)', '-3cos(3x)'] },
            { fn: '4tan(x)', answer: '4sec^2(x)', options: ['4sec^2(x)', 'sec^2(x)', '4cot(x)', '-4sec^2(x)'] },
            { fn: 'sin(x) + cos(x)', answer: 'cos(x) - sin(x)', options: ['cos(x) - sin(x)', '-sin(x) + cos(x)', 'sin(x) + cos(x)', 'cos(x) + sin(x)'] },
            { fn: '5cos(x)', answer: '-5sin(x)', options: ['-5sin(x)', '5sin(x)', '-sin(x)', '5cos(x)'] }
        ]
    },

    levelLabels: {
        lineal: 'Lineales',
        cuadratica: 'Cuadráticas',
        trigonometrica: 'Trigonométricas'
    },

    config: {
        totalQuestions: 10,
        timeLimitSeconds: 15,
        transitionDelayMs: 1800
    },

    // Aquí ponemos dónde va a quedar el volado de la pizarra en la imagen, para que no quede pandeado
    // Lo ajustamos para que el panel se vea chivo justo en el centro de la pizarra
    BOARD_NX: 0.47,
    BOARD_NY: 0.55,

    async init() {
        if (this.initPromise) return this.initPromise;
        this.initPromise = this._setup();
        return this.initPromise;
    },

    async _setup() {
        this.cacheDom();
        this.createAudio();
        this.bindEvents();
        this.resetState();
        await this.initPixi();
        this.syncHeader();
    },

    cacheDom() {
        this.dom = {
            container: document.getElementById('game-container'),
            pixiContainer: document.getElementById('game-pixi-bg'),
            screens: document.querySelectorAll('#game-container .game-screen'),
            gamePanel: document.querySelector('.game-panel'),
            hudLevel: document.getElementById('hud-level'),
            hudScore: document.getElementById('hud-score'),
            hudTime: document.getElementById('hud-time'),
            timerProgress: document.getElementById('timer-progress'),
            questionCounter: document.getElementById('question-counter'),
            streakDisplay: document.getElementById('streak-display'),
            functionDisplay: document.getElementById('function-display-text'),
            optionsGrid: document.getElementById('options-grid'),
            feedbackBox: document.getElementById('feedback-box'),
            resultScore: document.getElementById('result-score'),
            statCorrect: document.getElementById('stat-correct'),
            statWrong: document.getElementById('stat-wrong'),
            statAccuracy: document.getElementById('stat-accuracy'),
            retryButton: document.getElementById('btn-retry'),
            menuButton: document.getElementById('btn-menu')
        };
    },

    createAudio() {
        this.bgMusic = new Audio('assets/sounds/background.mp3');
        this.bgMusic.loop = true;
        this.bgMusic.volume = 0.38;
    },

    async initPixi() {
        this.app = new PIXI.Application({
            resizeTo: this.dom.container,
            backgroundAlpha: 0,
            antialias: true,
            resolution: window.devicePixelRatio || 1,
            autoDensity: true
        });
        this.dom.pixiContainer.appendChild(this.app.view);

        this.bgSpriteA = new PIXI.Sprite();
        this.bgSpriteB = new PIXI.Sprite();
        this.bgSpriteA.anchor.set(0.5);
        this.bgSpriteB.anchor.set(0.5);
        this.bgSpriteA.alpha = 0;
        this.bgSpriteB.alpha = 0;

        this.app.stage.addChild(this.bgSpriteA);
        this.app.stage.addChild(this.bgSpriteB);

        try {
            // Traemos todas las imágenes de un solo para que no nos de casaca después
            this.spritesheet = await PIXI.Assets.load('assets/questions/spritesheet.json');
            
            if (this.spritesheet && this.spritesheet.textures) {
                this.textureNames = [
                    "Gemini_Generated_Image_2b7moy2b7moy2b7m.png",
                    "Gemini_Generated_Image_3barr83barr83bar.png",
                    "Gemini_Generated_Image_65oiha65oiha65oi.png",
                    "Gemini_Generated_Image_cfqlizcfqlizcfql.png",
                    "Gemini_Generated_Image_cw35stcw35stcw35.png",
                    "Gemini_Generated_Image_ifepusifepusifep.png",
                    "Gemini_Generated_Image_jfhapgjfhapgjfha.png",
                    "Gemini_Generated_Image_kj03y7kj03y7kj03.png",
                    "Gemini_Generated_Image_rkbe4crkbe4crkbe.png",
                    "Gemini_Generated_Image_ueo68tueo68tueo6"
                ];
                this.orderedTextures = this.textureNames.map(name => this.spritesheet.textures[name]).filter(Boolean);
            }
        } catch (e) {
            console.error("Error en initPixi:", e);
        }

        this.resizePixi();
        window.addEventListener('resize', () => this.resizePixi());

        // Si el usuario pone pantalla completa, reacomodamos todo para que no se vea fiero
        document.addEventListener('fullscreenchange', () => {
            if (this.app) {
                this.app.resize();
                this.resizePixi();
                // Le damos otro retoque por si las moscas, para que quede bien centrado
                requestAnimationFrame(() => {
                    this.app.resize();
                    this.resizePixi();
                });
            }
        });
    },

    resizePixi() {
        if (!this.app) return;
        const sw = this.app.screen.width;
        const sh = this.app.screen.height;

        // Si el contenedor está escondido, no hacemos nada para no trabar la onda
        if (!sw || !sh) return;

        let tw = 0, th = 0;

        [this.bgSpriteA, this.bgSpriteB].forEach(sprite => {
            if (sprite.texture && sprite.texture.valid) {
                tw = sprite.texture.width;
                th = sprite.texture.height;
                const scale = Math.max(sw / tw, sh / th);
                sprite.scale.set(scale);
                sprite.position.set(sw / 2, sh / 2);
            }
        });

        // Calculamos dónde va a caer la pizarra para que el panel flote cabal ahí
        if (tw && th && this.dom.gamePanel) {
            const scale = Math.max(sw / tw, sh / th);
            const scaledW = tw * scale;
            const scaledH = th * scale;
            const imgLeft = (sw - scaledW) / 2;
            const imgTop  = (sh - scaledH) / 2;

            const panelX = imgLeft + this.BOARD_NX * scaledW;
            const panelY = imgTop  + this.BOARD_NY * scaledH;

            this.dom.gamePanel.style.left = `${panelX}px`;
            this.dom.gamePanel.style.top  = `${panelY}px`;
        }

        this.app.render(); // Refrescamos el dibujo para que se vea el cambio al chilazo
    },

    bindEvents() {
        this.dom.retryButton.addEventListener('click', () => {
            this.start(this.state.selectedLevel);
        });

        this.dom.menuButton.addEventListener('click', () => {
            this.returnToHome();
        });
    },

    resetState() {
        this.state = {
            selectedLevel: null,
            score: 0,
            streak: 0,
            questionIndex: 0,
            correctCount: 0,
            wrongCount: 0,
            questionSet: [],
            currentQuestion: null,
            remainingTime: this.config.timeLimitSeconds,
            timerId: null,
            answered: false,
            visibleSprite: 'A'
        };
    },

    async start(level) {
        try {
            // Preparamos todo de antemano para que el juego arranque 
            const initPromise = this.init();

            if (!this.questionsByLevel[level]) {
                alert("Ese nivel no existe, compa: " + level);
                return;
            }

            this.resetState();
            this.state.selectedLevel = level;
            this.state.questionSet = this.buildQuestionSet(level);
            
            // Esperamos que cargue todo BIEN antes de mostrar la pantalla, para no ver cosas raras
            await initPromise;

            // Hoy sí, soltamos la pantalla de juego
            this.dom.container.classList.add('is-visible');
            this.dom.container.removeAttribute('inert');
            this.showScreen('screen-game');

            this.syncHeader();
            this.playMusic();

            // Ajustamos el fondo de Pixi de un solo para que no se vea movido
            if (this.app) {
                this.app.resize();
                this.resizePixi();
            }

            this.renderCurrentQuestion();
            this.triggerEntryEffect();

            // Por seguridad, volvemos a chequear el tamaño en el siguiente cuadro
            requestAnimationFrame(() => {
                if (this.app) {
                    this.app.resize();
                    this.resizePixi();
                }
            });
            } catch (e) {            console.error("Error in GameScreen.start:", e);
        }
    },

    triggerEntryEffect() {
        this.dom.gamePanel.classList.remove('entry-anim');
        void this.dom.gamePanel.offsetWidth; 
        this.dom.gamePanel.classList.add('entry-anim');

        if (this.bgSpriteA && this.bgSpriteA.texture && this.bgSpriteA.texture.valid) {
            const initialScale = this.bgSpriteA.scale.x;
            this.bgSpriteA.scale.set(initialScale * 1.15);
            this.bgSpriteA.alpha = 0;
            
            let blurFilter = null;
            // Metemos un filtro de desenfoque para que se vea con estilo
            const FilterClass = PIXI.BlurFilter || (PIXI.filters && PIXI.filters.BlurFilter);
            
            if (FilterClass) {
                blurFilter = new FilterClass();
                blurFilter.blur = 15;
                this.bgSpriteA.filters = [blurFilter];
            }

            let startTime = null;
            const duration = 1200; 

            const anim = (now) => {
                if (!startTime) startTime = now;
                const elapsed = now - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                const ease = 1 - Math.pow(1 - progress, 3);

                this.bgSpriteA.alpha = progress;
                this.bgSpriteA.scale.set(initialScale * (1.15 - (0.15 * ease)));
                
                if (blurFilter) {
                    blurFilter.blur = 15 * (1 - ease);
                }

                if (progress < 1) {
                    requestAnimationFrame(anim);
                } else {
                    this.bgSpriteA.filters = [];
                }
            };
            requestAnimationFrame(anim);
        }
    },

    shuffle(list) {
        const copy = [...list];
        for (let i = copy.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [copy[i], copy[j]] = [copy[j], copy[i]];
        }
        return copy;
    },

    buildQuestionSet(level) {
        return this.shuffle(this.questionsByLevel[level])
            .slice(0, this.config.totalQuestions)
            .map(question => ({
                fn: question.fn,
                answer: question.answer,
                options: this.shuffle(question.options)
            }));
    },

    showScreen(screenId) {
        this.dom.screens.forEach(screen => {
            const isActive = screen.id === screenId;
            screen.classList.toggle('is-active', isActive);
            screen.setAttribute('aria-hidden', String(!isActive));
            
            if (isActive) {
                screen.removeAttribute('inert');
            } else {
                screen.setAttribute('inert', '');
            }
        });

        // Manejamos el foco para que que usa teclado no se pierda
        const activeScreen = document.getElementById(screenId);
        if (activeScreen) {
            // Buscamos el primer botón o cosa que se pueda enfocar
            const firstFocusable = activeScreen.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
            if (firstFocusable) {
                firstFocusable.focus();
            } else {
                activeScreen.focus();
            }
        }
    },

    syncHeader() {
        const isGameActive = document.getElementById('screen-game').classList.contains('is-active');

        this.dom.hudLevel.textContent = this.state.selectedLevel
            ? this.levelLabels[this.state.selectedLevel]
            : 'Sin seleccionar';
        this.dom.hudScore.textContent = String(this.state.score);
        this.dom.hudTime.textContent =
            isGameActive && this.state.selectedLevel
                ? `${Math.max(0, this.state.remainingTime)}s`
                : '--';
    },

    playMusic() {
        if (!this.bgMusic) return;
        this.bgMusic.currentTime = 0;
        this.bgMusic.play().catch(() => {});
    },

    stopMusic() {
        if (!this.bgMusic) return;
        this.bgMusic.pause();
        this.bgMusic.currentTime = 0;
    },

    applyBackgroundForQuestion(index) {
        const showA = this.state.visibleSprite !== 'A';
        const incoming = showA ? this.bgSpriteA : this.bgSpriteB;
        const outgoing = showA ? this.bgSpriteB : this.bgSpriteA;

        if (this.orderedTextures && this.orderedTextures.length > 0) {
            const nextTexture = this.orderedTextures[index % this.orderedTextures.length];
            if (nextTexture) {
                incoming.texture = nextTexture;
                
                // SI ES LA PRIMERA PREGUNTA: La ponemos de un solo sin tanto mate
                if (index === 0) {
                    incoming.alpha = 1;
                    outgoing.alpha = 0;
                    this.state.visibleSprite = showA ? 'A' : 'B';
                    this.resizePixi();
                    this.app.render();
                    return;
                }

                // Para las demás preguntas: Hacemos un desvanecido suave para que se vea de toque
                setTimeout(() => {
                    this.resizePixi();
                    this.app.render();

                    let alpha = 0;
                    const step = () => {
                        alpha += 0.05;
                        incoming.alpha = alpha;
                        outgoing.alpha = 1 - alpha;
                        if (alpha < 1) requestAnimationFrame(step);
                        else {
                            incoming.alpha = 1;
                            outgoing.alpha = 0;
                            this.state.visibleSprite = showA ? 'A' : 'B';
                        }
                    };
                    step();
                }, 50);
            }
        }
    },

    renderCurrentQuestion() {
        this.state.currentQuestion = this.state.questionSet[this.state.questionIndex];
        this.state.answered = false;

        this.applyBackgroundForQuestion(this.state.questionIndex);

        this.dom.questionCounter.textContent =
            `Pregunta ${this.state.questionIndex + 1} de ${this.config.totalQuestions}`;
        this.dom.streakDisplay.textContent = `Racha: ${this.state.streak}`;
        this.dom.functionDisplay.textContent = this.state.currentQuestion.fn;
        this.dom.optionsGrid.innerHTML = '';

        this.state.currentQuestion.options.forEach(optionText => {
            const optionButton = document.createElement('button');
            optionButton.type = 'button';
            optionButton.className = 'option-btn';
            optionButton.textContent = optionText;
            optionButton.addEventListener('click', () => {
                this.processAnswer(optionText, optionButton);
            });
            this.dom.optionsGrid.appendChild(optionButton);
        });

        this.setFeedback('', '');
        this.startTimer();
    },

    startTimer() {
        if (this.state.timerId) {
            clearInterval(this.state.timerId);
        }
        
        this.state.remainingTime = this.config.timeLimitSeconds;
        this.paintTimer();

        this.state.timerId = setInterval(() => {
            // Si por alguna razón ya respondimos, matamos el intervalo
            if (this.state.answered) {
                clearInterval(this.state.timerId);
                this.state.timerId = null;
                return;
            }

            this.state.remainingTime -= 1;
            this.paintTimer();

            if (this.state.remainingTime <= 0) {
                clearInterval(this.state.timerId);
                this.state.timerId = null;
                this.processTimeout();
            }
        }, 1000);
    },

    paintTimer() {
        const percent = (this.state.remainingTime / this.config.timeLimitSeconds) * 100;
        this.dom.timerProgress.style.width = `${Math.max(0, percent)}%`;
        this.syncHeader();
    },

    setFeedback(message, type) {
        this.dom.feedbackBox.textContent = message;
        this.dom.feedbackBox.className = 'feedback-box';
        if (type) {
            this.dom.feedbackBox.classList.add(type);
        }
    },

    lockOptions(correctAnswer, selectedButton) {
        const buttons = this.dom.optionsGrid.querySelectorAll('.option-btn');
        buttons.forEach(button => {
            button.disabled = true;
            if (button.textContent === correctAnswer) {
                button.classList.add('is-correct');
            }
        });
        if (selectedButton && selectedButton.textContent !== correctAnswer) {
            selectedButton.classList.add('is-wrong');
        }
    },

    addScoreForCorrect() {
        const basePoints = 100;
        const speedBonus = this.state.remainingTime * 6;
        const streakBonus = this.state.streak * 15;
        const total = basePoints + speedBonus + streakBonus;
        this.state.score += total;
        return total;
    },

    processAnswer(selectedText, selectedButton) {
        if (this.state.answered) return;

        this.state.answered = true;
        
        // Paramos el tiempo de un solo
        if (this.state.timerId) {
            clearInterval(this.state.timerId);
            this.state.timerId = null;
        }

        const isCorrect = selectedText === this.state.currentQuestion.answer;

        try {
            if (isCorrect) {
                this.state.correctCount++;
                this.state.streak++;
                this.setFeedback(`Correcto. +${this.addScoreForCorrect()} puntos`, 'success');
                this.launchBeeCelebration();
            } else {
                this.state.wrongCount++;
                this.state.streak = 0;
                this.setFeedback(`Incorrecto. Resultado correcto: ${this.state.currentQuestion.answer}`, 'error');
                
                this.dom.gamePanel.classList.remove('shake');
                void this.dom.gamePanel.offsetWidth; 
                this.dom.gamePanel.classList.add('shake');
            }
        } catch (e) {
            console.error("Error procesando respuesta:", e);
        }

        this.lockOptions(this.state.currentQuestion.answer, selectedButton);
        this.dom.streakDisplay.textContent = `Racha: ${this.state.streak}`;
        this.syncHeader();
        
        // Saltamos a la siguiente después de un ratito
        setTimeout(() => this.goToNextStep(), this.config.transitionDelayMs);
    },

    processTimeout() {
        if (this.state.answered) return;
        this.state.answered = true;

        if (this.state.timerId) {
            clearInterval(this.state.timerId);
            this.state.timerId = null;
        }

        this.state.wrongCount++;
        this.state.streak = 0;
        
        try {
            this.lockOptions(this.state.currentQuestion.answer);
            this.setFeedback(`Tiempo agotado. Resultado correcto: ${this.state.currentQuestion.answer}`, 'error');
        } catch (e) {
            console.error("Error en processTimeout:", e);
        }

        this.dom.streakDisplay.textContent = `Racha: ${this.state.streak}`;
        this.syncHeader();
        setTimeout(() => this.goToNextStep(), this.config.transitionDelayMs);
    },

    goToNextStep() {
        // Clear any existing timer just in case
        if (this.state.timerId) {
            clearInterval(this.state.timerId);
            this.state.timerId = null;
        }

        this.state.questionIndex++;
        if (this.state.questionIndex >= this.config.totalQuestions) {
            this.openResults();
            return;
        }
        
        try {
            this.renderCurrentQuestion();
        } catch (e) {
            console.error("Error transitioning to next question:", e);
            // Fallback: try to open results if we can't render
            this.openResults();
        }
    },

    openResults() {
        clearInterval(this.state.timerId);
        this.stopMusic();

        const answeredTotal = this.state.correctCount + this.state.wrongCount;
        const accuracy = answeredTotal === 0
            ? 0
            : Math.round((this.state.correctCount / answeredTotal) * 100);

        this.dom.resultScore.textContent = String(this.state.score);
        this.dom.statCorrect.textContent = String(this.state.correctCount);
        this.dom.statWrong.textContent = String(this.state.wrongCount);
        this.dom.statAccuracy.textContent = `${accuracy}%`;

        this.showScreen('screen-result');
        this.state.remainingTime = this.config.timeLimitSeconds;
        this.syncHeader();
    },

    returnToHome() {
        clearInterval(this.state.timerId);
        this.stopMusic();
        this.resetState();
        this.dom.container.classList.remove('is-visible');

        if (window.returnToHomeMenu) {
            window.returnToHomeMenu();
        }
    },

    launchBeeCelebration() {
        if (typeof window.launchBeeCelebration === 'function') {
            window.launchBeeCelebration();
        } else {
            this.simpleCelebration();
        }
    },

    simpleCelebration() {
        // Hacemos una celebracion sencilla con puntitos de colores si no está la abeja
        const container = new PIXI.Container();
        this.app.stage.addChild(container);
        
        const colors = [0xFFD700, 0xFFFFFF, 0xFFAA00];
        
        for (let i = 0; i < 40; i++) {
            const particle = new PIXI.Graphics();
            const color = colors[Math.floor(Math.random() * colors.length)];
            particle.beginFill(color);
            particle.drawCircle(0, 0, Math.random() * 4 + 2);
            particle.endFill();
            
            particle.x = this.app.screen.width / 2;
            particle.y = this.app.screen.height / 2;
            
            const speed = Math.random() * 8 + 4;
            const angle = Math.random() * Math.PI * 2;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            let gravity = 0.15;
            
            container.addChild(particle);
            
            let alpha = 1;
            const move = () => {
                particle.x += vx;
                particle.y += vy;
                vy += gravity; 
                alpha -= 0.015;
                particle.alpha = alpha;
                
                if (alpha > 0) {
                    requestAnimationFrame(move);
                } else {
                    container.removeChild(particle);
                    if (container.children.length === 0) {
                        this.app.stage.removeChild(container);
                    }
                }
            };
            move();
        }
    }
};

window.GameScreen = GameScreen;
