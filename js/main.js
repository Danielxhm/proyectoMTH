/* Esta función abre el juego con el nivel que hayás escogido, para que le des con todo */
function openGameLevel(level) {
    if (!window.GameScreen) {
        console.error('El GameScreen no está listo, qué mala onda');
        return;
    }

    var homeContainer = document.getElementById('home-container');
    var gameContainer = document.getElementById('game-container');

    if (homeContainer) {
        // Cerramos el menú con un efecto chivo
        homeContainer.classList.add('closing-lock');
        homeContainer.setAttribute('inert', '');

        // Esperamos que termine la animación para quitar el menú
        homeContainer.addEventListener('animationend', function handler(e) {
            if (e.animationName !== 'lock-close') return;
            homeContainer.removeEventListener('animationend', handler);

            homeContainer.classList.remove('is-visible');
            homeContainer.classList.remove('closing-lock');

            // Hoy sí, mostramos el juego
            if (gameContainer) {
                gameContainer.style.display = 'block';
                gameContainer.removeAttribute('inert');
                
                setTimeout(function() {
                    window.GameScreen.start(level);
                }, 20);
            }
        });
    } else {
        // Si por alguna razón no está el menú, tiramos el juego de un solo
        if (gameContainer) {
            gameContainer.style.display = 'block';
            gameContainer.removeAttribute('inert');
            setTimeout(function() {
                window.GameScreen.start(level);
            }, 20);
        }
    }
}

/* Con esto nos regresamos al menú principal si ya nos aburrimos del juego */
function returnToHomeMenu() {
    var gameContainer = document.getElementById('game-container');
    var homeContainer = document.getElementById('home-container');

    // Quitamos la pantalla del juego
    if (gameContainer) {
        gameContainer.classList.remove('is-visible');
        gameContainer.setAttribute('inert', '');
        
        // Lo sacamos del renderizado para que no estorbe los clics
        setTimeout(function() {
            gameContainer.style.display = 'none';
        }, 500);
    }

    // Ponemos el menú de nuevo, ¡chivísimo!
    if (homeContainer) {
        homeContainer.classList.add('is-visible');
        homeContainer.removeAttribute('inert');
    }
}

document.addEventListener('DOMContentLoaded', function () {
// QUITAMOS LA BARRERA INVISIBLE
// Escondemos el juego del todo para que no nos ande robando los hovers y clics del menú
var gameContainer = document.getElementById('game-container');
if (gameContainer) {
    gameContainer.style.display = 'none';
    gameContainer.setAttribute('inert', '');
}

window.LoadingScreen.init();
    window.LoadingScreen.onVideoStarted = function () {
        window.HomeScreen.init();
    };

    window.LoadingScreen.onVideoFinished = function () {
        window.HomeScreen.reveal();
        
        // Limpiamos todo después de la cinemática para que quede nítido
        setTimeout(function() {
            var hc = document.getElementById('home-container');
            if (hc) {
                hc.classList.remove('reveal-lock');
                hc.classList.add('reveal-finished');
            }
            
            // Mandamos a volar las pantallas de carga que ya no ocupamos
            var capasMuertas = ['flash-overlay', 'video-screen', 'loading-screen', 'fullscreen-prompt'];
            capasMuertas.forEach(function(id) {
                var capa = document.getElementById(id);
                if (capa) capa.style.display = 'none';
            });
        }, 1200);
    };

    // Aquí capturamos cuando el usuario le da clic a un nivel, fluyendo como mantequilla
    document.addEventListener('click', function (event) {
        var button = event.target.closest('.btn[data-game-level]');
        if (button) {
            event.preventDefault(); 
            openGameLevel(button.getAttribute('data-game-level'));
        }
    });

    window.returnToHomeMenu = returnToHomeMenu;
});
