import { Start } from './scenes/Start.js';
import { IsometricMap } from './scenes/IsometricMap.js';
const config = {    type: Phaser.AUTO,
    width: 1280,    height: 720,
    backgroundColor: '#000000',    pixelArt: true,
    scene: [Start, IsometricMap],    physics: {
        default: 'arcade',        arcade: {
            debug: false        }
    }};

const game = new Phaser.Game(config);










