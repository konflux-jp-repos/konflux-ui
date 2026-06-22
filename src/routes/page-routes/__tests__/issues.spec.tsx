import React from 'react';
import { ensureConditionOnLoader } from '~/feature-flags/utils';
import { ISSUES_PATH } from '../../paths';
import issuesRoutes from '../issues';

// Type definitions matching the actual React Router route objects
type ChildBaseRoute = {
  loader?: () => boolean;
  lazy?: () => Promise<{ Component: React.ComponentType }>;
  errorElement?: JSX.Element;
};

type IndexRoute = ChildBaseRoute & {
  index: boolean;
  path?: undefined;
};

type PathRoute = ChildBaseRoute & {
  path: string;
  index?: undefined;
};

type ChildRoute = IndexRoute | PathRoute;

type MainRoute = {
  path: string;
  loader: () => Promise<null>;
  lazy: () => Promise<{ Component: React.ComponentType }>;
  errorElement: JSX.Element;
  children: ChildRoute[];
};

// Mock the RouteErrorBoundary
jest.mock('../../RouteErrorBoundary', () => ({
  RouteErrorBoundry: () => <div data-test="error-boundary">Error Boundary</div>,
}));

// Mock the issuesPageLoader
jest.mock('~/components/Issues', () => ({
  issuesPageLoader: jest.fn(() => true),
}));

// Mock ensureConditionOnLoader so loader does not throw redirect
jest.mock('~/feature-flags/utils', () => ({
  ...jest.requireActual('~/feature-flags/utils'),
  ensureConditionOnLoader: jest.fn(),
}));

const mockEnsureConditionOnLoader = ensureConditionOnLoader as jest.Mock;

describe('Issues Routes Configuration', () => {
  it('should export an array of routes', () => {
    expect(Array.isArray(issuesRoutes)).toBe(true);
    expect(issuesRoutes).toHaveLength(1);
  });

  describe('main issues route', () => {
    let mainRoute: MainRoute;

    beforeEach(() => {
      mockEnsureConditionOnLoader.mockResolvedValue(undefined);
      [mainRoute] = issuesRoutes as [MainRoute];
    });

    it('should have correct path', () => {
      expect(mainRoute.path).toBe(ISSUES_PATH.path);
    });

    it('should have loader function', () => {
      expect(typeof mainRoute.loader).toBe('function');
    });

    it('should check kite service availability in loader', async () => {
      await mainRoute.loader();

      expect(mockEnsureConditionOnLoader).toHaveBeenCalledWith(
        ['isKiteServiceEnabled'],
        'issues-dashboard',
        'Kite Service',
      );
    });

    it('should have lazy loading function', () => {
      expect(typeof mainRoute.lazy).toBe('function');
    });

    it('should have error element', () => {
      expect(mainRoute.errorElement).toBeDefined();
      expect(React.isValidElement(mainRoute.errorElement)).toBe(true);
    });

    it('should have children routes', () => {
      expect(Array.isArray(mainRoute.children)).toBe(true);
      expect(mainRoute.children).toHaveLength(2);
    });

    it('should return Component from lazy function', async () => {
      const lazyResult = await mainRoute.lazy();

      expect(lazyResult).toHaveProperty('Component');
      expect(typeof lazyResult.Component).toBe('function');
    });
  });

  describe('overview child route', () => {
    let overviewRoute: IndexRoute;

    beforeEach(() => {
      const [route] = issuesRoutes as [MainRoute];
      const [firstChild] = route.children;
      overviewRoute = firstChild as IndexRoute;
    });

    it('should be an index route', () => {
      expect(overviewRoute.index).toBe(true);
    });

    it('should have loader function', () => {
      expect(overviewRoute.loader).toBeDefined();
      expect(typeof overviewRoute.loader).toBe('function');
    });

    it('should have lazy loading function', () => {
      expect(typeof overviewRoute.lazy).toBe('function');
    });

    it('should have error element', () => {
      expect(overviewRoute.errorElement).toBeDefined();
      expect(React.isValidElement(overviewRoute.errorElement)).toBe(true);
    });

    it('should return Component from lazy function', async () => {
      const lazyResult = await overviewRoute.lazy();

      expect(lazyResult).toHaveProperty('Component');
      expect(typeof lazyResult.Component).toBe('function');
    });
  });

  describe('list child route', () => {
    let listRoute: PathRoute;

    beforeEach(() => {
      const [route] = issuesRoutes as [MainRoute];
      const [, secondChild] = route.children;
      listRoute = secondChild as PathRoute;
    });

    it('should have correct path', () => {
      expect(listRoute.path).toBe('list');
    });

    it('should have loader function', () => {
      expect(listRoute.loader).toBeDefined();
      expect(typeof listRoute.loader).toBe('function');
    });

    it('should have lazy loading function', () => {
      expect(typeof listRoute.lazy).toBe('function');
    });

    it('should have error element', () => {
      expect(listRoute.errorElement).toBeDefined();
      expect(React.isValidElement(listRoute.errorElement)).toBe(true);
    });

    it('should return Component from lazy function', async () => {
      const lazyResult = await listRoute.lazy();

      expect(lazyResult).toHaveProperty('Component');
      expect(typeof lazyResult.Component).toBe('function');
    });
  });

  describe('route integration', () => {
    it('should use the same loader for both child routes', () => {
      const [route] = issuesRoutes as [MainRoute];
      const [firstChild, secondChild] = route.children;
      const overviewRoute = firstChild as IndexRoute;
      const listRoute = secondChild as PathRoute;

      expect(overviewRoute.loader).toBe(listRoute.loader);
    });

    it('should have error boundaries for all routes', () => {
      const [route] = issuesRoutes as [MainRoute];
      const [firstChild, secondChild] = route.children;
      const overviewRoute = firstChild as IndexRoute;
      const listRoute = secondChild as PathRoute;

      expect(route.errorElement).toBeDefined();
      expect(overviewRoute.errorElement).toBeDefined();
      expect(listRoute.errorElement).toBeDefined();
    });

    it('should call loader functions without errors', async () => {
      const [route] = issuesRoutes as [MainRoute];
      const [firstChild, secondChild] = route.children;
      const overviewRoute = firstChild as IndexRoute;
      const listRoute = secondChild as PathRoute;

      await expect(route.loader()).resolves.toBeNull();
      expect(() => overviewRoute.loader?.()).not.toThrow();
      expect(() => listRoute.loader?.()).not.toThrow();
    });
  });
});
