let muteAudio = false;

function sound(src) {
    this.sound = document.createElement("audio");
    this.sound.src = src;
    this.sound.setAttribute("preload", "auto");
    this.sound.setAttribute("controls", "none");
    this.sound.style.display = "none";
    document.body.appendChild(this.sound);
    this.play = function(){
        if (!muteAudio){
            this.sound.play();
        }
    }
    this.stop = function(){
      this.sound.pause();
    }
  }
  
let bounceSound = new sound("./src/resourses/bounce2.wav");
let lavaSound = new sound("./src/resourses/lava.wav");
let coinSound = new sound("./src/resourses/coin.wav");
let soundtrack = new sound("./src/resourses/cavetheme.ogg");
soundtrack.sound.loop = true;