import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { BigQuery } from "@google-cloud/bigquery";

// Ensure Admin SDK is initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

// Lazy initialization of BigQuery to prevent cold start crashes
let bigqueryInstance: BigQuery | null = null;
const getBigQuery = () => {
    if (!bigqueryInstance) {
        bigqueryInstance = new BigQuery();
    }
    return bigqueryInstance;
};

// --- HELPERS (Safe Serialization & Error Handling) ---

const safeStringify = (obj: any) => {
    const cache = new Set();
    return JSON.stringify(obj, (key, value) => {
        if (typeof value === 'object' && value !== null) {
            if (cache.has(value)) return '[Circular]';
            cache.add(value);
        }
        if (typeof value === 'bigint') return value.toString();
        return value;
    });
};

const cleanPayload = (data: any) => {
    if (data === undefined) return null;
    try {
        return JSON.parse(safeStringify(data));
    } catch (e) {
        return { error: true, message: "Serialization Failed", originalError: String(e) };
    }
};

const normalizeError = (err: any) => {
    if (!err) return { message: "Unknown Error" };
    let details = "No details";
    try {
        if (err.details) details = safeStringify(err.details);
        else if (err.response) details = safeStringify(err.response);
        else if (err.errors) details = safeStringify(err.errors); // BigQuery specific
    } catch (e) {}
    
    return {
        message: err.message || "Unknown Error",
        code: err.code || 0,
        details: details
    };
};

// --- DATE LOGIC FOR BIGQUERY TABLES ---

const getTableSuffix = (filter: string, customStart?: string, customEnd?: string) => {
    const now = new Date();
    // BigQuery suffix format: YYYYMMDD
    const toBQFormat = (d: Date) => d.toISOString().split('T')[0].replace(/-/g, '');
    
    let start = new Date();
    let end = new Date();

    if (filter === 'yesterday') {
        start.setDate(now.getDate() - 1);
        end.setDate(now.getDate() - 1);
    } else if (filter === '7d') {
        start.setDate(now.getDate() - 7);
    } else if (filter === '30d') {
        start.setDate(now.getDate() - 30);
    } else if (filter === 'custom' && customStart && customEnd) {
        // Assume input is YYYY-MM-DD
        return { start: customStart.replace(/-/g, ''), end: customEnd.replace(/-/g, '') };
    }
    // 'today' is default (start=now, end=now)
    
    return { start: toBQFormat(start), end: toBQFormat(end) };
};

