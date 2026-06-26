import { SERVICE_UNAVAILABLE_PATH } from '../paths';

describe('Service unavailable path configuration', () => {
  it('should be defined with the expected path', () => {
    expect(SERVICE_UNAVAILABLE_PATH.path).toBe('service-unavailable');
  });

  it('should generate the correct URL', () => {
    expect(SERVICE_UNAVAILABLE_PATH.createPath({} as never)).toBe('/service-unavailable');
  });
});
