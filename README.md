SafeRoute Planner

Live demo: https://thebinarynirmal.github.io/SafeRoutePlanner/
Interactive pathfinding on a city grid using a modified Dijkstra’s algorithm that balances distance with safety risk. Click to choose source/destination, shift-click to block roads, and tune the safety weight (α).

✨ FEATURES
Shortest route with safety weighting:
cost = distance × (1 + α × risk)
Day/Night toggle affecting risk map
Block roads with shift-click (simulates closures)
Live stats: total distance, risk, effective cost, nodes expanded
Custom min-heap priority queue for Dijkstra

🕹️ HOW TO USE
Click on the grid to set Source (blue) and Destination (amber).
Shift + Click any cell to block/unblock it.
Adjust Safety Priority (α) to avoid risky areas more or less.
Toggle Night mode to increase risk in alleys.
Click Recalculate to recompute (auto recalculates on most actions).

🛠️ TECH STACK
HTML5 + CSS3
Vanilla JavaScript
Canvas 2D API

Custom Min-Heap Priority Queue

📁 Project Structure
fast-safe-navigator/
├── index.html   # UI layout and controls
├── style.css    # Styling (dark theme, legend, layout)
└── script.js    # Grid, risk heatmap, Dijkstra, rendering & events
