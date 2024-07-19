import crypto from 'crypto';

const cryptoHash = (token: string): string =>
  crypto.createHash('sha256').update(token).digest('hex');

export default cryptoHash;
