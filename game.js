let window_width = window.innerWidth;
let window_height = window.innerHeight;

const HORIZONTAL_TILES = 24;
const VERTICAL_TILES = 12;
const ORIGINAL_TILE_WIDTH = 16;
const SCALE_WIDTH = window_width / (HORIZONTAL_TILES * ORIGINAL_TILE_WIDTH);
const SCALE_HEIGHT = window_height / (VERTICAL_TILES * ORIGINAL_TILE_WIDTH);
const MY_SCALE = Math.floor(Math.min(SCALE_WIDTH, SCALE_HEIGHT));
const TILE_WIDTH = ORIGINAL_TILE_WIDTH * MY_SCALE;
const TILE_OFFSET = TILE_WIDTH / 2;
const MAX_VELOCITY = 100 * MY_SCALE;

// const all_directions = ["d", "u", "r", "l", "dr", "dl", "ur", "ul", "n"]

let config = {
    type: Phaser.AUTO,
    width: HORIZONTAL_TILES * TILE_WIDTH,
    height: VERTICAL_TILES * TILE_WIDTH,
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

let game = new Phaser.Game(config);

let currentWeapon = 'laser';
let lastDirection;



let forest_tiles_dict = {
    "grass0": { "col": 7, "row": 17, id: 0 },
    "grass1": { "col": 8, "row": 17, id: 1 },
    "grass2": { "col": 9, "row": 17, id: 2 },
    "grass3": { "col": 10, "row": 17, id: 3 },
    "dirt0": { "col": 7, "row": 16, id: 4 },
    "dirt1": { "col": 8, "row": 16, id: 5 },
    "dirt2": { "col": 9, "row": 16, id: 6 },
    "dirt3": { "col": 10, "row": 16, id: 7 },
    "stump": { "col": 4, "row": 9, id: 8 },
    "mush0": { "col": 5, "row": 9, id: 9 },
    "mush1": { "col": 6, "row": 9, id: 10 },
    "twig0": { "col": 4, "row": 10, id: 11 },
    "mush2": { "col": 5, "row": 10, id: 12 },
    "mush3": { "col": 6, "row": 10, id: 13 },
}

let num_forest_tiles = Object.keys(forest_tiles_dict).length;

let id_to_forest_tile_dict = {};
let forest_tile_to_id_dict = {};



for (let i = 0; i < 6; i++) {
    let j = 0;
    let time = Number.isInteger(i / 2) ? "day" : "night"
    for (var key in forest_tiles_dict) {
        id_to_forest_tile_dict[i * num_forest_tiles + j] = `forest0${Math.floor(i / 2) + 1}-${time}-${key}`;
        forest_tile_to_id_dict[`forest0${Math.floor(i / 2) + 1}-${time}-${key}`] = i * num_forest_tiles + j;
        j++;
    }
}

let total_forest_tiles = Object.keys(id_to_forest_tile_dict).length;


console.log(id_to_forest_tile_dict)

function grid_coords_to_x_y(x, y) {
    return [x * TILE_WIDTH + TILE_OFFSET, y * TILE_WIDTH + TILE_OFFSET]
}

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

let playerWeapon = createWeapon(currentWeapon);

function preload() {
    // Forest 01
    this.load.image('forest01-day', 'forest tiles/forest-palette01-day.png')
    this.load.image('forest01-night', 'forest tiles/forest-palette01-night.png')
    // Forest 02
    this.load.image('forest02-day', 'forest tiles/forest-palette02-day.png')
    this.load.image('forest02-night', 'forest tiles/forest-palette02-night.png')
    // Forest 03
    this.load.image('forest03-day', 'forest tiles/forest-palette03-day.png')
    this.load.image('forest03-night', 'forest tiles/forest-palette03-night.png')


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
        'spritesheets/bullets/All_Fire_Bullet_Pixel_16x16_07.png',
        { frameWidth: 16, frameHeight: 16 })
}

