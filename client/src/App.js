import React, { useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [userData, setUserData] = useState({ userId: "", name: "", email: "" });
  const [timetableFile, setTimetableFile] = useState(null);
  const [calendarFile, setCalendarFile] = useState(null);
  const [syllabusFile, setSyllabusFile] = useState(null);
  const [syllabusRecommendations, setSyllabusRecommendations] = useState([]);
  const [leaveSuggestions, setLeaveSuggestions] = useState([]);
  const [timetableSummary, setTimetableSummary] = useState(null);
  const [semesterDates, setSemesterDates] = useState({
    startDate: "",
    endDate: "",
  });
  const [message, setMessage] = useState("");

  const handleUserChange = (e) => {
    setUserData({ ...userData, [e.target.name]: e.target.value });
  };

  const handleTimetableChange = (e) => {
    setTimetableFile(e.target.files[0]);
  };

  const handleCalendarChange = (e) => {
    setCalendarFile(e.target.files[0]);
  };

  const handleSyllabusChange = (e) => {
    setSyllabusFile(e.target.files[0]);
  };

  const handleDateChange = (e) => {
    setSemesterDates({ ...semesterDates, [e.target.name]: e.target.value });
  };

  const addUser = async () => {
    try {
      const res = await axios.post(
        "http://localhost:5001/api/users/add",
        userData
      );
      setMessage(res.data.message);
    } catch (error) {
      setMessage("Error: " + (error.response?.data.error || error.message));
    }
  };

  const uploadTimetable = async () => {
    if (!timetableFile || !userData.userId) {
      setMessage("Please select a timetable file and provide a User ID");
      return;
    }
    const formData = new FormData();
    formData.append("timetable", timetableFile);
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
      setMessage("Error: " + (error.response?.data.error || error.message));
    }
  };

  const uploadAcademicCalendar = async () => {
    if (!calendarFile || !userData.userId) {
      setMessage("Please select a calendar file and provide a User ID");
      return;
    }
    if (!semesterDates.startDate || !semesterDates.endDate) {
      setMessage("Please select both start and end dates for the semester");
      return;
    }
    const formData = new FormData();
    formData.append("calendar", calendarFile);
    formData.append("userId", userData.userId);
    formData.append("startDate", semesterDates.startDate);
    formData.append("endDate", semesterDates.endDate);

    try {
      const res = await axios.post(
        "http://localhost:5001/api/files/upload-calendar",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      setMessage(res.data.message);
    } catch (error) {
      setMessage("Error: " + (error.response?.data.error || error.message));
    }
  };

  const uploadSyllabus = async () => {
    if (!syllabusFile || !userData.userId) {
      setMessage("Please select a syllabus file and provide a User ID");
      return;
    }
    const formData = new FormData();
    formData.append("syllabus", syllabusFile);
    formData.append("userId", userData.userId);

    try {
      const res = await axios.post(
        "http://localhost:5001/api/files/upload-syllabus",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      setMessage(res.data.message);
    } catch (error) {
      setMessage("Error: " + (error.response?.data.error || error.message));
    }
  };

  const getSyllabusRecommendations = async () => {
    if (!userData.userId) {
      setMessage("Please provide a User ID");
      return;
    }
    try {
      const res = await axios.post(
        "http://localhost:5001/api/recommendations/syllabus",
        {
          userId: userData.userId,
        }
      );
      setSyllabusRecommendations(res.data.recommendations);
      setMessage("Syllabus-based recommendations fetched successfully");
    } catch (error) {
      setMessage("Error: " + (error.response?.data.error || error.message));
    }
  };

  const getLeaveOptimization = async () => {
    if (!userData.userId) {
      setMessage("Please provide a User ID");
      return;
    }
    try {
      const res = await axios.post(
        "http://localhost:5001/api/optimization/leave",
        {
          userId: userData.userId,
        }
      );
      setLeaveSuggestions(res.data.suggestions);
      setMessage("Leave optimization suggestions fetched successfully");
    } catch (error) {
      setMessage("Error: " + (error.response?.data.error || error.message));
    }
  };

  const getTimetableSummary = async () => {
    if (!userData.userId) {
      setMessage("Please provide a User ID");
      return;
    }
    try {
      const res = await axios.post(
        "http://localhost:5001/api/files/timetable-summary",
        {
          userId: userData.userId,
        }
      );
      setTimetableSummary(res.data.summary);
      setMessage("Timetable summary fetched successfully");
    } catch (error) {
      setMessage("Error: " + (error.response?.data.error || error.message));
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
        <input type="file" onChange={handleTimetableChange} />
        <button onClick={uploadTimetable}>Upload</button>
        <button onClick={getTimetableSummary}>Get Timetable Summary</button>
        {timetableSummary && (
          <div>
            <h3>Timetable Summary (Weekly Class Count)</h3>
            <ul>
              {Object.entries(timetableSummary).map(
                ([subject, count], index) => (
                  <li key={index}>
                    {subject}: {count} {count === 1 ? "class" : "classes"} per
                    week
                  </li>
                )
              )}
            </ul>
          </div>
        )}
      </div>

      {/* Upload Academic Calendar */}
      <div>
        <h2>Upload Academic Calendar</h2>
        <input type="file" onChange={handleCalendarChange} />
        <div>
          <label>Start Date: </label>
          <input
            type="date"
            name="startDate"
            value={semesterDates.startDate}
            onChange={handleDateChange}
          />
        </div>
        <div>
          <label>End Date: </label>
          <input
            type="date"
            name="endDate"
            value={semesterDates.endDate}
            onChange={handleDateChange}
          />
        </div>
        <button onClick={uploadAcademicCalendar}>Upload</button>
      </div>

      {/* Upload Syllabus */}
      <div>
        <h2>Upload Course Syllabus</h2>
        <input type="file" onChange={handleSyllabusChange} />
        <button onClick={uploadSyllabus}>Upload</button>
      </div>

      {/* Get Syllabus-Based Recommendations */}
      <div>
        <h2>Get Syllabus-Based Recommendations</h2>
        <button onClick={getSyllabusRecommendations}>
          Fetch from Syllabus
        </button>
        {syllabusRecommendations.length > 0 && (
          <ul>
            {syllabusRecommendations.map((rec, index) => (
              <li key={index}>
                <a href={rec.url} target="_blank" rel="noopener noreferrer">
                  {rec.title}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Get Leave Optimization */}
      <div>
        <h2>Leave Optimization</h2>
        <button onClick={getLeaveOptimization}>Get Suggestions</button>
        {leaveSuggestions.length > 0 && (
          <ul>
            {leaveSuggestions.map((suggestion, index) => (
              <li key={index}>
                {suggestion.date} - {suggestion.suggestion}
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
