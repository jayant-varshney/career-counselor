# CareerAI – AI-Powered Career Counseling Companion

> **IBM Granite × watsonx.ai × Flask**
> A fully personalized, AI-driven career counseling web application powered by IBM Granite on IBM watsonx.ai.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🤖 AI Chat | Real-time career guidance chat via IBM Granite |
| 👤 Student Profile | Name, education, interests, skills, career goal |
| 🗺️ Career Roadmap | 4-phase personalized roadmap (Foundation → Job Ready) |
| 🏆 Certifications | Top 6 recommended certs with provider & difficulty |
| 🛠️ Technical Skills | Must-have, nice-to-have, emerging skills with resources |
| 💻 Project Ideas | 5 portfolio-ready project suggestions with tech stack |
| 📄 Resume Tips | ATS-optimized resume improvement guide |
| 🎤 Interview Prep | Technical + behavioral questions with STAR-method tips |
| 📊 Dashboard | Career summary: top roles, skill match, next steps |

---

## 🗂️ Project Structure

```
career-counselor/
├── app.py                  # Flask backend + IBM watsonx.ai integration
├── requirements.txt        # Python dependencies
├── .env                    # API keys (never commit this!)
├── .gitignore
├── templates/
│   └── index.html          # Single-page frontend
└── static/
    ├── css/
    │   └── style.css       # Dark professional UI styles
    └── js/
        └── main.js         # Frontend logic & API calls
```

---

## ⚙️ Prerequisites

- Python 3.10+
- IBM Cloud account — [ibm.com/cloud](https://www.ibm.com/cloud)
- IBM watsonx.ai access — [dataplatform.cloud.ibm.com](https://dataplatform.cloud.ibm.com)
- An active watsonx.ai **Project**

---

## 🔑 IBM Cloud Setup

### 1. Create an IBM Cloud API Key

1. Go to [IBM Cloud Console → Manage → Access (IAM) → API Keys](https://cloud.ibm.com/iam/apikeys)
2. Click **Create an IBM Cloud API key**
3. Copy and save the key — you will not see it again

### 2. Get your watsonx.ai Project ID

1. Open [IBM watsonx.ai](https://dataplatform.cloud.ibm.com)
2. Create or open an existing project
3. Go to **Manage → General** tab
4. Copy the **Project ID**

### 3. Configure `.env`

Open `career-counselor/.env` and fill in your credentials:

```env
IBM_API_KEY=your_ibm_cloud_api_key_here
WATSONX_PROJECT_ID=your_watsonx_project_id_here
WATSONX_URL=https://us-south.ml.cloud.ibm.com
```

> **Note:** Change `us-south` to your region if your watsonx instance is in a different region
> (e.g., `eu-de.ml.cloud.ibm.com` for Frankfurt, `jp-tok.ml.cloud.ibm.com` for Tokyo).

---

## 🚀 Local Development

### 1. Clone or download the project

```bash
cd career-counselor
```

### 2. Create a virtual environment

```bash
python3 -m venv venv
source venv/bin/activate        # macOS / Linux
venv\Scripts\activate           # Windows
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Run the application

```bash
python app.py
```

The app will be available at **http://localhost:5000**

---

## 🌐 Deployment

### Option A – Gunicorn (Linux / macOS production)

```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

### Option B – IBM Code Engine

1. Build a container image (or use `gunicorn` as the entrypoint)
2. Push to IBM Container Registry
3. Deploy as a **Code Engine Application**
4. Set environment variables (IBM_API_KEY, WATSONX_PROJECT_ID, WATSONX_URL) in the Code Engine console

```bash
# Example Dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY . .
RUN pip install --no-cache-dir -r requirements.txt
EXPOSE 5000
CMD ["gunicorn", "-w", "2", "-b", "0.0.0.0:5000", "app:app"]
```

### Option C – Heroku / Render / Railway

1. Add a `Procfile`:
   ```
   web: gunicorn app:app
   ```
2. Set env vars via the platform's dashboard
3. Deploy via Git push

### Option D – Docker (local)

```bash
docker build -t careerai .
docker run -p 5000:5000 \
  -e IBM_API_KEY=your_key \
  -e WATSONX_PROJECT_ID=your_project_id \
  -e WATSONX_URL=https://us-south.ml.cloud.ibm.com \
  careerai
```

---

## 🧠 Customizing the AI (AGENT_INSTRUCTIONS)

The AI agent's personality, tone, and output format are controlled by the `AGENT_INSTRUCTIONS` constant at the top of `app.py`:

```python
AGENT_INSTRUCTIONS = """
You are CareerAI, an expert career counseling companion...
"""
```

Edit this block to:
- Change the AI's name or persona
- Add or remove capabilities
- Adjust response length/format
- Target specific industries or regions

---

## 🔧 Configuration Reference

| Variable | Description | Default |
|---|---|---|
| `IBM_API_KEY` | IBM Cloud API Key | — |
| `WATSONX_PROJECT_ID` | watsonx.ai Project ID | — |
| `WATSONX_URL` | watsonx.ai endpoint URL | `https://us-south.ml.cloud.ibm.com` |

### Model Configuration (in `app.py`)

```python
GRANITE_MODEL_ID = "ibm/granite-3-3-8b-instruct"   # Change to granite-13b for larger model
```

Available IBM Granite models:
- `ibm/granite-3-3-8b-instruct` — Fast, cost-effective (default)
- `ibm/granite-13b-instruct-v2` — Larger, more detailed responses
- `ibm/granite-20b-multilingual` — Multi-language support

---

## 🛡️ Security Notes

- **Never commit `.env`** to version control — it is listed in `.gitignore`
- Rotate your IBM Cloud API key regularly
- In production, use IBM Cloud Secrets Manager or environment-level secret injection
- Enable CORS restrictions in `app.py` for production deployments

---

## 📋 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/chat` | General AI career chat |
| `POST` | `/api/dashboard` | Career dashboard summary |
| `POST` | `/api/roadmap` | Personalized career roadmap |
| `POST` | `/api/certifications` | Recommended certifications |
| `POST` | `/api/skills` | Technical skills guide |
| `POST` | `/api/projects` | Project suggestions |
| `POST` | `/api/resume` | Resume improvement tips |
| `POST` | `/api/interview` | Interview preparation guide |

All endpoints accept a JSON body:
```json
{
  "profile": {
    "name": "Priya Sharma",
    "education": "Bachelor's Degree – Computer Science",
    "interests": "Machine Learning, Data Science",
    "skills": "Python, SQL, Pandas",
    "careerGoal": "AI/ML Engineer"
  },
  "message": "What should I learn next?"  // (chat endpoint only)
}
```

---

## 🧩 Tech Stack

| Layer | Technology |
|---|---|
| AI Model | IBM Granite 3.3 8B Instruct |
| AI Platform | IBM watsonx.ai |
| Backend | Python 3.11 + Flask 3.0 |
| Frontend | HTML5 + CSS3 + Bootstrap 5.3 |
| Icons | Bootstrap Icons 1.11 |
| Auth | IBM Cloud IAM (API Key) |

---

## 📄 License

MIT License — free to use, modify, and distribute.

---

*Built with ❤️ using IBM Granite on IBM watsonx.ai*
