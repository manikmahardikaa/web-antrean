import jwt, { JwtPayload } from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET;

if (!SECRET) {
  throw new Error('JWT_SECRET environment variable is not defined');
}

export interface TokenPayload {
  id_user: string;
  role: string;
  [key: string]: any; // Tambahan field lain jika diperlukan
}

export const generateToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, SECRET, { expiresIn: '24h' });
};

export const verifyToken = (token: string): TokenPayload => {
  try {
    const decoded = jwt.verify(token, SECRET);
    return decoded as TokenPayload;
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      throw new Error('Token sudah kedaluwarsa');
    }
    if (err.name === 'JsonWebTokenError') {
      throw new Error('Token tidak valid');
    }
    throw new Error('Token tidak dapat diverifikasi');
  }
};
