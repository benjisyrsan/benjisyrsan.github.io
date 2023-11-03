var canvas = document.getElementById("gamescreen");
var ctx = canvas.getContext("2d", { alpha: false });

var gui = document.getElementById("gui");
var ctxGui = gui.getContext("2d");
var txt = document.getElementById("infotext");
let depthText = document.getElementById("depthText");

var screenSize = [400, 600];
canvas.setAttribute('width', screenSize[0]);
canvas.setAttribute('height', screenSize[1]);
gui.setAttribute('width', screenSize[0]);
gui.setAttribute('height', screenSize[1]);

const textureSheet = new Image();
textureSheet.src = "./src/resourses/grass_tile.png";

const playerAnimationSheet = new Image();
playerAnimationSheet.src = "./src/resourses/playerAnimation.png";

const backgroundImage = new Image();
backgroundImage.src = "./src/resourses/backgroundimage.png";

textureSheet.onload = function(){
  ctx.imageSmoothingEnabled = false;
}

var lastFrameTimeMs = 0;
var maxFPS = 60;
let deltaTime = 0;

var lastPos = [0, 0];
var block_px_size = 20

var pn = new Perlin(0);
let perlinScale = 10

let worldBlocksDict = {}
let discoveredChunks = {}
let cunkSize = 12

let playerPos = [0, 0]
let playerVelocity = [0, 0]
let viewingDistance = [11, 17];
const collisionOffset = 0.2

const gravity = 0.001;
const movementSpeed = 0.02;
const blockBounciness = 0.4;

class block{
  constructor(pos, ID) {
    this.pos = pos
    this.ID = ID
  }
}

Start();

function Start(){
  return
}

let curAnimIndex = 0;
let curAnimType = 0;
let lastAnimationTimestamp = 0;
const animationSpeedMS = 100;

function renderObjects(timestamp) {
  ctx.drawImage(playerAnimationSheet, curAnimType*16, curAnimIndex*16, 16, 16, canvas.width/2 - block_px_size, canvas.height/2 - block_px_size, block_px_size, block_px_size);
  
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

var displayInfo = "...";

//Gameloop
requestAnimationFrame(mainLoop);
function mainLoop(timestamp) {
  /*
  if (timestamp < lastFrameTimeMs + 1000 / maxFPS) {
    requestAnimationFrame(mainLoop);
    return;
  }
  */

  deltaTime = timestamp - lastFrameTimeMs

  displayInfo = "Position: " + Math.floor(playerPos[0]) + ", " + Math.floor(playerPos[1]) + 
  "<br> FPS: " + Math.round(1000/deltaTime);
  txt.innerHTML = displayInfo;
  depthText.innerHTML = Math.floor(-playerPos[1]/10)*10;
  
  updatePlayer();

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "darkslateblue";
  ctx.fillRect(0, 0, screenSize[0], screenSize[1]);
  ctx.drawImage(backgroundImage, playerPos[0]*2, -playerPos[1]*2, 1024, 1024, -500, -500, 2048, 2048)

  updateWorld();
  renderObjects(timestamp);

  lastFrameTimeMs = timestamp;
  requestAnimationFrame(mainLoop);
}

function updatePlayer(){
  playerVelocity = addVectors(playerVelocity, [0, -gravity * deltaTime])
  playerPos = addVectors(playerPos, playerVelocity)
  playerPos = addVectors(playerPos, [movement_direction[0] * movementSpeed * deltaTime, 0])
  //playerPos = pxPos
}

function updateWorld(){
  start_x = Math.floor(playerPos[0]) - viewingDistance[0];
  end_x = Math.floor(playerPos[0]) + viewingDistance[0];
  start_y = Math.floor(playerPos[1]) - viewingDistance[1];
  end_y = Math.floor(playerPos[1]) + viewingDistance[1];

  let playerChunkPos = [Math.floor(playerPos[0]/cunkSize), Math.floor(playerPos[1]/cunkSize)]
  for (let y = playerChunkPos[1]-1; y < playerChunkPos[1]+2; y++){
    for (let x = playerChunkPos[0]-2; x < playerChunkPos[0]+2; x++){
      lookChunkPos = [x, y]
      if (discoveredChunks[lookChunkPos] == undefined && playerChunkPos[1] <= -2){
        discoveredChunks[lookChunkPos] = 1
        createChunk(lookChunkPos[0]*cunkSize, (lookChunkPos[0]+1)*cunkSize, lookChunkPos[1]*cunkSize, (lookChunkPos[1]+1)*cunkSize)
      }
    }
  }

  for (let y = start_y; y < end_y; y++){
    for (let x = start_x; x < end_x; x++){
      curBlock = worldBlocksDict[[x, y]];
      if (curBlock == undefined)
        continue;

      //CHECK COLLISIONS
      if (playerPos[1] <= y && playerPos[1] >= y-2 && playerPos[0] >= x+collisionOffset && playerPos[0] <= x+2-collisionOffset){
        if (floating)
          playerVelocity = addVectors(playerVelocity, [0, 0.03])
        else
          playerVelocity = [0, blockBounciness] //addVectors(playerVelocity, [0, 0.02]) //
      }

      //RENDER
      ctx.drawImage(textureSheet, 0, 16 + curBlock.ID*8, 8, 8, 
        screenSize[0]/2 + (x - playerPos[0]) * block_px_size, 
        screenSize[1]/2 - (y - playerPos[1]) * block_px_size, block_px_size, block_px_size);
      continue
      ctx.fillStyle = "green"
      ctx.fillRect(
        screenSize[0]/2 + (x - playerPos[0]) * block_px_size, 
        screenSize[1]/2 - (y - playerPos[1]) * block_px_size, 
        block_px_size, block_px_size)
    }
  }
}

function createChunk(start_x, end_x, start_y, end_y){
  for (let y = start_y; y < end_y; y++){
    for (let x = start_x; x < end_x; x++){
      curPN1 = pn.noise(x/perlinScale, y/perlinScale, 0) 
      curPN2 = pn.noise((x+1000)/perlinScale*2, (y+1000)/perlinScale*2, 0) 
      curPN = (curPN1 + curPN2)/2
      blockID = 0
      if (curPN > 0.6){
        blockID = 1
      }
      if (curPN > 0.55){ //0.52 is good
        let newBlock = new block([x, y], blockID)
        worldBlocksDict[[x, y]] = newBlock 
      }
    }
  }
}

function addVectors(v1, v2){
  return Array(v1[0] + v2[0], v1[1] + v2[1])
}
