import { Start } from './scenes/Start.js';
import { AuthSceneHTML } from './scenes/AuthSceneHTML.js';
import { IsometricMap } from './scenes/IsometricMap.js';
import { ExplorationMap } from './scenes/ExplorationMap.js';

const config = {
    type: Phaser.AUTO,
    width: 1280,
    height: 720,
    backgroundColor: '#000000',
    pixelArt: true,
    parent: 'game-container', // Especificar el contenedor
    scene: [AuthSceneHTML, ExplorationMap, IsometricMap], // Empezar con autenticación HTML
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    }
};

const game = new Phaser.Game(config);










