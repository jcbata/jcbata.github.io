class GameScene extends Phaser.Scene {
    constructor() { super('GameScene'); }

    init() {
        this.playerBiomass = 200;
        this.selectedUnit = null;
        this.broodChamberBuilt = false;
    }

    create() {
        this.cameras.main.setBackgroundColor('#2E4023');

        this.buildings = this.add.group();
        this.harvesters = this.physics.add.group({ collideWorldBounds: true });
        this.combatUnits = this.physics.add.group({ collideWorldBounds: true });
        this.enemies = this.physics.add.group({ collideWorldBounds: true });

        const gameZone = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0, 0).setOrigin(0,0).setInteractive();
        gameZone.on('pointerdown', this.handleGroundClick, this);
        this.children.sendToBack(gameZone);

        this.biomassNodes = this.physics.add.staticGroup();
        [ { x: 100, y: 150 }, { x: 700, y: 450 } ].forEach(pos => {
            const node = this.biomassNodes.create(pos.x, pos.y, null).setCircle(30).setTint(0x00FF00);
            node.setInteractive().on('pointerdown', (p) => this.commandUnitToNode(node, p));
        });

        this.hive = this.add.rectangle(this.scale.width / 2, this.scale.height / 2, 80, 80, 0x8B4513);
        this.physics.add.existing(this.hive, true);
        this.hive.setInteractive().on('pointerdown', () => this.spawnHarvester());
        this.buildings.add(this.hive);

        this.spawnEnemy(200, 200);
        this.spawnEnemy(600, 300);

        this.biomassText = this.add.text(10, 10, '', { fontSize: '20px', fill: '#FFFFFF' });
        this.updateBiomassText();
        this.createBuildButton();
    }

    update(time, delta) {
        this.harvesters.getChildren().forEach(unit => this.updateHarvesterState(unit, delta));
        this.combatUnits.getChildren().forEach(unit => this.updateCombatUnitState(unit, delta));
    }

    updateHarvesterState(unit, delta) {
        const speed = 100;
        if (!unit.state || unit.state === 'idle') return;
        switch (unit.state) {
            case 'moving': this.updateUnitMovement(unit); break;
            case 'movingToGather':
                if (this.physics.overlap(unit, unit.targetNode)) {
                    unit.body.stop();
                    unit.state = 'gathering';
                    unit.gatherTimer = 3000;
                } else { this.physics.moveToObject(unit, unit.targetNode, speed); }
                break;
            case 'gathering':
                unit.gatherTimer -= delta;
                if (unit.gatherTimer <= 0) {
                    unit.isFull = true;
                    unit.setFillStyle(0x00BFFF);
                    unit.state = 'returningToHive';
                }
                break;
            case 'returningToHive':
                if (Phaser.Math.Distance.Between(unit.x, unit.y, this.hive.x, this.hive.y) < 60) {
                    unit.body.stop();
                    this.playerBiomass += 25;
                    this.updateBiomassText();
                    unit.isFull = false;
                    unit.setFillStyle(0xFFFFFF);
                    unit.state = 'idle';
                } else { this.physics.moveToObject(unit, this.hive, speed); }
                break;
        }
    }

    updateCombatUnitState(unit, delta) {
        const speed = 120;
        if (!unit.state || unit.state === 'idle') return;
        switch (unit.state) {
            case 'moving': this.updateUnitMovement(unit); break;
            case 'attacking':
                if (!unit.target || !unit.target.active) {
                    unit.state = 'idle';
                    return;
                }
                const distance = Phaser.Math.Distance.Between(unit.x, unit.y, unit.target.x, unit.target.y);
                if (distance < 40) {
                    unit.body.stop();
                    if (unit.attackCooldown <= 0) {
                        unit.target.getData('hp');
                        const newHP = unit.target.getData('hp') - unit.attackDamage;
                        unit.target.setData('hp', newHP);
                        if (newHP <= 0) {
                            unit.target.destroy();
                            unit.state = 'idle';
                        } else {
                            unit.target.setTint(0xff0000);
                            this.time.delayedCall(100, () => { if(unit.target.active) unit.target.clearTint(); });
                        }
                        unit.attackCooldown = 1000;
                    }
                } else { this.physics.moveToObject(unit, unit.target, speed); }
                break;
        }
        if (unit.attackCooldown > 0) unit.attackCooldown -= delta;
    }

    updateUnitMovement(unit) {
        if (unit.state === 'moving' && unit.destination) {
            if (Phaser.Math.Distance.Between(unit.x, unit.y, unit.destination.x, unit.destination.y) < 4) {
                unit.body.reset(unit.destination.x, unit.destination.y);
                unit.state = 'idle';
            } else { this.physics.moveTo(unit, unit.destination.x, unit.destination.y, 100); }
        }
    }

    handleGroundClick(pointer) {
        if (this.selectedUnit) {
            this.selectedUnit.state = 'moving';
            this.selectedUnit.destination = new Phaser.Math.Vector2(pointer.worldX, pointer.worldY);
            this.deselectUnit();
        }
    }

    commandUnitToNode(node, pointer) {
        if (this.selectedUnit && this.selectedUnit.unitType === 'harvester') {
            this.selectedUnit.state = 'movingToGather';
            this.selectedUnit.targetNode = node;
            this.deselectUnit();
        }
        pointer.stopPropagation();
    }

    commandUnitToAttack(enemy, pointer) {
        if (this.selectedUnit && this.selectedUnit.unitType === 'soldier') {
            this.selectedUnit.state = 'attacking';
            this.selectedUnit.target = enemy;
            this.deselectUnit();
        }
        pointer.stopPropagation();
    }

    createBuildButton() {
        const buttonContainer = this.add.container(610, 540);
        const button = this.add.rectangle(0, 0, 180, 40, 0x444444).setOrigin(0,0);
        const buttonText = this.add.text(10, 10, 'Build Brood Chamber (150)', { fontSize: '14px' });
        buttonContainer.add([button, buttonText]);
        button.setInteractive().on('pointerdown', () => {
            if (this.playerBiomass >= 150 && !this.broodChamberBuilt) {
                this.playerBiomass -= 150;
                this.updateBiomassText();
                this.broodChamberBuilt = true;
                this.buildBroodChamber();
                buttonContainer.destroy();
            }
        });
    }

    buildBroodChamber() {
        const broodChamber = this.add.rectangle(this.hive.x + 120, this.hive.y, 70, 70, 0x9B2226);
        this.physics.add.existing(broodChamber, true);
        this.buildings.add(broodChamber);
        broodChamber.setInteractive().on('pointerdown', () => this.spawnSoldierBeetle(broodChamber));
    }

    spawnHarvester() {
        if (this.playerBiomass >= 50) {
            this.playerBiomass -= 50;
            this.updateBiomassText();
            const harvester = this.add.rectangle(this.hive.x, this.hive.y + 60, 20, 20, 0xFFFFFF);
            this.setupUnit(harvester, { unitType: 'harvester' });
            this.harvesters.add(harvester);
        }
    }

    spawnSoldierBeetle(spawner) {
        if (this.playerBiomass >= 75) {
            this.playerBiomass -= 75;
            this.updateBiomassText();
            const beetle = this.add.rectangle(spawner.x, spawner.y + 60, 25, 25, 0xEE6C4D);
            this.setupUnit(beetle, { unitType: 'soldier', attackDamage: 8, attackCooldown: 1000 });
            this.combatUnits.add(beetle);
        }
    }

    spawnEnemy(x, y) {
        const enemy = this.physics.add.sprite(x, y, null).setSize(30, 30).setTint(0x6a0dad);
        enemy.body.immovable = true;
        this.enemies.add(enemy);
        enemy.setData({ hp: 100 });
        enemy.setInteractive().on('pointerdown', this.commandUnitToAttack.bind(this, enemy));
    }

    setupUnit(unit, data) {
        this.physics.add.existing(unit);
        unit.body.setCollideWorldBounds(true);
        unit.setInteractive().on('pointerdown', (pointer) => {
            if (this.selectedUnit === unit) this.deselectUnit();
            else { this.deselectUnit(); this.selectUnit(unit); }
            pointer.stopPropagation();
        });
        unit.unitType = data.unitType;
        unit.state = 'idle';
        if (data.attackDamage) unit.attackDamage = data.attackDamage;
        if (data.attackCooldown) unit.attackCooldown = 0;
    }

    selectUnit(unit) {
        this.selectedUnit = unit;
        this.selectedUnit.setStrokeStyle(2, 0xFFFF00);
    }

    deselectUnit() {
        if (this.selectedUnit) {
            this.selectedUnit.setStrokeStyle();
            this.selectedUnit = null;
        }
    }

    updateBiomassText() {
        this.biomassText.setText('Biomasa: ' + this.playerBiomass);
    }
}

const config = {
    type: Phaser.AUTO,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, width: 800, height: 600 },
    physics: { default: 'arcade', arcade: { debug: false } },
    scene: [GameScene]
};

const game = new Phaser.Game(config);
