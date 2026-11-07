// ============================================================
// Cloudinary Upload Utility
// Huong dan setup:
//   1. Vao https://cloudinary.com > Settings > Upload
//   2. Tao "Upload Preset" voi mode = "Unsigned"
//   3. Dien CLOUD_NAME va UPLOAD_PRESET ben duoi
// ============================================================

const CLOUDINARY_CLOUD_NAME = 'doe2ifald';   // <-- Thay bang Cloud Name cua ban
const CLOUDINARY_UPLOAD_PRESET = 'quanlikhachsan';    // <-- Thay bang Upload Preset (unsigned)

const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

/**
 * Upload mot file anh len Cloudinary va tra ve URL cua anh da upload
 * @param {File} file - File anh tu input
 * @param {string} folder - Thu muc luu tren Cloudinary (optional)
 * @returns {Promise<string>} - Cloudinary secure_url
 */
export const uploadToCloudinary = async (file, folder = 'hotel') => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', folder);

  const response = await fetch(CLOUDINARY_UPLOAD_URL, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Upload Cloudinary that bai');
  }

  const data = await response.json();
  return data.secure_url; // URL cua anh da upload
};

export const CLOUDINARY_CONFIG = {
  cloudName: CLOUDINARY_CLOUD_NAME,
  uploadPreset: CLOUDINARY_UPLOAD_PRESET,
};
