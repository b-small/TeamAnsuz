(function() {
	//vars
	var canvas = document.getElementById('canvas');
	var ctx = canvas.getContext('2d');
	var player = {
		x: 64,
		y: 260,
		width: 60,
		height: 96
	};
	var ground = [];
	var enemies = [];
	var runes = [];
	var platformWidth = 32;

	var stop;

	var platformHeight = canvas.height - platformWidth * 4;
	var spaceHeld = false;
	var body = document.body;
	var html = document.documentElement;
	var height = Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight);
	var lives = 5;
	var points = 0;
	var hitSound = new Audio('sounds/punch.wav');
	var runeSound = new Audio('sounds/coin.ogg');

	// resize the canvas to fill browser wind
	window.addEventListener('resize', resizeCanvas, false);

	function resizeCanvas() {
		canvas.width = window.innerWidth;
		canvas.height = height;
		platformHeight = canvas.height - platformWidth;
		player.y = platformHeight - player.height + 4;

		//load images
		var assetLoader = (function() {
			// images 
			this.imgs = {
				'bg': 'imgs/sky.png',
				'sky': 'imgs/sky.png',
				'grass': 'imgs/grass.png',
				'avatar_normal': 'imgs/normal_walk.png',
				'enemy': 'imgs/scary.gif',
				'enemy1': 'imgs/soScary.gif',
				'enemy2': 'imgs/veryScary.gif',
				'rune': 'imgs/rune1.png',
				'rune1': 'imgs/rune2.png',
				'rune2': 'imgs/rune3.png'

			};

			var assetsLoaded = 0;
			var numImgs = Object.keys(this.imgs).length;
			this.totalAssets = numImgs;


			function assetLoaded(dic, name) {

				if (this[dic][name].status !== 'loading') {
					return;
				}

				this[dic][name].status = 'loaded';
				assetsLoaded++;

				// finished callback
				if (assetsLoaded === this.totalAssets && typeof this.finished === 'function') {
					this.finished();
				}
			}


			this.downloadAll = function() {
				var _this = this;
				var src;

				// load images
				for (var img in this.imgs) {
					if (this.imgs.hasOwnProperty(img)) {
						src = this.imgs[img];

						// closure for event binding
						(function(_this, img) {
							_this.imgs[img] = new Image();
							_this.imgs[img].status = 'loading';
							_this.imgs[img].name = img;
							_this.imgs[img].onload = function() {
								assetLoaded.call(_this, 'imgs', img)
							};
							_this.imgs[img].src = src;
						})(_this, img);
					}
				}
			}

			return {
				imgs: this.imgs,
				totalAssets: this.totalAssets,
				downloadAll: this.downloadAll
			};
		})();

		assetLoader.finished = function() {
			start();
		}


		function SpriteSheet(path, frameWidth, frameHeight) {
			this.image = new Image();
			this.frameWidth = frameWidth;
			this.frameHeight = frameHeight;

			// calculate number of frames in a row after the image loads
			var self = this;
			this.image.onload = function() {
				self.framesPerRow = Math.floor(self.image.width / self.frameWidth);
			};

			this.image.src = path;
		}

		//spritesheet animation
		function Animation(spritesheet, frameSpeed, startFrame, endFrame) {

			var animationSequence = [];
			var currentFrame = 0;
			var counter = 0;


			for (var frameNumber = startFrame; frameNumber <= endFrame; frameNumber++)
				animationSequence.push(frameNumber);

			//update animation
			this.update = function() {

				// update to the next frame 
				if (counter == (frameSpeed - 1)) {
					currentFrame = (currentFrame + 1) % animationSequence.length;
				}

				// update the counter
				counter = (counter + 1) % frameSpeed;
			};


			this.draw = function(x, y) {
				// row and col of the frame
				var row = Math.floor(animationSequence[currentFrame] / spritesheet.framesPerRow);
				var col = Math.floor(animationSequence[currentFrame] % spritesheet.framesPerRow);

				ctx.drawImage(
					spritesheet.image,
					col * spritesheet.frameWidth, row * spritesheet.frameHeight,
					spritesheet.frameWidth, spritesheet.frameHeight,
					x, y,
					spritesheet.frameWidth, spritesheet.frameHeight);
			};
		}

		//create background
		var background = (function() {
			var sky = {};

			this.draw = function() {

				ctx.drawImage(assetLoader.imgs.bg, 0, 0);


				sky.x -= sky.speed;
				// draw images side by side to loop
				ctx.drawImage(assetLoader.imgs.sky, sky.x, sky.y);
				ctx.drawImage(assetLoader.imgs.sky, sky.x + canvas.width, sky.y);

			};

			//reset background
			this.reset = function() {
				sky.x = 0;
				sky.y = 0;
				sky.speed = 0.2;

			}

			return {
				draw: this.draw,
				reset: this.reset
			};
		})();


		//create runes
		var runesF = (function() {
			runes.splice(0, runes.length);
			for (var i = 0; i < 6; i++) {

				var rune = {};
				rune.active = true;
				rune.width = 30;
				rune.height = 40;
				//runes.pop();
				runes.push(rune);
				rune.path = assetLoader.imgs.rune;
			}

			this.draw = function() {


				for (var i = 0; i < runes.length; i++) {


					runes[i].x -= runes[i].speed;
					// draw images side by side to loop
					if (runes[i].active) {
						ctx.drawImage(runes[i].path, runes[i].x, runes[i].y);
						ctx.drawImage(runes[i].path, runes[i].x + canvas.width, runes[i].y);
					}

					// ctx.font = "20pt Arial";
					// ctx.fillText("\n" + points + "pts", 50, 40);

					if( document.getElementById('score') == null ) {
						var scoreDiv = document.createElement('div');
						scoreDiv.id = "score";
						document.body.appendChild(scoreDiv);
						scoreDiv.innerHTML = points + 'pts';
					} else {
						document.getElementById('score').innerHTML = points + 'pts';
					}

					if (runes[i].x < 0) {
						updateCurrent(runes[i]);

					}
				}
			}


			function updateCurrent(rune) {
				rune.x = Math.random() * 1000 + 500;

				rune.speed = 6;
				rune.active = true;

				var nr1 = Math.random();
				if (nr1 < 0.3) {
					rune.path = assetLoader.imgs.rune;
					rune.y = Math.random() * 800;
				} else if (nr1 >= 0.3 && nr1 < 0.6) {
					rune.path = assetLoader.imgs.rune1;
					rune.y = Math.random() * 800;
				} else if (nr1 >= 0.6) {
					rune.path = assetLoader.imgs.rune2;
					rune.y = Math.random() * 800;
				}
			}

			this.updateRune = function() {

				for (var i = 0; i < runes.length; i++) {

					updateCurrent(runes[i]);

				}
			}

			return {
				draw: this.draw,
				updateRune: this.updateRune

			};
		})();



		//create enemies
		var enemiesF = (function() {
			enemies.splice(0, enemies.length);
			for (var i = 0; i < 2; i++) {
				var enemy = {};
				enemy.active = true;
				enemy.width = 145;
				enemy.height = 123;
				enemies.push(enemy);
				enemy.path = assetLoader.imgs.enemy;
			}

			this.draw = function() {
				for (var i = 0; i < enemies.length; i++) {

					enemies[i].x -= enemies[i].speed;
					// draw images side by side to loop

					ctx.drawImage(enemies[i].path, enemies[i].x, enemies[i].y);
					ctx.drawImage(enemies[i].path, enemies[i].x + canvas.width, enemies[i].y);

					// ctx.font = "20pt Arial";
					// ctx.fillText("" + lives, 20, 40);


					if( document.getElementById('lives') == null ) {
						var livesDiv = document.createElement('div');
						livesDiv.id = "lives";
						document.body.appendChild(livesDiv);
						livesDiv.innerHTML = lives;
					} else {
						document.getElementById('lives').innerHTML = lives;
						// alert(document.getElementById('lives').innerHtml);
					}

					if ( lives <= 0 ) {
						location.href = 'gameover.html';
					}
					if (enemies[i].x <= 0) {
						updateCurr(enemies[i]);
					}
				}

			}

			function updateCurr(enemy) {
				enemy.x = canvas.width + Math.random() * 1500;
				enemy.speed = 6;
				enemy.active = true;
				var nr = Math.random();
				if (nr < 0.3) {
					enemy.path = assetLoader.imgs.enemy;
					enemy.y = player.y - 20 - Math.random() * 300;
				} else if (nr >= 0.3 && nr < 0.6) {
					enemy.path = assetLoader.imgs.enemy1;
					enemy.y = player.y - 45 - Math.random() * 300;
				} else if (nr >= 0.6) {
					enemy.path = assetLoader.imgs.enemy2;
					enemy.y = player.y - 60;
				}

			}
			this.update = function() {
				for (var i = 0; i < enemies.length; i++) {
					updateCurr(enemies[i]);
				};

			}

			return {
				draw: this.draw,
				update: this.update
			};
		})();


		//game loop
		function animate() {


			requestAnimFrame(animate);

			//ctx.clearRect(0, 0, canvas.width, canvas.height);
			background.draw();

			enemiesF.draw();

			runesF.draw();


			for (i = 0; i < ground.length; i++) {
				ground[i].x -= player.speed;
				ctx.drawImage(assetLoader.imgs.grass, ground[i].x, ground[i].y);
			}

			if (ground[0].x <= -platformWidth) {
				ground.shift();
				ground.push({
					'x': ground[ground.length - 1].x + platformWidth,
					'y': platformHeight
				});
			}


			checkForCollision();
			checkForPointsCollision();
			player.anim.update();
			player.anim.draw(player.x, player.y);


		}


		var requestAnimFrame = (function() {
			return window.requestAnimationFrame ||
				window.webkitRequestAnimationFrame ||
				window.mozRequestAnimationFrame ||
				window.oRequestAnimationFrame ||
				window.msRequestAnimationFrame ||
				function(callback, element) {
					window.setTimeout(callback, 1000 / 60);
				};
		})();



		function start() {
			// setup 

			player.width = 60;
			player.height = 96;
			player.speed = 6;
			player.sheet = new SpriteSheet('imgs/normal_walk.png', player.width, player.height);
			player.anim = new Animation(player.sheet, 4, 0, 15);

			// ground tiles
			for (i = 0, length = Math.floor(canvas.width / platformWidth) + 2; i < length; i++) {
				ground[i] = {
					'x': i * platformWidth,
					'y': platformHeight
				};
			}


			background.reset();
			enemiesF.update();
			runesF.updateRune();
			animate();

		}

		assetLoader.downloadAll();
	}


	function checkForCollision() {
		enemies.forEach(function(enemy) {
			if (collides(enemy, player)) {
				lives--;
				enemy.active = false;
				hitSound.play();
			}
		});
	}

	function checkForPointsCollision() {
		runes.forEach(function(rune) {
			if (collides(rune, player)) {
				points += 10;
				rune.active = false;
				runeSound.play();
			}
		});
	}

	function collides(a, b) {
		if (a.active) {
			var collision = (b.x + b.width >= a.x && b.x <= a.x + a.width) && (b.y + b.height >= a.y && b.y <= a.y + a.height);
			return collision;
		} else {
			return false;
		}
	}

	function jump(event) {
	if(player.y>0){
		player.y -= 100;
		var counter = 0;
			var asd=100;
		var i = setInterval(function() {
			player.y += 10;
			counter++;
			asd=asd + 20;
			if (counter === 10) {
				clearInterval(i);
			}
		}, asd);}
	}

	canvas.addEventListener("click", jump, true);
	canvas.addEventListener("touch", jump, true);
	document.onkeydown = function() {
		switch (window.event.keyCode) {
			case 38:
				jump();
				break;
			case 32:
				jump();
				break;
		}
	};
	resizeCanvas();
})();
