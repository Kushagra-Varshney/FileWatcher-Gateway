import { Router } from 'express';
import DashboardController from '../controllers/dashboardController';

const createDashboardRoutes = (dashboardController: DashboardController): Router => {
  const router = Router();

  router.get('/analytics', dashboardController.getAnalytics.bind(dashboardController));
  router.get('/health', dashboardController.getHealth.bind(dashboardController));
  router.get('/clients', dashboardController.getClients.bind(dashboardController));
  router.get('/clients/:clientMacAddress', dashboardController.getClientAnalytics.bind(dashboardController));

  return router;
};

export default createDashboardRoutes;