import * as jwt from 'jsonwebtoken';

export const checkTokens = (
  access: string,
  refresh: string,
  secret: string,
) => {
  try {
    const accessPayload = jwt.verify(access, secret);
    const refreshPayload = jwt.verify(refresh, secret);
    return [accessPayload as jwt.JwtPayload, refreshPayload as jwt.JwtPayload];
  } catch (e) {
    console.error(e);
    throw new jwt.JsonWebTokenError('Invalid token');
  }
};
