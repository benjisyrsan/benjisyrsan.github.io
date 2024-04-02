var canvas = document.getElementById("gamescreen");
var ctx = canvas.getContext("2d", { alpha: false });

var gui = document.getElementById("gui");
var ctxGui = gui.getContext("2d");
//var txt = document.getElementById("infotext");
let depthText = document.getElementById("depthText");

var screenSize = [400, 600];
if (window.innerHeight > window.innerWidth){
  screenSize = [window.innerWidth, window.innerWidth*1.5];
}
//var screenSize = [1000, 1500];
canvas.setAttribute('width', screenSize[0]);
canvas.setAttribute('height', screenSize[1]);
gui.setAttribute('width', screenSize[0]);
gui.setAttribute('height', screenSize[1]);

const textureSheet = new Image();
textureSheet.src = "./src/resourses/grass_tile.png";

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
let chunkSize = 12

let playerPos = [0, 0]
let playerChunkPos = [0, 0]
let playerVelocity = [0, 0]
let viewingDistance = [11, 17];
const collisionOffset = 0.4

const lowestLevel = 2000; //deepness where hardest level is
const lowestLevelAmmount = 0.095 //how hard the hardest level is (0.088 is on the limit to impossible)

const gravity = 0.001;
const movementSpeed = 0.02;
const blockBounciness = 0.4;

function sound(src) {
  this.sound = document.createElement("audio");
  this.sound.src = src;
  this.sound.setAttribute("preload", "auto");
  this.sound.setAttribute("controls", "none");
  this.sound.style.display = "none";
  document.body.appendChild(this.sound);
  this.play = function(){
    this.sound.play();
  }
  this.stop = function(){
    this.sound.pause();
  }
}

let bounceSound = new sound("./src/resourses/bounce.mp3")

class block{
  constructor(pos, ID) {
    this.pos = pos
    this.ID = ID
  }
}

const bgImgSize = 700;

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
  new backgroundLayer(0.2, backgroundImage1),
  new backgroundLayer(0.25, backgroundImage2),
  new backgroundLayer(0.3, backgroundImage3)]

Start();

function Start(){
  return;
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
  //txt.innerHTML = displayInfo;
  depthText.innerHTML = Math.floor(-playerPos[1]/10)*10;
  
  updatePlayer();

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "darkslateblue";
  ctx.fillRect(0, 0, screenSize[0], screenSize[1]);
  for (let i = 0; i < bgLayers.length; i++){
    bgLayers[i].Update();
  }

  updateWorld();
  renderObjects(timestamp);

  lastFrameTimeMs = timestamp;
  requestAnimationFrame(mainLoop);
}

function downBoost(){
  playerVelocity = addVectors(playerVelocity, [0, -0.4])
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

  playerChunkPos = [Math.floor(playerPos[0]/chunkSize), Math.floor(playerPos[1]/chunkSize)]
  for (let y = playerChunkPos[1]-1; y < playerChunkPos[1]+2; y++){
    for (let x = playerChunkPos[0]-2; x < playerChunkPos[0]+2; x++){
      lookChunkPos = [x, y]
      if (discoveredChunks[lookChunkPos] == undefined && playerChunkPos[1] <= -2){
        discoveredChunks[lookChunkPos] = 1
        createChunk(lookChunkPos[0]*chunkSize, (lookChunkPos[0]+1)*chunkSize, (lookChunkPos[1]+1)*chunkSize, lookChunkPos[1]*chunkSize)
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
        //if (floating)
          //playerVelocity = addVectors(playerVelocity, [0, 0.03])
        playerVelocity = [0, blockBounciness] //addVectors(playerVelocity, [0, 0.02]) //
        //bounceSound.play();
        if (curBlock.ID == 3){
          playerVelocity = addVectors(playerVelocity, [Math.random()*2-1, Math.random()])
        }
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
  let percentageToLowest = -playerPos[1]/lowestLevel
  if (percentageToLowest > 1)
    percentageToLowest = 1;

  for (let y = start_y; y > end_y; y--){
    for (let x = start_x; x < end_x; x++){
      let noise1 = pn.noise(x/perlinScale, y/perlinScale, 0) //mediumscale
      let noise2 = pn.noise((x+1000)/perlinScale*2, (y+1000)/perlinScale*2, 0) //smallscale
      let noise3 = pn.noise((x+10000)/perlinScale*1, (y+10000)/perlinScale*0.1, 0) //vertical drops
      let noiseSum = noise1*0.5 + noise2*0.4 + noise3*0.1
      
      blockID = 1
      if (worldBlocksDict[[x, y+1]] == undefined && y != start_y){
        blockID = 0
      }

      if (worldBlocksDict[[x-1, y]] == undefined && y != start_y){
        if (Math.random() < 0.3){
          blockID = 3
        }
      }

      if (noiseSum > 0.6 - percentageToLowest*lowestLevelAmmount){ //0.55 is good
        let newBlock = new block([x, y], blockID)
        worldBlocksDict[[x, y]] = newBlock 
      }
    }
  }
}

function addVectors(v1, v2){
  return Array(v1[0] + v2[0], v1[1] + v2[1])
}
