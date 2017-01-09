var ESpecialBlockType = { "SMILE" : 10, "GHOST" : 11 }
var EBlockState = { "STABLE" : 0, "DROPPING" : 1, "BREAKING" : 2, "CREATING" : 3, "SWAPPING" : 4, "BREAKED": 5 }
var GameConfig = { "BLOCK_W" : 81, "BLOCK_H" : 82, "BLOCK_SPACE_X" : -15, "BLOCK_SPACE_Y" : -15, "BLOCK_SWAP_TIME" : 0.1, "DROP_SPEED" : 1000, "BLOCK_TYPE_COUNT" : 5, "DRAG_LENGTH": 20 }

// ██████╗ ██╗      ██████╗  ██████╗██╗  ██╗
// ██╔══██╗██║     ██╔═══██╗██╔════╝██║ ██╔╝
// ██████╔╝██║     ██║   ██║██║     █████╔╝ 
// ██╔══██╗██║     ██║   ██║██║     ██╔═██╗ 
// ██████╔╝███████╗╚██████╔╝╚██████╗██║  ██╗
// ╚═════╝ ╚══════╝ ╚═════╝  ╚═════╝╚═╝  ╚═╝                                      

var Block = cc.Node.extend({
    
    spriteWidth: GameConfig.BLOCK_W,
    spriteHeight: GameConfig.BLOCK_H,
    sprite: null,
    blockType: 0,
    state: EBlockState.STABLE,
    blockTypeCount: GameConfig.BLOCK_TYPE_COUNT,

    ctor: function () {
        "use strict";
        this._super();
        this.attr({
            width: this.spriteWidth,
            height: this.spriteHeight
        });

        this.sprite = new cc.Sprite(res.Block1_png);
        this.sprite.attr({
            x: this.spriteWidth / 2,
            y: this.spriteHeight / 2
        });
        this.addChild(this.sprite, 0);

        this.SetRandomType();
    },

    // 플럭 타입 변경
    ChangeBlockType: function (inType) {
        this.blockType = inType;
        this.DefaultSprite();
    },

    SetRandomType: function (inType) {
        this.blockType = parseInt(Math.floor(Math.random() * this.blockTypeCount));
        this.DefaultSprite();
    },

    DefaultSprite: function() {
        this.sprite.setTexture(cc.textureCache.getTextureForKey(res["Block" + (this.blockType + 1).toString() + "_png"]));
    },

    SelectSprite: function() {
        this.sprite.setTexture(cc.textureCache.getTextureForKey(res["BlockSelect" + (this.blockType + 1).toString() + "_png"]));
    },

    IsStable: function() {
        return this.state == EBlockState.STABLE; 
    },

    Break: function() {
        this.state = EBlockState.BREAKING;
        this.sprite.setTexture(cc.textureCache.getTextureForKey(res["BlockBroken" + (this.blockType + 1).toString() + "_png"]));  
        this.runAction(cc.sequence(cc.delayTime(0.2), cc.callFunc(() => { this.state = EBlockState.BREAKED; }, this)));
    }
});

// ██████╗ ██╗      ██████╗  ██████╗██╗  ██╗    ██╗      █████╗ ██╗   ██╗███████╗██████╗ 
// ██╔══██╗██║     ██╔═══██╗██╔════╝██║ ██╔╝    ██║     ██╔══██╗╚██╗ ██╔╝██╔════╝██╔══██╗
// ██████╔╝██║     ██║   ██║██║     █████╔╝     ██║     ███████║ ╚████╔╝ █████╗  ██████╔╝
// ██╔══██╗██║     ██║   ██║██║     ██╔═██╗     ██║     ██╔══██║  ╚██╔╝  ██╔══╝  ██╔══██╗
// ██████╔╝███████╗╚██████╔╝╚██████╗██║  ██╗    ███████╗██║  ██║   ██║   ███████╗██║  ██║
// ╚═════╝ ╚══════╝ ╚═════╝  ╚═════╝╚═╝  ╚═╝    ╚══════╝╚═╝  ╚═╝   ╚═╝   ╚══════╝╚═╝  ╚═╝
                                                                                      
