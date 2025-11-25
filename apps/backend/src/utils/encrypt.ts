import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

/**
 * 从密钥派生加密密钥
 */
function deriveKey(password: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(password, salt, 100000, KEY_LENGTH, 'sha512');
}

/**
 * 加密数据
 * @param text 要加密的文本
 * @param secretKey 密钥
 * @returns 加密后的字符串（包含 salt、iv、tag 和加密数据）
 */
export function encrypt(text: string, secretKey: string): string {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const key = deriveKey(secretKey, salt);
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const tag = cipher.getAuthTag();

  // 格式: salt:iv:tag:encrypted
  return `${salt.toString('hex')}:${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
}

/**
 * 解密数据
 * @param encryptedText 加密的文本
 * @param secretKey 密钥
 * @returns 解密后的原始文本
 */
export function decrypt(encryptedText: string, secretKey: string): string {
  const parts = encryptedText.split(':');

  if (parts.length !== 4) {
    throw new Error('Invalid encrypted data format');
  }

  const salt = Buffer.from(parts[0]!, 'hex');
  const iv = Buffer.from(parts[1]!, 'hex');
  const tag = Buffer.from(parts[2]!, 'hex');
  const encrypted = parts[3];

  const key = deriveKey(secretKey, salt);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  //@ts-ignore
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  //@ts-ignore
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * 生成随机密钥
 * @param length 密钥长度（默认 32 字节）
 * @returns 十六进制格式的随机密钥
 */
export function generateKey(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * 哈希数据（用于密码等）
 * @param data 要哈希的数据
 * @returns 哈希后的字符串
 */
export function hash(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * 验证哈希
 * @param data 原始数据
 * @param hashedData 哈希后的数据
 * @returns 是否匹配
 */
export function verifyHash(data: string, hashedData: string): boolean {
  return hash(data) === hashedData;
}
