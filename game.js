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

let playerWeapon = { "damage": 5, "fireRate": 250, "isFiring": false }

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

class Shop {
    constructor(scene) {
        this.scene = scene;
        this.shopGroup = this.scene.add.group();
        this.isOpen = false;
        this.items = [
            { name: 'Potion', cost: 100 },
            { name: 'Sword', cost: 200 }
        ];
        this.createShopUI();
    }

    createShopUI() {
        const graphics = this.scene.add.graphics();
        graphics.fillStyle(0x000000, 0.9); // Black color, fully opaque
        graphics.fillRect(this.scene.cameras.main.centerX - (this.items.length * 50), this.scene.cameras.main.centerY - (this.items.length * 25), 200, this.items.length * 50 + 50);

        const bg = this.scene.add.existing(graphics);
        this.shopGroup.add(bg);

        this.items.forEach((item, index) => {
            const itemText = this.scene.add.text(this.scene.cameras.main.centerX - 100, index * 50 + 50 + this.scene.cameras.main.centerY - (this.items.length * 25), `${item.name} - ${item.cost} Gold`, { fontSize: '16px', fill: '#fff' });
            this.shopGroup.add(itemText);
        });

        const closeButton = this.scene.add.text(this.scene.cameras.main.centerX - 100, this.scene.cameras.main.centerY - (this.items.length * 25), 'Close', { fontSize: '16px', fill: '#fff' });
        closeButton.setInteractive();
        closeButton.on('pointerdown', () => this.hideShop());
        this.shopGroup.add(closeButton);

        this.shopGroup.getChildren().forEach(child => {
            child.setVisible(false);
        });
    }

    showShop() {
        if (!this.isOpen) {
            this.shopGroup.getChildren().forEach(child => {
                child.setVisible(true);
            });
        }
        this.isOpen = true;

    }

    hideShop() {
        this.isOpen = false;
        this.shopGroup.getChildren().forEach(child => {
            child.setVisible(false);
        });

    }

    update() {
        // TODO: Handle shop interactions
    }
}

class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, textureKey) {
        super(scene, x, y, textureKey);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setCollideWorldBounds(true);
        this.setScale(scene.scaleFactor);

        this.maxVelocity = 100 * scene.scaleFactor;
        this.lastDirection = "u";
    }

    play_anim_from_directions(dir, lastDir) {
        switch (dir) {
            case "u":
                this.anims.play('dude1_up', true);
                break;
            case "d":
                this.anims.play('dude1_down', true);
                break;
            case "r":
                this.flipX = false;
                this.anims.play('dude1_right', true);
                break;
            case "l":
                this.flipX = true;
                this.anims.play('dude1_right', true);
                break;
            case "n":
                switch (lastDir) {
                    case "n":
                        break;
                    case "u":
                        this.anims.play('dude1_idle_up', true);
                        break;
                    case "d":
                        this.anims.play('dude1_idle_down', true);
                        break;
                    case "r":
                        this.flipX = false;
                        this.anims.play('dude1_idle_right', true);
                        break;
                    case "l":
                        this.flipX = true;
                        this.anims.play('dude1_idle_right', true);
                        break;
                }
        }
    }

    update(cursors) {
        let animDirection = velocity_to_direction(this.body.velocity);
        if (!(animDirection == "n")) {
            this.lastDirection = animDirection;
        }

        if (cursors.left.isDown || this.scene.keyA.isDown) {
            if (!cursors.right.isDown) {
                this.setVelocityX(- MAX_VELOCITY);
            } else {
                this.setVelocityX(0);
            }
        }
        else if (cursors.right.isDown || this.scene.keyD.isDown) {
            this.setVelocityX(MAX_VELOCITY);
            this.flipX = false;
        }
        else {
            this.setVelocityX(0);
        }

        if (cursors.up.isDown || this.scene.keyW.isDown) {
            if (!cursors.down.isDown) {
                this.setVelocityY(-MAX_VELOCITY);
            } else {
                this.setVelocityY(0);
            }
        }
        else if (cursors.down.isDown || this.scene.keyS.isDown) {
            this.setVelocityY(MAX_VELOCITY);
        }
        else {
            this.setVelocityY(0);
        }

        if (cursors.space.isDown) {
            if (playerWeapon && !playerWeapon.isFiring) {
                let bullet = this.scene.physics.add.sprite(this.x, this.y, 'bullet1'); // Replace 'bullet' with your projectile's texture
                bullet.setScale(MY_SCALE / 2);
                if (this.body.velocity.x == 0 && this.body.velocity.y == 0) {
                    switch (this.lastDirection) {
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
                    bullet.setVelocityX(this.body.velocity.x * 2); // Adjust the velocity as needed
                    bullet.setVelocityY(this.body.velocity.y * 2); // Adjust the velocity as needed
                }
                bullet.setActive(true);
                bullet.setVisible(true);
                bullet.damage = playerWeapon.damage; // Set damage based on the current weapon
                bullet.anims.play('bullet1', true);

                // Add collision handling for the bullet (e.g., with enemies or objects)
                // this.physics.add.collider(bullet, enemies, bulletHitEnemy, null, this);

                // Prevent the player from firing again until the fire rate cooldown is over
                playerWeapon.isFiring = true;
                this.scene.time.delayedCall(playerWeapon.fireRate, () => {
                    playerWeapon.isFiring = false;
                });
            }
        }

        let direction = velocity_to_direction(this.body.velocity);
        this.play_anim_from_directions(direction, animDirection)
    }
}

class Enemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, textureKey, enemyType) {
        super(scene, x, y, textureKey);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.enemyType = enemyType;
        this.setCollideWorldBounds(true);
        this.setScale(scene.scaleFactor);

        this.health = 100; // Default health
        this.speed = 50; // Default speed

        this.initializeEnemyProperties();
    }

    initializeEnemyProperties() {
        switch (this.enemyType) {
            case 'knight':
                this.health = 50;
                this.speed = 60;
                break;
            case 'ogre':
                this.health = 150;
                this.speed = 30;
                break;
        }
    }

    update() {
        this.anims.play('knight_idle_right', true);
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.die();
        }
    }

    die() {
        this.destroy();
    }
}


class Wizard extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, textureKey) {
        super(scene, x, y, textureKey);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        let wizard_body_width = Math.floor(this.width * 0.6)
        let wizard_body_height = Math.floor(this.height * 0.4)
        this.body.setSize(wizard_body_width, wizard_body_height);
        this.setScale(MY_SCALE);
        this.setCollideWorldBounds(true);
        this.setImmovable(true);

        this.interactionZone = scene.add.zone(this.x - this.width, this.y, this.width * 2, this.body.height * 4);
        scene.physics.world.enable(this.interactionZone);
    }

}


class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
        this.scaleFactor = null;
        this.player = null;
        this.wizard = null;
        this.cursors = null;
    }

    preload() {
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

        // Wizard
        this.load.spritesheet('wizard',
            'Mini_Dungeon/Characters/Wizard.png',
            { frameWidth: 32, frameHeight: 32 }
        );

        // Knight Enemy
        this.load.spritesheet('knight',
            'Mini_Dungeon/Characters/PlayerV3.png',
            { frameWidth: 16, frameHeight: 16 }
        );

        // Bullets
        this.load.spritesheet('bullets1',
            'spritesheets/bullets/All_Fire_Bullet_Pixel_16x16_07.png',
            { frameWidth: 16, frameHeight: 16 })
    }

    create() {
        this.scaleFactor = Math.floor(Math.min(
            window.innerWidth / (HORIZONTAL_TILES * ORIGINAL_TILE_WIDTH),
            window.innerHeight / (VERTICAL_TILES * ORIGINAL_TILE_WIDTH)
        ));

        this.physics.world.setBounds(0, 0, HORIZONTAL_TILES * TILE_WIDTH, VERTICAL_TILES * TILE_WIDTH);
        // Load all textures from each forest palette
        for (let forest_num = 0; forest_num < 6; forest_num++) {
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
        this.forest_ground_textures = ["grass0", "grass1", "grass2", "dirt0", "dirt1", "dirt2"].map(a => `forest03-day-${a}`)
        this.forest_mush_textures = ["mush0", "mush1", "mush2", "mush3", "stump"].map(a => `forest03-day-${a}`)
        let ground_texture, mush_texture;

        for (let i = 0; i < HORIZONTAL_TILES; i++) {
            for (let j = 0; j < VERTICAL_TILES; j++) {
                let pos = grid_coords_to_x_y(i, j)


                ground_texture = this.forest_ground_textures[Math.floor(Math.random() * this.forest_ground_textures.length)]
                this.add.image(pos[0], pos[1], ground_texture)


                if (Math.random() < 0.1) {
                    mush_texture = this.forest_mush_textures[Math.floor(Math.random() * this.forest_mush_textures.length)]
                    this.add.image(pos[0], pos[1], mush_texture)
                }

            }
        }

        // Create wizard
        const wizardPos = grid_coords_to_x_y(12, 1, this.scaleFactor);
        this.wizard = new Wizard(this, wizardPos[0], wizardPos[1], 'wizard');

        // Animate wizard
        this.anims.create({
            key: 'wizard_idle',
            frames: this.anims.generateFrameNames('wizard', {
                start: 0,
                end: 1
            }),
            frameRate: 2,
            repeat: -1
        })
        this.wizard.anims.play('wizard_idle');

        // Create player 1
        const playerPos = grid_coords_to_x_y(12, 5, this.scaleFactor);
        this.player = new Player(this, playerPos[0], playerPos[1], 'dude1');

        // Animate player 1
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
            key: 'dude1_idle_right',
            frames: [
                { key: 'dude1_idle', frame: 2 },
                { key: 'dude1_idle', frame: 5 },
            ],
            frameRate: 5,
            repeat: -1
        });

        // Animate knight
        this.anims.create({
            key: 'knight_idle_right',
            frames: [
                { key: 'knight', frame: 16 },
                { key: 'knight', frame: 19 },
            ],
            frameRate: 3,
            repeat: -1
        });

        this.anims.create({
            key: 'knight_right',
            frames: [
                { key: 'knight', frame: 31 },
                { key: 'knight', frame: 34 },
                { key: 'knight', frame: 37 },
                { key: 'knight', frame: 40 }
            ],
            frameRate: 5,
            repeat: -1
        });

        this.anims.create({
            key: 'knight_attack_right',
            frames: [
                { key: 'knight', frame: 46 },
                { key: 'knight', frame: 49 },
                { key: 'knight', frame: 52 },
                { key: 'knight', frame: 55 },
                { key: 'knight', frame: 58 },
            ],
            frameRate: 5,
            repeat: -1
        });

        this.anims.create({
            key: 'knight_damaged_right',
            frames: [
                { key: 'knight', frame: 61 },
                { key: 'knight', frame: 64 },
                { key: 'knight', frame: 67 },
                { key: 'knight', frame: 70 },
                { key: 'knight', frame: 73 },
            ],
            frameRate: 5,
            repeat: -1
        });

        this.anims.create({
            key: 'knight_duck_right',
            frames: [
                { key: 'knight', frame: 76 },
                { key: 'knight', frame: 79 },
                { key: 'knight', frame: 82 },
                { key: 'knight', frame: 85 },
                { key: 'knight', frame: 88 },
                { key: 'knight', frame: 88 },
            ],
            frameRate: 5,
            repeat: -1
        });



        // Animate bullet
        this.anims.create({
            key: 'bullet1',
            frames: [
                { key: 'bullets1', frame: 40 },
                { key: 'bullets1', frame: 44 },
            ],
            frameRate: 10,
            repeat: -1
        });

        this.enemies = this.physics.add.group();
        this.enemies.add(new Enemy(this, 100, 100, 'knight', 'knight'));

        // Set up collision and overlap
        this.physics.add.collider(this.player, this.wizard);
        this.physics.add.overlap(this.player, this.wizard.interactionZone, this.openShopMenu, null, this);

        // Set up cursors
        this.cursors = this.input.keyboard.createCursorKeys();

        this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.keyF = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);

        // Add shop
        this.shop = new Shop(this);
    }

    update() {
        if (this.player) this.player.update(this.cursors);
        if (this.wizard) this.wizard.update();
        if (this.shop.isOpen) {
            this.shop.update();
        }
        this.enemies.children.iterate(enemy => {
            enemy.update();
        })




    }

    openShopMenu(player, wizard) {
        // Shop menu logic
        if (this.cursors.space.isDown) {
            this.shop.showShop();
        }
    }
}

function grid_coords_to_x_y(x, y) {
    return [x * TILE_WIDTH + TILE_OFFSET, y * TILE_WIDTH + TILE_OFFSET]
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
    scene: [GameScene],
    pixelArt: true,
    roundPixels: true,
    parent: 'gameContainer',
    backgroundColor: '#ababab'
};


let game = new Phaser.Game(config);