import {
  ActionIcon,
  Box,
  Group,
  Input,
  InputWrapperProps,
  LoadingOverlay,
  Paper,
  Text,
  Tooltip,
  useMantineTheme,
} from '@mantine/core';
import { Dropzone, FileWithPath } from '@mantine/dropzone';
import { useDidUpdate } from '@mantine/hooks';
import { MediaType } from '@prisma/client';
import { IconPhoto, IconTrash, IconUpload, IconX } from '@tabler/icons-react';
import { isEqual } from 'lodash-es';
import { useEffect, useState } from 'react';

import { EdgeMedia } from '~/components/EdgeMedia/EdgeMedia';
import { useCFImageUpload } from '~/hooks/useCFImageUpload';
import { IMAGE_MIME_TYPE } from '~/server/common/mime-types';

type SimpleImageUploadProps = Omit<InputWrapperProps, 'children' | 'onChange'> & {
  value?: string | { url: string };
  onChange?: (value: CustomFile | null) => void;
  previewWidth?: number;
};

export function SimpleImageUpload({ value, onChange, ...props }: SimpleImageUploadProps) {
  const theme = useMantineTheme();
  const { uploadToCF, files: imageFiles } = useCFImageUpload();
  // const [files, filesHandlers] = useListState<CustomFile>(value ? [{ url: value }] : []);
  const [image, setImage] = useState<CustomFile | undefined>();

  const handleDrop = async (droppedFiles: FileWithPath[]) => {
    const [file] = droppedFiles;
    const toUpload = { url: URL.createObjectURL(file), file };
    setImage((current) => ({
      ...current,
      previewUrl: toUpload.url,
      url: '',
      file: toUpload.file,
    }));

    const { id } = await uploadToCF(toUpload.file);
    setImage((current) => ({ ...current, url: id, file: undefined, previewUrl: undefined }));
    URL.revokeObjectURL(toUpload.url);
  };

  const handleRemove = () => {
    setImage(undefined);
    onChange?.(null);
  };

  useEffect(() => {
    const newValue =
      typeof value === 'string' ? (value.length > 0 ? { url: value } : undefined) : value;

    if (!isEqual(image, newValue))
      setImage(typeof value === 'string' ? (value.length > 0 ? { url: value } : undefined) : value);
  }, [image, value]);

  useDidUpdate(() => {
    const [imageFile] = imageFiles;
    if (imageFile.status === 'success') {
      const { id, url, status, ...file } = imageFile;
      onChange?.({ ...image, ...file, url: id });
    }
    // don't disable the eslint-disable
  }, [imageFiles]); // eslint-disable-line

  const [match] = imageFiles;
  const showLoading = match && match.progress < 100 && !image?.url;

  return (
    <Input.Wrapper {...props}>
      {showLoading ? (
        <Paper
          style={{ position: 'relative', marginTop: 5, width: '100%', height: 200 }}
          withBorder
        >
          <LoadingOverlay visible />
        </Paper>
      ) : image && (image.previewUrl || image.url) ? (
        <div style={{ position: 'relative', width: '100%', marginTop: 5 }}>
          <Tooltip label="Remove image">
            <ActionIcon
              size="sm"
              variant="light"
              color="red"
              onClick={handleRemove}
              sx={(theme) => ({
                position: 'absolute',
                top: theme.spacing.xs * 0.4,
                right: theme.spacing.xs * 0.4,
              })}
            >
              <IconTrash />
            </ActionIcon>
          </Tooltip>

          <Box
            sx={(theme) => ({
              height: 'calc(100vh / 3)',
              '& > img': {
                height: '100%',
                objectFit: 'cover',
                borderRadius: theme.radius.md,
              },
            })}
          >
            <EdgeMedia src={image.previewUrl ?? image.url} type={MediaType.image} width={450} />
          </Box>
        </div>
      ) : (
        <Dropzone
          onDrop={handleDrop}
          accept={IMAGE_MIME_TYPE}
          maxFiles={1}
          mt={5}
          styles={(theme) => ({
            root: !!props.error
              ? {
                  borderColor: theme.colors.red[6],
                  marginBottom: theme.spacing.xs / 2,
                }
              : undefined,
          })}
        >
          <Dropzone.Accept>
            <Group position="center" spacing="xs">
              <IconUpload
                size={32}
                stroke={1.5}
                color={theme.colors[theme.primaryColor][theme.colorScheme === 'dark' ? 4 : 6]}
              />
              <Text color="dimmed">Drop image here</Text>
            </Group>
          </Dropzone.Accept>
          <Dropzone.Reject>
            <Group position="center" spacing="xs">
              <IconX
                size={32}
                stroke={1.5}
                color={theme.colors.red[theme.colorScheme === 'dark' ? 4 : 6]}
              />
              <Text>File not accepted</Text>
            </Group>
          </Dropzone.Reject>
          <Dropzone.Idle>
            <Group position="center" spacing="xs">
              <IconPhoto size={32} stroke={1.5} />
              <Text color="dimmed">Drop image here</Text>
            </Group>
          </Dropzone.Idle>
        </Dropzone>
      )}
    </Input.Wrapper>
  );
}
