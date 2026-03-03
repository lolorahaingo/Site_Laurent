// Snake Game (port fidele du fichier Snake.pde)
(function () {
  'use strict';

  // --- Canvas & contexte ---
  var canvas = document.getElementById('snake-canvas');
  var ctx = canvas.getContext('2d');

  // --- Dimensions de la grille ---
  // Original .pde : 901x801 avec cellules de 20px
  // On utilise un canvas plus petit (601x601) avec cellules de 20px pour le web
  var CELL = 20;
  var COLS = Math.floor(canvas.width / CELL);   // 30
  var ROWS = Math.floor(canvas.height / CELL);   // 30

  // --- Etat du jeu ---
  var MAX_SNAKE = 700;
  var snakesX = new Array(MAX_SNAKE);
  var snakesY = new Array(MAX_SNAKE);
  var colors  = new Array(MAX_SNAKE);
  var snakeSize, time, moveX, moveY;
  var snakeHeadX, snakeHeadY;
  var foodX, foodY;
  var lastMove, gameOver, score;
  var animId;

  // --- Elements UI ---
  var scoreEl = document.getElementById('snake-score');
  var speedEl = document.getElementById('snake-speed');

  // --- Utilitaires couleur HSB -> RGB ---
  // Processing HSB(100,1,1) : h in [0,100], s=1, b in [0,1]
  function hsbToRgb(h100, s, b) {
    var h = (h100 / 100) * 360;
    var c = b * s;
    var x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    var m = b - c;
    var r, g, bl;
    if      (h < 60)  { r = c; g = x; bl = 0; }
    else if (h < 120) { r = x; g = c; bl = 0; }
    else if (h < 180) { r = 0; g = c; bl = x; }
    else if (h < 240) { r = 0; g = x; bl = c; }
    else if (h < 300) { r = x; g = 0; bl = c; }
    else               { r = c; g = 0; bl = x; }
    return 'rgb(' + Math.round((r + m) * 255) + ',' + Math.round((g + m) * 255) + ',' + Math.round((bl + m) * 255) + ')';
  }

  // --- Reset ---
  function reset() {
    var sX = Math.floor(Math.random() * (COLS - 1)) + 1;
    var sY = Math.floor(Math.random() * (ROWS - 1)) + 1;
    var fX = Math.floor(Math.random() * (COLS - 1)) + 1;
    var fY = Math.floor(Math.random() * (ROWS - 1)) + 1;
    snakeHeadX = sX * CELL;
    snakeHeadY = sY * CELL;
    snakesX[0] = snakeHeadX;
    snakesY[0] = snakeHeadY;
    foodX = fX * CELL;
    foodY = fY * CELL;
    moveX = 0;
    moveY = 0;
    gameOver = false;
    score = 0;
    snakeSize = 1;
    lastMove = performance.now();
    time = 200;
    colors[0] = Math.floor(Math.random() * 100);
    updateHud();
  }

  function updateHud() {
    scoreEl.textContent = 'Score : ' + score;
    speedEl.textContent = 'Vitesse : ' + Math.round(time) + ' ms';
  }

  // --- Dessin grille ---
  function drawGrid() {
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 0.5;
    for (var i = 0; i <= COLS; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL, 0);
      ctx.lineTo(i * CELL, canvas.height);
      ctx.stroke();
    }
    for (var j = 0; j <= ROWS; j++) {
      ctx.beginPath();
      ctx.moveTo(0, j * CELL);
      ctx.lineTo(canvas.width, j * CELL);
      ctx.stroke();
    }
  }

  // --- Dessin serpent ---
  function drawSnake() {
    for (var i = 0; i < snakeSize; i++) {
      ctx.fillStyle = hsbToRgb(colors[i], 1, 0.5);
      ctx.fillRect(snakesX[i], snakesY[i], CELL, CELL);
      // Petit contour pour distinguer les segments
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = 1;
      ctx.strokeRect(snakesX[i], snakesY[i], CELL, CELL);
    }
  }

  // --- Dessin nourriture ---
  function drawFood() {
    ctx.fillStyle = hsbToRgb(100, 1, 0.5);
    ctx.fillRect(foodX, foodY, CELL, CELL);
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(foodX, foodY, CELL, CELL);
  }

  // --- Manger ---
  function ateFood() {
    if (foodX === snakeHeadX && foodY === snakeHeadY) {
      snakeSize++;
      score++;
      if (time > 60) time -= 3;
      var fX = Math.floor(Math.random() * (COLS - 1)) + 1;
      var fY = Math.floor(Math.random() * (ROWS - 1)) + 1;
      foodX = fX * CELL;
      foodY = fY * CELL;
      colors[snakeSize - 1] = Math.floor(Math.random() * 100);
      updateHud();
    }
  }

  // --- Deplacement ---
  function snakeMove() {
    snakeHeadX += moveX;
    snakeHeadY += moveY;

    // Collision murs
    if (snakeHeadX < 0 || snakeHeadX > canvas.width - 1 ||
        snakeHeadY < 0 || snakeHeadY > canvas.height - 1) {
      gameOver = true;
    }
    // Collision avec soi-meme
    for (var i = 1; i < snakeSize; i++) {
      if (snakesX[i] === snakeHeadX && snakesY[i] === snakeHeadY) {
        gameOver = true;
      }
    }

    // Deplacer la queue
    for (var j = snakeSize; j > 0; j--) {
      snakesX[j] = snakesX[j - 1];
      snakesY[j] = snakesY[j - 1];
    }
    snakesX[0] = snakeHeadX;
    snakesY[0] = snakeHeadY;
  }

  // --- Game Over overlay ---
  function drawGameOver() {
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 20);
    ctx.font = '16px Inter, sans-serif';
    ctx.fillStyle = '#9999aa';
    ctx.fillText('Score : ' + score, canvas.width / 2, canvas.height / 2 + 15);
    ctx.fillText("Appuyez sur 'R' pour recommencer", canvas.width / 2, canvas.height / 2 + 45);
  }

  // --- Ecran d'attente (avant la premiere touche) ---
  function drawWaiting() {
    ctx.fillStyle = '#9999aa';
    ctx.font = '16px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Appuyez sur une fleche pour commencer', canvas.width / 2, canvas.height / 2 + 40);
  }

  // --- Boucle principale ---
  function draw(timestamp) {
    // Fond
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawGrid();

    if (!gameOver) {
      drawSnake();
      drawFood();

      // Afficher indication si le serpent ne bouge pas encore
      if (moveX === 0 && moveY === 0) {
        drawWaiting();
      }

      if (timestamp - lastMove >= time) {
        if (moveX !== 0 || moveY !== 0) {
          snakeMove();
          ateFood();
        }
        lastMove = timestamp;
      }
    } else {
      drawSnake();
      drawFood();
      drawGameOver();
    }

    animId = requestAnimationFrame(draw);
  }

  // --- Clavier ---
  document.addEventListener('keydown', function (e) {
    switch (e.key) {
      case 'ArrowUp':
        if (moveY !== CELL) { moveY = -CELL; moveX = 0; }
        e.preventDefault();
        break;
      case 'ArrowDown':
        if (moveY !== -CELL) { moveY = CELL; moveX = 0; }
        e.preventDefault();
        break;
      case 'ArrowLeft':
        if (moveX !== CELL) { moveX = -CELL; moveY = 0; }
        e.preventDefault();
        break;
      case 'ArrowRight':
        if (moveX !== -CELL) { moveX = CELL; moveY = 0; }
        e.preventDefault();
        break;
      case 'r':
      case 'R':
        reset();
        break;
    }
  });

  // --- Controles mobiles ---
  var controls = document.getElementById('snake-controls');
  controls.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-dir]');
    if (btn) {
      var dir = btn.getAttribute('data-dir');
      if (dir === 'up'    && moveY !== CELL)   { moveY = -CELL; moveX = 0; }
      if (dir === 'down'  && moveY !== -CELL)  { moveY = CELL;  moveX = 0; }
      if (dir === 'left'  && moveX !== CELL)   { moveX = -CELL; moveY = 0; }
      if (dir === 'right' && moveX !== -CELL)  { moveX = CELL;  moveY = 0; }
    }
  });
  document.getElementById('btn-restart').addEventListener('click', function () {
    reset();
  });

  // --- Empecher le scroll sur mobile avec les fleches / swipe sur le canvas ---
  canvas.addEventListener('touchmove', function (e) { e.preventDefault(); }, { passive: false });

  // --- Lancement ---
  reset();
  animId = requestAnimationFrame(draw);
})();
