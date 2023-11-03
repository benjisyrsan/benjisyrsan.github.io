var curKeys = [];

var pxPos = [0, 0];
let movement_direction = [0, 0]
let floating = false;

var curMousePos = [0, 0];
var lastMousePos = [0, 0];
var tilePos = [0, 0];

document.addEventListener("keydown", keyDownHandler, false);
document.addEventListener("keyup", keyUpHandler, false);

function keyDownHandler(event) {
  //UP
  if (event.keyCode === 87) {
    movement_direction[1] = 1
  } 
  //DOWN
  else if (event.keyCode === 83) {
    movement_direction[1] = -1
  }
  //RIGHT
  if (event.keyCode === 68) {
    curAnimType = 0
    movement_direction[0] = 1
  } 
  //LEFT
  else if (event.keyCode === 65) {
    curAnimType = 1
    movement_direction[0] = -1
  }
  //SPACE
  if (event.keyCode === 32) {
    floating = true;
  } 
}

function keyUpHandler(event) {
  //UP
  if (event.keyCode === 87) {
    movement_direction[1] = 0
  } 
  //DOWN
  else if (event.keyCode === 83) {
    movement_direction[1] = 0
  }
  //RIGHT
  if (event.keyCode === 68) {
    curAnimType = 2
    movement_direction[0] = 0
  } 
  //LEFT
  else if (event.keyCode === 65) {
    curAnimType = 2
    movement_direction[0] = -0
  }
  //SPACE
  if (event.keyCode === 32) {
    floating = false;
  } 
}