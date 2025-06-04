import Phaser from 'phaser';
import { AuthSceneHTML } from '@scenes/AuthSceneHTML.js';
import { IsometricMap } from '@scenes/IsometricMap.js';
import { IsometricMapRefactored } from '@scenes/IsometricMapRefactored.js';
import { ExplorationMap } from '@scenes/ExplorationMap.js';
import { ExplorationMapRefactored } from '@scenes/ExplorationMapRefactored.js';
import { Combat } from '@scenes/Combat.js';
import { CharacteristicsScene } from '@scenes/CharacteristicsScene.js';
import { CharacterSelectionScene } from '@scenes/CharacterSelectionScene.js';
import { CharacterCreationScene } from '@scenes/CharacterCreationScene.js';

const config = {
    type: Phaser.AUTO,
    width: 1280,
    height: 720,
    backgroundColor: '#000000',
    pixelArt: true,
    parent: 'game-container', // Especificar el contenedor
    scene: [AuthSceneHTML, CharacterSelectionScene, CharacterCreationScene, 
        ExplorationMap, ExplorationMapRefactored, IsometricMap, 
        IsometricMapRefactored, Combat, CharacteristicsScene], // Empezar con autenticación HTML
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    }
};

// Inicializar el juego
new Phaser.Game(config);
