// Check if Cloudinary is configured
const isCloudinaryConfigured = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME && 
                                import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

export const cloudinaryService = {
  uploadImage: async (file, options = {}) => {
    if (!isCloudinaryConfigured) {
      console.warn('Cloudinary not configured - returning dummy URL');
      return {
        url: 'https://via.placeholder.com/800x600?text=Property+Image',
        publicId: 'dummy_id',
        width: 800,
        height: 600,
        format: 'jpg',
        bytes: 0,
      };
    }
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
      
      if (options.folder) {
        formData.append('folder', options.folder);
      }
      
      if (options.transformation) {
        formData.append('transformation', options.transformation);
      }

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message);
      }

      return {
        url: data.secure_url,
        publicId: data.public_id,
        width: data.width,
        height: data.height,
        format: data.format,
        bytes: data.bytes,
      };
    } catch (error) {
      console.error('Cloudinary upload failed:', error);
      throw error;
    }
  },

  uploadVideo: async (file, options = {}) => {
    if (!isCloudinaryConfigured) {
      console.warn('Cloudinary not configured - returning dummy URL');
      return {
        url: 'https://via.placeholder.com/800x600?text=Video+Placeholder',
        publicId: 'dummy_id',
        duration: 0,
        bytes: 0,
      };
    }
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
      
      if (options.folder) {
        formData.append('folder', options.folder);
      }

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/video/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message);
      }

      return {
        url: data.secure_url,
        publicId: data.public_id,
        duration: data.duration,
        bytes: data.bytes,
      };
    } catch (error) {
      console.error('Cloudinary upload failed:', error);
      throw error;
    }
  },

  uploadMultiple: async (files, options = {}) => {
    try {
      const uploadPromises = files.map(file => 
        cloudinaryService.uploadImage(file, options)
      );
      
      const results = await Promise.all(uploadPromises);
      return results;
    } catch (error) {
      throw error;
    }
  },

  deleteImage: async (publicId) => {
    if (!isCloudinaryConfigured) {
      console.warn('Cloudinary not configured - skipping delete');
      return true;
    }
    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/destroy`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            public_id: publicId,
            api_key: import.meta.env.VITE_CLOUDINARY_API_KEY,
            api_secret: import.meta.env.VITE_CLOUDINARY_API_SECRET,
          }),
        }
      );

      const data = await response.json();
      return data.result === 'ok';
    } catch (error) {
      console.error('Cloudinary delete failed:', error);
      throw error;
    }
  },

  getTransformedUrl: (publicId, transformations = {}) => {
    if (!isCloudinaryConfigured) {
      return 'https://via.placeholder.com/800x600?text=Transformed+Image';
    }
    const params = new URLSearchParams({
      fetch_format: 'auto',
      quality: 'auto',
      ...transformations,
    });
    
    return `https://res.cloudinary.com/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload/${params.toString()}/${publicId}`;
  },

  getThumbnailUrl: (publicId, width = 300, height = 300) => {
    if (!isCloudinaryConfigured) {
      return 'https://via.placeholder.com/300x300?text=Thumbnail';
    }
    const params = new URLSearchParams({
      width,
      height,
      crop: 'fill',
      fetch_format: 'auto',
      quality: 'auto',
    });
    
    return `https://res.cloudinary.com/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload/${params.toString()}/${publicId}`;
  },

  /**
   * Optimizes a Cloudinary URL by injecting auto-format and auto-quality.
   * If it's not a Cloudinary URL, returns the original URL.
   */
  optimizeUrl: (url, options = {}) => {
    if (!url || typeof url !== 'string') return url;
    
    // If it's an Unsplash URL, we can also optimize it
    if (url.includes('images.unsplash.com')) {
      const unsplashUrl = new URL(url);
      unsplashUrl.searchParams.set('auto', 'format,compress');
      unsplashUrl.searchParams.set('q', options.quality || '80');
      if (options.width) unsplashUrl.searchParams.set('w', options.width);
      if (options.height) unsplashUrl.searchParams.set('h', options.height);
      return unsplashUrl.toString();
    }

    if (!url.includes('cloudinary.com')) return url;

    try {
      // Cloudinary URL format: .../image/upload/v12345/public_id.jpg
      // We want to insert transformations after /upload/
      const parts = url.split('/upload/');
      if (parts.length !== 2) return url;

      const transformationList = ['f_auto', 'q_auto'];
      
      if (options.width) transformationList.push(`w_${options.width}`);
      if (options.height) transformationList.push(`h_${options.height}`);
      if (options.crop) transformationList.push(`c_${options.crop}`);
      if (options.quality && options.quality !== 'auto') transformationList.push(`q_${options.quality}`);

      return `${parts[0]}/upload/${transformationList.join(',')}/${parts[1]}`;
    } catch (e) {
      return url;
    }
  }
};

export default cloudinaryService;
