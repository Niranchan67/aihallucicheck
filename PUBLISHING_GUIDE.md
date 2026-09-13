# How to Publish & Deploy HalluciCheck

Your application is now configured with a **Unified Single-Port Architecture**:
- Both the **React UI** and the **FastAPI Backend** run together on port `8000`.
- No CORS issues, no complex multi-service setup required.

---

## ? Option 1: Instant Live Demo (Active Right Now!)

A temporary public HTTPS tunnel is currently live for immediate testing or showing to your team/professor:

- **Public URL**: [https://hallucicheck-demo.loca.lt](https://hallucicheck-demo.loca.lt)
- **Tunnel Password**: `116.73.174.142`
*(When opening the link, enter the password above to proceed to the live site).*

To start this tunnel anytime in the future:
```powershell
# 1. Start unified server
cd backend
py -m uvicorn main:app --host 0.0.0.0 --port 8000

# 2. In another terminal, create tunnel
npx localtunnel --port 8000 --subdomain hallucicheck-demo
```

---

## ?? Option 2: Render.com (Permanent Free 24/7 Cloud Hosting - Recommended)

Render provides free hosting with a permanent HTTPS link (e.g. `https://hallucicheck.onrender.com`).

### Steps:
1. **Upload your code to GitHub**:
   - Create a free GitHub account at [github.com](https://github.com).
   - Create a new repository (e.g. `hallucicheck`).
   - Upload the project files or push via Git.
2. **Deploy on Render**:
   - Go to [render.com](https://render.com) and sign in with GitHub.
   - Click **"New +"** in the top-right corner and select **"Web Service"**.
   - Connect your `hallucicheck` GitHub repository.
   - Render will automatically detect the included `Dockerfile` and `render.yaml`.
   - Select the **Free** instance type.
   - Click **"Create Web Service"**.
3. **Done!**
   - Render will automatically build the React frontend, set up the Python FastAPI backend, and assign you a public link like `https://hallucicheck.onrender.com`.

---

## ?? Option 3: Hugging Face Spaces (Free Cloud AI Hosting)

Hugging Face Spaces is widely used for academic and AI portfolio projects:

1. Create an account at [huggingface.co](https://huggingface.co).
2. Click your profile -> **"New Space"**.
3. Name it `hallucicheck`, choose license (e.g. MIT).
4. Select **Space SDK**: **Docker** -> **Blank**.
5. Upload the project files (including `Dockerfile`).
6. Hugging Face will automatically build and host the app at:
   `https://huggingface.co/spaces/<your-username>/hallucicheck`

---

## ?? Option 4: Local Docker Run

If you or a collaborator have Docker installed:

```bash
# Build Docker image
docker build -t hallucicheck .

# Run on port 8000
docker run -p 8000:8000 hallucicheck
```
Then access at `http://localhost:8000`.
