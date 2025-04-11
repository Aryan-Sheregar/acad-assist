const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // e.g., "acadassist@gmail.com"
    pass: process.env.EMAIL_PASS, // App password or SMTP credentials
  },
});

const sendLeaveSuggestionsEmail = async (to, suggestions) => {
  const subject = "Your Leave Optimization Suggestions from AcadAssist";

  const strategic = suggestions.strategicLeaves
    .map((item, idx) => {
      return `
      <h4>${item.type}</h4>
      <p>${item.strategy}</p>
      <ul>
        <li><strong>Leave Days:</strong> ${item.leaveDays
          .map((d) => `${d.day} (${d.date})`)
          .join(", ")}</li>
        <li><strong>Holidays:</strong> ${item.holidays
          .map((d) => `${d.day} (${d.date})`)
          .join(", ")}</li>
        <li><strong>Total Days Off:</strong> ${item.daysOff}</li>
        <li><strong>Leaves Used:</strong> ${item.leavesUsed}</li>
      </ul>
    `;
    })
    .join("<br>");

  const attendance = Object.entries(
    suggestions.attendanceInfo.subjectWise || {}
  )
    .map(
      ([subject, data]) =>
        `<li>${subject} — Total: ${data.totalClasses}, Min Required: ${data.minAttendanceRequired}, Max Leaves: ${data.maxAllowedAbsences}</li>`
    )
    .join("");

  const htmlContent = `
    <h2>Strategic Leave Suggestions</h2>
    ${strategic}
    <h2>Subject-wise Attendance Insights</h2>
    <ul>${attendance}</ul>
    <p>Thank you for using AcadAssist!</p>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    html: htmlContent,
  });
};

module.exports = { sendLeaveSuggestionsEmail };
