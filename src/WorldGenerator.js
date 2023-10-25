var sandcolor = "lightyellow";
var sandlevel = 0.53;
var watercolor = "lightblue";
var grasslevel = 0.55;
var grasscolor = "lightgreen";
var mountainlevel = 0.7;
var mountaincolor = "dimgrey";

var pn = new Perlin(0);
var chunks = []; //(chunkdata, tileY, tileX)

//kontrollera vilka chunks som läggs till och renderas
function chunkManager(){
  var pxPosRound = [Math.floor(pxPos[0]), Math.floor(pxPos[1])]
  if (pxPosRound[0] !== lastPos[0] || pxPosRound[1] !== lastPos[1]){
    lastPos[0] = pxPosRound[0];
    lastPos[1] = pxPosRound[1];

    for (var y = lastPos[1]-renderDist; y <= lastPos[1]+renderDist-1; y++) {
      for (var x = lastPos[0]-renderDist; x <= lastPos[0]+renderDist-1; x++) {
        var curTile = [x*chunkSize, y*chunkSize];
        if (!chunkExists(curTile[0], curTile[1])){
         newChunk(curTile[1], curTile[0]);
        }
      }
    }
  }
}

function chunkExists(tileX, tileY){
  for (var i = 0; i < chunks.length; i++){
    var curChunk = chunks[i];
    if (curChunk[1] === tileY && curChunk[2] === tileX){
      return true;
    }
  }
  return false;
}

//add chunk at tileNO to chunks array
function newChunk(tileY, tileX){
  //timeType at (y, x)
  var chunkData = [];
  //tileXY
  for (var y = 0; y < chunkSize; y++) {
    chunkData[y] = [];
    for (var x = 0; x < chunkSize; x++) {
      chunkData[y][x] = getTile(x+tileX, y+tileY);
    }
  }
  chunks.push([chunkData, tileY, tileX]);
}

//get tile type ID at tile position
function getTile(tileX, tileY){
  var curH = pn.noise(
    (tileX) / perlinScale,
    (tileY) / perlinScale,
    0
  ) *
    0.2 + pn.noise(
    (tileX) / (perlinScale * 5),
    (tileY) / (perlinScale * 5),
    0
  ) *
    0.6 +
  0.2;

  var curHWood = pn.noise(
    (tileX) / (perlinScale * 1),
    (tileY) / (perlinScale * 1),
    0
  );

  var curHCopper = pn.noise(
    (tileX) / (perlinScale * 1.5),
    (tileY) / (perlinScale * 1.5),
    0
  );

  if (curH > mountainlevel) {
    if (curHCopper > 0.75) {
      return 6;
    }
    else{
      return 4;
    }
  } else if (curH > grasslevel) {
    if (curHWood > 0.5) {
      return 5;
    }
    else{
      return 3;
    }
  } else if (curH > sandlevel) {
    return 2;
  } else {
    return 1;
  }
}

//get tile Color from ID
function getTileColor(id){
  if (id === 6) {
    return "chocolate";
  } else if (id === 5) {
    return "ForestGreen";
  } else if (id === 4) {
    return mountaincolor;
  } else if (id === 3) {
    return grasscolor;
  } else if (id === 2) {
    return sandcolor;
  } else if (id === 1) {
    return watercolor;
  } else {
    return "purple";
  }
}

function getIdAt(tilePos){
  for (var i = 0; i < chunks.length; i++){
    if (chunks[i][2] === getChunkStart(tilePos[0]) && chunks[i][1] === getChunkStart(tilePos[1])){
      var curChunk = chunks[i][0];
      return curChunk[getLocalChunkIndex(tilePos[1])][getLocalChunkIndex(tilePos[0])];
    }
  }
}

function getLocalChunkIndex(tilePos){
  return tilePos-getChunkStart(tilePos);
}

function getChunkStart(tilePos){
  return Math.floor(tilePos/chunkSize)*chunkSize;
}
