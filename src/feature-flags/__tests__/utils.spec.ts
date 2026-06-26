import { redirect } from 'react-router-dom';
import { ConditionState } from '~/feature-flags/conditions';
import { HttpError } from '~/k8s/error';
import { FeatureFlagsStore } from '../store';
import {
  ensureConditionIsOn,
  ensureConditionOnLoader,
  ensureFeatureFlagOnLoader,
  getAllConditionsKeysFromFlags,
  isFeatureFlagOn,
} from '../utils';

jest.mock('../store', () => ({
  FeatureFlagsStore: {
    ensureConditions: jest.fn(),
    conditions: {},
    isOn: jest.fn(),
  },
}));

type MockFeatureFlagsStore = {
  ensureConditions: jest.Mock;
  conditions: ConditionState;
  isOn: jest.Mock;
};

const mockStore = FeatureFlagsStore as unknown as MockFeatureFlagsStore;

jest.mock('../flags', () => ({
  FLAGS: {
    'issues-dashboard': {
      key: 'issues-dashboard',
      guard: {
        allOf: ['isKiteServiceEnabled'],
        failureReason: 'Kite Service is not enabled',
        visibleInFeatureFlagPanel: true,
      },
    },
    'staging-feature': {
      key: 'staging-feature',
      guard: {
        anyOf: ['isStagingCluster'],
        failureReason: 'Not staging',
        visibleInFeatureFlagPanel: false,
      },
    },
    'combined-feature': {
      key: 'combined-feature',
      guard: {
        allOf: ['isKubearchiveEnabled'],
        anyOf: ['isAnalyticsEnabled'],
        failureReason: 'Unavailable',
        visibleInFeatureFlagPanel: true,
      },
    },
    'no-guard': {
      key: 'no-guard',
    },
  },
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  redirect: jest.fn((url: string) => ({ url, status: 302 })),
}));

const mockEnsureConditions = mockStore.ensureConditions;
const mockIsOn = mockStore.isOn;

describe('feature-flags utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStore.conditions = {};
    mockIsOn.mockReturnValue(true);
    mockEnsureConditions.mockResolvedValue(undefined);
  });

  describe('isFeatureFlagOn', () => {
    it('returns the feature flag state from the store', () => {
      mockIsOn.mockReturnValueOnce(true).mockReturnValueOnce(false);

      expect(isFeatureFlagOn('issues-dashboard')).toBe(true);
      expect(isFeatureFlagOn('issues-dashboard')).toBe(false);
      expect(mockIsOn).toHaveBeenCalledWith('issues-dashboard');
    });
  });

  describe('ensureFeatureFlagOnLoader', () => {
    it('throws 404 when feature flag is off', () => {
      mockIsOn.mockReturnValue(false);

      expect(() => ensureFeatureFlagOnLoader('issues-dashboard')).toThrow(HttpError);
    });

    it('does not throw when feature flag is on', () => {
      mockIsOn.mockReturnValue(true);

      expect(() => ensureFeatureFlagOnLoader('issues-dashboard')).not.toThrow();
    });
  });

  describe('getAllConditionsKeysFromFlags', () => {
    it('returns unique condition keys from allOf and anyOf guards', () => {
      const keys = getAllConditionsKeysFromFlags();

      expect(keys.sort()).toEqual(
        [
          'isAnalyticsEnabled',
          'isKiteServiceEnabled',
          'isKubearchiveEnabled',
          'isStagingCluster',
        ].sort(),
      );
    });

    it('ignores flags without guards', () => {
      const keys = getAllConditionsKeysFromFlags();

      expect(keys).not.toContain('no-guard');
    });
  });

  describe('ensureConditionIsOn', () => {
    it('returns true when all conditions are on', () => {
      mockStore.conditions = {
        isKiteServiceEnabled: true,
        isKubearchiveEnabled: true,
      };

      expect(ensureConditionIsOn(['isKiteServiceEnabled', 'isKubearchiveEnabled'])()).toBe(true);
    });

    it('returns false when any condition is off', () => {
      mockStore.conditions = {
        isKiteServiceEnabled: true,
        isKubearchiveEnabled: false,
      };

      expect(ensureConditionIsOn(['isKiteServiceEnabled', 'isKubearchiveEnabled'])()).toBe(false);
    });

    it('returns false when a condition is undefined', () => {
      mockStore.conditions = {};

      expect(ensureConditionIsOn(['isKiteServiceEnabled'])()).toBe(false);
    });
  });

  describe('ensureConditionOnLoader', () => {
    it('evaluates conditions before checking the feature flag and guard', async () => {
      mockStore.conditions = { isKiteServiceEnabled: true };
      const callOrder: string[] = [];

      mockEnsureConditions.mockImplementation(() => {
        callOrder.push('ensureConditions');
      });
      mockIsOn.mockImplementation(() => {
        callOrder.push('isOn');
        return true;
      });

      await ensureConditionOnLoader(['isKiteServiceEnabled'], 'issues-dashboard');

      expect(callOrder).toEqual(['ensureConditions', 'isOn']);
      expect(mockEnsureConditions).toHaveBeenCalledWith(['isKiteServiceEnabled']);
    });

    it('throws 404 when feature flag is off', async () => {
      mockIsOn.mockReturnValue(false);

      await expect(
        ensureConditionOnLoader(['isKiteServiceEnabled'], 'issues-dashboard'),
      ).rejects.toThrow(HttpError);
    });

    it('redirects with condition key when condition is off', async () => {
      mockStore.conditions = { isKiteServiceEnabled: false };

      await expect(
        ensureConditionOnLoader(['isKiteServiceEnabled'], 'issues-dashboard'),
      ).rejects.toEqual(redirect('/service-unavailable?condition=isKiteServiceEnabled'));
    });

    it('redirects with the first failed condition when multiple keys are off', async () => {
      mockStore.conditions = { isKiteServiceEnabled: false, isKubearchiveEnabled: false };

      await expect(
        ensureConditionOnLoader(['isKiteServiceEnabled', 'isKubearchiveEnabled'], 'issues-dashboard'),
      ).rejects.toEqual(redirect('/service-unavailable?condition=isKiteServiceEnabled'));
    });

    it('does not throw when flag and conditions are on', async () => {
      mockStore.conditions = { isKiteServiceEnabled: true };

      await expect(
        ensureConditionOnLoader(['isKiteServiceEnabled'], 'issues-dashboard'),
      ).resolves.toBeUndefined();
    });
  });
});
