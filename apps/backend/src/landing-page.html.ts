export const getLandingPageHtml = () => {
  const serverTime = new Date().toLocaleString();
  const env = process.env.NODE_ENV || 'development';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MonoRepo Backend Service</title>
    <style>
        :root {
            --bg-color: #ffffff;
            --text-primary: #111827;
            --text-secondary: #6b7280;
            --border-color: #e5e7eb;
            --accent-color: #0f172a; /* Dark slate/black for a professional look */
            --success-color: #059669;
            --card-bg: #ffffff;
            --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        }

        @media (prefers-color-scheme: dark) {
            :root {
                --bg-color: #0a0a0a;
                --text-primary: #f9fafb;
                --text-secondary: #9ca3af;
                --border-color: #262626;
                --accent-color: #f3f4f6;
                --success-color: #34d399;
                --card-bg: #0a0a0a;
            }
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: var(--font-sans);
            background-color: var(--bg-color);
            color: var(--text-primary);
            line-height: 1.5;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 4rem 1rem;
            -webkit-font-smoothing: antialiased;
        }

        .container {
            width: 100%;
            max-width: 640px;
        }

        header {
            margin-bottom: 3rem;
            border-bottom: 1px solid var(--border-color);
            padding-bottom: 1.5rem;
        }

        h1 {
            font-size: 1.5rem;
            font-weight: 600;
            letter-spacing: -0.025em;
            color: var(--text-primary);
        }

        .section {
            margin-bottom: 2.5rem;
        }

        h2 {
            font-size: 0.875rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: var(--text-secondary);
            font-weight: 600;
            margin-bottom: 1rem;
        }

        .card {
            border: 1px solid var(--border-color);
            border-radius: 8px;
            background: var(--card-bg);
            overflow: hidden;
        }

        .info-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1rem 1.25rem;
            border-bottom: 1px solid var(--border-color);
        }

        .info-row:last-child {
            border-bottom: none;
        }

        .info-label {
            color: var(--text-secondary);
            font-size: 0.925rem;
        }

        .info-value {
            font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
            font-size: 0.875rem;
            color: var(--text-primary);
        }

        .endpoint-list {
            list-style: none;
        }

        .endpoint-item {
            display: flex;
            align-items: center;
            padding: 0.75rem 1.25rem;
            border-bottom: 1px solid var(--border-color);
            font-size: 0.925rem;
        }

        .endpoint-item:last-child {
            border-bottom: none;
        }

        .method {
            font-size: 0.75rem;
            font-weight: 700;
            padding: 2px 6px;
            border-radius: 4px;
            background-color: var(--border-color);
            color: var(--text-primary);
            margin-right: 1rem;
            min-width: 45px;
            text-align: center;
        }

        .path {
            font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
            color: var(--text-primary);
            margin-right: auto;
        }

        .desc {
            color: var(--text-secondary);
            font-size: 0.875rem;
        }

        .status-dot {
            display: inline-block;
            width: 8px;
            height: 8px;
            background-color: var(--success-color);
            border-radius: 50%;
            margin-right: 0.5rem;
        }

        a {
            color: var(--text-primary);
            text-decoration: underline;
            text-underline-offset: 4px;
            text-decoration-color: var(--border-color);
            transition: text-decoration-color 0.2s;
        }

        a:hover {
            text-decoration-color: var(--text-primary);
        }

        .footer {
            margin-top: 4rem;
            text-align: center;
            font-size: 0.875rem;
            color: var(--text-secondary);
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>MonoRepo Backend Service</h1>
        </header>
        
        <div class="section">
            <h2>System Status</h2>
            <div class="card">
                <div class="info-row">
                    <span class="info-label">Status</span>
                    <span class="info-value" style="display: flex; align-items: center;">
                        <span class="status-dot"></span>Operational
                    </span>
                </div>
                <div class="info-row">
                    <span class="info-label">Environment</span>
                    <span class="info-value">${env}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Server Time</span>
                    <span class="info-value">${serverTime}</span>
                </div>
            </div>
        </div>

        <div class="section">
            <h2>Endpoints</h2>
            <div class="card">
                <ul class="endpoint-list">
                    <li class="endpoint-item">
                        <span class="method">GET</span>
                        <span class="path">/</span>
                        <span class="desc">Welcome</span>
                    </li>
                    <li class="endpoint-item">
                        <span class="method">GET</span>
                        <span class="path">/health</span>
                        <span class="desc">Health Check</span>
                    </li>
                </ul>
            </div>
        </div>

        <div class="section">
            <p style="color: var(--text-secondary); font-size: 0.925rem;">
                For full details, view the <a href="/api-docs">API Documentation</a>.
            </p>
        </div>

        <div class="footer">
            &copy; ${new Date().getFullYear()} MonoRepo Backend Service
        </div>
    </div>
</body>
</html>
`;
};
