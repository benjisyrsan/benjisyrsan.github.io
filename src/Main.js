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
var depthText = document.getElementById("depthText");
var coinText = document.getElementById("inGameInfo");
var shopDiv = document.getElementById("shopMenu");

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

const springAnimationSheet = new Image();
springAnimationSheet.src = "./src/resourses/textures/spring_animation.png";

const shopAnimationSheet = new Image();
shopAnimationSheet.src = "./src/resourses/textures/shop_64px.png";

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
var isInShop = false;
var canEnterShop = true;

var dynamites = 0;

function Start(){ //images loaded
  playerAnim = new Animator(new block([0, 0], -1), playerAnimationSheet, 16, 100, true);
  setTimeout(function(){requestAnimationFrame(mainLoop);}, 100);
  //setTimeout(function(){spawnShop([4, -10])}, 500);
}

function spawnShop(pos){
  let clearRadius = 8;
  for (let y=0; y<clearRadius; y++){
    for (let x=-clearRadius; x<clearRadius; x++){
      let curWorldPos = [2+ x + pos[0], y + pos[1]];
      if (Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2)) > clearRadius){
        continue;
      }
      
      if (worldBlocksDict[curWorldPos] != undefined){
        delete worldBlocksDict[curWorldPos];
      }
    }
  }

  for (let y=pos[1]; y<pos[1]+4; y++){
    for (let x=pos[0]; x<pos[0]+4; x++){
      worldBlocksDict[[x, y]] = new block([x, y], 11);
    }
  }
  worldBlocksDict[pos] = new block(pos, 10);
}

function buyShopItem(index){
  if (coins >= 10){
    coins -= 10;
    dynamites ++;
  }
}

function fireDynamite(){
  if (dynamites <= 0){
    return;
  }
  dynamites --;
  
  let clearRadius = 8;
  for (let y=-clearRadius; y<clearRadius; y++){
    for (let x=-clearRadius; x<clearRadius; x++){
      let curWorldPos = [x + Math.floor(playerPos[0]), y + Math.floor(playerPos[1])];
      if (Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2)) > clearRadius){
        continue;
      }

      if (worldBlocksDict[curWorldPos] != undefined){
        delete worldBlocksDict[curWorldPos];
      }
    }
  }
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
  if (isInShop){
    if (movement_direction[0] != 0 || movement_direction[1] != 0){
      canEnterShop = false;
      isInShop = false;
      shopDiv.style.display = "none";
      setTimeout(function(){canEnterShop = true;}, 1000);
    }
    return;
  }
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
        if (curBlock.ID == 3){ //lava
          let lavaBounciness = 0.03;
          playerVelocity = [0, blockBounciness + lavaBounciness]
          lavaSound.play();
          curBlock.animator.isPlaying = true;
        }

        else if (curBlock.ID == 4){ //coin pickup
          delete worldBlocksDict[[x, y]];
          coinSound.play();
          coins ++;
        }

        else if (curBlock.ID == 11){ //enter Shop
          if (canEnterShop){
            isInShop = true;
            shopDiv.style.display = "flex";
          }
        }

        else{
          playerVelocity = [0, blockBounciness]
          bounceSound.play();
        }
      }

      //RENDER
      let screenPos = world2screen([x, y]);
      if (curBlock.animator == null){
        if (curBlock.ID == 10){
          ctx.drawImage(shopAnimationSheet, 0, 0, 64, 64, 
            screenPos[0], 
            screenPos[1]-96, 
            128, 
            128);
          continue;
        }
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
      
      //Something in ground
      if (noiseSum > 0.6 - percentageToLowest*lowestLevelAmmount){ //0.55 is good
        //spawn stone
        blockID = 1

        //spawn grass
        if (y != start_y && worldBlocksDict[[x, y+1]] == undefined){
          blockID = 0;

          //spawn spring
          if (Math.random() < 0.2){
            let newBlock = new block([x, y+1], 3);
            newBlock.animator = new Animator(newBlock, springAnimationSheet, 8, 100, false);
            worldBlocksDict[[x, y+1]] = newBlock;
          }
        }
        
        let newBlock = new block([x, y], blockID);
        worldBlocksDict[[x, y]] = newBlock;
      }

      //Something in air
      else{
        //spawn coin
        if (worldBlocksDict[[x, y]] == undefined && y != start_y){
          if (Math.random() < 0.003){
            blockID = 4;
            let newBlock = new block([x, y], blockID);
            newBlock.animator = new Animator(newBlock, coinAnimationSheet, 32, 100, true);
            worldBlocksDict[[x, y]] = newBlock;
          }
        }
      }
    }
  }

  //spawn shop
  if (Math.random() < 0.002){
    spawnShop([start_x, start_y]);
  }
}


function dispInGameText(){
  displayInfo = "Position: " + Math.floor(playerPos[0]) + ", " + Math.floor(playerPos[1]) + 
  "<br> FPS: " + Math.round(1000/deltaTime);
  txt.innerHTML = displayInfo;
}