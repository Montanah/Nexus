import { useState } from 'react';
import PropTypes from 'prop-types';
import { compressImage } from '../utils/imageUtils';

const PhotoUpload = ({ photos, setPhotos, className }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    try {
      setLoading(true);
      setError(null);

      // Process each file
      const processedPhotos = await Promise.all(
        files.map(async (file) => {
          // Check file type
          if (!file.type.startsWith('image/')) {
            throw new Error('Only image files are allowed');
          }

          // Check file size (5MB limit)
          if (file.size > 5 * 1024 * 1024) {
            throw new Error('File size should be less than 5MB');
          }

          // Compress and convert to base64
          const base64String = await compressImage(file);
          return {
            name: file.name,
            type: file.type,
            size: file.size,
            base64: base64String
          };
        })
      );

      // Update photos state
      setPhotos(prev => [...prev, ...processedPhotos]);
    } catch (err) {
      setError(err.message);
      console.error('Error processing photos:', err);
    } finally {
      setLoading(false);
    }
  };

  const removePhoto = (index) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className={`space-y-4 ${className}`}>
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
      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {photos.map((photo, index) => (
            <div key={index} className="relative group">
              <img
                src={photo.base64}
                alt={`Preview ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={() => removePhoto(index)}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
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
};

export default PhotoUpload;