import { useState } from "react";
import axios from "axios";

function App() {
  const [code, setCode] = useState("");
  const [validCode, setValidCode] = useState(false);
  const [storage, setStorage] = useState(null);
  const [file, setFile] = useState(null);

  const checkCode = async () => {
    try {
      const response = await axios.get(`https://your-backend-url.com/storage/${code}`);
      setStorage(response.data);
      setValidCode(true);
    } catch {
      alert("Invalid code!");
    }
  };

  const uploadFile = async () => {
    if (!file) return alert("Select a file first!");
    const fileSize = file.size;
    if (storage.used + fileSize > storage.storageLimit) return alert("Storage limit exceeded!");

    await axios.post("https://your-backend-url.com/upload", { code, fileSize });
    alert("File uploaded!");
    setStorage({ ...storage, used: storage.used + fileSize });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
      {!validCode ? (
        <div className="p-6 bg-gray-800 rounded-xl shadow-lg">
          <h2 className="text-lg mb-4">Enter Invite Code</h2>
          <input className="p-2 border rounded text-black" onChange={(e) => setCode(e.target.value)} />
          <button className="mt-4 bg-blue-500 px-4 py-2 rounded" onClick={checkCode}>Submit</button>
        </div>
      ) : (
        <div className="p-6 bg-gray-800 rounded-xl shadow-lg">
          <h2 className="text-lg">Welcome! {code}</h2>
          <p>Storage Used: {Math.round(storage.used / 1024 / 1024)} MB / {Math.round(storage.storageLimit / 1024 / 1024)} MB</p>
          <input type="file" className="mt-4" onChange={(e) => setFile(e.target.files[0])} />
          <button className="mt-4 bg-green-500 px-4 py-2 rounded" onClick={uploadFile}>Upload</button>
        </div>
      )}
    </div>
  );
}

export default App;
