var score = 0;
var scoreText;

var window_width = window.innerWidth;
var window_height = window.innerHeight;

var tile_width = 16 * 3
var tile_offset = tile_width / 2


var grid_width = Math.floor(window_width / tile_width)
var grid_height = Math.floor(window_height / tile_width)



var forest01_dict = {
    "grass0": { "col": 7, "row": 17 },
    "grass1": { "col": 8, "row": 17 },
    "grass2": { "col": 9, "row": 17 },
    "grass3": { "col": 10, "row": 17 },
    "dirt0": { "col": 7, "row": 16 },
    "dirt1": { "col": 8, "row": 16 },
    "dirt2": { "col": 9, "row": 16 },
    "dirt3": { "col": 10, "row": 16 },
    "stump": { "col": 4, "row": 9 },
    "mush0": { "col": 5, "row": 9 },
    "mush1": { "col": 6, "row": 9 },
    "twig0": { "col": 4, "row": 10 },
    "mush2": { "col": 5, "row": 10 },
    "mush3": { "col": 6, "row": 10 },

}

var config = {
    type: Phaser.AUTO,
    width: window_width,
    height: window_height,
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    },
    pixelArt: true,
    roundPixels: true,
};

var game = new Phaser.Game(config);


function grid_coords_to_x_y(x, y) {
    return [x * tile_width, y * tile_width]
}

function preload() {
    this.load.image('sky', 'assets/sky.png');
    this.load.image('ground', 'assets/platform.png');

    this.load.image('forest-01', 'forest tiles/forest-palette01-day.png')


    this.load.spritesheet('dude1',
        'spritesheets/1 walk.png',
        { frameWidth: 16, frameHeight: 16 }
    );
    this.load.spritesheet('dude1_idle',
        'spritesheets/1 idle.png',
        { frameWidth: 16, frameHeight: 16 }
    );
}



function create() {

    // Load all textures from forest01_dict
    for (var key in forest01_dict) {
        var item = forest01_dict[key];
        var col = item.col;
        var row = item.row;
        var texture = this.textures.createCanvas(key, tile_width, tile_width);
        var ctx = texture.getContext();
        ctx.drawImage(
            this.textures.get('forest-01').getSourceImage(),
            col * 16,
            row * 16,
            16,
            16,
            0,
            0,
            tile_width,
            tile_width
        );
        texture.refresh();
    }

    // Randomly fill the background with grass and dirt
    forest_01_ground_textures = ["grass0", "grass1", "grass2", "dirt0", "dirt1", "dirt2"]
    forest_01_mush_textures = ["mush0", "mush1", "mush2", "mush3", "stump"]

    for (var i = 0; i < grid_width; i++) {
        for (var j = 0; j < grid_height; j++) {
            var pos = grid_coords_to_x_y(i, j)
            pos[0] += tile_offset
            pos[1] += tile_offset

            var ground_texture = forest_01_ground_textures[Math.floor(Math.random() * forest_01_ground_textures.length)]
            this.add.image(pos[0], pos[1], ground_texture)


            if (Math.random() < 0.1) {
                var mush_texture = forest_01_mush_textures[Math.floor(Math.random() * forest_01_mush_textures.length)]
                this.add.image(pos[0], pos[1], mush_texture)
            }


        }
    }


    console.log("Screen size: " + grid_width + " wide by " + grid_height + " tall")

    cursors = this.input.keyboard.createCursorKeys();

    // platforms = this.physics.add.staticGroup();
    // platforms.create(400, 568, 'ground').setScale(2).refreshBody();

    // platforms.create(600, 400, 'ground');
    // platforms.create(50, 250, 'ground');
    // platforms.create(750, 220, 'ground');

    player = this.physics.add.sprite(100, 450, 'dude1');
    player.setCollideWorldBounds(true);
    player.setScale(3);


    bombs = this.physics.add.group();

    // this.physics.add.collider(player, platforms);


    this.anims.create({
        key: 'dude1_right',
        frames: [
            { key: 'dude1', frame: 2 },
            { key: 'dude1', frame: 5 },
            { key: 'dude1', frame: 8 },
            { key: 'dude1', frame: 11 }
        ],
        frameRate: 10,
        repeat: -1
    });
    this.anims.create({
        key: 'dude1_up',
        frames: [
            { key: 'dude1', frame: 1 },
            { key: 'dude1', frame: 4 },
            { key: 'dude1', frame: 7 },
            { key: 'dude1', frame: 10 }
        ],
        frameRate: 10,
        repeat: -1
    });
    this.anims.create({
        key: 'dude1_down',
        frames: [
            { key: 'dude1', frame: 0 },
            { key: 'dude1', frame: 3 },
            { key: 'dude1', frame: 6 },
            { key: 'dude1', frame: 9 }
        ],
        frameRate: 10,
        repeat: -1
    });
    this.anims.create({
        key: 'dude1_idle_down',
        frames: [
            { key: 'dude1_idle', frame: 0 },
            { key: 'dude1_idle', frame: 3 },
        ],
        frameRate: 5,
        repeat: -1
    });

}

function update() {
    if (cursors.left.isDown) {
        player.setVelocityX(-260);
        player.flipX = true;
        player.anims.play('dude1_right', true);
    }
    else if (cursors.right.isDown) {
        player.setVelocityX(260);
        player.flipX = false;
        player.anims.play('dude1_right', true);
    }
    else {
        player.setVelocityX(0);
    }
    if (cursors.up.isDown) {
        if (!cursors.left.isDown && !cursors.right.isDown) {
            player.anims.play('dude1_up', true);
        }
        player.setVelocityY(-260);
    }
    else if (cursors.down.isDown) {
        if (!cursors.left.isDown && !cursors.right.isDown) {
            player.anims.play('dude1_down', true);
        }
        player.setVelocityY(260);
    }
    else {
        player.setVelocityY(0);
        if (!(cursors.right.isDown) && (!cursors.left.isDown)) {
            player.anims.play('dude1_idle_down', true);
        }
    }



}