import express from 'express';
import auth from './controllers/auth';

const router = express.Router();

router.post('/login', auth.login);
router.post('/logout', auth.logout);
router.post('/signup', auth.signup);

export default router;
