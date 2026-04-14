import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import adminRoutes from './routes/adminRoutes';
import batchRoutes from './routes/batchRoutes';
import alertRoutes from './routes/alertRoutes';
import locationRoutes from './routes/locationRoutes';
import simulationRoutes from './routes/simulationRoutes';
import verifyRoutes from './routes/verifyRoutes';
import blockchainRoutes from './routes/blockchainRoutes';
import riskRoutes from './routes/riskRoutes';
import secureOsRoutes from './routes/secureOsRoutes';
import pool from './config/database';
import { getBlockchainStatus } from './utils/blockchainService';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// CORS Configuration
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'authorization'],
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

// Pharmaceutical Supply Chain Routes
app.use('/api/pharma/batch', batchRoutes);
app.use('/api/pharma/alerts', alertRoutes);
app.use('/api/pharma/location', locationRoutes);
app.use('/api/pharma/simulate', simulationRoutes);
app.use('/api/pharma/verify', verifyRoutes);
app.use('/api/pharma/risk', riskRoutes);
app.use('/api/pharma/secure-os', secureOsRoutes);

// Blockchain Routes
app.use('/api/blockchain', blockchainRoutes);

// Database health check endpoint
app.get('/api/health/db', async (_req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.status(200).json({ 
      status: 'connected',
      timestamp: result.rows[0].now 
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Unified system health endpoint for hackathon demos
app.get('/api/health/system', async (_req, res) => {
  try {
    const [dbResult, blockchainStatus, batchStats, alertStats] = await Promise.all([
      pool.query('SELECT NOW() as now'),
      getBlockchainStatus(),
      pool.query(
        `SELECT 
          COUNT(*)::int AS total_batches,
          COUNT(*) FILTER (WHERE status = 'delivered')::int AS delivered_batches,
          COUNT(*) FILTER (WHERE status = 'compromised')::int AS compromised_batches,
          COUNT(*) FILTER (WHERE current_stage = 'pharmacy')::int AS pharmacy_batches
        FROM batches`
      ),
      pool.query(
        `SELECT 
          COUNT(*)::int AS total_alerts,
          COUNT(*) FILTER (WHERE resolved = false)::int AS active_alerts
        FROM alerts`
      )
    ]);

    res.status(200).json({
      success: true,
      data: {
        environment: process.env.NODE_ENV || 'development',
        serverTime: dbResult.rows[0].now,
        services: {
          database: {
            connected: true
          },
          blockchain: {
            enabled: blockchainStatus.enabled,
            connected: blockchainStatus.connected,
            contractAddress: blockchainStatus.contractAddress || null,
            hashCount: blockchainStatus.hashCount ?? 0,
            error: blockchainStatus.error || null
          }
        },
        metrics: {
          ...batchStats.rows[0],
          ...alertStats.rows[0]
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch system health'
    });
  }
});

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Test database connection
  try {
    await pool.query('SELECT NOW()');
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error instanceof Error ? error.message : error);
  }

  // Check blockchain connection
  try {
    const blockchainStatus = await getBlockchainStatus();
    if (blockchainStatus.enabled) {
      if (blockchainStatus.connected) {
        console.log('⛓️  Blockchain connected successfully');
        console.log(`   Contract: ${blockchainStatus.contractAddress}`);
        console.log(`   Hashes stored: ${blockchainStatus.hashCount}`);
      } else {
        console.log('⚠️  Blockchain enabled but not connected');
        console.log(`   ${blockchainStatus.error}`);
      }
    } else {
      console.log('ℹ️  Blockchain disabled (running in local mode)');
    }
  } catch (error) {
    console.log('⚠️  Blockchain status check failed');
  }
});

export default app;
