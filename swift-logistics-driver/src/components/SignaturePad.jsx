import React, { useRef } from "react";
import { LuCheck } from "react-icons/lu";
import { RxCross1 } from "react-icons/rx";
import SignatureCanvas from "react-signature-canvas";

const SignaturePad = ({
  handleConfirmModal,
  setSignatureImage,
  // imageURL,
  setImageURL,
}) => {
  const sigPadRef = useRef(null);
  // const [imageURL, setImageURL] = useState(null); // create a state that will contain our image url

  const handleSaveImage = () => {
    if (sigPadRef.current && !sigPadRef.current.isEmpty()) {
      const originalCanvas = sigPadRef.current.getCanvas();
      const trimmedCanvas = trimCanvas(originalCanvas); // Create a new canvas (no UI modification)
      const dataUrl = trimmedCanvas.toDataURL("image/png");
      setImageURL(dataUrl);

      // Call handleConfirmModal with signature data
      handleConfirmModal(dataUrl);

      const blob = dataURLtoBlob(dataUrl);
      setSignatureImage(blob);
    } else {
      alert("Please sign before confirming.");
    }
  };

  const dataURLtoBlob = (dataUrl) => {
    const arr = dataUrl.split(",");
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  const handleClear = () => {
    sigPadRef.current.clear();
  };

  return (
    <div className="w-full flex justify-center">
      <div className="w-full h-[70vh]">
        {/* Signature Canvas Wrapper */}
        <div className="w-full h-full overflow-hidden">
          <SignatureCanvas
            ref={sigPadRef}
            penColor="black"
            canvasProps={{
              className: "signatureCanvas w-full h-full", // Inherit from parent container
              style: {
                border: "1px solid #ccc",
                objectFit: "contain", // Prevent overflow and maintain aspect ratio
              },
            }}
          />
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-center gap-4 mt-4 z-50">
          <button
            onClick={handleClear}
            type="button"
            style={{
              color: "#f44336",
              border: "none",
              borderRadius: "6px",
              fontSize: "20px",
              fontWeight: "900",
              cursor: "pointer",
              padding: "8px 12px",
              backgroundColor: "#ffebee",
              transition: "background-color 0.2s ease-in-out",
            }}
            onMouseOver={(e) => (e.target.style.backgroundColor = "#ffcdd2")}
            onMouseOut={(e) => (e.target.style.backgroundColor = "#ffebee")}
          >
            <RxCross1 />
          </button>
          <button
            type="button"
            onClick={handleSaveImage}
            style={{
              color: "#4CAF50",
              border: "none",
              borderRadius: "6px",
              fontSize: "23px",
              fontWeight: "900",
              cursor: "pointer",
              padding: "8px 12px",
              backgroundColor: "#e8f5e9",
              transition: "background-color 0.2s ease-in-out",
            }}
            onMouseOver={(e) => (e.target.style.backgroundColor = "#c8e6c9")}
            onMouseOut={(e) => (e.target.style.backgroundColor = "#e8f5e9")}
          >
            <LuCheck />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignaturePad;

function trimCanvas(canvas) {
  const context = canvas.getContext("2d");
  const imgWidth = canvas.width;
  const imgHeight = canvas.height;
  const imgData = context.getImageData(0, 0, imgWidth, imgHeight).data;

  const cropTop = scanY(true, imgWidth, imgHeight, imgData);
  const cropBottom = scanY(false, imgWidth, imgHeight, imgData);
  const cropLeft = scanX(true, imgWidth, imgHeight, imgData);
  const cropRight = scanX(false, imgWidth, imgHeight, imgData);

  if (
    cropTop === null ||
    cropBottom === null ||
    cropLeft === null ||
    cropRight === null
  ) {
    return canvas; // No content drawn
  }

  const cropXDiff = cropRight - cropLeft + 1;
  const cropYDiff = cropBottom - cropTop + 1;

  // ✅ Create a new offscreen canvas
  const trimmedCanvas = document.createElement("canvas");
  trimmedCanvas.width = cropXDiff;
  trimmedCanvas.height = cropYDiff;
  const trimmedContext = trimmedCanvas.getContext("2d");

  const trimmedData = context.getImageData(
    cropLeft,
    cropTop,
    cropXDiff,
    cropYDiff
  );
  trimmedContext.putImageData(trimmedData, 0, 0);

  return trimmedCanvas;
}

function getAlpha(x, y, imgWidth, imgData) {
  return imgData[(imgWidth * y + x) * 4 + 3];
}

function scanY(fromTop, imgWidth, imgHeight, imgData) {
  const offset = fromTop ? 1 : -1;
  const firstCol = fromTop ? 0 : imgHeight - 1;

  for (let y = firstCol; fromTop ? y < imgHeight : y >= 0; y += offset) {
    for (let x = 0; x < imgWidth; x++) {
      if (getAlpha(x, y, imgWidth, imgData)) {
        return y;
      }
    }
  }
  return null;
}

function scanX(fromLeft, imgWidth, imgHeight, imgData) {
  const offset = fromLeft ? 1 : -1;
  const firstRow = fromLeft ? 0 : imgWidth - 1;

  for (let x = firstRow; fromLeft ? x < imgWidth : x >= 0; x += offset) {
    for (let y = 0; y < imgHeight; y++) {
      if (getAlpha(x, y, imgWidth, imgData)) {
        return x;
      }
    }
  }
  return null;
}
