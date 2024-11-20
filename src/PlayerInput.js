var curKeys = [];

var pxPos = [0, 0];
let movement_direction = [0, 0]
let floating = false;

var curMousePos = [0, 0];
var lastMousePos = [0, 0];
var tilePos = [0, 0];

let leftDown = false;
let rightDown = false;
let downDown = false;

//mobile
document.addEventListener("touchstart", touchHandler);
document.addEventListener("touchend", touchHandler);

function touchHandler(e) {
  if (e.touches) {
    if (e.type == "touchstart"){
      mouseX = e.touches[0].pageX
      mouseY = e.touches[0].pageY

      if (mouseX < window.innerWidth/2){
        leftDown = true
      }

      if (mouseX >= window.innerWidth/2){
        rightDown = true
      }
    }
    if (e.type == "touchend"){
      mouseX = e.changedTouches[0].pageX
      mouseY = e.changedTouches[0].pageY

      if (mouseX < window.innerWidth/2){
        leftDown = false
      }

      if (mouseX >= window.innerWidth/2){
        rightDown = false
      }
    }
  }

  setMovementDirection();
}

//desktop
document.addEventListener("keydown", keyDownHandler, false);
document.addEventListener("keyup", keyUpHandler, false);

function keyDownHandler(event) {
  //UP
  if (event.keyCode === 87) {
    movement_direction[1] = 1
  } 
  //DOWN
  if (event.keyCode === 83) {
    //movement_direction[1] = -1
    //downDown = true;
  }
  //RIGHT
  if (event.keyCode === 68) {
    //movement_direction[0] = 1
    rightDown = true;
  } 
  //LEFT
  if (event.keyCode === 65) {
    //movement_direction[0] = -1
    leftDown = true;
  }
  //SPACE
  if (event.keyCode === 32) {
    downDown = true;
  } 

  setMovementDirection();
}

function keyUpHandler(event) {
  //UP
  if (event.keyCode === 87) {
    movement_direction[1] = 0
  } 
  //DOWN
  if (event.keyCode === 83) {
    //movement_direction[1] = 0
    
  }
  //RIGHT
  if (event.keyCode === 68) {
    //movement_direction[0] = 0
    rightDown = false;
  } 
  //LEFT
  if (event.keyCode === 65) {
    //movement_direction[0] = -0
    leftDown = false;
  }
  //SPACE
  if (event.keyCode === 32) {
    downDown = false;
  } 

  setMovementDirection();
}

function setMovementDirection(){
  StartMusic();
  if (rightDown && leftDown){
    movement_direction[0] = 0;
    playerAnim.curAnimType = 2;
  }

  else if (rightDown){
    movement_direction[0] = 1;
    playerAnim.curAnimType = 0
  }

  else if (leftDown){
    movement_direction[0] = -1;
    playerAnim.curAnimType = 1
  }

  else{
    movement_direction[0] = 0;
    playerAnim.curAnimType = 2
  }

  if (downDown){
    //downBoost();
    //downDown = false;
  }
}