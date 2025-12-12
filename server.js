
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// --- PROXY GATEWAY ---
// 1. Receives requests at /google-api
// 2. Forwards them to https://generativelanguage.googleapis.com
// 3. Strips user IP headers so Google sees the Server IP (Host IP) instead of User IP
const proxyOptions = {
    target: 'https://generativelanguage.googleapis.com',
    changeOrigin: true,
    pathRewrite: {
        '^/google-api': '', // Remove the local prefix
    },
    ws: true, // Enable WebSockets for Gemini Live
    onProxyReq: (proxyReq, req, res) => {
        // CRITICAL FOR BYPASSING GEO-BLOCKS:
        // Remove headers that reveal the end-user's real IP address.
        // Google will treat the request as coming from THIS server (e.g. Render/Railway in US/EU).
        proxyReq.removeHeader('x-forwarded-for');
        proxyReq.removeHeader('x-real-ip');
        proxyReq.removeHeader('forwarded');
        
        // Console log for debugging (optional)
        // console.log(`[Proxy] ${req.method} ${req.url} -> Google`);
    },
    onError: (err, req, res) => {
        console.error('[Proxy Error]', err);
        if (!res.headersSent) {
            res.status(500).json({ error: "Proxy Connection Failed", details: err.message });
        }
    }
};

// Apply the proxy
app.use('/google-api', createProxyMiddleware(proxyOptions));

// --- SERVE REACT APP ---
// Serve static files from the build directory
app.use(express.static(path.join(__dirname, 'dist')));

// Handle Single Page Application (SPA) routing
// Send all other requests to index.html so React Router takes over
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`==================================`);
    console.log(`🚀 GTayr Server running on port ${PORT}`);
    console.log(`🔗 Proxy Endpoint: http://localhost:${PORT}/google-api`);
    console.log(`==================================`);
});
