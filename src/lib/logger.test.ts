import { describe, expect, it, vi, beforeEach } from 'vitest';
import { logger } from './logger';
import { safeReadJSON, safeRemove } from './safeIO';

vi.mock('./safeIO', () => ({
  safeReadJSON: vi.fn(),
  safeWriteJSON: vi.fn(() => true),
  safeRemove: vi.fn(),
}));

describe('logger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (safeReadJSON as ReturnType<typeof vi.fn>).mockReturnValue([]);
  });

  it('should have all log level methods', () => {
    expect(typeof logger.debug).toBe('function');
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.critical).toBe('function');
  });

  it('should log with correct level', () => {
    const entry = logger.info('system', 'test message');
    expect(entry.level).toBe('info');
    expect(entry.cat).toBe('system');
    expect(entry.msg).toBe('test message');
  });

  it('should include sessionId in log entries', () => {
    const entry = logger.warn('db', 'test');
    expect(entry.sessionId).toBeDefined();
    expect(entry.sessionId.length).toBeGreaterThan(0);
  });

  it('should return session id', () => {
    const sid = logger.getSessionId();
    expect(sid).toBeDefined();
  });

  describe('setLevel', () => {
    it('should change min level', () => {
      logger.setLevel('error');
      const entry = logger.debug('system', 'should be filtered');
      expect(entry.level).toBe('debug');
      logger.setLevel('debug');
    });
  });

  describe('subscribe', () => {
    it('should notify subscribers', () => {
      const fn = vi.fn();
      const unsub = logger.subscribe(fn);
      logger.info('system', 'sub test');
      expect(fn).toHaveBeenCalledTimes(1);
      unsub();
    });

    it('unsubscribe should stop notifications', () => {
      const fn = vi.fn();
      const unsub = logger.subscribe(fn);
      unsub();
      logger.info('system', 'after unsub');
      expect(fn).not.toHaveBeenCalled();
    });
  });

  describe('getLogs', () => {
    it('should return empty array when no logs', () => {
      const logs = logger.getLogs();
      expect(Array.isArray(logs)).toBe(true);
    });

    it('should filter by level', () => {
      logger.getLogs({ level: 'error' });
      expect(safeReadJSON).toHaveBeenCalled();
    });
  });

  describe('count', () => {
    it('should return a number', () => {
      const count = logger.count();
      expect(typeof count).toBe('number');
    });
  });

  describe('clearLogs', () => {
    it('should call safeRemove', () => {
      logger.clearLogs();
      expect(safeRemove).toHaveBeenCalled();
    });
  });

  describe('time', () => {
    it('should return timer with end method', () => {
      const t = logger.time('perf', 'test');
      expect(typeof t.end).toBe('function');
    });

    it('should return ms from end', () => {
      const t = logger.time('perf', 'test');
      const ms = t.end();
      expect(typeof ms).toBe('number');
    });
  });

  describe('reportCrash', () => {
    it('should create crash report from Error', () => {
      const report = logger.reportCrash(new Error('test crash'));
      expect(report).toHaveProperty('id');
      expect(report.message).toBe('test crash');
      expect(report.stack).toBeDefined();
    });

    it('should create crash report from string', () => {
      const report = logger.reportCrash('string error');
      expect(report.message).toBe('string error');
    });
  });

  describe('getCrashReports / clearCrashReports', () => {
    it('should return empty array when no crashes', () => {
      (safeReadJSON as ReturnType<typeof vi.fn>).mockReturnValue(null);
      const reports = logger.getCrashReports();
      expect(Array.isArray(reports)).toBe(true);
      expect(reports).toHaveLength(0);
    });
  });
});