function create() {
    this.physics.world.setBounds(0, 0, HORIZONTAL_TILES * TILE_WIDTH, VERTICAL_TILES * TILE_WIDTH);
    for (let forest_num = 0; forest_num < 6; forest_num++) {
        // Load all textures from each forest palette
        for (let key in forest_tiles_dict) {
            let item = forest_tiles_dict[key];
            let col = item.col;
            let row = item.row;
            let time = Number.isInteger(forest_num / 2) ? "day" : "night";
            let pallette_num = Math.floor(forest_num / 2) + 1
            let name = `forest0${pallette_num}-${time}-${key}`;
            let texture = this.textures.createCanvas(name, TILE_WIDTH, TILE_WIDTH);
            let ctx = texture.getContext();
            let forest_name = `forest0${pallette_num}-${time}`
            ctx.drawImage(
                this.textures.get(forest_name).getSourceImage(),
                col * 16,
                row * 16,
                16,
                16,
                0,
                0,
                TILE_WIDTH,
                TILE_WIDTH
            );
            texture.refresh();
        }
    }


    // Randomly fill the background with grass and dirt, then randomly put mushrooms on top
    forest_ground_textures = ["grass0", "grass1", "grass2", "dirt0", "dirt1", "dirt2"].map(a => `forest03-day-${a}`)
    forest_mush_textures = ["mush0", "mush1", "mush2", "mush3", "stump"].map(a => `forest03-day-${a}`)
    let ground_texture, mush_texture;

    for (let i = 0; i < HORIZONTAL_TILES; i++) {
        for (let j = 0; j < VERTICAL_TILES; j++) {
            let pos = grid_coords_to_x_y(i, j)


            ground_texture = forest_ground_textures[Math.floor(Math.random() * forest_ground_textures.length)]
            this.add.image(pos[0], pos[1], ground_texture)


            if (Math.random() < 0.1) {
                mush_texture = forest_mush_textures[Math.floor(Math.random() * forest_mush_textures.length)]
                this.add.image(pos[0], pos[1], mush_texture)
            }

        }
    }




    cursors = this.input.keyboard.createCursorKeys();

    keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    keyF = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);

    player_pos = grid_coords_to_x_y(6, 10)
    player = this.physics.add.sprite(player_pos[0], player_pos[1], 'dude1');
    player.setCollideWorldBounds(true);
    player.setScale(MY_SCALE);


    // this.physics.add.collider(player, platforms);

    // Player 1
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
    // Bullet 1
    this.anims.create({
        key: 'bullet1',
        frames: this.anims.generateFrameNames('bullets1', {
            start: 40 * 19 + 11,
            end: 40 * 19 + 16
        }),
        frameRate: 10,
        repeat: -1
    });
}

function updatePlayer() {
    let animDirection = velocity_to_direction(player.body.velocity);
    if (!(animDirection == "n")) {
        lastDirection = animDirection;
    }

    if (cursors.left.isDown || keyA.isDown) {
        if (!cursors.right.isDown) {
            player.setVelocityX(- MAX_VELOCITY);
        } else {
            player.setVelocityX(0);
        }
    }
    else if (cursors.right.isDown || keyD.isDown) {
        player.setVelocityX(MAX_VELOCITY);
        player.flipX = false;
    }
    else {
        player.setVelocityX(0);
    }

    if (cursors.up.isDown || keyW.isDown) {
        if (!cursors.down.isDown) {
            player.setVelocityY(-MAX_VELOCITY);
        } else {
            player.setVelocityY(0);
        }
    }
    else if (cursors.down.isDown || keyS.isDown) {
        player.setVelocityY(MAX_VELOCITY);
    }
    else {
        player.setVelocityY(0);
    }

    if (cursors.space.isDown) {
        if (playerWeapon && !playerWeapon.isFiring) {
            let bullet = this.physics.add.sprite(player.x, player.y, 'bullet1'); // Replace 'bullet' with your projectile's texture
            bullet.setScale(MY_SCALE / 2)
            if (player.body.velocity.x == 0 && player.body.velocity.y == 0) {
                switch (lastDirection) {
                    case "n":
                        bullet.setVelocityY(MAX_VELOCITY * 2);
                        break;
                    case "u":
                        bullet.setVelocityY(-MAX_VELOCITY * 2);
                        break;
                    case "d":
                        bullet.setVelocityY(MAX_VELOCITY * 2);
                        break;
                    case "r":
                        bullet.setVelocityX(MAX_VELOCITY * 2);
                        break;
                    case "l":
                        bullet.setVelocityX(-MAX_VELOCITY * 2);
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

    let direction = velocity_to_direction(player.body.velocity);
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
    let x_positive = velocity.x > 0
    let x_negative = velocity.x < 0
    let y_positive = velocity.y > 0
    let y_negative = velocity.y < 0
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