import { Icon } from '@common/Icon';
import { GUIDE_BLUE } from '@constants/data';
import {
  ActionIcon,
  Box,
  Button,
  ColorInput,
  Group,
  Modal,
  NumberInput,
  Select,
  Stack,
  Text,
  TextInput,
  Title,
  UnstyledButton,
} from '@mantine/core';
import { ContextModalProps, modals } from '@mantine/modals';
import { useState } from 'react';
import { SelectIconModalContents } from './SelectIconModal';
import { Encounter } from '@typing/content';
import _ from 'lodash-es';
import { SelectIcon, stringifyIconValue } from '@common/IconDisplay';

export default function UpdateEncounterModal({
  context,
  id,
  innerProps,
}: ContextModalProps<{
  encounter: Encounter;
  onUpdate: (encounter: Encounter) => void;
  onDelete: () => void;
}>) {
  const [title, setTitle] = useState(innerProps.encounter.name);
  const [icon, setIcon] = useState(innerProps.encounter.icon);
  const [color, setColor] = useState(innerProps.encounter.color);
  const [partySize, setPartySize] = useState(innerProps.encounter.meta_data.party_size);
  const [partyLevel, setPartyLevel] = useState(innerProps.encounter.meta_data.party_level);
  const [description, setDescription] = useState(innerProps.encounter.meta_data.description);

  const [openedModal, setOpenedModal] = useState(false);

  const openConfirmModal = () =>
    modals.openConfirmModal({
      title: <Title order={4}>Delete Encounter</Title>,
      children: <Text size='sm'>Are you sure you want to delete this encounter?</Text>,
      labels: { confirm: 'Confirm', cancel: 'Cancel' },
      onCancel: () => {},
      onConfirm: () => {
        innerProps.onDelete();
        context.closeModal(id);
      },
      zIndex: 1001,
    });

  return (
    <Stack style={{ position: 'relative' }}>
      <TextInput
        label='Title'
        defaultValue={title}
        placeholder='Title'
        onChange={async (e) => {
          setTitle(e.currentTarget.value);
        }}
        w={150}
      />

      <Group wrap='nowrap'>
        <NumberInput
          label='Party Size'
          placeholder='Party Size'
          w={120}
          min={0}
          value={partySize}
          onChange={(value) => {
            setPartySize(value ? parseInt(`${value}`) : undefined);
          }}
        />
        <Select
          label='Party Level'
          data={Array.from({ length: 31 }, (_, i) => i.toString())}
          w={120}
          value={partyLevel?.toString()}
          onChange={(value) => {
            setPartyLevel(value ? parseInt(value) : undefined);
          }}
        />
      </Group>

      <SelectIcon
        iconOnly
        strValue={stringifyIconValue({ type: 'icon', value: icon, color })}
        setValue={(strValue, iconValue) => {
          setIcon(iconValue.value);
          setColor(iconValue.color ?? GUIDE_BLUE);
        }}
      />

      <Group justify='space-between'>
        <Button variant='light' size='compact-xs' color='red' onClick={() => openConfirmModal()}>
          Delete Encounter
        </Button>
        <Group justify='flex-end'>
          <Button variant='default' onClick={() => context.closeModal(id)}>
            Cancel
          </Button>
          <Button
            disabled={!title.trim() || !icon || !color}
            onClick={() => {
              innerProps.onUpdate({
                ..._.cloneDeep(innerProps.encounter),
                name: title,
                icon,
                color,
                meta_data: {
                  ..._.cloneDeep(innerProps.encounter).meta_data,
                  description,
                  party_size: partySize,
                  party_level: partyLevel,
                },
              });
              context.closeModal(id);
            }}
          >
            Update
          </Button>
        </Group>
      </Group>
    </Stack>
  );
}