import { NextFunction, Request, Response } from 'express';
import { isAuthenticated } from '../controllers/auth';

const authCheck = async (req: Request, res: Response, next: NextFunction) => {
  const isAuth = await isAuthenticated(req);
  if (isAuth) {
    next();
  }
  // TODO: redirect to login
};

export default authCheck;
