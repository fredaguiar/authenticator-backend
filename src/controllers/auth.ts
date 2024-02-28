import express, { NextFunction, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import User, { TUser } from '../models/User';

const TOKEN_EXPIRES_MS = 60 * 60 * 1000; // 1hr
export const COOKIE_NAME = 'jid'; // 1hr
export const PRIVATE_KEY = fs.readFileSync('keys/rsa.ppk', 'utf-8');
export const PUBLIC_KEY = fs.readFileSync('keys/rsa.pub', 'utf-8');

export const isAuthenticated = async (req: Request) => {
  const token = req.cookies[COOKIE_NAME];
  if (!token) {
    return false;
  }
  jwt.verify(token, PUBLIC_KEY, { algorithms: ['RS256'] }, (err, _decoded) => {
    if (err) {
      return false;
    }
    return true;
  });
};

const authenticate = (res: Response, user: TUser) => {
  console.log('PRIVATE_KEY', PRIVATE_KEY);
  const token = jwt.sign({ id: user._id }, PRIVATE_KEY, {
    expiresIn: TOKEN_EXPIRES_MS,
    algorithm: 'RS256',
  });
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    maxAge: TOKEN_EXPIRES_MS,
  }); // TODO: secure: true
  return res.status(200).json({ name: user.name, email: user.email });
};

export const verifyJwt = (token: string) => {
  return jwt.verify(token, PUBLIC_KEY, {
    algorithms: ['RS256'],
  });
};

const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne<TUser>({ email }).exec();
    if (!user) {
      return res.status(200).json({ message: 'Authentication error' });
    }
    const auth = await bcrypt.compare(password, user.password);
    if (!auth) {
      return res.status(200).json({ message: 'Invalid user or password' });
    }
    return authenticate(res, user);
  } catch (err: any) {
    return res.status(500).json({ message: 'Internal server error', stack: err.message });
  }
};

const logout = () => {};

const signup = async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  try {
    const user = await User.create<TUser>({ name, email, password });
    return authenticate(res, user);
  } catch (err) {
    return res.status(500).json('Internal server error');
  }
};

export default { login, logout, signup };
