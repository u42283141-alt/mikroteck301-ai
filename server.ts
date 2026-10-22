import 'dotenv/config';
import express, { Request, Response } from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { apiRouter } from './src/server/routes/api.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const isProduction = process.env.NODE_ENV === 'production';

  // Parser JSON avec conservation du buffer brut (rawBody)
  // Essentiel pour la vérification cryptographique X-Hub-Signature-256 de Meta
  app.use(
    express.json({
      verify: (req: any, _res, buf) => {
        req.rawBody = buf;
      },
      limit: '10mb',
    })
  );

  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Route de santé (Health Check)
  app.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      app: 'MIKROTECK 301 — Messenger AI Manager',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    });
  });

  // Montage des routes d'API backend
  app.use('/api', apiRouter);

  // Serveur Vite en mode développement vs fichiers statiques en production
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req: Request, res: Response) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    } else {
      app.get('*', (_req: Request, res: Response) => {
        res.status(503).send('Application en cours de compilation. Veuillez patienter...');
      });
    }
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`=======================================================`);
    console.log(`🚀 MIKROTECK 301 — Messenger AI Manager`);
    console.log(`📍 Fianarantsoa, Madagascar | 038 28 171 00`);
    console.log(`🌐 Serveur démarré sur : http://0.0.0.0:${port}`);
    console.log(`🔗 Webhook Meta : http://0.0.0.0:${port}/api/webhook`);
    console.log(`🔑 Gemini API : ${process.env.GEMINI_API_KEY ? 'Actif' : 'Non détecté'}`);
    console.log(`=======================================================`);
  });
}

startServer().catch((err) => {
  console.error('Erreur fatale au démarrage du serveur:', err);
  process.exit(1);
});
