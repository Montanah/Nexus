import { useState } from 'react';
import PropTypes from 'prop-types';
import { compressImage } from '../utils/imageUtils';

const PhotoUpload = ({ photos, setPhotos, className }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Ensure photos is always an array
  const safePhotos = Array.isArray(photos) ? photos : [];

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const processedPhotos = [];
    
      for (const file of files) {
        try {
          if (!file.type.startsWith('image/')) {
            throw new Error('Only image files are allowed');
          }

          if (file.size > 5 * 1024 * 1024) {
            throw new Error('File size should be less than 5MB');
          }

          const base64String = await compressImage(file);
          const fullBase64 = base64String.startsWith('data:') ? base64String : `data:${file.type};base64,${base64String}`;

          if (!base64String) throw new Error('Image compression failed');

          processedPhotos.push({
            id: Date.now() + Math.random(), // Add unique ID for better key management
            name: file.name,
            type: file.type,
            size: file.size,
            base64: fullBase64,
          });
          
        } catch (innerErr) {
          console.error('Skipping file due to error:', innerErr);
          setError(prev => prev || innerErr.message); // Keep first error, don't overwrite
        }
      }

      if (processedPhotos.length > 0) {
        console.log('Processed photos:', processedPhotos.length);
        // Use functional update to ensure we get the latest state
        setPhotos((prevPhotos) => {
          const safePrevPhotos = Array.isArray(prevPhotos) ? prevPhotos : [];
          const newPhotos = [...safePrevPhotos, ...processedPhotos];
          console.log('Setting photos:', newPhotos);
          return newPhotos;
        });
      } else if (processedPhotos.length === 0 && files.length > 0) {
        // All files failed to process
        setError('No valid images could be processed');
      }

    } catch (err) {
      setError('Unexpected error occurred while uploading photos');
      console.error('Error in handleFileChange:', err);
    } finally {
      setLoading(false);
    }
  };

  const removePhoto = (index) => {
    setPhotos(prevPhotos => {
      const safePrevPhotos = Array.isArray(prevPhotos) ? prevPhotos : [];
      const newPhotos = safePrevPhotos.filter((_, i) => i !== index);
      console.log('Removing photo at index', index, 'new photos:', newPhotos);
      return newPhotos;
    });
  };

  return (
    <div className={`space-y-4 ${className || ''}`}>
      <div className="flex flex-col space-y-2">
        <label className="text-sm font-medium text-gray-700">
          Product Photos
        </label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-indigo-50 file:text-indigo-700
            hover:file:bg-indigo-100"
          disabled={loading}
        />
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
        {loading && (
          <p className="text-sm text-gray-600">Processing photos...</p>
        )}
      </div>

      {/* Photo Preview */}
      {safePhotos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {safePhotos.map((photo, index) => (
            <div key={photo.id || index} className="relative group">
              <img
                src={photo.base64}
                alt={`Preview ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg"
                onError={() => console.error('Failed to load image:', photo.name)}
              />
              <button
                type="button"
                onClick={() => removePhoto(index)}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                title="Remove photo"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

PhotoUpload.propTypes = {
  photos: PropTypes.arrayOf(PropTypes.object).isRequired,
  setPhotos: PropTypes.func.isRequired,
  className: PropTypes.string,
};

export default PhotoUpload;