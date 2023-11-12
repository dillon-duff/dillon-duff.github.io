var score = 0;
var scoreText;

var window_width = window.innerWidth;
var window_height = window.innerHeight;

const HORIZONTAL_TILES = 24
const VERTICAL_TILES = 12

const SCALE_WIDTH = window_width / (HORIZONTAL_TILES * 16);
const SCALE_HEIGHT = window_height / (VERTICAL_TILES * 16);

const MY_SCALE = Math.floor(Math.min(SCALE_WIDTH, SCALE_HEIGHT));

var tile_width = 16 * MY_SCALE
var tile_offset = tile_width / 2

var max_velocity = 100 * MY_SCALE

var grid_width = HORIZONTAL_TILES//Math.floor(window_width / tile_width)
var grid_height = VERTICAL_TILES//Math.floor(window_height / tile_width)


const all_directions = ["d", "u", "r", "l", "dr", "dl", "ur", "ul", "n"]

var currentWeapon = 'laser';

function createWeapon(type) {
    switch (type) {
        case 'laser':
            return {
                damage: 10,
                fireRate: 200, // Time in milliseconds between shots
            };
        default:
            return null;
    }
}

var playerWeapon = createWeapon(currentWeapon);


var forest_tiles_dict = {
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
    width: HORIZONTAL_TILES * tile_width,
    height: VERTICAL_TILES * tile_width,
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
    parent: 'gameContainer',
    backgroundColor: '#ababab'
};

var game = new Phaser.Game(config);


function grid_coords_to_x_y(x, y) {
    return [x * tile_width + tile_offset, y * tile_width + tile_offset]
}


function preload() {
    // Forest 01
    this.load.image('forest-01', 'forest tiles/forest-palette01-day.png')
    this.load.image('forest-01-night', 'forest tiles/forest-palette01-night.png')
    // Forest 02
    this.load.image('forest-02', 'forest tiles/forest-palette02-day.png')
    this.load.image('forest-02-night', 'forest tiles/forest-palette02-night.png')
    // Forest 03
    this.load.image('forest-03', 'forest tiles/forest-palette03-day.png')
    this.load.image('forest-03-night', 'forest tiles/forest-palette03-night.png')


    // Player 1
    this.load.spritesheet('dude1',
        'spritesheets/players/1 walk.png',
        { frameWidth: 16, frameHeight: 16 }
    );
    this.load.spritesheet('dude1_idle',
        'spritesheets/players/1 idle.png',
        { frameWidth: 16, frameHeight: 16 }
    );

    // Bullets
    this.load.spritesheet('bullets1',
        'spritesheets/bullets/All_Fire_Bullet_Pixel_16x16_06.png',
        { frameWidth: 16, frameHeight: 16 })
}



