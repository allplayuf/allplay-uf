/**
 * Health Check Endpoint
 * Returns service health status and basic metrics
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

const startTime = Date.now();
const deploymentId = Deno.env.get('DENO_DEPLOYMENT_ID') || 'local';
const environment = Deno.env.get('DENO_ENV') || 'development';

// Simple request counter
let requestCount = 0;
let errorCount = 0;

// Export for other functions to use
export function incrementRequestCount() {
  requestCount++;
}

export function incrementErrorCount() {
  errorCount++;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Check database connectivity
    let dbHealthy = true;
    let dbLatency = 0;
    
    try {
      const dbStart = Date.now();
      await base44.asServiceRole.entities.Venue.list(); // Simple query
      dbLatency = Date.now() - dbStart;
    } catch (error) {
      dbHealthy = false;
      console.error('Database health check failed:', error);
    }
    
    // Calculate uptime
    const uptime = Date.now() - startTime;
    const uptimeSeconds = Math.floor(uptime / 1000);
    const uptimeMinutes = Math.floor(uptimeSeconds / 60);
    const uptimeHours = Math.floor(uptimeMinutes / 60);
    
    // Calculate error rate
    const errorRate = requestCount > 0 ? (errorCount / requestCount * 100).toFixed(2) : 0;
    
    // Health status
    const healthy = dbHealthy;
    const status = healthy ? 'healthy' : 'unhealthy';
    
    const response = {
      status,
      timestamp: new Date().toISOString(),
      environment,
      deploymentId,
      uptime: {
        ms: uptime,
        seconds: uptimeSeconds,
        formatted: `${uptimeHours}h ${uptimeMinutes % 60}m ${uptimeSeconds % 60}s`
      },
      checks: {
        database: {
          status: dbHealthy ? 'up' : 'down',
          latencyMs: dbLatency
        }
      },
      metrics: {
        requestCount,
        errorCount,
        errorRate: `${errorRate}%`
      },
      version: '1.0.0'
    };
    
    return Response.json(response, { 
      status: healthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
    
  } catch (error) {
    console.error('Health check error:', error);
    
    return Response.json({
      status: 'error',
      error: 'Health check failed',
      timestamp: new Date().toISOString()
    }, { 
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  }
});