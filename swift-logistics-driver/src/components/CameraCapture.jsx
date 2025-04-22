import { useRef, useState } from "react";

const CameraCapture = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [photo, setPhoto] = useState(null > null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      alert("Failed to access camera");
    }
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvasRef.current.toDataURL("image/png");
        setPhoto(dataUrl);
      }
    }
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject;
    stream?.getTracks().forEach((track) => track.stop());
  };

  return (
    <div>
      <video ref={videoRef} style={{ width: "100%", maxHeight: "400px" }} />
      <canvas ref={canvasRef} style={{ display: "none" }} />

      <div>
        {!photo ? (
          <>
            <button onClick={startCamera}>Start Camera</button>
            <button onClick={takePhoto}>Take Photo</button>
            <button onClick={stopCamera}>Stop Camera</button>
          </>
        ) : (
          <>
            <img
              src={photo}
              alt="Captured"
              style={{ width: "100%", maxHeight: "400px" }}
            />
            <button onClick={() => setPhoto(null)}>Retake</button>
          </>
        )}
      </div>
    </div>
  );
};

export default CameraCapture;