function create() {
    this.physics.world.setBounds(0, 0, HORIZONTAL_TILES * tile_width, VERTICAL_TILES * tile_width);
    for (var forest_num = 1; forest_num <= 3; forest_num++) {
        // Load all textures from each forest palette
        for (var key in forest_tiles_dict) {
            var item = forest_tiles_dict[key];
            var col = item.col;
            var row = item.row;
            var name = `forest0${forest_num}-${key}`
            var texture = this.textures.createCanvas(name, tile_width, tile_width);
            var ctx = texture.getContext();
            ctx.drawImage(
                this.textures.get(`forest-0${forest_num}`).getSourceImage(),
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
    }


    // Randomly fill the background with grass and dirt
    forest_ground_textures = ["grass0", "grass1", "grass2", "dirt0", "dirt1", "dirt2"].map(a => `forest03-${a}`)
    forest_mush_textures = ["mush0", "mush1", "mush2", "mush3", "stump"].map(a => `forest03-${a}`)

    for (var i = 0; i < grid_width; i++) {
        for (var j = 0; j < grid_height; j++) {
            var pos = grid_coords_to_x_y(i, j)

            var ground_texture = forest_ground_textures[Math.floor(Math.random() * forest_ground_textures.length)]
            this.add.image(pos[0], pos[1], ground_texture)


            if (Math.random() < 0.1) {
                var mush_texture = forest_mush_textures[Math.floor(Math.random() * forest_mush_textures.length)]
                this.add.image(pos[0], pos[1], mush_texture)
            }


        }
    }


    cursors = this.input.keyboard.createCursorKeys();

    keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);

    player_pos = grid_coords_to_x_y(6, 10)
    player = this.physics.add.sprite(player_pos[0], player_pos[1], 'dude1');
    player.setCollideWorldBounds(true);
    player.setScale(MY_SCALE);


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
    this.anims.create({
        key: 'dude1_idle_up',
        frames: [
            { key: 'dude1_idle', frame: 1 },
            { key: 'dude1_idle', frame: 4 },
        ],
        frameRate: 5,
        repeat: -1
    });
    this.anims.create({
        key: 'dude1_idle_right',
        frames: [
            { key: 'dude1_idle', frame: 2 },
            { key: 'dude1_idle', frame: 5 },
        ],
        frameRate: 5,
        repeat: -1
    });
    this.anims.create({
        key: 'bullet1',
        frames: this.anims.generateFrameNames('bullets1', {
            start: 40 * 8 + 31,
            end: 40 * 8 + 34
        }),
        frameRate: 10,
        repeat: -1
    });
    // row 9
    // col 31-34
}

var lastDirection;

function updatePlayer() {
    var animDirection = velocity_to_direction(player.body.velocity);
    if (!(animDirection == "n")) {
        lastDirection = animDirection;
    }

    if (cursors.left.isDown || keyA.isDown) {
        if (!cursors.right.isDown) {
            player.setVelocityX(- max_velocity);
        } else {
            player.setVelocityX(0);
        }
    }
    else if (cursors.right.isDown || keyD.isDown) {
        player.setVelocityX(max_velocity);
        player.flipX = false;
    }
    else {
        player.setVelocityX(0);
    }

    if (cursors.up.isDown || keyW.isDown) {
        if (!cursors.down.isDown) {
            player.setVelocityY(-max_velocity);
        } else {
            player.setVelocityY(0);
        }
    }
    else if (cursors.down.isDown || keyS.isDown) {
        player.setVelocityY(max_velocity);
    }
    else {
        player.setVelocityY(0);
    }

    if (cursors.space.isDown) {
        if (playerWeapon && !playerWeapon.isFiring) {
            var bullet = this.physics.add.sprite(player.x, player.y, 'bullet1'); // Replace 'bullet' with your projectile's texture
            bullet.setScale(MY_SCALE / 2)
            if (player.body.velocity.x == 0 && player.body.velocity.y == 0) {
                switch (lastDirection) {
                    case "n":
                        bullet.setVelocityY(max_velocity * 2);
                        break;
                    case "u":
                        bullet.setVelocityY(-max_velocity * 2);
                        break;
                    case "d":
                        bullet.setVelocityY(max_velocity * 2);
                        break;
                    case "r":
                        bullet.setVelocityX(max_velocity * 2);
                        break;
                    case "l":
                        bullet.setVelocityX(-max_velocity * 2);
                        break;
                }
            } else {
                bullet.setVelocityX(player.body.velocity.x * 2); // Adjust the velocity as needed
                bullet.setVelocityY(player.body.velocity.y * 2); // Adjust the velocity as needed
            }
            bullet.setActive(true);
            bullet.setVisible(true);
            bullet.damage = playerWeapon.damage; // Set damage based on the current weapon
            bullet.anims.play('bullet1', true);

            // Add collision handling for the bullet (e.g., with enemies or objects)
            // this.physics.add.collider(bullet, enemies, bulletHitEnemy, null, this);

            // Prevent the player from firing again until the fire rate cooldown is over
            playerWeapon.isFiring = true;
            this.time.delayedCall(playerWeapon.fireRate, () => {
                playerWeapon.isFiring = false;
            });
        }
    }

    var direction = velocity_to_direction(player.body.velocity);
    play_anim_from_directions(direction, animDirection)

}

function update() {
    updatePlayer.call(this);
}

function play_anim_from_directions(dir, lastDir) {
    switch (dir) {
        case "u":
            player.anims.play('dude1_up', true);
            break;
        case "d":
            player.anims.play('dude1_down', true);
            break;
        case "r":
            player.flipX = false;
            player.anims.play('dude1_right', true);
            break;
        case "l":
            player.flipX = true;
            player.anims.play('dude1_right', true);
            break;
        case "n":
            switch (lastDir) {
                case "n":
                    break;
                case "u":
                    player.anims.play('dude1_idle_up', true);
                    break;
                case "d":
                    player.anims.play('dude1_idle_down', true);
                    break;
                case "r":
                    player.flipX = false;
                    player.anims.play('dude1_idle_right', true);
                    break;
                case "l":
                    player.flipX = true;
                    player.anims.play('dude1_idle_right', true);
                    break;
            }
    }
}

function velocity_to_direction(velocity) {
    var x_positive = velocity.x > 0
    var x_negative = velocity.x < 0
    var y_positive = velocity.y > 0
    var y_negative = velocity.y < 0
    if (x_positive) {
        // if (y_positive) {
        //     return "dr"
        // } else if (y_negative) {
        //     return "ur"
        // } else {
        //     return "r"
        // }
        return "r"
    } else if (x_negative) {
        // if (y_positive) {
        //     return "dl"
        // } else if (y_negative) {
        //     return "ul"
        // } else {
        //     return "l"
        // }
        return "l"
    } else {
        if (y_positive) {
            return "d"
        } else if (y_negative) {
            return "u"
        }
    }
    return "n";

}