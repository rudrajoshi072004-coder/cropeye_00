# API Endpoints Summary

This document provides a comprehensive overview of all API endpoints used in the CROPEYE application.

## Main Data APIs

### 1. AgroStats API (Growth, Water Uptake, Soil Moisture, Pest)
- **Endpoint**: `https://cropeye-grapes-events-production.up.railway.appplots/agroStats`
- **Method**: GET
- **Query Parameters**: `end_date={YYYY-MM-DD}`
- **Development Proxy**: `/api/agroStats` → routes to agroStats API
- **Used By**:
  - Growth Data (`fetchGrowthData`)
  - Water Uptake Data (`fetchWaterUptakeData`)
  - Soil Moisture Data (`fetchSoilMoistureData`)
  - Pest Detection Data (`fetchPestData`)
- **Features**:
  - ✅ Retry logic with exponential backoff (3 retries, 15s timeout)
  - ✅ Caching (30 minutes)
  - ✅ Proxy support in development
  - ✅ Error handling with specific messages
  - ✅ Handles plot name variations (with/without quotes, underscores)

### 2. Brix Grid Values API
- **Endpoint**: `https://cropeye-grapes-admin-production.up.railway.appgrapes_brix_grid_values`
- **Method**: POST
- **Query Parameters**: `plot_name={plotName}`
- **Development Proxy**: `/api/dev-plot` → routes to n1kx47gh-8000 server
- **Used By**: `fetchBrixData`
- **Features**:
  - ✅ Retry logic with exponential backoff (3 retries, 15s timeout)
  - ✅ Caching (30 minutes)
  - ✅ Proxy support in development
  - ✅ Error handling with timeout detection

### 3. Canopy Vigour API
- **Endpoint**: `https://cropeye-grapes-admin-production.up.railway.appgrapes/canopy-vigour1`
- **Method**: POST
- **Query Parameters**: `plot_name={plotName}`
- **Development Proxy**: `/api/dev-plot` → routes to n1kx47gh-8000 server
- **Used By**: `fetchCanopyVigour`
- **Features**:
  - ✅ Retry logic with exponential backoff (3 retries, 15s timeout)
  - ✅ Caching (30 minutes)
  - ✅ Proxy support in development
  - ✅ Error handling

## Supporting APIs

### 4. Plot Data API (for boundaries)
- **Endpoint**: `https://cropeye-grapes-admin-production.up.railway.appanalyze_Growth`
- **Method**: POST
- **Query Parameters**: `plot_name={plotName}&end_date={YYYY-MM-DD}&days_back=7`
- **Development Proxy**: `/api/dev-plot` → routes to n1kx47gh-8000 server
- **Used By**: `fetchPlotData`
- **Purpose**: Fetches plot boundary geometry
- **Features**:
  - ✅ Retry logic with exponential backoff
  - ✅ Proxy support in development
  - ✅ Error handling

### 5. Field Analysis API
- **Endpoint**: `https://cropeye-grapes-admin-production.up.railway.app/`
- **Method**: GET
- **Query Parameters**: `plot_name={plotName}&end_date={YYYY-MM-DD}&days_back=7`
- **Used By**: `fetchFieldAnalysis`
- **Purpose**: Fetches overall field health analysis
- **Features**:
  - ✅ Retry logic with exponential backoff
  - ✅ Error handling
  - ⚠️ No proxy configured (direct connection)

## Proxy Configuration (vite.config.ts)

### Development Proxies

1. **`/api/dev-plot`**
   - Target: `https://cropeye-grapes-admin-production.up.railway.app`
   - Used for: Brix, Canopy Vigour, Plot Data
   - Rewrites: Removes `/api/dev-plot` prefix

2. **`/api/agroStats`**
   - Target: `https://cropeye-grapes-events-production.up.railway.app`
   - Used for: Growth, Water Uptake, Soil Moisture, Pest
   - Rewrites: `/api/agroStats` → `/plots/agroStats`

3. **`/api/backend`**
   - Target: `https://cropeye-server-flyio.onrender.com`
   - Used for: Main backend API (authentication, users, farms, etc.)
   - Rewrites: `/api/backend` → `/api`

## Error Handling

All API calls include:
- **Retry Logic**: Exponential backoff (3 retries, delays: 1s, 2s, 4s)
- **Timeout**: 15 seconds per request
- **Error Messages**: Specific messages for:
  - Network errors
  - CORS errors
  - Timeout errors
  - Server errors (502, 503, 504)
  - Not found errors (404)

## Caching Strategy

- **Cache Duration**: 30 minutes for all data types
- **Cache Keys**: Format: `{dataType}_{plotName}_{endDate}`
- **Cache Storage**: Browser localStorage
- **Cache Invalidation**: Automatic after 30 minutes

## Data Flow

```
User selects plot/layer
    ↓
Check cache (30 min TTL)
    ↓
Cache hit? → Return cached data
    ↓
Cache miss? → Fetch from API
    ↓
Apply retry logic (3 attempts)
    ↓
Transform data to GeoJSON format
    ↓
Cache result
    ↓
Update UI
```

## Testing Checklist

- [ ] Growth data loads from agroStats API
- [ ] Water Uptake data loads from agroStats API
- [ ] Soil Moisture data loads from agroStats API
- [ ] Pest data loads from agroStats API
- [ ] Brix data loads from grapes_brix_grid_values API
- [ ] Canopy Vigour data loads from grapes/canopy-vigour1 API
- [ ] Field Analysis data loads from analyze API
- [ ] Plot boundaries load correctly
- [ ] Error handling works for network failures
- [ ] Retry logic works for temporary failures
- [ ] Caching works correctly
- [ ] Proxy works in development mode
- [ ] Direct API calls work in production mode

## Notes

- All APIs use CORS mode
- Credentials are omitted for all requests
- Accept header is set to `application/json` for all requests
- Development mode uses proxy to avoid CORS issues
- Production mode uses direct API calls
