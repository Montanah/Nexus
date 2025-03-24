import { useState, useRef } from 'react';
import axios from 'axios';

const PhotoUpload = ({ photos, setPhotos }) => {
  const [uploadStatus, setUploadStatus] = useState('No File Chosen');
  const fileInputRef = useRef(null);

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (photos.length + files.length > 5) {
      alert('Maximum 5 photos allowed');
      return;
    }

    const newPhotos = [...photos, ...files];
    setPhotos(newPhotos);
    setUploadStatus(`${newPhotos.length} file(s) selected`);

    // Prepare FormData for POST request
    const formData = new FormData();
    files.forEach((file) => formData.append('photos', file));

    try {
      const response = await axios.post('/api/upload-photos', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      console.log('Photos uploaded successfully:', response.data);
      setUploadStatus(`${newPhotos.length} file(s) uploaded`);
    } catch (error) {
      console.error('Error uploading photos:', error);
      setUploadStatus('Upload failed');
    }
  };

  const removePhoto = (index) => {
    const newPhotos = [...photos];
    newPhotos.splice(index, 1);
    setPhotos(newPhotos);
    setUploadStatus(newPhotos.length > 0 ? `${newPhotos.length} file(s) selected` : 'No File Chosen');
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  return (
    <div>
      <label className="block mb-2 text-blue-600">Upload Photos (Optional, Max 5)</label>
      <div className="flex items-center space-x-4">
        <button
          type="button"
          onClick={triggerFileInput}
          className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
        >
          Choose File
        </button>
        <span className="text-sm text-gray-600">{uploadStatus}</span>
        <input
          type="file"
          accept="image/*"
          multiple
          ref={fileInputRef}
          onChange={handleFileUpload}
          className="hidden" // Hide the default input
        />
      </div>
      <div className="flex space-x-2 mt-2">
        {photos.map((photo, index) => (
          <div key={index} className="relative">
            <img
              src={URL.createObjectURL(photo)}
              alt={`Photo ${index}`}
              className="w-20 h-20 object-cover rounded"
            />
            <button
              onClick={() => removePhoto(index)}
              className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PhotoUpload;