import { useState } from "react";
import axios from "axios";
import "./index.css"; // Import our plain CSS

function App() {
  const [code, setCode] = useState("");
  const [validCode, setValidCode] = useState(false);
  const [storage, setStorage] = useState(null);
  const [file, setFile] = useState(null);
  const [files, setFiles] = useState([]);

  const checkCode = async () => {
    try {
      const response = await axios.get(`https://backend-a590.onrender.comstorage/${code}`);
      setStorage(response.data);
      setValidCode(true);
      fetchFiles();
    } catch {
      alert("Invalid code!");
    }
  };

  const uploadFile = async () => {
    if (!file) return alert("Select a file first!");
    const fileSize = file.size;
    if (storage.used + fileSize > storage.storageLimit) return alert("Storage limit exceeded!");

    // Simulate an upload request
    await axios.post("https://backend-a590.onrender.comupload", { code, fileSize });
    alert("File uploaded!");
    setStorage({ ...storage, used: storage.used + fileSize });
    fetchFiles();
  };

  const fetchFiles = async () => {
    // Simulating fetching files (replace with actual API call)
    setFiles([
      { name: "example.png", size: "2MB" },
      { name: "document.pdf", size: "1MB" },
    ]);
  };

  return (
    <div className="container">
      {!validCode ? (
        <>
          <h2>Enter Invite Code</h2>
          <input type="text" placeholder="Enter code" onChange={(e) => setCode(e.target.value)} />
          <button onClick={checkCode}>Submit</button>
        </>
      ) : (
        <>
          <h2>Welcome!</h2>
          <p>Storage Used: {Math.round(storage.used / 1024 / 1024)} MB / {Math.round(storage.storageLimit / 1024 / 1024)} MB</p>

          {/* File Upload Section */}
          <div className="file-upload">
            <input type="file" onChange={(e) => setFile(e.target.files[0])} />
          </div>
          <button onClick={uploadFile}>Upload File</button>

          {/* File List */}
          <div className="file-list">
            <h3>Your Files</h3>
            {files.map((f, index) => (
              <div key={index} className="file-item">
                <span>{f.name}</span>
                <span>{f.size}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default App;