export const getGa4Reports = functions.https.onCall(async (data: any, context: any) => {
  console.log("📡 [START] getGa4Reports (Safe Mode)");

  // 1. Safe Project ID Detection
  let projectId = 'pompino-b2b';
  try {
     projectId = process.env.GCLOUD_PROJECT || 
                 (admin.app().options.projectId) || 
                 (process.env.FIREBASE_CONFIG ? JSON.parse(process.env.FIREBASE_CONFIG).projectId : 'pompino-b2b');
  } catch (e) {
     console.warn("⚠️ Could not detect Project ID automatically, using default.", e);
  }

  try {
      // 2. Input Validation
      let { propertyId, dateFilter = '30d', customStart, customEnd, reportType = 'summary' } = data || {};
      
      if (!propertyId) propertyId = '375682540';
      propertyId = propertyId.replace(/^p/, ''); // Remove 'p' prefix if present

      const datasetId = `analytics_${propertyId}`;
      const { start, end } = getTableSuffix(dateFilter, customStart, customEnd);
      
      // Construct table reference with wildcard for date range
      // Important: Use backticks for BigQuery table/project names to handle hyphens
      const tableRef = `\`${projectId}.${datasetId}.events_*\``;
      const whereClause = `_TABLE_SUFFIX BETWEEN '${start}' AND '${end}'`;

      console.log(`⚙️ Querying BigQuery: ${tableRef} for range ${start}-${end}`);

      const bigquery = getBigQuery();

      if (reportType === 'summary') {
          // KPI Query
          const kpiQuery = `
            SELECT
                COUNT(DISTINCT user_pseudo_id) as users,
                COUNT(DISTINCT CONCAT(user_pseudo_id, (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'ga_session_id'))) as sessions,
                COUNTIF(event_name = 'add_to_cart') as carts,
                COUNTIF(event_name = 'purchase') as purchases,
                COALESCE(SUM(ecommerce.purchase_revenue), 0) as revenue
            FROM ${tableRef}
            WHERE ${whereClause}
          `;

          // Product Query
          const productQuery = `
             SELECT
                item_name as name,
                SUM(quantity) as quantity,
                SUM(item_revenue) as revenue
             FROM ${tableRef}, UNNEST(items)
             WHERE ${whereClause}
             GROUP BY 1
             ORDER BY 3 DESC
             LIMIT 25
          `;

          const [kpiRows] = await bigquery.query({ query: kpiQuery });
          const [productRows] = await bigquery.query({ query: productQuery });

          const kpis = kpiRows[0] || { users:0, sessions:0, carts:0, purchases:0, revenue:0 };
          const conversionRate = kpis.sessions > 0 ? ((kpis.purchases / kpis.sessions) * 100).toFixed(2) : '0.00';

          return cleanPayload({
              success: true,
              data: {
                  kpis: { ...kpis, conversionRate: `${conversionRate}%` },
                  topProducts: productRows,
                  meta: { currency: 'USD' }
              }
          });

      } else if (reportType === 'panoramic') {
          // Sources
          const sourceQuery = `
            SELECT 
                (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'source') as name,
                COUNT(DISTINCT CONCAT(user_pseudo_id, (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'ga_session_id'))) as value
            FROM ${tableRef}
            WHERE ${whereClause}
            GROUP BY 1
            ORDER BY 2 DESC
            LIMIT 10
          `;

          // Cities
          const cityQuery = `
            SELECT geo.city as name, COUNT(DISTINCT user_pseudo_id) as value
            FROM ${tableRef}
            WHERE ${whereClause}
            GROUP BY 1
            ORDER BY 2 DESC
            LIMIT 10
          `;

          // Devices
          const deviceQuery = `
             SELECT device.category as name, 
             COUNT(DISTINCT CONCAT(user_pseudo_id, (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'ga_session_id'))) as value
             FROM ${tableRef}
             WHERE ${whereClause}
             GROUP BY 1
             ORDER BY 2 DESC
          `;

           const [sourceRows] = await bigquery.query({ query: sourceQuery });
           const [cityRows] = await bigquery.query({ query: cityQuery });
           const [deviceRows] = await bigquery.query({ query: deviceQuery });

           const clean = (rows: any[]) => rows.map(r => ({ name: r.name || '(Not Set)', value: r.value }));

           return cleanPayload({
              success: true,
              data: {
                  sources: clean(sourceRows),
                  cities: clean(cityRows),
                  devices: clean(deviceRows),
              }
          });
      }

      return cleanPayload({ error: true, message: "Invalid report type" });

  } catch (err: any) {
      console.error("❌ BigQuery Error:", err);
      const normalized = normalizeError(err);

      // Handle "Not Found" specifically (Table not found implies no data for date range)
      // BigQuery 404 looks like code: 404 or message contains "Not found"
      if (normalized.code === 404 || (normalized.message && normalized.message.includes("Not found"))) {
           return cleanPayload({
              error: true, 
              message: "Datos no disponibles", 
              userHint: "BigQuery no encontró tablas para este rango de fechas. Si acabas de vincular GA4, espera 24-48hs.",
              originalError: normalized.message
           });
      }
      
      // Check for permission denied
      if (normalized.code === 403 || (normalized.message && normalized.message.includes("Permission denied"))) {
            return cleanPayload({
              error: true,
              fatal: true,
              message: "Permiso denegado en BigQuery",
              userHint: `La cuenta de servicio del proyecto ${projectId} no tiene acceso al dataset. Ve a IAM y dale rol 'BigQuery Data Viewer'.`,
              details: normalized.details
          });
      }

      return cleanPayload({
          error: true,
          fatal: true,
          ...normalized
      });
  }
});