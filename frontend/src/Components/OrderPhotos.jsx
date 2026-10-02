import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { FiImage, FiUpload, FiX } from 'react-icons/fi';
import { validateOrderPhoto } from './newOrderModel';

const preparePhoto = file => new Promise((resolve, reject) => {
  const image = new Image();
  const url = URL.createObjectURL(file);
  image.onload = () => {
    try {
      const canvas = document.createElement('canvas');
      // Keep five photos within the existing API's 100 KB JSON body limit.
      let longest = 640;
      let base64;
      do {
        const scale = Math.min(1, longest / Math.max(image.width, image.height));
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext('2d');
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        base64 = canvas.toDataURL('image/jpeg', 0.65);
        longest = Math.floor(longest * 0.75);
      } while (base64.length > 16000 && longest >= 100);
      if (base64.length > 16000) throw new Error('This photo is too detailed to process. Try a smaller image.');
      resolve({ id: crypto.randomUUID(), name: file.name, base64 });
    } catch { reject(new Error('This photo could not be processed. Try another image.')); }
    finally { URL.revokeObjectURL(url); }
  };
  image.onerror = () => { URL.revokeObjectURL(url); reject(new Error('This file could not be opened as a photo.')); };
  image.src = url;
});

const OrderPhotos = ({ photos, onChange, disabled, readOnly, onProcessing }) => {
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const chooseFiles = async event => {
    const files = [...event.target.files];
    event.target.value = '';
    if (!files.length) return;
    setError('');
    if (files.length + photos.length > 5) { setError('You can add up to 5 photos. Remove one before adding another.'); return; }
    const invalid = files.map(validateOrderPhoto).find(Boolean);
    if (invalid) { setError(invalid); return; }
    setProcessing(true); onProcessing(true);
    try {
      const added = await Promise.all(files.map(preparePhoto));
      if (mounted.current) onChange([...photos, ...added]);
    } catch (failure) { if (mounted.current) setError(failure.message); }
    finally { if (mounted.current) { setProcessing(false); onProcessing(false); } }
  };
  return <div className="no-photos">
    {!readOnly && <div className="no-upload-zone"><FiImage aria-hidden="true" /><div><label htmlFor="order-photos">Add product photos <span>(optional)</span></label><p id="order-photo-help">Up to 5 JPG, PNG, or WebP photos, 5 MB each. Photos are resized before saving.</p></div><input id="order-photos" type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={disabled || processing} onChange={chooseFiles} aria-describedby={`order-photo-help${error ? ' order-photo-error' : ''}`} aria-invalid={Boolean(error)} /><span className="no-upload-symbol" aria-hidden="true"><FiUpload /></span></div>}
    {processing && <p className="no-field-hint" role="status">Preparing your photos…</p>}
    {error && <p className="no-field-error" id="order-photo-error" role="alert">{error}</p>}
    {photos.length > 0 && <ul className="no-photo-list">{photos.map((photo, index) => <li key={photo.id}><img src={photo.base64} alt={`Product photo ${index + 1}`} />{!readOnly && <button type="button" disabled={disabled || processing} onClick={() => { onChange(photos.filter(item => item.id !== photo.id)); setError(''); }} aria-label={`Remove photo ${index + 1}: ${photo.name}`}><FiX aria-hidden="true" /></button>}</li>)}</ul>}
    {readOnly && !photos.length && <p className="no-field-hint">No photos were added to this item.</p>}
  </div>;
};
OrderPhotos.propTypes = { photos: PropTypes.arrayOf(PropTypes.object).isRequired, onChange: PropTypes.func.isRequired, disabled: PropTypes.bool, readOnly: PropTypes.bool, onProcessing: PropTypes.func.isRequired };
export default OrderPhotos;
