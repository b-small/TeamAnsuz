(function() {
  //vars
  var canvas = document.getElementById('canvas');
  var ctx = canvas.getContext('2d');
  var player = { x : 64, y : 260, width : 60, height : 96 };
  var ground = [];
  var platformWidth = 32;
  var platformHeight = canvas.height - platformWidth * 4;
  var spaceHeld = false;
  var body = document.body;
  var html = document.documentElement;
  var height = Math.max( body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight );

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
        'avatar_normal': 'imgs/normal_walk.png'
      };

      var assetsLoaded = 0;
      var numImgs = Object.keys(this.imgs).length;
      this.totalAssest = numImgs;


      function assetLoaded(dic, name) {

        if (this[dic][name].status !== 'loading') {
          return;
        }

        this[dic][name].status = 'loaded';
        assetsLoaded++;

        // finished callback
        if (assetsLoaded === this.totalAssest && typeof this.finished === 'function') {
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
        totalAssest: this.totalAssest,
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

    //game loop
    function animate() {
      requestAnimFrame(animate);

      background.draw();

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

      animate();
    }

    assetLoader.downloadAll();
  }

  resizeCanvas();
})();