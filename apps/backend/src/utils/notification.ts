import axios from 'axios';
import type { NotificationConfig, TaskExecutionLog } from '../types/index.js';
import logger from './logger.js';

/**
 * 发送通知
 */
export async function sendNotification(
  config: NotificationConfig,
  log: TaskExecutionLog
): Promise<void> {
  if (!config.enabled) {
    return;
  }

  try {
    switch (config.type) {
      case 'webhook':
        await sendWebhookNotification(config, log);
        break;
      case 'email':
        // Email 通知暂时不实现，可以后续添加
        logger.warn('Email notifications not implemented yet');
        break;
      default:
        logger.warn(`Unknown notification type: ${config.type}`);
    }
  } catch (error) {
    logger.error('Failed to send notification', { error, config: config.type });
  }
}

/**
 * 发送 Webhook 通知
 */
async function sendWebhookNotification(
  config: NotificationConfig,
  log: TaskExecutionLog
): Promise<void> {
  if (!config.webhook) {
    throw new Error('Webhook config is missing');
  }

  const { url, method = 'POST', headers = {}, template } = config.webhook;

  // 构建通知内容
  const payload = template
    ? parseTemplate(template, log)
    : {
        taskId: log.taskId,
        status: log.status,
        message: log.message,
        details: log.details,
        startedAt: log.startedAt,
        finishedAt: log.finishedAt,
      };

  await axios({
    method,
    url,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    data: payload,
    timeout: 10000,
  });

  logger.info('Webhook notification sent', { url, status: log.status });
}

/**
 * 解析通知模板
 */
function parseTemplate(template: string, log: TaskExecutionLog): unknown {
  try {
    // 简单的模板变量替换
    let result = template;
    result = result.replace(/\{\{taskId\}\}/g, log.taskId);
    result = result.replace(/\{\{status\}\}/g, log.status);
    result = result.replace(/\{\{message\}\}/g, log.message || '');
    result = result.replace(/\{\{startedAt\}\}/g, log.startedAt.toISOString());
    result = result.replace(
      /\{\{finishedAt\}\}/g,
      log.finishedAt?.toISOString() || ''
    );

    return JSON.parse(result);
  } catch (error) {
    logger.error('Failed to parse notification template', { error, template });
    return { error: 'Failed to parse template' };
  }
}

/**
 * 批量发送通知
 */
export async function sendBatchNotifications(
  configs: NotificationConfig[],
  log: TaskExecutionLog
): Promise<void> {
  const promises = configs.map((config) => sendNotification(config, log));
  await Promise.allSettled(promises);
}
