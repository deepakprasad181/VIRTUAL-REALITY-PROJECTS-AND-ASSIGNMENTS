# ✈️ 3D Aircraft Museum

An interactive WebGL-based 3D aircraft museum built using [Three.js](https://threejs.org/), showcasing high-quality fighter jet models with detailed descriptions, videos, and smooth navigation. Users can explore the virtual museum using keyboard and mouse controls, interact with the models, and learn about each aircraft through embedded YouTube videos and Wikipedia links.

---

## 🚀 Features

* 🌆 **Fully Immersive 3D Museum:** Walk through a stylized hangar with realistic walls, lighting, and textures.
* 🛫 **Interactive Aircraft Models:** View detailed 3D GLTF aircraft models (Su-57, F-22, MIG-35, etc.) on both sides of the hallway.
* 🎥 **Embedded YouTube Videos:** Each aircraft has an associated educational or documentary video.
* 📖 **Aircraft Info Panels:** Detailed descriptions and quick links to each aircraft's Wikipedia page.
* 🎮 **User Controls:**

  * `WASD` to navigate.
  * Click & Drag to rotate view.
  * Click on aircraft to view modal video.
  * On-screen rotation controls for each model.
* 🔄 **Auto & Manual Rotation:** Models auto-rotate when idle and can be manually rotated along X, Y, and Z axes.

---

## 💽 Technologies Used

| Stack              | Description                                       |
| ------------------ | ------------------------------------------------- |
| HTML5              | Structure and layout                              |
| CSS3               | Styling with modern UI techniques and transitions |
| JavaScript         | Core logic                                        |
| Three.js           | Rendering engine for the 3D scene                 |
| GLTFLoader         | Loads 3D `.glb` aircraft models                   |
| DRACOLoader        | Compresses 3D models for better performance       |
| RGBELoader         | Loads HDR environment maps                        |
| YouTube IFrame API | Embeds videos for each aircraft                   |

---

## 🏠 File Structure

```
├── index.html            # Entry point
├── style.css             # Styles for layout and UI
├── app.js                # Main JavaScript application (Three.js logic)
├── models/               # Folder for .glb 3D models
├── textures/             # Folder for aircraft wall images
└── lighting/             # HDR files (e.g., Warm.hdr)
```

---

### Prerequisites

Ensure you have a local server (like `Live Server`, `http-server`, or `python3 -m http.server`) to run this WebGL application.

### Clone the Repository

```bash
git clone https://github.com/deepakprasad181/VIRTUAL-REALITY-PROJECTS-AND-ASSIGNMENTS.git
cd PES1PG24CS020_ThreeJS_Project
```

### Serve the Project

Using **VS Code Live Server**:

1. Install the [Live Server extension](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer)
2. Right-click `index.html` > *Open with Live Server*

Or use Python:

```bash
python3 -m http.server
# Visit http://localhost:8000 in browser
```

---

## 🎮 Controls

| Action                | Control               |
| --------------------- | --------------------- |
| Move Forward          | `W`                   |
| Move Backward         | `S`                   |
| Move Left             | `A`                   |
| Move Right            | `D`                   |
| Look Around           | Click + Drag          |
| Select Aircraft       | Click on 3D model     |
| Rotate Model Manually | Use on-screen buttons |

---

## ✈️ Aircrafts Featured

| Aircraft         | Model File  
| ---------------- | ----------- |
| Sukhoi Su-57     | `su57.glb`  |  
| F22 Raptor       | `f22.glb`   | 
| MIG 35           | `mig35.glb` |  
| Sukhoi Su-35     | `su35.glb`  | 
| F35 Lightning-II | `f35.glb`   |

---
## 🤝 Contributing

Contributions are welcome! Follow the steps below:

```bash
git checkout -b feature-name
git commit -m "Add your message"
git push origin feature-name
```

Then open a pull request. Contributions should follow standard JS and CSS best practices.

---

## 📜 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---
