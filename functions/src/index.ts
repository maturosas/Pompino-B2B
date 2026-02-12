import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import { BigQuery } from "@google-cloud/bigquery";
import * as nodemailer from "nodemailer";

// Ensure Admin SDK is initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

// Project Configuration Reference
// Project ID: pompino-b2b

// Lazy initialization of BigQuery
let bigqueryInstance: BigQuery | null = null;
const getBigQuery = () => {
    if (!bigqueryInstance) {
        bigqueryInstance = new BigQuery();
    }
    return bigqueryInstance;
};

// --- EMAIL CONFIGURATION ---
// ⚠️ IMPORTANT: Configure these variables in Firebase:
// firebase functions:config:set email.user="tu_email@gmail.com" email.pass="tu_contraseña_de_aplicacion"
const gmailEmail = functions.config().email?.user || "tu_sistema@gmail.com"; 
const gmailPassword = functions.config().email?.pass || "password_temporal";

const mailTransport = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: gmailEmail,
    pass: gmailPassword,
  },
});

// --- TRIGGER: SEND EMAIL ON REPORT ---
export const sendReportEmail = functions.firestore
    .document('reports/{reportId}')
    .onCreate(async (snap, context) => {
      const report = snap.data();
      
      const mailOptions = {
        from: `"Pompino System" <${gmailEmail}>`,
        to: "hola@bzsgrupobebidas.com.ar",
        subject: `🐞 Nuevo Reporte de Problema - ${report.user}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #d12030;">Nuevo Reporte en Pompino</h2>
            <p><strong>Usuario:</strong> ${report.user}</p>
            <p><strong>Fecha:</strong> ${new Date(report.timestamp).toLocaleString()}</p>
            <hr />
            <p style="background: #f5f5f5; padding: 15px; border-left: 4px solid #d12030;">
              ${report.message}
            </p>
            <hr />
            <p style="font-size: 12px; color: #888;">Este es un mensaje automático del sistema BZS.</p>
          </div>
        `
      };

      try {
        await mailTransport.sendMail(mailOptions);
        console.log('Email de reporte enviado correctamente');
        // Actualizar estado en DB
        await snap.ref.update({ status: 'email_sent' });
      } catch (error) {
        console.error('Error enviando email:', error);
        await snap.ref.update({ status: 'email_failed', error: String(error) });
      }
});


// --- BIGQUERY ANALYTICS FUNCTIONS (EXISTING) ---

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

const getTableSuffix = (filter: string, customStart?: string, customEnd?: string) => {
    const now = new Date();
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
        return { start: customStart.replace(/-/g, ''), end: customEnd.replace(/-/g, '') };
    }
    
    return { start: toBQFormat(start), end: toBQFormat(end) };
};

export const getGa4Reports = functions.https.onCall(async (data: any, context: any) => {
  let projectId = 'pompino-b2b';
  try {
     projectId = process.env.GCLOUD_PROJECT || 
                 (admin.app().options.projectId) || 
                 (process.env.FIREBASE_CONFIG ? JSON.parse(process.env.FIREBASE_CONFIG).projectId : 'pompino-b2b');
  } catch (e) {
     console.warn("Using default project ID");
  }

  try {
      let { propertyId, dateFilter = '30d', customStart, customEnd, reportType = 'summary' } = data || {};
      
      if (!propertyId) propertyId = '375682540';
      propertyId = propertyId.replace(/^p/, '');

      const datasetId = `analytics_${propertyId}`;
      const { start, end } = getTableSuffix(dateFilter, customStart, customEnd);
      
      const tableRef = `\`${projectId}.${datasetId}.events_*\``;
      const whereClause = `_TABLE_SUFFIX BETWEEN '${start}' AND '${end}'`;

      const bigquery = getBigQuery();

      if (reportType === 'summary') {
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

          const cityQuery = `
            SELECT geo.city as name, COUNT(DISTINCT user_pseudo_id) as value
            FROM ${tableRef}
            WHERE ${whereClause}
            GROUP BY 1
            ORDER BY 2 DESC
            LIMIT 10
          `;

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
      const normalized = normalizeError(err);
      if (normalized.code === 404 || (normalized.message && normalized.message.includes("Not found"))) {
           return cleanPayload({
              error: true, 
              message: "Datos no disponibles", 
              userHint: "BigQuery no encontró tablas para este rango de fechas.",
              originalError: normalized.message
           });
      }
      return cleanPayload({ error: true, fatal: true, ...normalized });
  }
});