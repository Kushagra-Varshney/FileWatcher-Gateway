import { Router } from 'express';
import MessageController from '../controllers/messageController';

const createMessageRoutes = (messageController: MessageController): Router => {
  const router = Router();

  router.post('/publish', messageController.receiveMessage.bind(messageController));

  return router;
};

export default createMessageRoutes;