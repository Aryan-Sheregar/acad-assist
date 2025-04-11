import React, { useState, useRef } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [userData, setUserData] = useState({
    userId: "default_user",
    name: "Default User",
    email: "default@example.com",
  });
  const [timetableFile, setTimetableFile] = useState(null);
  const [calendarFile, setCalendarFile] = useState(null);
  const [syllabusFile, setSyllabusFile] = useState(null);
  const [syllabusRecommendations, setSyllabusRecommendations] = useState([]);
  const [leaveSuggestions, setLeaveSuggestions] = useState({
    strategicLeaves: [],
    attendanceInfo: { message: "", subjectWise: {} },
  });
  const [semesterDates, setSemesterDates] = useState({
    startDate: "",
    endDate: "",
  });
  const [message, setMessage] = useState("");

  // References to file inputs
  const timetableInputRef = useRef(null);
  const calendarInputRef = useRef(null);
  const syllabusInputRef = useRef(null);

  // const handleUserChange = (e) => {
  //   setUserData({ ...userData, [e.target.name]: e.target.value });
  // };

  const handleTimetableChange = (e) => {
    const file = e.target.files[0];
    setTimetableFile(file);
  };

  const handleCalendarChange = (e) => {
    const file = e.target.files[0];
    setCalendarFile(file);
  };

  const handleSyllabusChange = (e) => {
    const file = e.target.files[0];
    setSyllabusFile(file);
  };

  const handleDateChange = (e) =>
    setSemesterDates({ ...semesterDates, [e.target.name]: e.target.value });

  const formatDate = (isoDate) => {
    if (!isoDate) return "";
    const [year, month, day] = isoDate.split("-");
    return `${day}.${month}.${year}`;
  };

  // Helper function to extract YouTube video ID from URL
  const getYoutubeVideoId = (url) => {
    if (!url) return null;

    // Handle various YouTube URL formats
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);

    return match && match[2].length === 11 ? match[2] : null;
  };

  // const addUser = async () => {
  //   console.log("Using default user,",userData);
  //   return;
  //   try {
  //     const res = await axios.post(
  //       "http://localhost:5001/api/users/add",
  //       userData
  //     );
  //     setMessage(res.data.message);
  //   } catch (error) {
  //     setMessage("Error: " + (error.response?.data.error || error.message));
  //   }
  // };

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
    formData.append("startDate", formatDate(semesterDates.startDate));
    formData.append("endDate", formatDate(semesterDates.endDate));

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
    try {
      if (!userData.userId) {
        setMessage("Please provide a User ID");
        return;
      }

      const res = await axios.post(
        "http://localhost:5001/api/optimization/leave",
        {
          userId: userData.userId,
        }
      );

      setLeaveSuggestions(res.data.suggestions);
      setMessage("Leave optimization suggestions fetched successfully");
    } catch (error) {
      console.error("Error:", error);
      setMessage("Error: " + (error.response?.data.error || error.message));
    }
  };

  // Helper function for file input display
  const getFileName = (file) => {
    return file ? file.name : "No file chosen";
  };

  return (
    <div className="App">
      <h1>AcadAssist</h1>
      <p style={{ textAlign: "center", marginBottom: "40px" }}>
        Your personal academic assistant for better semester planning
      </p>

      <div className="section-grid">
        {/* Add User */}
        {/* <div className="card">
          <h3>👤 Add User</h3>
          <label>User ID</label>
          <input
            type="text"
            name="userId"
            onChange={handleUserChange}
            placeholder="Enter user ID"
          />
          <label>Name</label>
          <input
            type="text"
            name="name"
            onChange={handleUserChange}
            placeholder="Enter name"
          />
          <label>Email</label>
          <input
            type="email"
            name="email"
            onChange={handleUserChange}
            placeholder="Enter email"
          />
          <button className="button" onClick={addUser}>
            Save User
          </button>
        </div> */}

        {/* Upload Timetable */}
        <div className="card">
          <h3>Upload Timetable</h3>
          <p>Optimize your class schedule</p>
          <div className="file-input-wrapper">
            <div
              className="file-input-field"
              onClick={() => timetableInputRef.current.click()}
            >
              {getFileName(timetableFile)}
              <span className="file-input-label">Browse</span>
            </div>
            <input
              type="file"
              ref={timetableInputRef}
              onChange={handleTimetableChange}
            />
          </div>
          <button className="button" onClick={uploadTimetable}>
            Upload
          </button>
        </div>

        {/* Upload Calendar */}
        <div className="card">
          <h3>Upload Calendar</h3>
          <p>Track academic holidays</p>
          <div className="file-input-wrapper">
            <div
              className="file-input-field"
              onClick={() => calendarInputRef.current.click()}
            >
              {getFileName(calendarFile)}
              <span className="file-input-label">Browse</span>
            </div>
            <input
              type="file"
              ref={calendarInputRef}
              onChange={handleCalendarChange}
            />
          </div>
          <label>Start Date</label>
          <input
            type="date"
            name="startDate"
            value={semesterDates.startDate}
            onChange={handleDateChange}
          />
          <label>End Date</label>
          <input
            type="date"
            name="endDate"
            value={semesterDates.endDate}
            onChange={handleDateChange}
          />
          <button className="button" onClick={uploadAcademicCalendar}>
            Upload
          </button>
        </div>

        {/* Upload Syllabus */}
        <div className="card">
          <h3>Upload Syllabus</h3>
          <p>Personalized study videos</p>
          <div className="file-input-wrapper">
            <div
              className="file-input-field"
              onClick={() => syllabusInputRef.current.click()}
            >
              {getFileName(syllabusFile)}
              <span className="file-input-label">Browse</span>
            </div>
            <input
              type="file"
              ref={syllabusInputRef}
              onChange={handleSyllabusChange}
            />
          </div>
          <button className="button" onClick={uploadSyllabus}>
            Upload
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="action-buttons">
        <button className="button" onClick={getSyllabusRecommendations}>
          Get Syllabus Recommendations
        </button>
        <button className="button" onClick={getLeaveOptimization}>
          Get Leave Suggestions
        </button>
      </div>

      {/* Video Recommendations with Previews */}
      {syllabusRecommendations.length > 0 && (
        <div className="recommendation-section">
          <h3>Syllabus-Based Video Recommendations</h3>
          <div className="video-grid">
            {syllabusRecommendations.map((rec, index) => {
              const videoId = getYoutubeVideoId(rec.url);

              return (
                <div key={index} className="video-card">
                  <div className="video-preview">
                    {videoId ? (
                      <iframe
                        src={`https://www.youtube.com/embed/${videoId}`}
                        title={rec.title}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    ) : (
                      <div className="video-thumbnail">
                        <img src="/api/placeholder/320/180" alt={rec.title} />
                        <div className="play-button">▶</div>
                      </div>
                    )}
                  </div>
                  <div className="video-info">
                    <h4>{rec.title}</h4>
                    <a
                      href={rec.url}
                      target="_blank"
                      rel="noreferrer"
                      className="video-link"
                    >
                      Watch Full Video
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Leave Suggestions */}
      {leaveSuggestions.strategicLeaves?.length > 0 && (
        <div className="leave-list">
          <h3>Leave Optimization Suggestions</h3>
          {leaveSuggestions.strategicLeaves.map((item, idx) => (
            <div key={idx} className="card" style={{ maxWidth: "100%" }}>
              <h4>{item.type}</h4>
              <p>{item.strategy}</p>
              <ul>
                <li>
                  <strong>Leave Days:</strong>{" "}
                  {item.leaveDays.map((d) => `${d.day} (${d.date})`).join(", ")}
                </li>
                <li>
                  <strong>Holidays:</strong>{" "}
                  {item.holidays.map((d) => `${d.day} (${d.date})`).join(", ")}
                </li>
                <li>
                  <strong>Total Days Off:</strong> {item.daysOff}
                </li>
                <li>
                  <strong>Leaves Used:</strong> {item.leavesUsed}
                </li>
              </ul>
            </div>
          ))}

          {/* Subject-wise Attendance Insights */}
          {leaveSuggestions.attendanceInfo.subjectWise && (
            <div className="recommendation-list">
              <h3>📘 Subject-wise Attendance Insights</h3>
              <ul>
                {Object.entries(
                  leaveSuggestions.attendanceInfo.subjectWise
                ).map(([subject, info], idx) => (
                  <li key={idx}>
                    <strong>{subject}</strong> — Total: {info.totalClasses}, Min
                    Required: {info.minAttendanceRequired}, Max Leaves:{" "}
                    {info.maxAllowedAbsences}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {message && (
        <p style={{ color: "#38bdf8", marginTop: "20px" }}>{message}</p>
      )}
    </div>
  );
}

export default App;
