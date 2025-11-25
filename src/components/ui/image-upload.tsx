'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Upload, Loader2, X } from 'lucide-react';
import Image from 'next/image';

interface ImageUploadProps {
    label: string;
    currentImageUrl?: string | null;
    onImageUploaded: (url: string) => void;
    bucket?: string;
    maxSizeMB?: number;
    acceptedFormats?: string[];
}

export function ImageUpload({
    label,
    currentImageUrl,
    onImageUploaded,
    bucket = 'receipts',
    maxSizeMB = 2,
    acceptedFormats = ['image/png', 'image/jpeg', 'image/jpg']
}: ImageUploadProps) {
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState<string | null>(currentImageUrl || null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!acceptedFormats.includes(file.type)) {
            toast.error(`Formato no válido. Usa: ${acceptedFormats.join(', ')}`);
            return;
        }

        // Validate file size
        const fileSizeMB = file.size / (1024 * 1024);
        if (fileSizeMB > maxSizeMB) {
            toast.error(`El archivo es muy grande. Máximo ${maxSizeMB}MB`);
            return;
        }

        setUploading(true);

        try {
            // Create unique filename
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `${fileName}`;

            // Upload to Supabase Storage
            const { data, error } = await supabase.storage
                .from(bucket)
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) throw error;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from(bucket)
                .getPublicUrl(data.path);

            setPreview(publicUrl);
            onImageUploaded(publicUrl);
            toast.success('Imagen subida correctamente');
        } catch (error: any) {
            console.error('Error uploading image:', error);
            toast.error('Error al subir la imagen: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleRemove = () => {
        setPreview(null);
        onImageUploaded('');
    };

    return (
        <div className="space-y-2">
            <Label>{label}</Label>

            {preview ? (
                <div className="relative inline-block">
                    <div className="border rounded-lg p-2 bg-white">
                        <Image
                            src={preview}
                            alt="Preview"
                            width={120}
                            height={120}
                            className="object-contain"
                        />
                    </div>
                    <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                        onClick={handleRemove}
                    >
                        <X className="h-3 w-3" />
                    </Button>
                </div>
            ) : (
                <div className="flex items-center gap-2">
                    <Input
                        type="file"
                        accept={acceptedFormats.join(',')}
                        onChange={handleFileChange}
                        disabled={uploading}
                        className="hidden"
                        id={`file-upload-${label}`}
                    />
                    <Label
                        htmlFor={`file-upload-${label}`}
                        className="cursor-pointer"
                    >
                        <div className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-gray-50 dark:hover:bg-gray-800">
                            {uploading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Upload className="h-4 w-4" />
                            )}
                            <span className="text-sm">
                                {uploading ? 'Subiendo...' : 'Seleccionar imagen'}
                            </span>
                        </div>
                    </Label>
                </div>
            )}

            <p className="text-xs text-muted-foreground">
                Formatos: PNG, JPG. Máximo {maxSizeMB}MB. Recomendado: 200x200px
            </p>
        </div>
    );
}