var BlockLayer = cc.Layer.extend({
   
    spaceX: GameConfig.BLOCK_SPACE_X,
    spaceY: GameConfig.BLOCK_SPACE_Y,
    blockWidth: GameConfig.BLOCK_W,
    blockHeight: GameConfig.BLOCK_H,
    w: 0,
    h: 0,
    blockList:null,
    invokedTouches:[],
    swapTime: GameConfig.BLOCK_SWAP_TIME,
    
    ctor: function () {
        "use strict";
        this._super();

        return true;
    },
    
    GetBlockGridPosition: function(inBlockIndex) {
        var posX = parseInt(inBlockIndex % this.w) * (this.blockWidth + this.spaceX);
        var posY = parseInt(inBlockIndex / this.w) * (this.blockHeight + this.spaceY);
        return { x : posX, y : posY };
    },

    InitLayer: function (inW, inH) {
        "use strict";
        this.w = inW;
        this.h = inH;

        this.blockList = [];
        this.invokedTouches = [];

        this.blockList.length = inW * inH;

        var i = 0;
        var count = this.blockList.length;
        var block = null;

        // 블럭 최초 생성
        for (i = 0; i < count; i += 1) {
            block = new Block();
            block.attr({
                x: this.GetBlockGridPosition(i).x,
                y: this.GetBlockGridPosition(i).y
            });
            this.addChild(block);
            this.blockList[i] = block;
        }

        this.attr({
            width: inW * this.blockWidth + (inW - 1) * this.spaceX,
            height: inH * this.blockHeight + (inH - 1) * this.spaceY
        });

        // 이미 매칭된 블럭이 있는지 테스트
        var j = 0;
        for (i = 0; i < count; i += 1) {
            if (this.GetMatchedBlockIndexes(i).brokenBlockIndexes.length > 0) {
                for (j = 0; j < count; j += 1) {
                    this.blockList[j].SetRandomType();
                }
                i = -1;
                continue;
            }
        }

        if ('touches' in cc.sys.capabilities) {
            cc.eventManager.addListener({
                event: cc.EventListener.TOUCH_ALL_AT_ONCE,
                onTouchesBegan: function(touches, event){
                    var blockLayer = event.getCurrentTarget();
                    for (var it = 0; it < touches.length; it++) {
                        var touch = touches[it];
                        if (!touch)
                            continue;

                        var location = blockLayer.convertTouchToNodeSpace(touch);
                        var blockIndex = blockLayer.GetBlockIndex(location);
                        touch.blockIndex = blockIndex != -1 && blockLayer.blockList[blockIndex].IsStable() ? blockIndex : -1;
                        touch.block = blockIndex != -1 && blockLayer.blockList[blockIndex].IsStable() ? blockLayer.blockList[blockIndex] : null;

                        if (blockIndex != -1 && blockLayer.blockList[blockIndex].IsStable()){
                            blockLayer.blockList[blockIndex].SelectSprite();
                            touch.block = blockLayer.blockList[blockIndex];
                        }
                    }
                },

                onTouchesMoved: function(touches, event){
                    var blockLayer = event.getCurrentTarget();
                    for (var it = 0; it < touches.length; it++) {
                        var touch = touches[it];

                        if (!touch || touch.blockIndex == -1 || !blockLayer.blockList[touch.blockIndex].IsStable())
                            continue;

                        var startLoc = touch.getStartLocationInView();
                        var curLoc = touch.getLocationInView();
                        var tempX = curLoc.x - startLoc.x;
                        var tempY = curLoc.y - startLoc.y;
                        var length = Math.sqrt(tempX * tempX + tempY * tempY);
                        if (length < GameConfig.DRAG_LENGTH)
                            continue;

                        blockLayer.SwapBlocks(touch);
                        touch.blockIndex = -1;
                    }
                },
                
                onTouchesEnded: function(touches, event){
                    var blockLayer = event.getCurrentTarget();
                    for (var it = 0; it < touches.length; it++) {
                        var touch = touches[it];
                        if (!touch || touch.blockIndex == -1)
                            continue;

                        if (touch.blockIndex != -1){
                            blockLayer.blockList[touch.blockIndex].DefaultSprite();
                        }

                        if (touch.block != null)
                            block.DefaultSprite();
                    }
                }
            }, this);
        }

        this.schedule(this.Update);
    },
    
    GetBlockIndex: function (inLocation) {
        var i = 0;
        var count = this.blockList.length;
        var block = null;
        for (i = 0; i < count; i += 1) {
            block = this.blockList[i];
            if (block == null)
                continue;;

            if (block.getPositionX() < inLocation.x 
                && inLocation.x < block.getPositionX() + block._getWidth()
                && block.getPositionY() < inLocation.y 
                && inLocation.y < block.getPositionY() + block._getHeight())
            {
                return i;
            }
        }

        return -1;
    },

    SwapBlocks: function (inTouch) {
        var index = inTouch.blockIndex;
        var block = this.blockList[index];

        if (!block.IsStable()){
            block.DefaultSprite();
            return;
        }

        var vec = inTouch.getDelta();

        /* direction은 시계방향
          12
         9  3
           6
        */
        var direction = (Math.abs(vec.x) < Math.abs(vec.y)) ? (vec.y > 0 ? 12 : 6) : (vec.x > 0 ? 3 : 9);
        var targetIndex = -1;

        switch (direction) {
            case 3:
                if (parseInt((index + 1) / this.w) == parseInt(index / this.w))
                    targetIndex = index + 1;
                break;

            case 6:
                if (index - this.w >= 0)
                    targetIndex = index - this.w;
                break;

            case 9:
                if (parseInt((index - 1) / this.w) == parseInt(index / this.w))
                    targetIndex = index - 1;
                break;

            case 12:
                if (index + this.w < this.blockList.length)
                    targetIndex = index + this.w;
                break;

            default:
                targetIndex = -1;
                break;
        }

        if (targetIndex == -1) {
            block.DefaultSprite();
            return;
        }

        var targetBlock = this.blockList[targetIndex];
        if (targetBlock == null || !targetBlock.IsStable()) {
            block.DefaultSprite();
            return;
        }

        block.state = EBlockState.SWAPPING;
        block.DefaultSprite();

        targetBlock.state = EBlockState.SWAPPING;
        targetBlock.DefaultSprite();

        var blockPos = block.getPosition();
        var targetBlockPos = targetBlock.getPosition();

        block.runAction(cc.sequence(
            cc.moveTo(this.swapTime, targetBlock.getPosition()), 
            cc.callFunc(()=> {
                block.state = EBlockState.STABLE; targetBlock.state = EBlockState.STABLE;
                var resultArr = this.CheckSwapMatching(index, targetIndex);

                if (resultArr.length > 0) {
                    this.SwapBlockIndex(index, targetIndex);
                    for (var i = 0; i < resultArr.length; i++)
                    {
                        this.CheckDestroyBlocks(resultArr[i]);
                    }
                }
                else {
                    block.state = EBlockState.SWAPPING; targetBlock.state = EBlockState.SWAPPING;

                    block.stopAllActions();
                    targetBlock.stopAllActions();

                    block.runAction(cc.moveTo(this.swapTime, blockPos));
                    targetBlock.runAction(cc.sequence(
                        cc.moveTo(this.swapTime, targetBlockPos), 
                        cc.callFunc(()=> {
                            block.state = EBlockState.STABLE; 
                            targetBlock.state = EBlockState.STABLE;

                            var resultArr = this.CheckMatching(index, targetIndex);
                            if (resultArr.length > 0)
                            {
                                this.SwapBlockIndex(index, targetIndex);
                                for (var i = 0; i < resultArr.length; i++)
                                {
                                    this.CheckDestroyBlocks(resultArr[i]);
                                }
                            }
                        }, this)));            
                }
            }, this)));
        targetBlock.runAction(cc.sequence(cc.moveTo(this.swapTime, block.getPosition())));
    },

    SwapBlockIndex: function (inSwapBlockIndex1, inSwapBlockIndex2) {
        var temp = this.blockList[inSwapBlockIndex1];
            this.blockList[inSwapBlockIndex1] = this.blockList[inSwapBlockIndex2];
            this.blockList[inSwapBlockIndex2] = temp;
    },

    CheckSwapMatching: function (inBlockIndex1, inBlockIndex2) 
    {
        this.SwapBlockIndex(inBlockIndex1, inBlockIndex2);
        var resultArr = this.CheckMatching(inBlockIndex1, inBlockIndex2);
        this.SwapBlockIndex(inBlockIndex1, inBlockIndex2);

        return resultArr;
    },

    CheckMatching: function (inBlockIndex1, inBlockIndex2) 
    {
        var indexArr = [inBlockIndex1, inBlockIndex2];
        var resultArr =[];
        for (var i = 0; i < indexArr.length; i++)
        {
            tempResult = this.GetMatchedBlockIndexes(indexArr[i]);
            if (tempResult.brokenBlockIndexes.length > 0)
                resultArr.push(tempResult);
        }

        return resultArr;
    },

    CheckDestroyBlocks: function(inResult)
    {
        var block = null;
        for (var i = 0; i < inResult.brokenBlockIndexes.length; i++)
        {
            var index = inResult.brokenBlockIndexes[i];
            block = this.blockList[index];
            if (block == null || !block.IsStable())
                continue;

            block.Break();
        }

        block = this.blockList[inResult.index];
        if (block == null)
            return;

        block.Break();
    },

    GetMatchedBlockIndexes: function (inBlockIndex) {
        var blockIndexArr = [];
        var tempIndexArr = [];
        var curIndex = inBlockIndex;
        var w = this.w;

        var result = new Object();
        result.createdBlockType = -1;

        var NextLeftIndex = function() {
            return curIndex - 1;
        }

        var NextRightIndex = function() {
            return curIndex + 1;
        }

        var NextTopIndex = function() {
            return curIndex + w;
        }

        var NextBottomIndex = function() {
            return curIndex - w;
        }

        var rowIndex = parseInt(inBlockIndex / this.w);

        curIndex = inBlockIndex;
        tempIndexArr = [];

        // 왼쪽
        while (NextLeftIndex() >= 0
            && parseInt(NextLeftIndex() / this.w) ==  rowIndex // 같은 가로줄 선상이면서
            && this.blockList[NextLeftIndex()] != null
            && this.blockList[NextLeftIndex()].IsStable() // 다음 블럭이 안정적이고
            && this.blockList[NextLeftIndex()].blockType == this.blockList[curIndex].blockType) { // 이전 블럭과 같으면
            curIndex = NextLeftIndex();
            tempIndexArr.push(curIndex);
        }

        curIndex = inBlockIndex;

        // 오른쪽
        while (NextRightIndex() < this.blockList.length
            && parseInt(NextRightIndex() / this.w) == rowIndex // 같은 가로줄 선상이면서
            && this.blockList[NextRightIndex()] != null
            && this.blockList[NextRightIndex()].IsStable() // 다음 블럭이 안정적이고
            && this.blockList[NextRightIndex()].blockType == this.blockList[curIndex].blockType) { // 이전 블럭과 같으면
            curIndex = NextRightIndex();
            tempIndexArr.push(curIndex);
        }

        if (tempIndexArr.length > 1) {
            blockIndexArr = blockIndexArr.concat(tempIndexArr);
        }

        if (tempIndexArr.length > 3) {
            result.createdBlockType = ESpecialBlockType.SMILE;
        }
        else if (tempIndexArr.length > 4) {
            result.createdBlockType = ESpecialBlockType.GHOST;
        }

        curIndex = inBlockIndex;
        tempIndexArr = [];

        // 위
        while (NextTopIndex() < this.blockList.length // 가장 큰 값 보다 작으면서
            && this.blockList[NextTopIndex()] != null
            && this.blockList[NextTopIndex()].IsStable() // 다음 블럭이 안정적이고
            && this.blockList[NextTopIndex()].blockType == this.blockList[curIndex].blockType) { // 이전 블럭과 같으면
            curIndex = NextTopIndex();
            tempIndexArr.push(curIndex);
        }

        curIndex = inBlockIndex;

        // 아래
        while (NextBottomIndex() >= 0 // 가장 작은 값 보다 크거나 같으면서
            && this.blockList[NextBottomIndex()] != null
            && this.blockList[NextBottomIndex()].IsStable() // 다음 블럭이 안정적이고
            && this.blockList[NextBottomIndex()].blockType == this.blockList[curIndex].blockType) { // 이전 블럭과 같으면
            curIndex = NextBottomIndex();
            tempIndexArr.push(curIndex);
        }

        if (tempIndexArr.length > 1) {
            blockIndexArr = blockIndexArr.concat(tempIndexArr);
        }

        if (tempIndexArr.length > 3) {
            result.createdBlockType = result.createdBlockType > ESpecialBlockType.SMILE ? result.createdBlockType : ESpecialBlockType.SMILE;
        }
        else if (tempIndexArr.length > 4) {
            result.createdBlockType = result.createdBlockType >ESpecialBlockType.GHOST ? result.createdBlockType : ESpecialBlockType.GHOST;
        }

        result.index = inBlockIndex;
        result.brokenBlockIndexes = blockIndexArr;

        return result;
    },

    DestroyBlocks: function()
    {
        for (var i = 0; i < this.blockList.length; i++) {
            var block = this.blockList[i];
            if (block == null)
                continue;

            if (block.state == EBlockState.BREAKED) {
                block.removeFromParent(true);
                this.blockList[i] = null;
            }
        }
    },

    PullBlockData: function()
    {
        for (var i = 0; i < this.w; i++) {
            for (var j = i; j < this.blockList.length; j += this.w) {
                if (this.blockList[j] != null)
                    continue;

                for (var k = j + this.w; k < this.blockList.length; k += this.w) {
                    if (this.blockList[k] == null)
                        continue;

                    if (this.blockList[k].state == EBlockState.DROPPING || this.blockList[k].state == EBlockState.STABLE)
                    {
                        this.SwapBlockIndex(j, k);
                        this.blockList[j].state = EBlockState.DROPPING;
                        this.blockList[j].DefaultSprite();
                        break;
                    }
                }
            }
        }
    },

    CreateBlocks: function()
    {
        var count = 0;
        var topBlockIndex = 0;
        var topBlockY = 0;
        var block = null;
        for (var i = 0; i < this.w; i++) {
            count = 0;
            topBlockY = 0;
            // 새로운 블럭을 채워 넣을 빈 블럭 개수 가져오기
            for (var j = i; j < this.blockList.length; j += this.w) {
                count = this.blockList[j] == null ? count + 1 : 0;
                topBlockIndex = j;

                if (this.blockList[j] != null) {
                    topBlockY = Math.max(this.blockList[j].getPositionY(), topBlockY);
                }
            }

            // 새로운 블럭 상단에 생성하기
            for (var j = 0; j < count; j++) {
                block = new Block();
                block.state = EBlockState.DROPPING;
                block.attr({
                    x: this.GetBlockGridPosition(i).x,
                    y: Math.max(this.GetBlockGridPosition(topBlockIndex + this.w * (j + 1)).y, topBlockY + this.blockHeight + this.spaceY)
                });
                this.addChild(block);
                this.blockList[topBlockIndex - this.w * (count - j - 1)] = block;
            }
        }
    },
    
    FlowBlocks: function(dt)
    {
        var dropSpeed = GameConfig.DROP_SPEED;
        for (var i = 0; i < this.blockList.length; i++) {

            var block = this.blockList[i];
            if (block == null)
                continue;

            var targetY = this.GetBlockGridPosition(i).y;
            if (block.state == EBlockState.STABLE && targetY < block.getPositionY())
                block.state = EBlockState.DROPPING;

            if (block.state == EBlockState.DROPPING) {
                if (block.getPositionY() > targetY) {
                    block.attr({
                        y: Math.max(block.getPositionY() - dt * dropSpeed, targetY)
                    });
                }
                else {
                    block.state = EBlockState.STABLE;
                    block.DefaultSprite();
                    block.attr({
                        y: targetY
                    });

                    var result = this.GetMatchedBlockIndexes(i);
                    if (result.brokenBlockIndexes.length > 0) {
                        this.CheckDestroyBlocks(result);
                    }
                }
            }
        }
    },

    Update: function (dt) {
        // 제거 연출이 완료된 블럭 제거하기
        this.DestroyBlocks();

        // 상단의 블럭 정보를 하단으로 당겨오기
        this.PullBlockData();

        // 신규 블럭 생성하기
        this.CreateBlocks();

        // 블럭 애니매이션 
        this.FlowBlocks(dt);
    },
});

var TopUI = cc.Node.extend({
    bg: null,
    ctor: function () {
        "use strict";
        this._super();

        this.bg = new cc.Sprite(res.BgTop_png);
        this.addChild(this.bg, 0);

        this.attr({
            width: this.bg.width,
            height: this.bg.height,
        });
    },
});

var BottomUI = cc.Node.extend({
    bg: null,
    ctor: function () {
        "use strict";
        this._super();

        this.bg = new cc.Sprite(res.BgBottom_png);
        this.addChild(this.bg, 0);

        this.attr({
            width: this.bg.width,
            height: this.bg.height,
        });
    },
});
