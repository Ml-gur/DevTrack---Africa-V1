
export const uploadToCloudinary = async (file: File): Promise<string> => {
    const CLOUD_NAME = "dhpcescz8";
    const PRESET_NAME = "ml_default";

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', PRESET_NAME);

    try {
        const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'Upload failed');
        }

        const data = await response.json();
        return data.secure_url;
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        throw error;
    }
};
