import { useState, useEffect, useRef } from 'react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';

interface CronPickerProps {
  value?: string;
  onChange?: (cron: string) => void;
}

type PeriodType = 'minute' | 'hour' | 'day' | 'week' | 'month' | 'custom';

export function CronPicker({ value = '0 * * * *', onChange }: CronPickerProps) {
  const [period, setPeriod] = useState<PeriodType>('hour');
  const [minute, setMinute] = useState('0');
  const [hour, setHour] = useState('0');
  const [dayOfMonth, setDayOfMonth] = useState('1');
  const [weekDay, setWeekDay] = useState('1');
  const [customCron, setCustomCron] = useState('');

  const { t } = useTranslation();

  // 使用 ref 追踪是否正在内部更新（避免 onChange 回调导致的循环）
  const isInternalUpdate = useRef(false);
  const initializedRef = useRef(false);

  // 从 cron 表达式解析并更新状态
  const parseCron = (cronValue: string) => {
    const parts = cronValue.split(' ');
    if (parts.length === 5) {
      const [min = '0', hr = '0', dom = '1', month = '*', dow = '*'] = parts;

      // 尝试识别预设类型
      if (cronValue === '* * * * *') {
        setPeriod('minute');
      } else if (hr === '*' && dom === '*' && month === '*' && dow === '*') {
        setPeriod('hour');
        setMinute(min);
      } else if (dom === '*' && month === '*' && dow === '*') {
        setPeriod('day');
        setMinute(min);
        setHour(hr);
      } else if (dom === '*' && month === '*' && dow !== '*') {
        setPeriod('week');
        setMinute(min);
        setHour(hr);
        setWeekDay(dow);
      } else if (month === '*' && dow === '*') {
        setPeriod('month');
        setMinute(min);
        setHour(hr);
        setDayOfMonth(dom);
      } else {
        setPeriod('custom');
        setCustomCron(cronValue);
      }
    }
  };

  // 初始化和外部 value 变化时解析
  useEffect(() => {
    if (!initializedRef.current) {
      // 首次初始化
      initializedRef.current = true;
      parseCron(value);
    } else if (!isInternalUpdate.current) {
      // 外部 value 变化时更新
      parseCron(value);
    }
  }, [value]);

  // 生成 cron 表达式并通知父组件
  useEffect(() => {
    let cron = '';

    switch (period) {
      case 'minute':
        cron = '* * * * *';
        break;
      case 'hour':
        cron = `${minute} * * * *`;
        break;
      case 'day':
        cron = `${minute} ${hour} * * *`;
        break;
      case 'week':
        cron = `${minute} ${hour} * * ${weekDay}`;
        break;
      case 'month':
        cron = `${minute} ${hour} ${dayOfMonth} * *`;
        break;
      case 'custom':
        cron = customCron;
        break;
    }

    // 只在用户操作时调用 onChange（初始化后且 cron 有效且与当前 value 不同）
    if (initializedRef.current && cron && cron !== value && onChange) {
      isInternalUpdate.current = true;
      onChange(cron);
      // 下一个事件循环重置标志
      setTimeout(() => {
        isInternalUpdate.current = false;
      }, 0);
    }
  }, [period, minute, hour, dayOfMonth, weekDay, customCron]);

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const weekDays = [
    { value: '0', label: t('cron.weekDays.sunday') },
    { value: '1', label: t('cron.weekDays.monday') },
    { value: '2', label: t('cron.weekDays.tuesday') },
    { value: '3', label: t('cron.weekDays.wednesday') },
    { value: '4', label: t('cron.weekDays.thursday') },
    { value: '5', label: t('cron.weekDays.friday') },
    { value: '6', label: t('cron.weekDays.saturday') },
  ];

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>{t('cron.title')}</Label>
        <Select
          value={period}
          onValueChange={(val) => setPeriod(val as PeriodType)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="minute">{t('cron.minute')}</SelectItem>
            <SelectItem value="hour">{t('cron.hour')}</SelectItem>
            <SelectItem value="day">{t('cron.day')}</SelectItem>
            <SelectItem value="week">{t('cron.week')}</SelectItem>
            <SelectItem value="month">{t('cron.month')}</SelectItem>
            <SelectItem value="custom">{t('cron.custom')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {period === 'hour' && (
        <div className="space-y-2">
          <Label>{t('cron.minuteLabel')}</Label>
          <Select value={minute} onValueChange={setMinute}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-[200px]">
              {minutes.map((m) => (
                <SelectItem key={m} value={String(m)}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {(period === 'day' || period === 'week' || period === 'month') && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('cron.hourLabel')}</Label>
              <Select value={hour} onValueChange={setHour}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {hours.map((h) => (
                    <SelectItem key={h} value={String(h)}>
                      {h}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('cron.minuteLabel')}</Label>
              <Select value={minute} onValueChange={setMinute}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {minutes.map((m) => (
                    <SelectItem key={m} value={String(m)}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </>
      )}

      {period === 'week' && (
        <div className="space-y-2">
          <Label>{t('cron.weekDayLabel')}</Label>
          <Select value={weekDay} onValueChange={setWeekDay}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {weekDays.map((day) => (
                <SelectItem key={day.value} value={day.value}>
                  {day.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {period === 'month' && (
        <div className="space-y-2">
          <Label>{t('cron.dayLabel')}</Label>
          <Select value={dayOfMonth} onValueChange={setDayOfMonth}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-[200px]">
              {days.map((d) => (
                <SelectItem key={d} value={String(d)}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {period === 'custom' && (
        <div className="space-y-2">
          <Label>{t('cron.customLabel')}</Label>
          <Input
            value={customCron}
            onChange={(e) => setCustomCron(e.target.value)}
            placeholder="* * * * *"
          />
          <p className="text-sm text-muted-foreground">{t('cron.formatTip')}</p>
        </div>
      )}

      <div className="rounded-lg bg-muted p-3">
        <p className="text-sm font-medium mb-1">
          {t('cron.cronExpressionLabel')}:
        </p>
        <code className="text-sm">
          {period === 'custom'
            ? customCron
            : (() => {
                switch (period) {
                  case 'minute':
                    return '* * * * *';
                  case 'hour':
                    return `${minute} * * * *`;
                  case 'day':
                    return `${minute} ${hour} * * *`;
                  case 'week':
                    return `${minute} ${hour} * * ${weekDay}`;
                  case 'month':
                    return `${minute} ${hour} ${dayOfMonth} * *`;
                  default:
                    return '';
                }
              })()}
        </code>
        <p className="text-xs text-muted-foreground mt-2">
          {period === 'minute' && t('cron.descriptions.minute')}
          {period === 'hour' && t('cron.descriptions.hour', { minute })}
          {period === 'day' &&
            t('cron.descriptions.day', {
              hour,
              minute: minute.padStart(2, '0'),
            })}
          {period === 'week' &&
            t('cron.descriptions.week', {
              weekDay: weekDays.find((d) => d.value === weekDay)?.label,
              hour,
              minute: minute.padStart(2, '0'),
            })}
          {period === 'month' &&
            t('cron.descriptions.month', {
              day: dayOfMonth,
              hour,
              minute: minute.padStart(2, '0'),
            })}
        </p>
      </div>
    </div>
  );
}
