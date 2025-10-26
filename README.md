🚦 SafeRoute Planner

🔗 Live Demo: https://thebinarynirmal.github.io/SafeRoutePlanner/

Interactive pathfinding on a city grid using a modified Dijkstra’s algorithm that balances distance with safety risk.
Click to choose source/destination, Shift + Click to block roads, and tune the safety weight (α) for smarter route planning.

✨ Features

🧭 Shortest route with safety weighting:
cost = distance × (1 + α × risk)

🌗 Day/Night toggle dynamically changes the risk map

⛔ Block roads via Shift + Click (simulates closed routes)

📊 Live stats: total distance, total risk, effective cost, and nodes expanded

⚡ Custom Min-Heap Priority Queue implementation for Dijkstra’s algorithm

🎨 Clean dark-themed interface with smooth heatmap visualization

🕹️ How to Use

Click anywhere on the grid to set the Source (blue) and Destination (amber).

Shift + Click any cell to block or unblock a road.

Adjust Safety Priority (α) using the slider to prioritize safe routes.

Toggle Night Mode to simulate increased risk in alleyways.

Press Recalculate or interact with the grid — it updates automatically.

🛠️ Tech Stack

HTML5 + CSS3

Vanilla JavaScript

Canvas 2D API

Custom Min-Heap Priority Queue

🧩 Project Structure
SafeRoutePlanner/
├── index.html   # UI layout and controls
├── style.css    # Styling (dark theme, layout, legend)
└── script.js    # Grid logic, risk heatmap, Dijkstra, rendering & events
