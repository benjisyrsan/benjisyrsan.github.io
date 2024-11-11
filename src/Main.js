var screenSize = [470, 705];

var canvas = document.getElementById("gamescreen");
canvas.setAttribute('width', screenSize[0]);
canvas.setAttribute('height', screenSize[1]);
var ctx = canvas.getContext("2d", { alpha: false });

//offscreen canvas
//var offscreenCanvas = document.createElement("canvas");
//offscreenCanvas.width = canvas.width;
//offscreenCanvas.height = canvas.height;
//var offscreenCanvasCtx = offscreenCanvas.getContext("2d", { alpha: false });

var gui = document.getElementById("gui");
gui.setAttribute('width', screenSize[0]);
gui.setAttribute('height', screenSize[1]);
var ctxGui = gui.getContext("2d");

var txt = document.getElementById("infotext");
let depthText = document.getElementById("depthText");
var coinText = document.getElementById("inGameInfo");

const textureSheet = new Image();
textureSheet.src = "./src/resourses/grass_tile.png";
textureSheet.onload = function(){
  ctx.imageSmoothingEnabled = false;
}
let textureBlockSize = 32; //px

const playerAnimationSheet = new Image();
playerAnimationSheet.src = "./src/resourses/playerAnimation.png";

const backgroundImage0 = new Image();
backgroundImage0.src = "./src/resourses/bgImgLayer0.png";

const backgroundImage1 = new Image();
backgroundImage1.src = "./src/resourses/bgImgLayer1.png";

const backgroundImage2 = new Image();
backgroundImage2.src = "./src/resourses/bgImgLayer2.png";

const backgroundImage3 = new Image();
backgroundImage3.src = "./src/resourses/bgImgLayer3.png";

const bgImgSize = canvas.height;

var lastFrameTimeMs = 0;
var maxFPS = 20;
var capFPS = false;
let deltaTime = 0;

var lastPos = [0, 0];
var block_px_size = 32;

var pn = new Perlin(Math.floor(Math.random()*9999));
let perlinScale = 17;

let worldBlocksDict = {}
let discoveredChunks = {}
let chunkSize = 6; //12
let chunkSpawnDist = [-2, 2, -3, 2]; //left to right, bot to top

let playerPos = [0, 0]
let playerChunkPos = [0, 0]
let playerVelocity = [0, 0]
let viewingDistance = [9, 14]; // [9, 14]
const collisionOffset = 0.4;

const lowestLevel = 2000; //deepness where hardest level is
const lowestLevelAmmount = 0.095; //how hard the hardest level is (0.088 is on the limit to impossible)

const gravity = 0.000035;
const movementSpeed = 0.015;
const blockBounciness = 0.02;

let coins = 0;

class block{
  constructor(pos, ID) {
    this.pos = pos
    this.ID = ID
  }
}

class backgroundObject{
  constructor(pos) {
    this.pos = pos;
  }
}

class backgroundLayer{
  constructor(parallaxSpeed, image) {
    this.parallaxSpeed = parallaxSpeed;
    this.image = image;
    this.backgroundObjectsList = [
      new backgroundObject([0, 0]),
      new backgroundObject([0, bgImgSize]),
      new backgroundObject([bgImgSize, 0]),
      new backgroundObject([bgImgSize, bgImgSize])
  ]
  }

  Update() {
    for (let i = 0; i < this.backgroundObjectsList.length; i++){
      let curBackgroundOB = this.backgroundObjectsList[i]
      let px_x = curBackgroundOB.pos[0] - playerPos[0]*block_px_size*this.parallaxSpeed;
      let px_y = curBackgroundOB.pos[1] + playerPos[1]*block_px_size*this.parallaxSpeed;
  
      if (px_x < -bgImgSize){
        curBackgroundOB.pos[0] += bgImgSize*2
      }
      else if (px_x >= bgImgSize){
        curBackgroundOB.pos[0] -= bgImgSize*2
      }
  
      if (px_y < -bgImgSize){
        curBackgroundOB.pos[1] += bgImgSize*2
      }
      else if (px_y >= bgImgSize){
        curBackgroundOB.pos[1] -= bgImgSize*2
      }
  
      ctx.drawImage(this.image, 0, 0, 1024, 1024, px_x, px_y, bgImgSize, bgImgSize)
    }
  }
}

