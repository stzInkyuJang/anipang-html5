
var InGameScreenSize = {width: 480, height: 800 }

var InGameLayer = cc.Layer.extend({
    topUI: null,
    bottomUI: null,
    blockLayer: null,
    ctor:function () {
        //////////////////////////////
        // 1. super init first
        this._super();

        /////////////////////////////
        // 2. add a menu item with "X" image, which is clicked to quit the program
        //    you may modify it.
        // ask the window size

        var size = InGameScreenSize;

        this.attr({
            width: size.width,
            height: size.height
        });

        // 블럭 레이어
        this.blockLayer = new BlockLayer();
        this.blockLayer.InitLayer(7, 7);
        this.addChild(this.blockLayer, 0);
        this.blockLayer.attr({
            x: size.width / 2 - this.blockLayer.width / 2,
            y: size.height / 2 - this.blockLayer.height / 2 - 19
        });

        // 상단 UI
        this.topUI = new TopUI();
        this.topUI.attr({
            x: size.width / 2,
            y: size.height - this.topUI.height / 2
        });
        this.addChild(this.topUI, 1);

        // 하단 UI
        this.bottomUI = new BottomUI();
        this.bottomUI.attr({
            x: size.width / 2,
            y: this.bottomUI.height / 2
        });
        this.addChild(this.bottomUI, 1);


        // var b = new Block();


        // var size = cc.winSize;

        // /////////////////////////////
        // // 3. add your codes below...
        // // add a label shows "Hello World"
        // // create and initialize a label
        // var helloLabel = new cc.LabelTTF(b.targetIndex, "Arial", 38);
        // // position the label on the center of the screen
        // helloLabel.x = size.width / 2;
        // helloLabel.y = size.height / 2 + 200;
        // // add the label as a child to this layer
        // this.addChild(helloLabel, 5);



        // add "HelloWorld" splash screen"
        // this.sprite = new cc.Sprite(res.HelloWorld_png);
        // this.sprite.attr({
        //     x: size.width / 2,
        //     y: size.height / 2
        // });
        // this.addChild(this.sprite, 0);


        

        return true;
    }
});

var InGameScene = cc.Scene.extend({
    onEnter:function () {
        this._super();
        cc.view.setDesignResolutionSize(InGameScreenSize.width, InGameScreenSize.height);
        var layer = new InGameLayer();
        this.addChild(layer);
    }
});

