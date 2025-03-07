import { useState, useEffect } from "react";
import axios from "axios";
import "./index.css";

function App() {
  const [code, setCode] = useState("");
  const [validCode, setValidCode] = useState(false);
  const [storage, setStorage] = useState(null);
  const [file, setFile] = useState(null);
  const [files, setFiles] = useState([]);

  useEffect(() => {
    if (validCode) {
        fetchFiles();
    }
}, [validCode, fetchFiles]);  // Add fetchFiles as a dependency

  const checkCode = async () => {
    try {
      const response = await axios.get(`https://backend-a590.onrender.com/storage/${code}`);
      setStorage(response.data);
      setValidCode(true);
      fetchFiles();
      alert("⚠️ Keep your invite code safe! This is your only way to access your files.");
    } catch {
      alert("Invalid code!");
    }
  };

  const uploadFile = async () => {
    if (!file) return alert("Select a file first!");
    const fileSize = file.size;
    if (storage.used + fileSize > storage.storageLimit) return alert("Storage limit exceeded!");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("code", code);

    await axios.post("https://backend-a590.onrender.com/upload", formData);
    alert("File uploaded!");
    setStorage({ ...storage, used: storage.used + fileSize });
    fetchFiles();
  };

  const fetchFiles = async () => {
    const response = await axios.get(`https://backend-a590.onrender.com/files/${code}`);
    setFiles(response.data);
  };

  const downloadFile = async (fileId) => {
    window.open(`https://backend-a590.onrender.com/download/${fileId}`);
  };

  const shareFile = (fileId) => {
    const link = `https://backend-a590.onrender.com/share/${fileId}`;
    navigator.clipboard.writeText(link);
    alert("🔗 Link copied to clipboard!");
  };

  const deleteFile = async (fileId) => {
    await axios.delete(`https://backend-a590.onrender.com/delete/${fileId}`);
    alert("File deleted!");
    fetchFiles();
  };

  const setFileExpiry = async (fileId, days) => {
    await axios.post(`https://backend-a590.onrender.com/set-expiry`, { fileId, days });
    alert(`Expiry set to ${days} days`);
    fetchFiles();
  };

  return (
    <div className="container">
      {!validCode ? (
        <div className="login-screen">
          <h2>Enter Invite Code</h2>
          <input type="text" placeholder="Enter code" onChange={(e) => setCode(e.target.value)} />
          <button onClick={checkCode}>Submit</button>
        </div>
      ) : (
        <div className="dashboard">
          <aside className="sidebar">
            <div className="profile">
              <img src="https://via.placeholder.com/60" alt="Profile" className="profile-pic" />
              <p className="username">User: {code}</p>
            </div>
            <nav>
              <ul>
                <li className="active"><a href="#">Dashboard</a></li>
                <li><a href="#">Settings</a></li>
                <li><a href="#">Logout</a></li>
              </ul>
            </nav>
          </aside>

          <main className="main-content">
            <header className="header">
              <h1>File Manager</h1>
            </header>

            <section className="quick-stats">
              <div className="stat-box">
                <h3>Storage Used</h3>
                <p>{Math.round(storage.used / 1024 / 1024)} MB / {Math.round(storage.storageLimit / 1024 / 1024)} MB</p>
              </div>
            </section>

            <section className="file-upload">
              <div className="upload-area">
                <input type="file" onChange={(e) => setFile(e.target.files[0])} />
                <button className="upload-btn" onClick={uploadFile}>Upload File</button>
              </div>
            </section>

            <section className="file-management">
              <h2>Your Files</h2>
              <div className="file-list">
                {files.map((file) => (
                  <div key={file.id} className="file-item">
                    <p>{file.name}</p>
                    <div className="file-actions">
                      <button onClick={() => downloadFile(file.id)}>⬇ Download</button>
                      <button onClick={() => shareFile(file.id)}>🔗 Share</button>
                      <button onClick={() => setFileExpiry(file.id, 3)}>⏳ Set Expiry (3 Days)</button>
                      <button onClick={() => deleteFile(file.id)}>❌ Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </main>
        </div>
      )}
    </div>
  );
}

export default App;