let bgLayers = [
  new backgroundLayer(0.1, backgroundImage0), 
  //new backgroundLayer(0.2, backgroundImage1),
  //new backgroundLayer(0.25, backgroundImage2),
  new backgroundLayer(0.3, backgroundImage3)]

hasStartedSong = false;
function StartMusic(){
  if (!hasStartedSong){
    soundtrack.play();
    hasStartedSong = true;
  }
}

let curAnimIndex = 0;
let curAnimType = 0;
let lastAnimationTimestamp = 0;
const animationSpeedMS = 100;

var displayInfo = "...";

let timeBeforeInactive = 0;
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    timeBeforeInactive = Date.now();
  } 
  else{
    lastFrameTimeMs += Date.now() - timeBeforeInactive;
  }
});


//Gameloop
requestAnimationFrame(mainLoop);
function mainLoop(timestamp) {
  
  if (capFPS && timestamp < lastFrameTimeMs + 1000 / maxFPS) {
    requestAnimationFrame(mainLoop);
    return;
  }

  deltaTime = timestamp - lastFrameTimeMs;

  /*
  displayInfo = "Position: " + Math.floor(playerPos[0]) + ", " + Math.floor(playerPos[1]) + 
  "<br> FPS: " + Math.round(1000/deltaTime);
  txt.innerHTML = displayInfo;
  */
  depthText.innerHTML = Math.floor(-playerPos[1]/10)*10;
  coinText.innerHTML = coins;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  //offscreenCanvasCtx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "darkslateblue";
  ctx.fillRect(0, 0, screenSize[0], screenSize[1]);
  for (let i = 0; i < bgLayers.length; i++){
    bgLayers[i].Update();
  }

  
  updatePlayer();
  updateWorld();
  renderObjects(timestamp);

  lastFrameTimeMs = timestamp;
  requestAnimationFrame(mainLoop);
}

function updatePlayer(){
  playerVelocity = addVectors(playerVelocity, [0, -gravity * deltaTime])
  playerPos = addVectors(playerPos, [playerVelocity[0]*deltaTime, playerVelocity[1]*deltaTime])
  playerPos = addVectors(playerPos, [movement_direction[0] * movementSpeed * deltaTime, 0])
}

function updateWorld(){
  //spawn chunks
  playerChunkPos = [Math.floor(playerPos[0]/chunkSize), Math.floor(playerPos[1]/chunkSize)]
  for (let y = playerChunkPos[1]+chunkSpawnDist[2]; y < playerChunkPos[1]+chunkSpawnDist[3]+1; y++){
    for (let x = playerChunkPos[0]+chunkSpawnDist[0]; x < playerChunkPos[0]+chunkSpawnDist[1]+1; x++){
      lookChunkPos = [x, y];
      if (discoveredChunks[lookChunkPos] == undefined && playerChunkPos[1] <= -2){
        discoveredChunks[lookChunkPos] = 1;
        createChunk(lookChunkPos[0]*chunkSize, (lookChunkPos[0]+1)*chunkSize, (lookChunkPos[1]+1)*chunkSize, lookChunkPos[1]*chunkSize);
      }
    }
  }

  //checking blocks in view
  start_x = Math.floor(playerPos[0]) - viewingDistance[0];
  end_x = Math.floor(playerPos[0]) + viewingDistance[0] + 1;
  start_y = Math.floor(playerPos[1]) - viewingDistance[1] + 2;
  end_y = Math.floor(playerPos[1]) + viewingDistance[1];

  for (let y = start_y; y < end_y; y++){
    for (let x = start_x; x < end_x; x++){
      curBlock = worldBlocksDict[[x, y]];
      if (curBlock == undefined)
        continue;

      //CHECK COLLISIONS
      if (playerPos[1] <= y && playerPos[1] >= y-2 && playerPos[0] >= x+collisionOffset && playerPos[0] <= x+2-collisionOffset){
        if (curBlock.ID == 3){
          let lavaBounciness = 0.05;
          playerVelocity = [lavaBounciness*(Math.random()-0.5), blockBounciness + lavaBounciness*(Math.random()*0.5)]
          lavaSound.play();
        }

        else if (curBlock.ID == 4){ //coin pickup
          delete worldBlocksDict[[x, y]]
          coinSound.play();
          coins ++;
        }

        else{
          playerVelocity = [0, blockBounciness]
          bounceSound.play();
        }
      }

      //RENDER
      xPosScreen = Math.floor(screenSize[0]/2 + (x - playerPos[0]) * block_px_size);
      yPosScreen = Math.floor(screenSize[1]/2 - (y - playerPos[1]) * block_px_size);
      ctx.drawImage(textureSheet, 0, 2*textureBlockSize + curBlock.ID*textureBlockSize, textureBlockSize, textureBlockSize, 
        xPosScreen, 
        yPosScreen, 
        block_px_size, 
        block_px_size);
    }
  }

  //offscreen canvas:   ctx.drawImage(offscreenCanvas, 0, 0);
}

