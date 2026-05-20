import { useState } from 'react';
import { Divider, ToolbarFilter } from '@patternfly/react-core';
import {
  Select,
  SelectGroup,
  SelectOption,
  SelectVariant,
} from '@patternfly/react-core/deprecated';
import { FilterIcon } from '@patternfly/react-icons/dist/esm/icons/filter-icon';

export const MENU_DIVIDER = '--divider--';

type MultiSelectProps = {
  label: string;
  filterKey: string;
  placeholderText?: string;
  defaultExpanded?: boolean;
  toggleAriaLabel?: string;
  values: string[];
  setValues: (filters: string[]) => void;
  options: { key: string; count?: number; label?: string }[];
};

export const MultiSelect = ({
  label,
  filterKey,
  placeholderText,
  defaultExpanded,
  toggleAriaLabel,
  values,
  setValues,
  options,
}: MultiSelectProps) => {
  const [expanded, setExpanded] = useState(defaultExpanded ?? false);

  const chipLabels = values.map((v) => options.find((o) => o.key === v)?.label ?? v);
  const labelToKey = options
    ? options.reduce(
        (acc, curr) => {
          acc[curr.label ?? curr.key] = curr.key;
          return acc;
        },
        {} as Record<string, string>,
      )
    : undefined;

  return (
    <ToolbarFilter
      chips={chipLabels}
      deleteChip={(_type, chip) => {
        const key = labelToKey ? labelToKey[chip as string] ?? chip : chip;
        setValues(values.filter((v) => v !== key));
      }}
      deleteChipGroup={() => {
        setValues([]);
      }}
      categoryName={label}
    >
      <Select
        placeholderText={placeholderText ?? label}
        toggleIcon={<FilterIcon />}
        toggleAriaLabel={toggleAriaLabel ?? `${label} filter menu`}
        variant={SelectVariant.checkbox}
        isOpen={expanded}
        onToggle={(_, exp: boolean) => setExpanded(exp)}
        onSelect={(event, selection) => {
          const checked = (event.target as HTMLInputElement).checked;
          setValues(
            checked
              ? [...values, String(selection)]
              : values.filter((value) => value !== selection),
          );
        }}
        selections={values}
        isGrouped
      >
        {[
          <SelectGroup label={label} key={filterKey}>
            {options.map((filter) =>
              filter.key.startsWith(MENU_DIVIDER) ? (
                <Divider key={filter.key} />
              ) : (
                <SelectOption
                  key={filter.key}
                  value={filter.key}
                  isChecked={values.includes(filter.key)}
                >
                  {filter.label ?? filter.key}
                </SelectOption>
              ),
            )}
          </SelectGroup>,
        ]}
      </Select>
    </ToolbarFilter>
  );
};
