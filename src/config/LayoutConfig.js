/**
 * Configuración centralizada del layout del juego
 */
export const LayoutConfig = {
    // Dimensiones del juego
    GAME_WIDTH: 1280,
    GAME_HEIGHT: 720,
    
    // Áreas principales
    GAME_AREA: {
        x: 0,
        y: 0,
        width: 1000,
        height: 720
    },

    // Panel lateral derecho
    RIGHT_PANEL: {
        x: 1000,
        y: 0,
        width: 280,
        height: 720,
        
        // Posiciones específicas dentro del panel
        MENU_BUTTONS: {
            x: 1140,
            startY: 120,
            spacing: 45,
            width: 240,
            height: 35
        },

        CONTENT_AREA: {
            x: 1140,
            y: 450,
            width: 240,
            height: 250
        }
    },
    
    // Panel superior
    TOP_PANEL: {
        x: 0,
        y: 0,
        width: 1000,
        height: 100,
        
        // Elementos específicos
        PLAYER_INFO: {
            x: 120,
            y: 40
        },
        
        CHARACTERISTICS_BTN: {
            x: 120,
            y: 80
        },
        
        USER_INFO: {
            x: 1100,
            y: 20
        },
        
        LOGOUT_BTN: {
            x: 1200,
            y: 40
        }
    },
    
    // Panel inferior (para futuro chat, hechizos, etc.)
    BOTTOM_PANEL: {
        x: 0,
        y: 620,
        width: 1000,
        height: 100
    },
    
    // Profundidades (z-index)
    DEPTHS: {
        BACKGROUND: 0,
        GAME_OBJECTS: 100,
        UI_BACKGROUND: 1000,
        UI_ELEMENTS: 1001,
        UI_TEXT: 1002,
        MODAL_BACKGROUND: 2000,
        MODAL_ELEMENTS: 2001,
        TOOLTIP: 3000
    },
    
    // Colores del tema
    COLORS: {
        PANEL_BG: 0x1a1a1a,
        PANEL_BORDER: 0x666666,
        BUTTON_BG: 0x2d2d2d,
        BUTTON_HOVER: 0x404040,
        BUTTON_ACTIVE: 0x555500,
        TEXT_PRIMARY: '#ffffff',
        TEXT_SECONDARY: '#cccccc',
        TEXT_ACCENT: '#ffdd00',
        TEXT_ERROR: '#ff4444',
        TEXT_SUCCESS: '#00ff00'
    },
    
    // Estilos de texto
    TEXT_STYLES: {
        TITLE: {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        },
        
        SUBTITLE: {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        },
        
        BUTTON: {
            fontSize: '12px',
            fontFamily: 'Arial',
            color: '#ffffff'
        },
        
        SMALL_BUTTON: {
            fontSize: '11px',
            fontFamily: 'Arial',
            color: '#ffffff'
        },
        
        BODY: {
            fontSize: '12px',
            fontFamily: 'Arial',
            color: '#cccccc'
        },
        
        SMALL: {
            fontSize: '10px',
            fontFamily: 'Arial',
            color: '#888888'
        }
    }
};

/**
 * Utilidades para el layout
 */
export class LayoutUtils {
    
    /**
     * Verifica si una posición está dentro del área de juego
     */
    static isInGameArea(x, y) {
        const area = LayoutConfig.GAME_AREA;
        return x >= area.x && x <= area.x + area.width && 
               y >= area.y && y <= area.y + area.height;
    }
    
    /**
     * Verifica si una posición está dentro del panel derecho
     */
    static isInRightPanel(x, y) {
        const panel = LayoutConfig.RIGHT_PANEL;
        return x >= panel.x && x <= panel.x + panel.width && 
               y >= panel.y && y <= panel.y + panel.height;
    }
    
    /**
     * Obtiene la posición de un botón del menú por índice
     */
    static getMenuButtonPosition(index) {
        const buttons = LayoutConfig.RIGHT_PANEL.MENU_BUTTONS;
        return {
            x: buttons.x,
            y: buttons.startY + (index * buttons.spacing)
        };
    }
    
    /**
     * Crea un estilo de texto combinando el base con overrides
     */
    static createTextStyle(baseStyle, overrides = {}) {
        return { ...LayoutConfig.TEXT_STYLES[baseStyle], ...overrides };
    }
    
    /**
     * Obtiene las dimensiones responsivas basadas en el tamaño de pantalla
     */
    static getResponsiveDimensions(screenWidth, screenHeight) {
        // Para futuro soporte de diferentes resoluciones
        if (screenWidth >= 1920) {
            return {
                scale: 1.5,
                gameWidth: 1920,
                gameHeight: 1080
            };
        }
        
        return {
            scale: 1,
            gameWidth: LayoutConfig.GAME_WIDTH,
            gameHeight: LayoutConfig.GAME_HEIGHT
        };
    }
}
