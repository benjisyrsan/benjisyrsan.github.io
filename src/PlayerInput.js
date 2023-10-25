var curKeys = [];
var zoom = 1;

var movespeed = 0.1;
var pxPos = [0, 0];

var curMousePos = [0, 0];
var lastMousePos = [0, 0];
var tilePos = [0, 0];

document.addEventListener("keydown", event => {
  const key = event.keyCode;
  if (!curKeys.includes(key)) {
    curKeys.unshift(key);
  }
});

document.addEventListener("keyup", event => {
  const key = event.keyCode;
  if (curKeys.includes(key)) {
    curKeys.splice(curKeys.indexOf(key), 1);
  }
});

document.addEventListener("mousedown", mouseClick);
function mouseClick(evt) {
  curMousePos = getMousePos(canvas, evt);
  //ctxGui.clearRect(0, 0, canvas.width, canvas.height);
  ctxGui.fillStyle = "red";
  ctxGui.fillRect(curMousePos[0], curMousePos[1], 2, 2);
  lastMousePos = [Math.floor(curMousePos[0]), Math.floor(curMousePos[1])];
  var mouseWorldPos = screenToWorld(lastMousePos[0], lastMousePos[1]);
  tilePos = [Math.round(mouseWorldPos[0]),
            Math.round(mouseWorldPos[1])];

  selectResourse(tilePos, getIdAt(tilePos));
}

function getMousePos(canvas, evt) {
  var rect = canvas.getBoundingClientRect();
  return [
    ((evt.clientX - rect.left) / (rect.right - rect.left)) * canvas.width,
    ((evt.clientY - rect.top) / (rect.bottom - rect.top)) * canvas.height
  ];
}

function updateInput() {
  if (curKeys.length > 0) {
    ctxGui.clearRect(0, 0, gui.width, gui.height);
    //up
    if (curKeys.includes(87)) {
      pxPos[1] -= movespeed;
    }
    //down
    if (curKeys.includes(83)) {
      pxPos[1] += movespeed;
    }
    //right
    if (curKeys.includes(68)) {
      pxPos[0] += movespeed;
    }
    //left
    if (curKeys.includes(65)) {
      pxPos[0] -= movespeed;
    }

    //uparrow
    if (curKeys.includes(69)) {
      zoom *= 1.07;
      zoom = Math.floor(zoom*1000)*0.001;
    }
    //downarrow
    if (curKeys.includes(81)) {
      zoom /= 1.07;
      zoom = Math.floor(zoom*100)*0.01;
      if (zoom < 1) {
        zoom = 1;
      }
    }

    //leftarrow
    if (curKeys.includes(37)) {
      perlinZoom /= 1.1;
    }
    //rightarrow
    if (curKeys.includes(39)) {
      perlinZoom *= 1.1;
    }
  }
}
