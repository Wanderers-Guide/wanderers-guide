import { Button, Group, Stack, Text, TextInput } from '@mantine/core';
import { getHotkeyHandler } from '@mantine/hooks';
import { ContextModalProps } from '@mantine/modals';
import { toLabel } from '@utils/strings';
import { labelToVariable } from '@variables/variable-utils';
import { useState } from 'react';

export default function AddNewLoreModal({
  context,
  id,
  innerProps,
}: ContextModalProps<{
  onConfirm: (loreName: string) => void;
}>) {
  const [loreName, setLoreName] = useState('');

  const handleSubmit = () => {
    innerProps.onConfirm(labelToVariable(loreName));
    context.closeModal(id);
  };

  return (
    <Stack style={{ position: 'relative' }}>
      <Text fz='sm'>You gain the following lore of your choice.</Text>
      <TextInput
        placeholder='Name of Lore'
        onChange={async (e) => {
          setLoreName(e.target.value);
        }}
        onKeyDown={getHotkeyHandler([
          ['mod+Enter', handleSubmit],
          ['Enter', handleSubmit],
        ])}
      />
      {loreName && toLabel(labelToVariable(loreName)) !== loreName.trim() && (
        <Text fz='sm'>Resulting Name: {toLabel(labelToVariable(loreName))}</Text>
      )}
      <Group justify='flex-end'>
        <Button variant='default' onClick={() => context.closeModal(id)}>
          Cancel
        </Button>
        <Button disabled={!loreName} onClick={handleSubmit}>
          Add Lore
        </Button>
      </Group>
    </Stack>
  );
}
