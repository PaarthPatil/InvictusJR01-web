# How to Remove Dashboard Graphs

If you want to remove the dashboard graphs component, follow these simple steps:

## Step 1: Remove Component Usage
Open `src/pages/DashboardPage.js` and remove these lines:

### Remove Import (around line 5):
```javascript
import DashboardGraphs from "../components/dashboard/DashboardGraphs";
```

### Remove Component Usage (around line 106):
```javascript
{/* Dashboard Graphs - Can be easily removed */}
<DashboardGraphs summary={summary} />
```

## Step 2: (Optional) Delete Component File
Delete the file:
```
src/components/dashboard/DashboardGraphs.js
```

## Step 3: (Optional) Remove CSS Styles
Open `src/styles.css` and remove these styles (around line 227):

```css
.dashboard-graphs {
  margin: 24px 0;
}

.graphs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
  gap: 20px;
}

.graph-card h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: var(--text);
}

.graph-container {
  width: 100%;
  height: 250px;
}
```

## That's It!

The dashboard will work exactly as before, without any graphs. The rest of the functionality (metrics, invoice generation, procurement table) will remain unchanged.

## To Restore

If you want to restore the graphs later, just undo the changes above or restore the component import and usage.
