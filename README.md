# Darwin Content Manager

Herramienta interna para generar posts de redes sociales a partir de inspiración externa, usando LLMs para texto e imágenes. Aprende del feedback del equipo y adapta el estilo a la voz de la marca con el tiempo.

---

## Cómo funciona

1. **Inspiración** — pegás texto o subís una imagen de referencia (un post de la competencia, una noticia, una tendencia)
2. **Extracción de concepto** — el LLM analiza la inspiración e identifica el mensaje central, tono y formato
3. **Generación** — arma un post adaptado al estilo de Darwin AI usando tres capas de contexto:
   - Prompt base de marca (editable desde `/brand`)
   - Corpus de posts propios como ejemplos de estilo (few-shot)
   - Preferencias aprendidas del historial de feedback
4. **Feedback** — aprobás o rechazás el resultado (con razón opcional)
5. **Aprendizaje** — cada 5 feedbacks, el sistema re-sintetiza automáticamente las preferencias del equipo y las incorpora en futuras generaciones

---

## Stack

### Backend
| Tecnología | Versión |
|-----------|---------|
| Python | 3.12.10 |
| FastAPI | 0.115.5 |
| Uvicorn | 0.32.1 |
| SQLAlchemy | 2.0.36 |
| Pydantic | 2.10.3 |
| pydantic-settings | 2.6.1 |
| OpenAI SDK | 1.57.2 |
| Anthropic SDK | 0.40.0 |
| google-genai | 1.9.0 |
| python-dotenv | 1.0.1 |
| aiofiles | 24.1.0 |
| python-multipart | 0.0.17 |

### Frontend
| Tecnología | Versión |
|-----------|---------|
| Node.js | 22.14.0 |
| npm | 11.2.0 |
| Next.js | 16.2.9 |
| React | 19.2.4 |
| TypeScript | ^5 |
| Tailwind CSS | ^4 |

### Base de datos
- SQLite (archivo en `data/app.db`, se crea automáticamente al iniciar)

---

## Requisitos previos

- Python **3.12+** (se recomienda usar el Python Launcher: `py -3.12`)
- Node.js **22+**
- Al menos una API key de proveedor de texto (OpenAI **o** Anthropic)
- API key de Gemini para generación de imágenes

---

## Instalación

### 1. Clonar y preparar variables de entorno

```bash
# Copiar el archivo de ejemplo
cp .env.example .env
```

Editá `.env` con tus keys:

```env
# Proveedor de texto: "openai" o "anthropic"
TEXT_PROVIDER=openai

# Proveedor de imagen (solo opción disponible)
IMAGE_PROVIDER=gemini

# API keys
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=AIza...
```

### 2. Backend

```bash
cd backend

# Crear entorno virtual con Python 3.12
py -3.12 -m venv .venv

# Activar (Windows)
.venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt

# Cargar corpus inicial en la DB (solo la primera vez)
python seed_corpus.py
```

### 3. Frontend

```bash
cd frontend
npm install
```

---

## Correr el proyecto

Abrí **dos terminales** desde la raíz del proyecto:

**Terminal 1 — Backend**
```bash
cd backend
.venv\Scripts\uvicorn main:app --reload
```
El backend queda en `http://localhost:8000`.  
Docs de la API disponibles en `http://localhost:8000/docs`.

**Terminal 2 — Frontend**
```bash
cd frontend
npm run dev
```
La app queda en `http://localhost:3000`.

> El servidor crea la base de datos automáticamente en `data/app.db` al primer arranque. Si cambiás el schema de modelos, borrá ese archivo para que se recree.

---

## Estructura del proyecto

```
darwin-content-manager/
├── backend/
│   ├── main.py                  # Entry point FastAPI
│   ├── database.py              # Conexión SQLite / SQLAlchemy
│   ├── seed_corpus.py           # Script de carga inicial del corpus
│   ├── requirements.txt
│   ├── models/
│   │   └── models.py            # Tablas: Generation, BrandCorpus, BrandConfig
│   ├── routers/
│   │   ├── generate.py          # POST /api/generate
│   │   ├── feedback.py          # POST /api/feedback  (+ síntesis automática)
│   │   ├── inspo.py             # POST /api/inspo/upload
│   │   └── brand.py             # GET/PUT /api/brand/config, /api/brand/corpus
│   ├── services/
│   │   ├── concept_extractor.py # Extrae concepto de la inspiración
│   │   ├── prompt_builder.py    # Arma el prompt con 3 capas de contexto
│   │   └── feedback_synthesizer.py  # Genera resumen de preferencias
│   └── providers/
│       ├── text_provider.py         # Interfaz abstracta de texto
│       ├── openai_provider.py       # GPT-4o (texto + visión)
│       ├── anthropic_provider.py    # Claude (texto + visión)
│       └── gemini_image_provider.py # Gemini 2.0 Flash (imágenes)
├── frontend/
│   ├── app/
│   │   ├── page.tsx             # /  →  Generar post
│   │   ├── history/page.tsx     # /history  →  Historial de generaciones
│   │   └── brand/page.tsx       # /brand  →  Corpus + prompt base
│   ├── components/
│   │   └── Nav.tsx
│   └── lib/
│       ├── api.ts               # Funciones de fetch al backend
│       └── types.ts             # Tipos compartidos
├── corpus_inicial/
│   ├── corpus-data.json         # Posts de referencia (LinkedIn + Instagram)
│   ├── instagram/               # Imágenes de posts de Instagram
│   └── linkedin/                # Imágenes de posts de LinkedIn
├── data/                        # DB SQLite (generada automáticamente)
├── storage/
│   ├── uploads/                 # Imágenes de inspiración subidas por el usuario
│   └── generated/               # Imágenes generadas por Gemini
└── .env                         # Variables de entorno (no commitear)
```

---

## Uso de la app

### Generar un post (`/`)

1. En **Inspiración**, pegá el texto de un post de referencia o subí una imagen
2. Podés agregar múltiples referencias con **Agregar referencia**
3. Opcionalmente, expandí **Agregar comentario** para dar indicaciones específicas ("tono más formal", "mencioná el producto X")
4. Seleccioná el tipo de output: **Texto**, **Imagen**, o **Ambos**
5. Hacé clic en **Generar →**
6. Revisá el resultado y **Aprobá** o **Rechazá** (con razón opcional)

### Historial (`/history`)

Muestra todas las generaciones anteriores con su estado (pendiente / aprobado / rechazado) y la razón de rechazo si la hay.

### Brand (`/brand`)

- **Prompt base**: instrucciones globales de estilo y voz de marca que se inyectan en cada generación. Editables en cualquier momento.
- **Preferencias aprendidas**: síntesis automática generada a partir del historial de feedback. Se actualiza cada 5 decisiones.
- **Corpus de marca**: los posts de referencia que se usan como ejemplos de estilo (few-shot). Podés agregar posts manualmente o usar `python seed_corpus.py --reset` para recargar desde el JSON inicial.

---

## Comandos útiles

```bash
# Recargar corpus desde cero
cd backend && python seed_corpus.py --reset

# Ver logs del backend en tiempo real
cd backend && .venv\Scripts\uvicorn main:app --reload --log-level debug

# Borrar la DB y empezar de cero
del data\app.db
cd backend && python seed_corpus.py
```
