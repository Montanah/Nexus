import { useId, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { FiFile, FiUpload, FiX } from 'react-icons/fi';
import { validateProofFile } from './travelerDashboardModel';

const DeliveryProofForm = ({ busy, onUpload }) => {
  const id = useId(), input = useRef(null);
  const [file, setFile] = useState(null), [error, setError] = useState('');
  return <form className="td-proof" onSubmit={event => {
    event.preventDefault(); if (busy) return;
    const validation = validateProofFile(file); setError(validation);
    if (validation) { input.current?.focus(); return; }
    onUpload(file);
  }} aria-busy={busy}>
    <label htmlFor={id}><FiUpload aria-hidden="true" /><strong>Delivery proof</strong><span id={`${id}-hint`}>JPG, PNG, or PDF · Up to 5 MB</span></label>
    <input id={id} ref={input} type="file" accept="image/jpeg,image/png,application/pdf" disabled={busy} aria-invalid={Boolean(error)} aria-describedby={`${id}-hint${error ? ` ${id}-error` : ''}`} onChange={event => {
      const chosen = event.target.files?.[0]; setFile(chosen || null); setError(chosen ? validateProofFile(chosen) : '');
    }} />
    {file && !error && <div className="dd-proof-file"><p className="td-file-name"><FiFile aria-hidden="true" />{file.name}</p><button type="button" className="cd-icon-button" aria-label="Remove selected proof" disabled={busy} onClick={() => { setFile(null); setError(''); input.current.value = ''; input.current.focus(); }}><FiX aria-hidden="true" /></button></div>}
    {error && <p className="td-inline-error" id={`${id}-error`} role="alert">{error}</p>}
    <button className="cd-button cd-primary" disabled={busy}>{busy ? <><span className="cd-spinner" />Uploading…</> : <><FiUpload aria-hidden="true" />Submit delivery proof</>}</button>
  </form>;
};
DeliveryProofForm.propTypes = { busy: PropTypes.bool, onUpload: PropTypes.func.isRequired };
export default DeliveryProofForm;
