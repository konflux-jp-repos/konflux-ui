import '@testing-library/jest-dom';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ServiceUnavailableState from '../ServiceUnavailableState';

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useNavigate: jest.fn(),
    useSearchParams: jest.fn(),
  };
});

const useNavigateMock = useNavigate as jest.Mock;
const useSearchParamsMock = useSearchParams as jest.Mock;

describe('ServiceUnavailableState', () => {
  let navigateMock: jest.Mock;

  beforeEach(() => {
    navigateMock = jest.fn();
    useNavigateMock.mockReturnValue(navigateMock);
    useSearchParamsMock.mockReturnValue([new URLSearchParams()]);
  });

  it('should render default message when query param is missing', () => {
    render(<ServiceUnavailableState />);

    screen.getByTestId('service-unavailable-state');
    screen.getByText('Service unavailable');
    screen.getByText('The required service is not available in this cluster.');
    screen.getByText('Go to Overview page');
  });

  it('should render message from query param', () => {
    useSearchParamsMock.mockReturnValue([
      new URLSearchParams('message=Kite Service is not available in this cluster.'),
    ]);

    render(<ServiceUnavailableState />);

    screen.getByText('Kite Service is not available in this cluster.');
  });

  it('should navigate to the overview page', async () => {
    render(<ServiceUnavailableState />);

    fireEvent.click(screen.getByTestId('service-unavailable-action'));

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/');
    });
  });
});
