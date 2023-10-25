var canvas = document.getElementById("gamescreen");
var ctx = canvas.getContext("2d", { alpha: false });

var gui = document.getElementById("gui");
var ctxGui = gui.getContext("2d");
var txt = document.getElementById("infotext");
var selectInfo = document.getElementById("selectinfo");

var screenSize = [300, 300];
canvas.setAttribute('width', screenSize[0]);
canvas.setAttribute('height', screenSize[1]);
gui.setAttribute('width', screenSize[0]);
gui.setAttribute('height', screenSize[1]);

const textureSheet = new Image();
textureSheet.src = "./src/resourses/grass_tile.png";

textureSheet.onload = function(){
  ctx.imageSmoothingEnabled = false;
}

var lastFrameTimeMs = 0;
var maxFPS = 30;

var lastPos = [0, 0];
var curSelectID = 0;

var renderDist = 6; //chunks distance per side
var chunkSize = 8; //rects per chunk
var pxPRect = 8;
var perlinScale = 8;

Start();

function Start(){
  //Create Starting Tiles
  for (var y = -renderDist; y < renderDist; y++) {
    for (var x = -renderDist; x < renderDist; x++) {
      var curTile = [x*chunkSize, y*chunkSize];
      if (!chunkExists(curTile[0], curTile[1])){
       newChunk(curTile[1], curTile[0]);
      }
    }
  }
}

function clearGraphics(){
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function renderObjects() {
  ctx.fillStyle = "red";
  ctx.fillRect(canvas.width/2, canvas.height/2, 4, 4);
}

var displayInfo = "...";
//Gameloop
requestAnimationFrame(mainLoop);
function mainLoop(timestamp) {
  displayInfo = "x: " + pxPos[0] +
  "<br> y: " + pxPos[1] +
  "<br> zoom: " + zoom +
  "<br> mouse pos: " + lastMousePos[0] +
  ", " + lastMousePos[1] +
  "<br> tilePos: " + tilePos[0] +
  ", " + tilePos[1];
  txt.innerHTML = displayInfo;

  if (timestamp < lastFrameTimeMs + 1000 / maxFPS) {
    requestAnimationFrame(mainLoop);
    return;
  }

  update();
  lastFrameTimeMs = timestamp;
  requestAnimationFrame(mainLoop);
}

function update(){
  updateInput();
  chunkManager();

  //ctxGui.clearRect(0, 0, gui.width, gui.height);
  renderChunks();
  renderObjects();
}

function renderChunks(){
  for (var i = 0; i < chunks.length; i++) {
    var curChunk = chunks[i];
    var startTile = [curChunk[2], curChunk[1]];

    if (Math.abs(lastPos[0] * chunkSize - startTile[0]) > chunkSize*(renderDist-1) ||
      Math.abs(lastPos[1] * chunkSize - startTile[1]) > chunkSize*(renderDist-1)){
      continue;
    }

    for (var y = 0; y < chunkSize; y++) {
      for (var x = 0; x < chunkSize; x++) {
        var curChunkData = curChunk[0];
        var curChunkValue = curChunkData[y][x];
        var pos = [(startTile[0] + x - pxPos[0] * chunkSize)*pxPRect*zoom + canvas.width/2,
                  (startTile[1] + y - pxPos[1] * chunkSize)*pxPRect*zoom + canvas.height/2
        ];
        //if (x === 0 || y === 0){ctx.fillStyle = "black";}

        //img, cropX, cropY, cropSizeX, cropSizeY, posX, posY, imgSize
        ctx.drawImage(textureSheet, 0, pxPRect*(curChunkValue-1), pxPRect, pxPRect, pos[0], pos[1], 8*zoom, 8*zoom);
      }
    }
  }
}


//screen pixel to world tile coordinates
function screenToWorld(px, py){
  return [Math.floor((px-canvas.width*0.5)/(pxPRect*zoom) + pxPos[0]*chunkSize),
          Math.floor((py-canvas.height*0.5)/(pxPRect*zoom) + pxPos[1]*chunkSize)];
}

//world tile coordinates to screen pixel
function worldToScreen(tileXY){
  return [(tileXY[0] - pxPos[0]*chunkSize)*pxPRect*zoom + canvas.width/2,
          (tileXY[1] - pxPos[1]*chunkSize)*pxPRect*zoom + canvas.height/2];
}

var selectedList = [];
function selectResourse(tilePos, id){
  selectedList = [];

  for (var i = 0; i < chunks.length; i++){
    if (chunks[i][2] === getChunkStart(tilePos[0]) && chunks[i][1] === getChunkStart(tilePos[1])){
      var curChunk = chunks[i][0];
      if (curChunk[getLocalChunkIndex(tilePos[1])][getLocalChunkIndex(tilePos[0])] === id){
        selectedList.push(tilePos);
      }
    }
  }

  var i = 0;
  while (i < selectedList.length){
    if (i > 5000){break;}
    var grannLista = findCloseBlocks(selectedList[i], id);
    var filteredList = [];
    for (var j = 0; j < grannLista.length; j++){
      var alreadyAdded = false;
      for (var k = 0; k < selectedList.length; k++) {
        if (selectedList[k][0] === grannLista[j][0] && selectedList[k][1] === grannLista[j][1]){
          alreadyAdded = true;
          break;
        }
      }

      if (!alreadyAdded){
        filteredList.push(grannLista[j]);
      }
    }
    selectedList = [].concat(selectedList, filteredList);
    i++;
  }

  ctxGui.clearRect(0, 0, gui.width, gui.height);
  for (var i = 0; i < selectedList.length; i++){
    var curTileObj = selectedList[i];
    ctxGui.fillStyle = "rgba(255, 0, 0, 0.5)";
    var curPxPos = worldToScreen([curTileObj[0], curTileObj[1]])
    ctxGui.fillRect(curPxPos[0], curPxPos[1], pxPRect*zoom, pxPRect*zoom);
  }

  selectinfo.innerHTML = "ID: " + id + "<br> Amount: " + selectedList.length;
  curSelectID = id;
}

//returns a list of nerby 3x3 tiles of id
function findCloseBlocks(tilePos, id){
  var curList = [];
  for (var i = 0; i < chunks.length; i++){
    if (chunks[i][2] === getChunkStart(tilePos[0]) && chunks[i][1] === getChunkStart(tilePos[1])){
      var curChunk = chunks[i][0];

      for (var y = -1; y <= 1; y++) {
        for (var x = -1; x <= 1; x++) {
          var curX = getLocalChunkIndex(tilePos[0])+x;
          var curY = getLocalChunkIndex(tilePos[1])+y;

          //if outside cur chunk
          if (curX >= chunkSize || curY >= chunkSize || curX < 0 || curY < 0){
            if (getIdAt([tilePos[0] + x, tilePos[1] + y]) === id){
              curList.push([tilePos[0] + x, tilePos[1] + y]);
            }
          } //if inside cur chunk
          else {
            var curID = curChunk[curY][curX];
            if (curID === id){
              //curChunk[curY][curX] = 0;
              curList.push([getChunkStart(tilePos[0]) + curX, getChunkStart(tilePos[1]) + curY]);
            }
          }
        }
      }
      return curList;
    }
  }
}
