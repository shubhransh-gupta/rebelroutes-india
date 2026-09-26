# 🇮🇳 RebelRoutes India (FIT - Fantastic Indian Traffic)

> **"Google Maps assumes cities behave logically. Indian cities don't."**
> An open-source, community-driven routing laboratory that argues with traffic maps to find routes that actually work across India's busiest cities.

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](https://opensource.org/licenses/MIT)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React_18_%2B_Vite-61DAFB.svg)](https://react.dev)
[![Leaflet](https://img.shields.io/badge/Maps-OpenStreetMap_%2B_Leaflet-green.svg)](https://leafletjs.com)
[![Hosting](https://img.shields.io/badge/Hosting_Cost-$0_Free_Tier-brightgreen.svg)](#-how-to-host-100-free-0-forever)

---

## 🌟 The Philosophy & Why This Exists

Traditional navigation tools (like Google Maps) operate on two flawed assumptions in Indian urban centers:
1. **The "Curbside Fallacy"**: Cabs are expected to enter congested office campus gates, internal security lines, or make 20-minute U-turns just to pick you up at a lobby door.
2. **The "Single-Mode Vehicle Invariance"**: Once inside a vehicle, you are expected to crawl at $3\text{ km/h}$ across flyovers and signals, even when brisk walking beats driving speed by 3x.

**RebelRoutes India** solves this with **Multimodal Active Routing**:
- 🚶 **Boundary Shift**: Walking $250\text{ m}$ outside a tech park gate or across an arterial road to save $15\text{–}25$ minutes of cab waiting and U-turn gridlocks.
- ⚡ **Choke-Point Walking & Rebooking**: Identifying when driving speed drops below human walking speed, prompting you to alight, walk past the bottleneck (via pedestrian skywalk, metro concourse, or footbridge), and rebook on the open road.
- ☕ **Zero-Detour Errands**: Finding coffee, fuel, cash ATMs, and pharmacies directly along your travel corridor without detours.
- 📊 **24-Hour Departure Window Radar**: Showing you whether leaving 20 minutes earlier or later saves an hour of congestion.

---

## 🏙️ Supported Indian Cities & Local Bottlenecks

| City | Key Choke Points Covered | Local Insider Bypass Heuristic |
| :--- | :--- | :--- |
| **Bengaluru** | Silk Board, Marathahalli Bridge, Bellandur EcoSpace, Tin Factory, Hebbal Flyover | Tech-park back pedestrian gates, metro concourse crossovers, ORR service road rebooking |
| **Gurgaon (Gurugram)** | Shankar Chowk, IFFCO Chowk, Rajiv Chowk | DLF Cyber City Rapid Metro footbridge into DLF Ph-2/3, NH-48 Yellow line subway hop |
| **Noida** | Film City flyover, Mahamaya flyover, Sector 62 / Model Town crossing | Metro skybridges, Kalindi Kunj border arterial bypass |
| **Delhi** | Ashram Chowk, Dhaula Kuan, ITO Junction | Metro station unpaid subways and airport express travelator concourse |
| **Pune** | Hinjawadi Phase 1/2/3 (Bhujbal & Shivaji Chowk), Chandani Chowk, Viman Nagar Phoenix | Wakad bridge walk past, Bavdhan service lane pickup |
| **Mumbai** | Western Express Highway, Kalanagar / BKC Connector, Saki Naka, Powai JVLR | Suburban railway skywalks, Bandra station to BKC pedestrian bridge |
| **Hyderabad** | Cyber Towers (Hitec City), Gachibowli Flyover, Bio-Diversity Junction | Raidurg metro elevated skywalk, DLF Cyber City lane pickup |
| **Chennai** | Kathipara Cloverleaf, Madhya Kailash (OMR start), T. Nagar Usman Road, TIDEL Park | Alandur Metro interchange pedestrian subway, MRTS canal footbridge |
| **Kolkata** | Howrah Bridge approach, Park Circus 7-Point, Ultadanga, Sector V Salt Lake | Hooghly River 5-minute ferry shortcut, Bidhannagar railway subway |
| **Lucknow** | Charbagh Station Crossing, Polytechnic Chauraha, Hazratganj, Shaheed Path | Charbagh Metro elevated concourse, Janpath heritage arcade walk |
| **Ahmedabad** | SG Highway ISKCON cross roads, Nehrunagar Circle | BRTS designated pedestrian overpasses |

---

## 🛠️ Zero-Cost Architecture ($0 Budget)

This project is built for **100% free hosting and $0 monthly operating cost**:
- **Routing Engine**: OpenStreetMap (OSRM public routing engine) - zero API fees.
- **Geocoding & Autocomplete**: Photon OSM geocoder with India bias - zero API keys required.
- **Map Visualizer**: Leaflet + CartoDB Dark Matter tiles - fast, responsive, zero Google billing account needed.
- **Optional**: Can plug in Google Maps API key via `.env` if desired for high-resolution traffic models.

---

## 🚀 How to Host 100% Free ($0 Forever)

You can launch both the frontend and backend live for the public at **$0 cost** using free tiers:

### 1. Backend Hosting: Render.com (Free Tier)
1. Fork or push this repository to GitHub.
2. Sign up on [Render.com](https://render.com) (Free account, no credit card required).
3. Click **New +** $\to$ **Web Service**.
4. Connect your GitHub repository.
5. Set:
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: `Free`
6. Click **Deploy Web Service**. You will receive a live URL: `https://your-app.onrender.com`.

*(Alternative free backend hosts: Hugging Face Spaces Docker container, Railway, or Koyeb).*

---

### 2. Frontend Hosting: Vercel or Cloudflare Pages (Free Tier)
1. Sign up on [Vercel](https://vercel.com) (Free Hobby tier).
2. Click **Add New Project** $\to$ Import your GitHub repository.
3. In Project Settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Under **Environment Variables**, add:
   - `VITE_API_URL` = `https://your-backend-app.onrender.com` (your Render backend URL)
5. Click **Deploy**. Your site is now live at `https://your-app.vercel.app`!

---

## 💻 Running Locally

### 1. Run Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
API Documentation will be live at: `http://localhost:8000/docs`.

### 2. Run Frontend
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## 🤝 Contributing for the Indian Commuter Community
This project is open-source and free for all Indian citizens. We invite developers from Bengaluru, Delhi, Mumbai, Pune, Hyderabad, Chennai, Kolkata, and beyond to submit PRs adding local choke points, skywalk shortcuts, and campus back-gate coordinates to `backend/app/data/cities.json`.
