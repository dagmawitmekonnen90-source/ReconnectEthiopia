import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import "./ImageUpload.css";

/**
 * Styled image upload box matching the design reference.
 *
 * Props:
 *   id        — input id (required)
 *   label     — section title e.g. "PERSON'S PHOTO"
 *   hint      — description line below title
 *   optional  — boolean, shows "Optional" badge
 *   onChange  — (file | null) => void
 *   value     — current File or null
 */
function ImageUpload({ id, label, hint, optional = false, onChange, value }) {
  const { t } = useTranslation();
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState(null);

  const handleFile = (file) => {
    if (!file) return;
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) return;
    if (file.size > 5 * 1024 * 1024) return;
    onChange(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleInputChange = (e) => {
    handleFile(e.target.files?.[0] || null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files?.[0] || null);
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    onChange(null);
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="img-upload">
      {/* Header row */}
      <div className="img-upload__header">
        <div className="img-upload__header-left">
          <span className="img-upload__icon-sm">🖼</span>
          <div>
            <p className="img-upload__label">{label}</p>
            {hint && <p className="img-upload__hint">{hint}</p>}
          </div>
        </div>
        {optional && (
          <span className="img-upload__optional">Optional</span>
        )}
      </div>

      {/* Drop zone */}
      <div
        className={`img-upload__zone${dragOver ? " img-upload__zone--over" : ""}${preview ? " img-upload__zone--has-image" : ""}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        aria-label="Upload image"
      >
        {preview ? (
          <div className="img-upload__preview">
            <img src={preview} alt="Preview" />
            <button
              type="button"
              className="img-upload__remove"
              onClick={handleRemove}
              aria-label="Remove image"
            >
              ×
            </button>
          </div>
        ) : (
          <div className="img-upload__placeholder">
            <svg className="img-upload__upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <p className="img-upload__upload-title">Upload Photo</p>
            <p className="img-upload__upload-sub">Supports JPG, JPEG, PNG, WEBP (Max 5MB)</p>
          </div>
        )}
      </div>

      {/* Hidden input */}
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleInputChange}
        style={{ display: "none" }}
      />
    </div>
  );
}

export default ImageUpload;
