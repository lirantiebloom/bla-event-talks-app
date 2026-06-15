# BigQuery Release Notes Dashboard

A modern, responsive web application that fetches, parses, and displays live Google Cloud BigQuery release notes. Built using a **Python Flask** backend and clean **Vanilla web technologies (HTML/CSS/JS)** with glassmorphism design principles.

---

## 🚀 Key Features

* **Live Data Fetching**: Retrieves real-time release updates directly from the official Google Cloud BigQuery Atom XML feed.
* **Smart XML Parsing**: Parses the feed and groups complex entries into discrete individual updates (e.g., Features, Changes, Deprecations) for easier readability.
* **Rich Dashboard Aesthetics**: Modern design with glassmorphism elements, custom layout spacing, glowing ambient backgrounds, and smooth micro-animations.
* **Advanced Search & Filtering**:
  * Real-time search across headings and text content.
  * Categories and quick-filtering chips (All, Features, Changes, Deprecations).
* **Live Update Metrics**: At-a-glance stats count for different types of release updates.
* **X (Twitter) Sharing Integration**: Built-in interactive tweet preview modal with a character counter (limit 280 chars) to quickly craft and share updates.
* **Clean API**: Provides a JSON endpoint (`/api/releases`) that can be consumed by other services.

---

## 📁 Project Structure

```text
├── app.py                 # Flask server and XML parser
├── .gitignore             # Git ignore file (virtualenvs, cache, etc.)
├── news.txt               # Input/Output document (utility/notes)
├── summary.txt            # Parsed summary notes
├── static/
│   ├── css/
│   │   └── style.css      # Core styles & variables (glassmorphism UI)
│   └── js/
│       └── app.js         # Frontend application logic, state, and sharing
└── templates/
    └── index.html         # Main dashboard template
```

---

## 🛠️ Getting Started

### 1. Prerequisites
Ensure you have Python 3.x installed on your machine.

### 2. Installation
Clone this repository and navigate to the project directory:
```bash
git clone https://github.com/lirantiebloom/bla-event-talks-app.git
cd bla-event-talks-app
```

Create a virtual environment and activate it:
```bash
# Create virtual environment
python3 -m venv .venv

# Activate on macOS/Linux
source .venv/bin/activate

# Activate on Windows
.venv\Scripts\activate
```

Install Flask:
```bash
pip install Flask
```

### 3. Running the App
Run the Flask server:
```bash
python app.py
```
The application will start in debug mode on **[http://127.0.0.1:5001](http://127.0.0.1:5001)**.

---

## 🔌 API Documentation

### Get Release Notes
Returns a structured list of all parsed release notes.

* **Endpoint**: `/api/releases`
* **Method**: `GET`
* **Response Format**: `JSON`

#### Example Response:
```json
[
  {
    "date": "June 15, 2026",
    "updated": "2026-06-15T12:00:00Z",
    "link": "https://cloud.google.com/bigquery/docs/release-notes",
    "updates": [
      {
        "id": "June_15,_2026_0",
        "type": "Feature",
        "body": "<p>BigQuery now supports new functionality...</p>",
        "plain_text": "BigQuery now supports new functionality..."
      }
    ]
  }
]
```

---

## 🖥️ Styling & UI Guidelines

* **Colors**: Curated dark-theme gradients using high-contrast slate, deep purples, and vibrant accents (emerald greens, warm ambers, cool blues).
* **Typography**: Outfitted with *Outfit* and *Plus Jakarta Sans* from Google Fonts.
* **Icons**: Powered by Lucide icons (`data-lucide` attributes) dynamically rendered on page load.
