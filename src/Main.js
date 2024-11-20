var screenSize = [536, 804];

var canvas = document.getElementById("gamescreen");
canvas.setAttribute('width', screenSize[0]);
canvas.setAttribute('height', screenSize[1]);
var ctx = canvas.getContext("2d", { alpha: false });

var gui = document.getElementById("gui");
gui.setAttribute('width', screenSize[0]);
gui.setAttribute('height', screenSize[1]);
var ctxGui = gui.getContext("2d");

var txt = document.getElementById("infotext");
let depthText = document.getElementById("depthText");
var coinText = document.getElementById("inGameInfo");

const textureSheet = new Image();
textureSheet.src = "./src/resourses/textures/grass_tile.png";
textureSheet.onload = function(){
  ctx.imageSmoothingEnabled = false;
  Start();
}
let textureBlockSize = 32; //px

const playerAnimationSheet = new Image();
playerAnimationSheet.src = "./src/resourses/textures/playerAnimation.png";

const coinAnimationSheet = new Image();
coinAnimationSheet.src = "./src/resourses/textures/coinAnimation.png";

const backgroundImage0 = new Image();
backgroundImage0.src = "./src/resourses/textures/bgImgLayer0.png";

const backgroundImage1 = new Image();
backgroundImage1.src = "./src/resourses/textures/bgImgLayer1.png";

const backgroundImage2 = new Image();
backgroundImage2.src = "./src/resourses/textures/bgImgLayer2.png";

const backgroundImage3 = new Image();
backgroundImage3.src = "./src/resourses/textures/bgImgLayer3.png";

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
let cameraPos = [0, 0]
let playerChunkPos = [0, 0]
let playerVelocity = [0, 0]
let viewingDistance = [9, 15]; // [9, 14]
const collisionOffset = 0.4; //0.4

const lowestLevel = 2000; //deepness where hardest level is
const lowestLevelAmmount = 0.095; //how hard the hardest level is (0.088 is on the limit to impossible)

const gravity = 0.000035;
const movementSpeed = 0.01;
const blockBounciness = 0.02;

let coins = 0;

let globalTimestamp = 0;

var displayInfo = "...";

let timeBeforeInactive = 0;

function Start(){ //images loaded
  playerAnim = new Animator(new block([0, 0], -1), playerAnimationSheet, 16, 100);

  requestAnimationFrame(mainLoop);
}

let bgLayers = [
  new backgroundLayer(0.1, backgroundImage0), 
  //new backgroundLayer(0.2, backgroundImage1),
  //new backgroundLayer(0.25, backgroundImage2),
  new backgroundLayer(0.3, backgroundImage3)]

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    timeBeforeInactive = Date.now();
  } 
  else{
    lastFrameTimeMs += Date.now() - timeBeforeInactive;
  }
});

//Gameloop
function mainLoop(timestamp) {
  //Gameloop stuff
  globalTimestamp = timestamp;
  if (capFPS && timestamp < lastFrameTimeMs + 1000 / maxFPS) {
    requestAnimationFrame(mainLoop);
    return;
  }

  deltaTime = timestamp - lastFrameTimeMs;

  //Set texts
  depthText.innerHTML = Math.floor(-playerPos[1]/10)*10;
  coinText.innerHTML = coins;

  //Clear Graphics
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  //Update Background
  for (let i = 0; i < bgLayers.length; i++){
    bgLayers[i].Update();
  }

  updatePlayer();
  updateWorld();

  //Animation
  playerAnim.Update(globalTimestamp);

  lastFrameTimeMs = timestamp;
  requestAnimationFrame(mainLoop);
}


function updatePlayer(){
  //Movement
  playerVelocity = addVectors(playerVelocity, [0, -gravity * deltaTime])
  playerPos = addVectors(playerPos, [playerVelocity[0]*deltaTime, playerVelocity[1]*deltaTime])
  playerPos = addVectors(playerPos, [movement_direction[0] * movementSpeed * deltaTime, 0])
  playerAnim.parentBlock.pos = playerPos;

  //const cameraFollowSpeed = 0.01;
  //cameraPos[0] = cameraPos[0] + (playerPos[0] - cameraPos[0])*cameraFollowSpeed*deltaTime;
  //cameraPos[1] = cameraPos[1] + (playerPos[1] - cameraPos[1])*cameraFollowSpeed*deltaTime;
  cameraPos = playerPos;
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
      if (playerPos[1] <= y+1 && playerPos[1] >= y-1 && playerPos[0] >= x-1+collisionOffset && playerPos[0] <= x+1-collisionOffset){
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
      let screenPos = world2screen([x, y]);
      if (curBlock.animator == null){
        ctx.drawImage(textureSheet, 0, 2*textureBlockSize + curBlock.ID*textureBlockSize, textureBlockSize, textureBlockSize, 
          screenPos[0], 
          screenPos[1], 
          block_px_size, 
          block_px_size);
      }

      else{
        curBlock.animator.Update(globalTimestamp);
      }

    }
  }
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
            newBlock.animator = new Animator(newBlock, coinAnimationSheet, 32, 100);
            worldBlocksDict[[x, y]] = newBlock;
          }
        }
      }
    }
  }
}


function dispInGameText(){
  displayInfo = "Position: " + Math.floor(playerPos[0]) + ", " + Math.floor(playerPos[1]) + 
  "<br> FPS: " + Math.round(1000/deltaTime);
  txt.innerHTML = displayInfo;
}