function renderObjects(timestamp) {
  ctx.drawImage(playerAnimationSheet, curAnimType*16, curAnimIndex*16, 16, 16, canvas.width/2 - block_px_size, canvas.height/2 - block_px_size, block_px_size, block_px_size);
  
  //ctx.strokeStyle = "blue";
  //ctx.lineWidth = 2;
  //ctx.strokeRect(canvas.width/2 - canvas.width*(16/widthInBlocks)/2, canvas.height/2 - 1.5*canvas.width*(16/widthInBlocks)/2, canvas.width*(16/widthInBlocks), canvas.width*(16/widthInBlocks)*1.5);
  
  if (timestamp - lastAnimationTimestamp < animationSpeedMS)
    return;

  lastAnimationTimestamp = timestamp
  curAnimIndex ++;
  if (curAnimIndex == 3)
    curAnimIndex = 0;
  return
  ctx.fillStyle = "red";
  ctx.fillRect(canvas.width/2 - block_px_size, canvas.height/2 - block_px_size, block_px_size, block_px_size);
}

function createChunk(start_x, end_x, start_y, end_y){
  let percentageToLowest = -playerPos[1]/lowestLevel
  if (percentageToLowest > 1)
    percentageToLowest = 1;

  for (let y = start_y; y > end_y; y--){
    for (let x = start_x; x < end_x; x++){
      let noise1 = pn.noise(x/perlinScale*1.2, y/perlinScale, 0) //mediumscale
      let noise2 = pn.noise((x+1000)/perlinScale*2, (y+1000)/perlinScale*1.7, 0) //smallscale
      let noise3 = pn.noise((x+10000)/perlinScale*1, (y+10000)/perlinScale*0.1, 0) //vertical drops
      let noiseSum = noise1*0.5 + noise2*0.4 + noise3*0.1;
      
      //spawn stone
      blockID = 1

      //spawn grass
      if (worldBlocksDict[[x, y+1]] == undefined && y != start_y){
        blockID = 0;
      }

      //spawn lava
      if (worldBlocksDict[[x-1, y]] == undefined && y != start_y){
        if (Math.random() < 0.3){
          blockID = 3;
        }
      }

      if (noiseSum > 0.6 - percentageToLowest*lowestLevelAmmount){ //0.55 is good
        let newBlock = new block([x, y], blockID);
        worldBlocksDict[[x, y]] = newBlock;
      }

      else{
        //spawn coin
        if (worldBlocksDict[[x, y]] == undefined && y != start_y){
          if (Math.random() < 0.003){
            blockID = 4;
            let newBlock = new block([x, y], blockID);
            worldBlocksDict[[x, y]] = newBlock;
          }
        }
      }
    }
  }
}

function addVectors(v1, v2){
  return Array(v1[0] + v2[0], v1[1] + v2[1])
}
