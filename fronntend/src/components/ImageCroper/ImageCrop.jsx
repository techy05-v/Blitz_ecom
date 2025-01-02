import React, { useState } from "react";
import Cropper from "react-cropper";
import "cropperjs/dist/cropper.css";
import "./Crop.css";

const ImageCropper = ({ image, onCrop }) => {
  const [cropper, setCropper] = useState(null);
  const [croppedSize, setCroppedSize] = useState({ width: 0, height: 0 });

  const handleCrop = () => {
    if (cropper) {
      // Get cropped canvas with fixed size
      const croppedCanvas = cropper.getCroppedCanvas({
        width: 300, // Fixed width
        height: 300, // Fixed height
      });
      const croppedImageUrl = croppedCanvas.toDataURL(); // Convert to image URL
      setCroppedSize({
        width: croppedCanvas.width,
        height: croppedCanvas.height,
      });
      onCrop(croppedImageUrl); // Pass cropped image back to parent
    }
  };

  return (
    <div className="image-cropper-card">
      <div className="image-cropper-header">
        <h2>Image Cropper</h2>
      </div>
      <div className="image-cropper-content">
        <div className="cropper-container">
          <Cropper
            src={image}
            style={{ height: "100%", width: "100%" }}
            initialAspectRatio={1} // Maintain square aspect ratio
            aspectRatio={1}
            guides={false}
            onInitialized={(instance) => setCropper(instance)}
          />
        </div>
      </div>
      <div className="image-cropper-footer">
        <button onClick={handleCrop} className="crop-button">
          Crop Image
        </button>
        {croppedSize.width > 0 && (
          <p className="cropped-size-info">
            Cropped size: {croppedSize.width}x{croppedSize.height}px
          </p>
        )}
      </div>
    </div>
  );
};

export default ImageCropper;
