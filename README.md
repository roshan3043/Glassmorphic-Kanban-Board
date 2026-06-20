# AuraFlow Glassmorphic Kanban Board

A premium, business-oriented Kanban Board web application featuring a stunning glassmorphic interface, client-side session authentication (roles for Administrator and Worker), local storage persistence, custom drag-and-drop sortable columns, task filtering, checklist tracking, and interactive board analytics.

---

## 🚀 Local Development Setup

To run and preview the Kanban board locally:

1. Make sure you have [Node.js](https://nodejs.org/) installed.
2. Open your terminal in the project directory.
3. Install dependencies (installs the local lightweight development server):
   ```bash
   npm install
   ```
4. Start the local server:
   ```bash
   npm start
   ```
5. Open your browser and navigate to:
   ```
   http://localhost:8080
   ```

---

## 📦 GitHub Pages Deployment Guide

We have pre-configured a GitHub Actions workflow in `.github/workflows/deploy.yml` that automatically deploys the Kanban board to GitHub Pages whenever you push changes to your repository.

Follow these steps to set up your repository and deploy the project:

### Step 1: Create a GitHub Repository
1. Go to your [GitHub account](https://github.com/) and create a new repository (e.g., `auraflow-kanban`).
2. Keep it **Public** (required for free GitHub Pages hosting) and do **not** initialize it with a README, `.gitignore`, or license.

### Step 2: Initialize Git and Push Code
Open your terminal in the local project directory and execute the following commands:

```bash
# Initialize git repository
git init -b main

# Stage all project files
git add .

# Create the initial commit
git commit -m "Initialize AuraFlow Kanban Board project"

# Link your local repository to GitHub (replace with your GitHub repository URL)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY_NAME.git

# Push the code to the main branch
git push -u origin main
```

### Step 3: Enable GitHub Pages Deployments via Actions
1. Go to your repository page on GitHub.
2. Click on the **Settings** tab.
3. In the left-hand sidebar, navigate to **Pages** under the "Code and automation" section.
4. Under **Build and deployment > Source**, click the dropdown and select **GitHub Actions**.

### Step 4: Verify Deployment
Once you change the source to **GitHub Actions**, go to the **Actions** tab in your repository. You will see a workflow named `Deploy static content to Pages` running. 

When it finishes, the deployment URL will be printed in the build logs (typically formatted as `https://YOUR_USERNAME.github.io/YOUR_REPOSITORY_NAME/`).

---

## 🔒 Test Accounts & Credentials

Use the following credentials to access the board:

| Role | Login ID | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **👑 Administrator** | `admin` | `admin` | Full control: manage columns, register employees, delete tasks |
| **👷 Worker (Alex)** | `1001` | `123` | Personal workspace: view/add/update only assigned tasks |
| **👷 Worker (Jordan)** | `1002` | `123` | Personal workspace: view/add/update only assigned tasks |
