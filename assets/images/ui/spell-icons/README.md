# Iconos de Hechizos

Esta carpeta contiene los iconos para todos los hechizos del juego.

## Estructura de Carpetas

```
assets/images/ui/spell-icons/
├── warrior/          # Iconos de hechizos del guerrero
│   ├── golpe_telurico.png
│   ├── llama_ardiente.png
│   ├── tormenta_helada.png
│   └── viento_cortante.png
├── mage/             # Iconos de hechizos del mago
│   ├── terremoto.png
│   ├── bola_de_fuego.png
│   ├── rayo_de_hielo.png
│   └── tormenta_electrica.png
└── archer/           # Iconos de hechizos del arquero
    ├── flecha_rocosa.png
    ├── flecha_explosiva.png
    ├── flecha_de_hielo.png
    └── flecha_del_viento.png
```

## Especificaciones de Iconos

- **Tamaño recomendado**: 64x64 píxeles
- **Formato**: PNG con transparencia
- **Estilo**: Iconos coloridos que representen el elemento del hechizo
- **Colores por elemento**:
  - 🟤 **Tierra**: Tonos marrones y dorados
  - 🔴 **Fuego**: Tonos rojos y naranjas
  - 🔵 **Agua**: Tonos azules y cianes
  - ⚪ **Aire**: Tonos grises y blancos

## Uso en el Código

Los iconos se cargan automáticamente en el juego. Si un icono no existe, el juego continuará funcionando mostrando un círculo de color elemental.

## Cómo Agregar Iconos

1. Coloca tus archivos PNG en la carpeta correspondiente a la clase
2. Asegúrate de que el nombre del archivo coincida exactamente con el especificado en el código
3. El juego cargará automáticamente los iconos disponibles

## Iconos Requeridos

### Guerrero (Warrior)
- `golpe_telurico.png` - Hechizo de tierra
- `llama_ardiente.png` - Hechizo de fuego  
- `tormenta_helada.png` - Hechizo de agua
- `viento_cortante.png` - Hechizo de aire

### Mago (Mage)
- `terremoto.png` - Hechizo de tierra
- `bola_de_fuego.png` - Hechizo de fuego
- `rayo_de_hielo.png` - Hechizo de agua
- `tormenta_electrica.png` - Hechizo de aire

### Arquero (Archer)
- `flecha_rocosa.png` - Hechizo de tierra
- `flecha_explosiva.png` - Hechizo de fuego
- `flecha_de_hielo.png` - Hechizo de agua
- `flecha_del_viento.png` - Hechizo de aire

## Fallback

Si un icono no está disponible, el juego mostrará un círculo de color elemental como respaldo:
- 🟤 Tierra: Marrón (#8B4513)
- 🔴 Fuego: Rojo (#FF4400)
- 🔵 Agua: Cian (#00FFFF)
- ⚪ Aire: Gris claro (#CCCCCC)
