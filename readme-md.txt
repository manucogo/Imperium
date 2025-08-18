# IMPERIUM Crosstraining Website

Sitio web moderno para IMPERIUM Crosstraining, un gimnasio especializado en entrenamiento funcional.

## Estructura de Archivos

```
imperium-website/
├── index.html
├── css/
│   └── styles.css
├── js/
│   └── script.js
└── img/
    ├── logo_color.png
    ├── hero-bg.jpg
    ├── grupal.jpeg
    ├── coach.jpeg
    ├── coach2.jpg
    ├── ruben.jpg
    ├── testimonial1.jpg
    ├── testimonial2.jpg
    ├── testimonial3.jpg
    ├── gallery1.jpg
    ├── gallery2.jpg
    ├── gallery3.jpg
    ├── gallery4.jpg
    ├── gallery5.jpg
    ├── gallery6.jpg
    ├── blog1.jpg
    ├── blog2.jpg
    ├── blog3.jpg
    └── app-mockup.jpg
```

## Descripción de Archivos

### HTML

- **index.html**: Documento principal que contiene toda la estructura del sitio web.

### CSS

- **styles.css**: Archivo CSS principal que contiene todos los estilos del sitio. Por su extensión, se ha dividido en 4 partes para facilitar su mantenimiento:
  - Parte 1: Variables, estilos generales, header, hero, sección about y servicios
  - Parte 2: Trainers, horarios, precios, testimonios, galería y blog
  - Parte 3: Sección app, contacto, newsletter, mapa y footer
  - Parte 4: Animaciones, modo oscuro y media queries

### JavaScript

- **script.js**: Contiene todas las funcionalidades interactivas:
  - Inicialización de AOS (Animate on Scroll)
  - Efecto de scroll en el header
  - Toggle del menú móvil
  - Cambio de tema claro/oscuro
  - Scroll suave para enlaces internos
  - Activación de navegación según sección visible
  - Tabs de horarios
  - Toggle de precios mensual/anual
  - Filtros de galería
  - Slider de testimonios
  - Animación de counters
  - Validación de formularios

### Imágenes

- **logo_color.png**: Logo de IMPERIUM Crosstraining
- **hero-bg.jpg**: Imagen de fondo para la sección hero
- Imágenes para las distintas secciones del sitio

## Características del Sitio

1. **Diseño Responsivo**: Se adapta a todos los tamaños de pantalla
2. **Modo Oscuro**: Permite al usuario cambiar entre tema claro y oscuro
3. **Animaciones AOS**: Animaciones al hacer scroll
4. **Navegación Interactiva**: Resalta la sección actual durante el scroll
5. **Tabs de Horarios**: Permite ver los horarios por día de la semana
6. **Toggle de Precios**: Muestra precios mensuales o anuales
7. **Filtros de Galería**: Filtra imágenes por categoría
8. **Slider de Testimonios**: Muestra testimonios de clientes
9. **Formularios Validados**: Validación de formularios de contacto y newsletter
10. **Integración de Mapa**: Muestra la ubicación del gimnasio

## Tecnologías Utilizadas

- HTML5
- CSS3 (Variables CSS, Flexbox, Grid, Animaciones)
- JavaScript (ES6)
- Font Awesome (iconos)
- AOS - Animate on Scroll (animaciones)
- Google Maps (mapa)

## Instrucciones de Implementación

1. Descarga todos los archivos manteniendo la estructura de carpetas
2. Reemplaza las imágenes en la carpeta img/ con las imágenes reales
3. Actualiza la información de contacto y ubicación en el HTML
4. Sube los archivos a tu servidor web

## Personalización

El sitio está diseñado para ser fácilmente personalizable:

- Las variables de color están definidas al inicio del archivo CSS para cambiar la paleta de colores
- Las fuentes pueden ser modificadas cambiando las variables --body-font y --heading-font
- Las imágenes pueden ser reemplazadas manteniendo los mismos nombres de archivo
