import * as React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Button,
  ButtonVariant,
  EmptyState,
  EmptyStateBody,
  EmptyStateFooter,
  EmptyStateHeader,
  EmptyStateIcon,
  EmptyStateVariant,
} from '@patternfly/react-core';
import { ExclamationCircleIcon } from '@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon';
import { css } from '@patternfly/react-styles';
import { getServiceUnavailableMessage } from './condition-messages';

import '~/shared/components/empty-state/EmptyState.scss';

const ServiceUnavailableState: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const message = getServiceUnavailableMessage(searchParams.get('condition'));

  return (
    <EmptyState
      className={css('app-empty-state')}
      variant={EmptyStateVariant.full}
      data-test="service-unavailable-state"
    >
      <EmptyStateHeader
        titleText="Service unavailable"
        icon={
          <EmptyStateIcon
            className={css('app-empty-state__icon m-is-error')}
            icon={ExclamationCircleIcon}
          />
        }
        headingLevel="h2"
      />
      <EmptyStateBody>{message}</EmptyStateBody>
      <EmptyStateFooter>
        <Button
          variant={ButtonVariant.primary}
          data-test="service-unavailable-action"
          onClick={() => navigate('/')}
        >
          Go to Overview page
        </Button>
      </EmptyStateFooter>
    </EmptyState>
  );
};

export default ServiceUnavailableState;
