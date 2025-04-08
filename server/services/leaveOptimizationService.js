const AcademicCalendar = require("../models/AcademicCalendar");

// Get leave optimization suggestions
async function getLeaveOptimizations(userId) {
  // Find the user's academic calendar
  const calendar = await AcademicCalendar.findOne({ userId });

  if (!calendar) {
    throw new Error("Academic calendar not found");
  }

  // Get calendar data, start date, and end date
  const calendarData = calendar.calendarData || [];
  const startDate = new Date(calendar.startDate);
  const endDate = new Date(calendar.endDate);

  if (!startDate || !endDate) {
    throw new Error("Start date or end date not found in academic calendar");
  }

  // Calculate leave optimizations
  const optimizations = calculateLeaveOptimizations(
    calendarData,
    startDate,
    endDate
  );

  return optimizations;
}

// Helper function to calculate leave optimizations
function calculateLeaveOptimizations(calendarData, startDate, endDate) {
  const holidays = calendarData.filter(
    (entry) => entry.holiday && typeof entry.holiday === "string"
  );

  const optimizations = {
    longWeekends: [],
    suggestedLeaves: [],
  };

  // Convert holidays to Date objects for easier comparison
  const holidayDates = holidays.map((holiday) => ({
    date: new Date(holiday.date.split(".").reverse().join("-")), // Convert DD.MM.YYYY to YYYY-MM-DD
    description: holiday.holiday,
  }));

  // Iterate through each day in the semester
  let currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 6 = Saturday
    const isHoliday = holidayDates.find(
      (h) => h.date.toDateString() === currentDate.toDateString()
    );

    // Check for Thursday holiday (extend to Friday)
    if (isHoliday && dayOfWeek === 4) {
      // Thursday
      const nextDay = new Date(currentDate);
      nextDay.setDate(nextDay.getDate() + 1); // Friday
      if (nextDay <= endDate && nextDay.getDay() === 5) {
        // Ensure it's Friday
        const isNextDayHoliday = holidayDates.find(
          (h) => h.date.toDateString() === nextDay.toDateString()
        );
        if (!isNextDayHoliday) {
          optimizations.suggestedLeaves.push({
            date: nextDay.toISOString().split("T")[0], // YYYY-MM-DD format
            suggestion: `Take leave on ${nextDay.toDateString()} (Friday) after ${
              isHoliday.description
            } on Thursday for a 4-day weekend (Thu-Sun)`,
          });
        }
      }
    }

    // Check for Monday holiday (extend from Friday)
    if (isHoliday && dayOfWeek === 1) {
      // Monday
      const prevDay = new Date(currentDate);
      prevDay.setDate(prevDay.getDate() - 3); // Friday (3 days back from Monday)
      if (prevDay >= startDate && prevDay.getDay() === 5) {
        // Ensure it's Friday
        const isPrevDayHoliday = holidayDates.find(
          (h) => h.date.toDateString() === prevDay.toDateString()
        );
        if (!isPrevDayHoliday) {
          optimizations.suggestedLeaves.push({
            date: prevDay.toISOString().split("T")[0], // YYYY-MM-DD format
            suggestion: `Take leave on ${prevDay.toDateString()} (Friday) before ${
              isHoliday.description
            } on Monday for a 4-day weekend (Fri-Mon)`,
          });
        }
      }
    }

    // Move to the next day
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return optimizations;
}

module.exports = {
  getLeaveOptimizations,
};
