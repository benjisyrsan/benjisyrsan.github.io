var canvas = document.getElementById("gamescreen");
var ctx = canvas.getContext("2d", { alpha: false });

var screenSize = [470, 705];

canvas.setAttribute('width', screenSize[0]);
canvas.setAttribute('height', screenSize[1]);

const textureSheet = new Image();
textureSheet.src = "./src/resourses/grass_tile.png";
let textureBlockSize = 8; //px

function StartMusic(){
    return;
    soundtrack.play();
    hasStartedSong = true;
  }

var pn = new Perlin(Math.random*9999);


let worldBlocksDict = {}
var block_px_size = 1;

class block{
    constructor(pos, ID) {
      this.pos = pos
      this.ID = ID
    }
}

ctx.fillStyle = "white";
ctx.fillRect(0, 0, screenSize[0], screenSize[1]);

textureSheet.onload = function(){
    ctx.imageSmoothingEnabled = false;
    Draw();
}

const lowestLevel = 600; 
const lowestLevelAmmount = 0.095; 
let perlinScale = 15;

function Draw(){
    for (let y = 0; y < 600; y++){
        for (let x = 0; x < 400; x++){
            let noise1 = pn.noise(x/perlinScale, y/perlinScale, 0) //mediumscale
            let noise2 = pn.noise((x+1000)/perlinScale*2, (y+1000)/perlinScale*2, 0) //smallscale
            let noise3 = pn.noise((x+10000)/perlinScale*1, (y+10000)/perlinScale*0.1, 0) //vertical drops
            let noiseSum = noise1*0.3 + noise2*0.2 + noise3*0.5
          
            //spawn stone
            blockID = 1

            //spawn grass
            if (worldBlocksDict[[x, y+1]] == undefined){
                blockID = 0;
            }

            //spawn lava
            if (worldBlocksDict[[x-1, y]] == undefined){
                if (Math.random() < 0.3){
                    blockID = 3;
                }
            }
          
            let percentageToLowest = y/lowestLevel;

            if (noiseSum > 0.6 - percentageToLowest*lowestLevelAmmount){
                let newBlock = new block([x, y], blockID);
                worldBlocksDict[[x, y]] = newBlock;
                
                ctx.fillStyle = "green";
                ctx.fillRect(x, y, block_px_size, block_px_size)
            }
        }
    }
}
