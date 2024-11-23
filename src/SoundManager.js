let muteAudio = false;

var hasStartedSong = false;
function StartMusic(){
  if (!hasStartedSong){
    hasStartedSong = true;
    setTimeout(function(){soundtrack.play();}, 1000); 
  }
}

function sound(src) {
    this.sound = document.createElement("audio");
    this.sound.src = src;
    this.sound.setAttribute("preload", "auto");
    this.sound.setAttribute("controls", "none");
    this.sound.style.display = "none";
    document.body.appendChild(this.sound);
    this.play = function(){
        if (!muteAudio && hasStartedSong){
            this.sound.play();
        }
    }
    this.stop = function(){
      this.sound.pause();
    }
  }
  
let bounceSound = new sound("./src/resourses/sounds/bounce2.wav");
let lavaSound = new sound("./src/resourses/sounds/lava.wav");
let coinSound = new sound("./src/resourses/sounds/coin.wav");
let soundtrack = new sound("./src/resourses/sounds/cavetheme.ogg");
soundtrack.sound.loop = true;