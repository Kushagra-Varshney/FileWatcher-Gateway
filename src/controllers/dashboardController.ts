import { Request, Response } from 'express';
import EnhancedAnalyticsService from '../services/enhancedAnalytics';
import DatabaseService from '../services/database';

class DashboardController {
  constructor(
    private analyticsService: EnhancedAnalyticsService,
    private databaseService: DatabaseService
  ) {}

  async getAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const clientMacAddress = req.query.clientMacAddress as string;
      const dashboardData = await this.analyticsService.getDashboardData(clientMacAddress);
      res.status(200).json(dashboardData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      res.status(500).json({ 
        error: 'Failed to fetch analytics data',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getHealth(req: Request, res: Response): Promise<void> {
    try {
      const dbHealth = await this.databaseService.healthCheck();
      const isHealthy = dbHealth.status === 'healthy';
      
      res.status(isHealthy ? 200 : 503).json({
        status: isHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        service: 'nazarts-gateway',
        database: dbHealth
      });
    } catch (error) {
      console.error('Error in health check:', error);
      res.status(500).json({ 
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }

  async getClients(_req: Request, res: Response): Promise<void> {
    try {
      const clients = await this.analyticsService.getUniqueClients();
      res.status(200).json({
        clients,
        count: clients.length
      });
    } catch (error) {
      console.error('Error fetching clients:', error);
      res.status(500).json({ 
        error: 'Failed to fetch clients data',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getClientAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const { clientMacAddress } = req.params;
      
      if (!clientMacAddress) {
        res.status(400).json({ 
          error: 'Client MAC address is required'
        });
        return;
      }

      const clientAnalytics = await this.analyticsService.getClientAnalytics(clientMacAddress);
      
      if (!clientAnalytics) {
        res.status(404).json({ 
          error: 'Client not found'
        });
        return;
      }

      res.status(200).json(clientAnalytics);
    } catch (error) {
      console.error('Error fetching client analytics:', error);
      res.status(500).json({ 
        error: 'Failed to fetch client analytics',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

export default DashboardController;