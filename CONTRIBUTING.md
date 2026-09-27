# 🤝 Contributing to RebelRoutes India

Thank you for your interest in contributing to **RebelRoutes India**! Every contribution helps Indian commuters beat traffic gridlocks and reach their destinations faster.

---

## 🌟 How You Can Help

1. **Add Local Choke Points & Street Shortcuts (No coding required!)**
   - Know a notorious traffic signal in Bengaluru, Delhi, Mumbai, Pune, Hyderabad, or your city?
   - Add its coordinates, average peak crawl speed, and pedestrian shortcut advice in `backend/app/data/cities.json`.
2. **Help Solve Open Issues**
   - Check out our [Open Issues](https://github.com/shubhransh-gupta/rebelroutes-india/issues) labeled `good first issue` and `help wanted`.
3. **Enhance Mobile UX & Performance**
   - Help optimize map rendering, PWA offline capabilities, or transit heuristics.

---

## 🛠️ Local Development Setup

### 1. Fork and Clone
```bash
git clone https://github.com/your-username/rebelroutes-india.git
cd rebelroutes-india
```

### 2. Backend (FastAPI)
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
Interactive API documentation will be available at: `http://localhost:8000/docs`.

### 3. Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## 📍 Adding a New City or Choke Point

Choke points and street cheat codes are located in `backend/app/data/cities.json`.

Each choke point entry follows this schema:
```json
{
  "id": "blr_silkboard",
  "name": "Silk Board Junction",
  "corridor": "Hosur Road - ORR Intersect",
  "severity": "extreme",
  "coords": {
    "lat": 12.9172,
    "lng": 77.6227
  },
  "peak_hours": "08:30 - 11:30 | 17:30 - 21:30",
  "avg_crawl_speed_kmh": 3.2,
  "bypass_tip": "Alight 150m before junction, cross via the elevated pedestrian walkway, and re-hail auto on Hosur road."
}
```

---

## 📝 Pull Request Guidelines

1. Create a feature branch (`git checkout -b feature/mumbai-choke-points`).
2. Keep PRs focused on a single topic.
3. Verify that `npm run build` passes cleanly for frontend changes.
4. Verify backend routes with `pytest` or testing with `uvicorn`.
5. Open your Pull Request with a clear title and description referencing the issue!

---

*Together, let's build the smartest commuter community in India!* 🇮🇳
