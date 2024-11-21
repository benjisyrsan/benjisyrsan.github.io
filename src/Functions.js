function world2screen([x, y]){
    return [
        Math.floor((x-cameraPos[0])*block_px_size + canvas.width/2), 
        Math.floor(-(y-cameraPos[1])*block_px_size  + canvas.height/2)
    ];
}

function screen2world([x, y]){
    return [
        Math.floor((x - canvas.width/2)/block_px_size + cameraPos[0]),
        Math.floor((y - canvas.height/2)/block_px_size + cameraPos[1]),
    ];
}

function addVectors(v1, v2){
    return Array(v1[0] + v2[0], v1[1] + v2[1])
  }

class block{
    constructor(pos, ID) {
      this.pos = pos;
      this.ID = ID;
      this.animator = null;
    }
  }

class Animator{
    constructor(parentBlock, animationSheet, animSheetSize, animationSpeedMS, looping) {
      this.parentBlock = parentBlock; 
      this.animationSheet = animationSheet;
      this.sheetPxSize = animSheetSize;
      this.animationSpeedMS = animationSpeedMS;

      this.lastAnimationTimestamp = 0;
      this.curAnimFrame = 0; //vertical
      this.curAnimType = 0; //horizontal
      this.frameAmount = this.animationSheet.height/this.sheetPxSize;
      this.isPlaying = false;
      this.looping = looping;
      if (this.looping)
        this.isPlaying = true;
    }
  
    Update(timestamp) {
        this.Render();
        if (!this.isPlaying || timestamp - this.lastAnimationTimestamp < this.animationSpeedMS)
            return;
        
        this.lastAnimationTimestamp = timestamp;
        this.curAnimFrame ++;
        if (this.curAnimFrame == this.frameAmount){
          this.curAnimFrame = 0;
          if (this.looping == false)
            this.isPlaying = false;
        }
    }
  
    Render() {
      let screenPos = world2screen(this.parentBlock.pos);
      //this.xPosScreen = Math.floor(screenSize[0]/2 + this.blockParent.pos[0] * block_px_size);
      //this.yPosScreen = Math.floor(screenSize[1]/2 - this.blockParent.pos[1] * block_px_size);
        
      ctx.drawImage(this.animationSheet, 
        this.curAnimType*this.sheetPxSize, 
        this.curAnimFrame*this.sheetPxSize, 
        this.sheetPxSize, 
        this.sheetPxSize, 
        screenPos[0], 
        screenPos[1], 
        block_px_size, 
        block_px_size);
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
        let px_x = curBackgroundOB.pos[0] - cameraPos[0]*block_px_size*this.parallaxSpeed;
        let px_y = curBackgroundOB.pos[1] + cameraPos[1]*block_px_size*this.parallaxSpeed;
    
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