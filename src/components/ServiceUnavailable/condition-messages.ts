import { ConditionKey } from '~/feature-flags/conditions';

export const DEFAULT_SERVICE_UNAVAILABLE_MESSAGE =
  'The required service is not available in this cluster.';

export const SERVICE_UNAVAILABLE_MESSAGES: Partial<Record<ConditionKey, string>> = {
  isKiteServiceEnabled: 'Kite Service is not available in this cluster.',
};

export const getServiceUnavailableMessage = (condition: string | null): string => {
  if (!condition) {
    return DEFAULT_SERVICE_UNAVAILABLE_MESSAGE;
  }

  return SERVICE_UNAVAILABLE_MESSAGES[condition as ConditionKey] ?? DEFAULT_SERVICE_UNAVAILABLE_MESSAGE;
};
