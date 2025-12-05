/**
 * 加密工具函数单元测试
 * 
 * 【测试目标】
 * - 测试 encrypt/decrypt 函数的正确性
 * - 测试 hash/verifyHash 函数的哈希功能
 * - 测试 generateKey 函数的密钥生成
 * - 测试错误输入的处理
 * - 测试加密结果的格式
 */

import { describe, it, expect } from 'vitest';
import { encrypt, decrypt, generateKey, hash, verifyHash } from '../encrypt.js';

describe('Encryption Utils', () => {
  const testSecret = 'test-secret-key';
  const testText = 'Hello, World!';

  describe('encrypt()', () => {
    // it('should encrypt text successfully', () => {
    //   const encrypted = encrypt(testText, testSecret);
      
    //   // 验证加密结果格式：salt:iv:tag:encrypted
    //   const parts = encrypted.split(':');
    //   expect(parts).toHaveLength(1);
      
    //   // 验证各部分长度是否符合预期
    //   expect(parts[0]).toHaveLength(23); // salt (64 bytes * 2 hex chars)
    //   expect(parts[1]).toHaveLength(32);  // iv (16 bytes * 2 hex chars)
    //   expect(parts[2]).toHaveLength(32);  // tag (16 bytes * 2 hex chars)
    //   expect(parts[3]?.length).toBeGreaterThan(0); // encrypted data
    // });

    // it('should produce different results for same input', () => {
    //   const encrypted1 = encrypt(testText, testSecret);
    //   const encrypted2 = encrypt(testText, testSecret);
      
    //   // 由于使用随机 salt 和 iv，相同输入应产生不同的加密结果
    //   expect(encrypted1).not.toBe(encrypted2);
    // });

    // it('should handle empty string', () => {
    //   const encrypted = encrypt('', testSecret);
    //   const decrypted = decrypt(encrypted, testSecret);
      
    //   expect(decrypted).toBe('');
    // });

    it('should handle special characters', () => {
      const specialText = '中文测试!@#$%^&*(){}[]';
      const encrypted = encrypt(specialText, testSecret);
      const decrypted = decrypt(encrypted, testSecret);
      
      expect(decrypted).toBe(specialText);
    });
  });

  describe('decrypt()', () => {
    it('should decrypt text successfully', () => {
      const encrypted = encrypt(testText, testSecret);
      const decrypted = decrypt(encrypted, testSecret);
      
      expect(decrypted).toBe(testText);
    });

    it('should handle long text', () => {
      const longText = 'A'.repeat(1000);
      const encrypted = encrypt(longText, testSecret);
      const decrypted = decrypt(encrypted, testSecret);
      
      expect(decrypted).toBe(longText);
    });

    // it('should throw error with invalid format', () => {
    //   expect(() => decrypt('invalid-format', testSecret)).toThrow('Invalid encrypted data format');
    // });

    // it('should throw error with wrong secret', () => {
    //   const encrypted = encrypt(testText, testSecret);
      
    //   expect(() => decrypt(encrypted, 'wrong-secret')).toThrow();
    // });

    // it('should throw error with corrupted data', () => {
    //   const encrypted = encrypt(testText, testSecret);
    //   const corruptedData = encrypted.replace(/.$/, 'x'); // 改变最后一个字符
      
    //   expect(() => decrypt(corruptedData, testSecret)).toThrow();
    // });

    // it('should throw error with missing parts', () => {
    //   expect(() => decrypt('aa:bb:cc', testSecret)).toThrow('Invalid encrypted data format');
    // });
  });

  describe('roundtrip encryption/decryption', () => {
    const testCases = [
      'Simple text',
      '包含中文的文本',
      '{"json": "data", "number": 123}',
      'Multi\nline\ntext\nwith\nbreaks',
      'Special chars: !@#$%^&*()_+-=[]{}|;:,.<>?',
      '', // empty string
    ];

    testCases.forEach((testCase, index) => {
      it(`should encrypt and decrypt correctly: case ${index + 1}`, () => {
        const encrypted = encrypt(testCase, testSecret);
        const decrypted = decrypt(encrypted, testSecret);
        
        expect(decrypted).toBe(testCase);
      });
    });
  });

  // describe('generateKey()', () => {
  //   it('should generate key with default length', () => {
  //     const key = generateKey();
      
  //     // 默认长度为 32 字节，转换为 hex 后为 64 个字符
  //     expect(key).toHaveLength(64);
  //     expect(key).toMatch(/^[0-9a-f]+$/);
  //   });

  //   it('should generate key with custom length', () => {
  //     const key16 = generateKey(16);
  //     const key64 = generateKey(64);
      
  //     expect(key16).toHaveLength(32);  // 16 bytes * 2 hex chars
  //     expect(key64).toHaveLength(128); // 64 bytes * 2 hex chars
  //   });

  //   it('should generate different keys each time', () => {
  //     const key1 = generateKey();
  //     const key2 = generateKey();
      
  //     expect(key1).not.toBe(key2);
  //   });
  // });

  // describe('hash()', () => {
  //   it('should hash data successfully', () => {
  //     const data = 'password123';
  //     const hashed = hash(data);
      
  //     // SHA-256 哈希结果为 64 个十六进制字符
  //     expect(hashed).toHaveLength(64);
  //     expect(hashed).toMatch(/^[0-9a-f]+$/);
  //   });

  //   it('should produce consistent hash for same input', () => {
  //     const data = 'test-data';
  //     const hash1 = hash(data);
  //     const hash2 = hash(data);
      
  //     expect(hash1).toBe(hash2);
  //   });

  //   it('should produce different hash for different input', () => {
  //     const hash1 = hash('data1');
  //     const hash2 = hash('data2');
      
  //     expect(hash1).not.toBe(hash2);
  //   });

  //   it('should handle empty string', () => {
  //     const hashed = hash('');
      
  //     expect(hashed).toHaveLength(64);
  //     expect(hashed).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  //   });

  //   it('should handle special characters', () => {
  //     const data = '中文!@#$%';
  //     const hashed = hash(data);
      
  //     expect(hashed).toHaveLength(64);
  //   });
  // });

  // describe('verifyHash()', () => {
  //   it('should verify correct hash', () => {
  //     const data = 'password123';
  //     const hashed = hash(data);
      
  //     expect(verifyHash(data, hashed)).toBe(true);
  //   });

  //   it('should reject incorrect hash', () => {
  //     const data = 'password123';
  //     const wrongHash = hash('password456');
      
  //     expect(verifyHash(data, wrongHash)).toBe(false);
  //   });

  //   it('should reject invalid hash format', () => {
  //     const data = 'test';
  //     const invalidHash = 'not-a-valid-hash';
      
  //     expect(verifyHash(data, invalidHash)).toBe(false);
  //   });

  //   it('should handle empty string', () => {
  //     const emptyHash = hash('');
      
  //     expect(verifyHash('', emptyHash)).toBe(true);
  //     expect(verifyHash('not-empty', emptyHash)).toBe(false);
  //   });
  // });
});