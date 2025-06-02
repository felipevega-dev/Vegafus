import { Grid } from '../classes/Grid.js';

export class IsometricMap extends Phaser.Scene {
    constructor() {
        super('IsometricMap');
    }

    preload() {
        // Cargar tileset isométrico (necesitarás crear o conseguir estos assets)
        this.load.image('iso-grass', 'assets/images/tiles/iso-grass.png');
        this.load.image('iso-water', 'assets/images/tiles/iso-water.png');
        this.load.image('iso-stone', 'assets/images/tiles/iso-stone.png');

        // Cargar sprite del personaje
        this.load.spritesheet('character', 'assets/images/characters/character.png', {
            frameWidth: 64,
            frameHeight: 64
        });
    }

    create() {
        // Crear sistema de grid
        this.grid = new Grid(this, 10, 10);

        // Crear mapa simple
        this.createMap();

        // Añadir personaje
        this.createPlayer();

        // Configurar cámara
        this.cameras.main.setBounds(0, 0, 1280, 720);
        this.cameras.main.startFollow(this.player);
    }
    createMap() {
        // Implementación básica - se mejorará después
        const tileWidth = 64;
        const tileHeight = 32;

        for (let y = 0; y < 10; y++) {
            for (let x = 0; x < 10; x++) {
                // Convertir coordenadas de grid a isométricas
                const isoX = (x - y) * tileWidth / 2;
                const isoY = (x + y) * tileHeight / 2;

                // Elegir tile aleatorio para demostración
                const tileType = Phaser.Math.Between(0, 10) > 8 ? 'iso-water' :
                                (Phaser.Math.Between(0, 10) > 7 ? 'iso-stone' : 'iso-grass');

                // Añadir tile al mapa
                const tile = this.add.image(640 + isoX, 300 + isoY, tileType);
                tile.setDepth(isoY); // Para correcto ordenamiento de capas
            }
        }
    }

    createPlayer() {
        // Posición inicial del jugador
        const startX = 640;
        const startY = 300;

        // Crear sprite del jugador
        this.player = this.add.sprite(startX, startY, 'character');
        this.player.setDepth(startY + 1); // Para que aparezca sobre los tiles
    }
}






























