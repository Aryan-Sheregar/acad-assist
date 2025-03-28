import React, { useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [userData, setUserData] = useState({ userId: "", name: "", email: "" });
  const [file, setFile] = useState(null);
  const [syllabusContent, setSyllabusContent] = useState("");
  const [recommendations, setRecommendations] = useState([]);
  const [message, setMessage] = useState("");

  const handleUserChange = (e) => {
    setUserData({ ...userData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const addUser = async () => {
    try {
      const res = await axios.post(
        "http://localhost:5001/api/users/add",
        userData
      );
      setMessage(res.data.message);
    } catch (error) {
      setMessage("Error: " + error.response.data.error);
    }
  };

  const uploadTimetable = async () => {
    if (!file || !userData.userId) {
      setMessage("Please select a file and provide a User ID");
      return;
    }
    const formData = new FormData();
    formData.append("timetable", file);
    formData.append("userId", userData.userId);

    try {
      const res = await axios.post(
        "http://localhost:5001/api/files/upload-timetable",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      setMessage(res.data.message);
    } catch (error) {
      setMessage("Error: " + error.response.data.error);
    }
  };

  const getRecommendations = async () => {
    try {
      const res = await axios.post(
        "http://localhost:5001/api/recommendations/request",
        {
          syllabusContent,
        }
      );
      setRecommendations(res.data.recommendations);
      setMessage("Recommendations fetched successfully");
    } catch (error) {
      setMessage("Error: " + error.response.data.error);
    }
  };

  return (
    <div className="App">
      <h1>Study App</h1>

      {/* Add User */}
      <div>
        <h2>Add User</h2>
        <input
          name="userId"
          placeholder="User ID"
          onChange={handleUserChange}
        />
        <input name="name" placeholder="Name" onChange={handleUserChange} />
        <input name="email" placeholder="Email" onChange={handleUserChange} />
        <button onClick={addUser}>Add User</button>
      </div>

      {/* Upload Timetable */}
      <div>
        <h2>Upload Timetable</h2>
        <input type="file" onChange={handleFileChange} />
        <button onClick={uploadTimetable}>Upload</button>
      </div>

      {/* Get Recommendations */}
      <div>
        <h2>Get Recommendations</h2>
        <input
          placeholder="Enter syllabus content (e.g., Physics Chapter 1)"
          value={syllabusContent}
          onChange={(e) => setSyllabusContent(e.target.value)}
        />
        <button onClick={getRecommendations}>Get Recommendations</button>
        {recommendations.length > 0 && (
          <ul>
            {recommendations.map((rec, index) => (
              <li key={index}>
                <a href={rec.url} target="_blank" rel="noopener noreferrer">
                  {rec.title}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>

      {message && <p>{message}</p>}
    </div>
  );
}

export default App;
