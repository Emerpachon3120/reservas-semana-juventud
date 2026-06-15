# Semana de Ciencia, Tecnología, Innovación y Juventud · Sistema de reservas

Alcaldía Municipal de Nemocón.

Aplicación web (sin frameworks ni build) para que instituciones,
universidades y empresas registren actividades durante la Semana de
la Juventud (14–18 de septiembre, 8:00 a.m. a 12:00 m.) en uno de tres
lugares con aforo limitado, evitando cruces de horario y respetando los
ejes temáticos de cada día.

Esta es la versión **refactorizada**: misma apariencia y comportamiento
que la versión original de un solo archivo, reorganizada en módulos
ES6 con responsabilidades separadas.

## Árbol del proyecto

```
src/
├── index.html                  Punto de entrada (HTML + carga de módulos)
├── app.js                      Orquestador: router de pestañas, inicialización,
│                                puente entre HTML dinámico y los módulos
├── assets/
│   └── css/
│       └── styles.css          Todos los estilos (idénticos al original)
├── config/
│   └── constants.js             Días, horas, lugares, categorías, tipos,
│                                 cupo máximo, claves — configuración única
├── utils/
│   ├── dom.js                   Atajo $() de querySelector
│   └── text.js                  norm() y esc() — normalización y escape HTML
├── services/
│   ├── storageService.js        Acceso a almacenamiento (con fallback a
│   │                             localStorage fuera de Claude.ai)
│   └── reservasService.js       Reglas de negocio puras: ocupación de
│                                 espacios, cupo por institución, contadores
├── components/
│   └── calendar.js               Componente de calendario reutilizable
│                                  (modo "lectura" para Cronograma y modo
│                                  "seleccion" para el wizard de Reservar)
└── modules/
    ├── state.js                  Estado global compartido (reservas, vista,
    │                              sesión de administración)
    ├── wizard.js                 Módulo "Reservar": asistente de 4 pasos
    ├── cronograma.js              Módulo "Cronograma": vista pública
    └── admin.js                   Módulo "Administración": validación, CSV
```

## Cómo ejecutarlo

Los módulos ES6 (`import`/`export`) requieren servir los archivos por
HTTP; no funcionan abriendo `index.html` con doble clic (`file://`).

Desde la carpeta `src/`, cualquiera de estas opciones funciona:

```bash
# Opción 1: con Node
npx serve .

# Opción 2: con Python
python3 -m http.server 8080
```

Luego abre `http://localhost:8080` (o el puerto que indique la
herramienta) en el navegador.

## Almacenamiento de datos: Firebase Firestore

Esta versión guarda las reservas en **Firebase Firestore** (proyecto
`semana-juventud`), una base de datos en la nube con plan gratuito.
Cada reserva es un documento independiente en la colección
`reservas`, así que varias instituciones pueden escribir al mismo
tiempo sin pisarse entre sí.

Las credenciales en `services/storageService.js` (`FIREBASE_CONFIG`)
son **públicas por diseño** — el control de acceso real lo hacen las
**reglas de seguridad** de Firestore, no esas claves.

### Reglas de seguridad recomendadas

En Firebase Console → Firestore Database → pestaña **Reglas**, pega:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /reservas/{reservaId} {
      // Cualquiera puede leer (cronograma público) y crear una reserva.
      allow read, create: if true;

      // Solo se permite actualizar el campo "estado" (validación de
      // administración) o eliminar el documento completo.
      allow update: if request.resource.data.diff(resource.data)
                      .affectedKeys().hasOnly(['estado']);
      allow delete: if true;
    }
  }
}
```

Esto permite que cualquiera registre actividades y vea el cronograma,
pero limita las ediciones posteriores a cambiar el campo `estado`
(lo que hace el panel de Administración). Es una protección básica:
no sustituye un login real, pero evita que alguien reescriba por
completo los datos de otra institución desde la consola del
navegador. Si más adelante quieres reforzarlo, el siguiente paso es
añadir **Firebase Authentication** y exigir que solo un usuario
autenticado como administrador pueda hacer `update`/`delete`.

## Publicar en GitHub Pages

1. Crea un repositorio nuevo en GitHub (público, para Pages gratis).
2. Sube **el contenido de esta carpeta `src/`** a la raíz del
   repositorio (es decir, `index.html`, `app.js`, `assets/`, etc.
   deben quedar en la raíz, no dentro de una subcarpeta `src/`).
3. Ve a **Settings → Pages**, en "Source" elige la rama `main` y la
   carpeta `/ (root)`, y guarda.
4. Espera 1–2 minutos; GitHub mostrará la URL pública, algo como
   `https://tu-usuario.github.io/nombre-del-repo/`.
5. Comparte esa URL con las instituciones. Todas verán y escribirán
   sobre la misma base de datos de Firestore en tiempo real.

## Reglas de negocio (config/constants.js)

- Lunes 14: bloqueado, jornada de Inauguración.
- Martes 15: categorías Gaming + Inteligencia Artificial.
- Miércoles 16: categorías Deporte + Creación Digital.
- Jueves 17: categorías Futuro y Tecnología + Medio Ambiente.
- Viernes 18: todas las categorías.
- Lugares: Teatrino Municipal (120), Biblioteca El Futuro (35),
  Biblioteca Ricardo Moros (35).
- Máximo 3 actividades por institución durante toda la semana.
- Estados de una reserva: `parcial` (Confirmado parcialmente) →
  `aprobado` (Confirmado) o `ajuste` (Requiere ajuste), gestionados
  desde Administración (clave: `juventud2026`).

## Mejoras futuras sugeridas

- **Backend real**: migrar `storageService.js` a una API con base de
  datos para que el panel de administración no dependa de
  `localStorage`/`window.storage` y se pueda auditar quién hizo qué
  cambio.
- **Autenticación por institución**: hoy cualquiera puede ver/editar
  cualquier reserva; un login por institución permitiría restringir
  ediciones a sus propios registros.
- **Notificaciones**: enviar correo/SMS automático cuando la
  administración apruebe o marque "Requiere ajuste" una actividad.
- **Pruebas automatizadas**: el archivo `test.js` (incluido en el
  paquete de desarrollo) ya cubre el flujo completo con jsdom; se
  puede formalizar con un runner como Vitest o Jest.
- **Internacionalización**: si el evento se repite en otros contextos,
  extraer los textos de `modules/*.js` a un archivo de traducciones.
- **Accesibilidad**: el calendario usa `aria-label` en los botones de
  selección; se podría añadir navegación completa por teclado en la
  tabla y anuncios `aria-live` al confirmar una reserva.
