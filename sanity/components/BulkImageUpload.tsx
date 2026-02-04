import React, { useCallback, useState } from 'react'
import { useClient } from 'sanity'
import { Card, Stack, Button, Text, Flex, Spinner, Grid, Box } from '@sanity/ui'
import { UploadIcon, TrashIcon } from '@sanity/icons'
import { set } from 'sanity'

interface BulkImageUploadProps {
    value?: any[]
    onChange: (patches: any) => void
    schemaType: any
}

export function BulkImageUpload(props: BulkImageUploadProps) {
    const { value = [], onChange } = props
    const client = useClient({ apiVersion: '2024-01-01' })
    const [isUploading, setIsUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 })
    const [isDragging, setIsDragging] = useState(false)
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

    const uploadImages = useCallback(async (files: FileList) => {
        if (files.length === 0) return

        setIsUploading(true)
        setUploadProgress({ current: 0, total: files.length })

        const newImages: any[] = []

        for (let i = 0; i < files.length; i++) {
            const file = files[i]
            if (!file.type.startsWith('image/')) continue

            try {
                const asset = await client.assets.upload('image', file, {
                    filename: file.name,
                })

                newImages.push({
                    _type: 'image',
                    _key: 'img-' + Date.now() + '-' + i,
                    asset: {
                        _type: 'reference',
                        _ref: asset._id,
                    },
                })

                setUploadProgress({ current: i + 1, total: files.length })
            } catch (error) {
                console.error('Failed to upload ' + file.name, error)
            }
        }

        if (newImages.length > 0) {
            onChange(set([...value, ...newImages]))
        }

        setIsUploading(false)
        setUploadProgress({ current: 0, total: 0 })
    }, [client, value, onChange])

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            uploadImages(e.dataTransfer.files)
        }
    }, [uploadImages])

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }, [])

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
    }, [])

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            uploadImages(e.target.files)
        }
    }, [uploadImages])

    const handleDelete = useCallback((index: number) => {
        const newValue = [...value]
        newValue.splice(index, 1)
        onChange(set(newValue))
    }, [value, onChange])

    const handleDragStart = useCallback((index: number) => {
        setDraggedIndex(index)
    }, [])

    const handleDragEnd = useCallback(() => {
        setDraggedIndex(null)
    }, [])

    const handleDropOnImage = useCallback((targetIndex: number) => {
        if (draggedIndex === null || draggedIndex === targetIndex) return

        const newValue = [...value]
        const draggedItem = newValue.splice(draggedIndex, 1)[0]
        newValue.splice(targetIndex, 0, draggedItem)
        onChange(set(newValue))
        setDraggedIndex(null)
    }, [draggedIndex, value, onChange])

    const getImageUrl = useCallback((item: any) => {
        if (!item?.asset?._ref) return null
        const ref = item.asset._ref
        const parts = ref.split('-')
        if (parts.length < 4) return null
        const id = parts[1]
        const dimensions = parts[2]
        const format = parts[3]
        return 'https://cdn.sanity.io/images/eulheo47/production/' + id + '-' + dimensions + '.' + format + '?w=150&h=150&fit=crop'
    }, [])

    return (
        <Stack space={4}>
            <Card
                padding={4}
                radius={2}
                tone={isDragging ? 'positive' : 'default'}
                style={{
                    border: '2px dashed ' + (isDragging ? '#3ab667' : '#666'),
                    backgroundColor: isDragging ? '#1a3d2a' : '#1a1a1a',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer',
                    position: 'relative',
                }}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
            >
                <Flex direction="column" align="center" justify="center" gap={2}>
                    {isUploading ? (
                        <>
                            <Spinner />
                            <Text size={1}>
                                Wgrywanie {uploadProgress.current} z {uploadProgress.total}...
                            </Text>
                        </>
                    ) : (
                        <>
                            <UploadIcon style={{ fontSize: 32 }} />
                            <Text size={1} weight="semibold">
                                Przeciągnij tutaj wiele zdjęć naraz
                            </Text>
                            <Text size={0} muted>
                                lub kliknij aby wybrać
                            </Text>
                        </>
                    )}
                </Flex>
                <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileSelect}
                    style={{
                        position: 'absolute',
                        inset: 0,
                        opacity: 0,
                        cursor: 'pointer',
                    }}
                />
            </Card>

            {value.length > 0 && (
                <Card padding={3} radius={2} tone="default">
                    <Stack space={3}>
                        <Flex justify="space-between" align="center">
                            <Text size={1} weight="semibold">
                                {value.length} zdjęć w galerii
                            </Text>
                            <Text size={0} muted>
                                Przeciągnij aby zmienić kolejność
                            </Text>
                        </Flex>

                        <Grid columns={[3, 4, 5, 6]} gap={2}>
                            {value.map((item, index) => {
                                const imageUrl = getImageUrl(item)
                                return (
                                    <Card
                                        key={item._key || index}
                                        radius={1}
                                        style={{
                                            position: 'relative',
                                            aspectRatio: '1',
                                            overflow: 'hidden',
                                            opacity: draggedIndex === index ? 0.5 : 1,
                                            cursor: 'grab',
                                        }}
                                        draggable
                                        onDragStart={() => handleDragStart(index)}
                                        onDragEnd={handleDragEnd}
                                        onDragOver={(e: React.DragEvent) => e.preventDefault()}
                                        onDrop={() => handleDropOnImage(index)}
                                    >
                                        {imageUrl ? (
                                            <img
                                                src={imageUrl}
                                                alt={'Zdjęcie ' + (index + 1)}
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'cover',
                                                }}
                                            />
                                        ) : (
                                            <Flex align="center" justify="center" style={{ height: '100%', background: '#333' }}>
                                                <Text size={0} muted>Ładowanie...</Text>
                                            </Flex>
                                        )}

                                        <Button
                                            mode="ghost"
                                            tone="critical"
                                            padding={1}
                                            style={{
                                                position: 'absolute',
                                                top: 2,
                                                right: 2,
                                                background: 'rgba(0,0,0,0.7)',
                                                borderRadius: '4px',
                                            }}
                                            onClick={() => handleDelete(index)}
                                        >
                                            <TrashIcon />
                                        </Button>

                                        <Box
                                            style={{
                                                position: 'absolute',
                                                bottom: 2,
                                                left: 2,
                                                background: 'rgba(0,0,0,0.7)',
                                                padding: '2px 6px',
                                                borderRadius: '4px',
                                            }}
                                        >
                                            <Text size={0}>{index + 1}</Text>
                                        </Box>
                                    </Card>
                                )
                            })}
                        </Grid>
                    </Stack>
                </Card>
            )}
        </Stack>
    )
}

export default BulkImageUpload
