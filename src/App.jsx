import { useState, useRef, useEffect } from 'react';
import { Client, handle_file } from "@gradio/client";
import './App.css'; 

function App() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Camera state
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Handle global paste event
  useEffect(() => {
    const handlePaste = (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            handleFileSelect(file);
          }
          break;
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const handleFileSelect = (file) => {
    setImage(file);
    setPreview(URL.createObjectURL(file));
    setResult(null); // Clear previous result
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Camera functionality
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraOpen(true);
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Could not access the camera. Please check your permissions.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], "webcam_capture.jpg", { type: "image/jpeg" });
        handleFileSelect(file);
        stopCamera();
      }
    }, 'image/jpeg', 0.9);
  };

  const handleRemoveBackground = async () => {
    if (!image) return;
    setLoading(true);

    try {
      const app = await Client.connect("moataz115/background-remover");
      
      const response = await app.predict("/remove_background", [
        handle_file(image),
      ]);

      const resultUrl = response.data[0]?.url || response.data[0];
      setResult(resultUrl);
      
    } catch (error) {
      console.error("Error removing background:", error);
      alert(error.message || "Something went wrong! Check the console.");
    } finally {
      setLoading(false);
    }
  };

  const copyResultToClipboard = async () => {
    if (!result) return;
    try {
      const response = await fetch(result);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob
        })
      ]);
      alert("Image copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy image:", err);
      alert("Failed to copy image to clipboard.");
    }
  };

  return (
    <div className="app-wrapper">
      <div className="glass-container">
        <header className="header">
          <h1>
            <span className="emoji">✨</span> 
            <span className="gradient-text">U-Net Background Remover</span>
          </h1>
          <p>Powered by a custom Residual U-Net built from scratch. Inference utilizes Test-Time Augmentation (TTA) and OpenCV Post-Processing. Paste an image (Ctrl+V) or use your camera.</p>
        </header>

        <div className="controls-section">
          <div className="input-methods">
            <label className="file-upload-btn">
              <input type="file" accept="image/*" onChange={handleImageChange} hidden />
              <span>📁 Upload Image</span>
            </label>
            
            {!isCameraOpen ? (
              <button className="camera-btn" onClick={startCamera}>
                📸 Use Camera
              </button>
            ) : (
              <button className="camera-btn cancel" onClick={stopCamera}>
                ✖ Cancel Camera
              </button>
            )}
          </div>

          <button 
            onClick={handleRemoveBackground} 
            disabled={!image || loading}
            className={`process-btn ${loading ? 'loading' : ''}`}
          >
            {loading ? "Processing..." : "Remove Background"}
          </button>
          
          <p className="gpu-note">
            (Note: The free GPU backend may take ~15 seconds to wake up on the first request!)
          </p>
        </div>

        {isCameraOpen && (
          <div className="camera-container">
            <video ref={videoRef} autoPlay playsInline className="video-preview"></video>
            <button className="capture-btn" onClick={capturePhoto}>Capture Photo</button>
          </div>
        )}

        <div className="image-comparison">
          {preview && (
            <div className="image-card original">
              <div className="card-header">Original</div>
              <img src={preview} alt="Original" />
            </div>
          )}
          
          {result && (
            <div className="image-card result">
              <div className="card-header">
                Result
                <button className="copy-btn" onClick={copyResultToClipboard}>Copy</button>
              </div>
              <div className="checkerboard-bg">
                <img src={result} alt="Background Removed" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
