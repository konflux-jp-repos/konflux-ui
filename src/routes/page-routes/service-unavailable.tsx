import ServiceUnavailableState from '~/components/ServiceUnavailable/ServiceUnavailableState';
import { SERVICE_UNAVAILABLE_PATH } from '../paths';

const serviceUnavailableRoutes = [
  {
    path: SERVICE_UNAVAILABLE_PATH.path,
    element: <ServiceUnavailableState />,
  },
];

export default serviceUnavailableRoutes;
