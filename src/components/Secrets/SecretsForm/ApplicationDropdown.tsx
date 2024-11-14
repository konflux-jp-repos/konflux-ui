import React from 'react';
import { useField } from 'formik';
import { useApplications } from '../../../hooks/useApplications';
import DropdownField from '../../../shared/components/formik-fields/DropdownField';
import { useWorkspaceInfo } from '../../Workspace/useWorkspaceInfo';

type ApplicationDropdownProps = Omit<
  React.ComponentProps<typeof DropdownField>,
  'items' | 'label' | 'placeholder'
>;

export const ApplicationDropdown: React.FC<React.PropsWithChildren<ApplicationDropdownProps>> = (
  props,
) => {
  const { namespace, workspace } = useWorkspaceInfo();
  const [applications, loaded] = useApplications(namespace, workspace);
  const [, , { setValue }] = useField<string>(props.name);

  const dropdownItems = React.useMemo(
    () =>
      loaded ? applications.map((a) => ({ key: a.metadata.name, value: a.metadata.name })) : [],
    [applications, loaded],
  );

  return (
    <DropdownField
      {...props}
      label="Select application"
      placeholder={!loaded ? 'Loading applications...' : 'Select application'}
      isDisabled={props.isDisabled || !loaded}
      items={dropdownItems}
      onChange={(app: string) => setValue(app)}
    />
  );
};