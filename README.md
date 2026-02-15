# PCB Inventory Automation Frontend (Junior Track PS1)

## Run

1. Copy env file:

```powershell
Copy-Item .env.example .env
```

2. Install dependencies:

```powershell
npm install
```

3. Start app:

```powershell
npm start
```

## Modes

- `REACT_APP_DATA_MODE=local` (default): localhost simulation using `src/assets/seedData.json`.
- `REACT_APP_DATA_MODE=api`: calls backend APIs at `REACT_APP_API_BASE_URL`.

### Import behavior by mode

- `local` mode: uploading `.xlsx/.xlsm` replaces the app DB with the full pre-analyzed seed dataset and auto-refreshes dashboard/analytics/components/pcbs.
- `api` mode: uploading `.xlsx/.xlsm` sends full files as `multipart/form-data` to backend (`/import-export/import`). Backend parsing updates are reflected by live refresh events.

## Local Login Credentials

- Admin: `admin@local.test` / `Admin@123`
- Viewer: `viewer@local.test` / `Viewer@123`

## Dataset Seed

Dataset-derived seed was generated from:
- Atomberg Data.xlsm
- Bajaj PCB Dec 25 Data.xlsm

Generation script:

```powershell
python scripts/generate_seed.py --atomberg "d:\Atomberg Data.xlsm" --bajaj "d:\Bajaj PCB Dec 25 Data.xlsm" --output "d:\Invictus Day1\src\assets\seedData.json"
```

## Business Rules Implemented

- Low stock: `currentStockQty < monthlyRequiredQty * 0.20`
- No negative inventory (atomic production validation)
- Procurement trigger lifecycle:
  - Normal -> Low: create `pending`
  - Low -> Normal: mark pending trigger as `resolved`
  - One active pending trigger per component
