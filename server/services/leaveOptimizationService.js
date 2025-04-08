// server/services/leaveOptimizationService.js
const AcademicCalendar = require("../models/AcademicCalendar");
const Timetable = require("../models/Timetable");

// Get leave optimization suggestions
exports.getLeaveOptimizations = async (userId) => {
  try {
    // Find the user's academic calendar
    const calendar = await AcademicCalendar.findOne({ userId });
    if (!calendar) {
      throw new Error("Academic calendar not found");
    }

    // Get timetable for attendance calculation
    const timetable = await Timetable.findOne({ userId });

    // Get calendar data
    const calendarData = calendar.calendarData;

    // Calculate leave optimizations
    const optimizations = calculateLeaveOptimizations(
      calendarData,
      calendar.startDate,
      calendar.endDate,
      timetable
    );

    return optimizations;
  } catch (error) {
    console.error("Error in getLeaveOptimizations service:", error);
    throw error;
  }
};

// Helper function to calculate leave optimizations
function calculateLeaveOptimizations(
  calendarData,
  startDate,
  endDate,
  timetable
) {
  // Sort calendar data by date
  const sortedHolidays = calendarData
    .filter((entry) => entry.holiday)
    .sort((a, b) => {
      const dateA = new Date(a.date.split(".").reverse().join("-"));
      const dateB = new Date(b.date.split(".").reverse().join("-"));
      return dateA - dateB;
    });

  const suggestions = [];

  // Find strategic leaves (long weekends, etc.)
  for (let i = 0; i < sortedHolidays.length; i++) {
    const holiday = sortedHolidays[i];
    const holidayDate = new Date(holiday.date.split(".").reverse().join("-"));
    const dayOfWeek = holidayDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

    // Convert day number to name for readability
    const dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const holidayDayName = dayNames[dayOfWeek];

    // Case 1: Holiday on Thursday - Take Friday off for 4-day weekend
    if (dayOfWeek === 4) {
      // Thursday
      const fridayDate = new Date(holidayDate);
      fridayDate.setDate(fridayDate.getDate() + 1);

      const formattedFriday = `${fridayDate
        .getDate()
        .toString()
        .padStart(2, "0")}.${(fridayDate.getMonth() + 1)
        .toString()
        .padStart(2, "0")}.${fridayDate.getFullYear()}`;

      suggestions.push({
        type: "Long Weekend",
        strategy: `Take leave on Friday (${formattedFriday}) after the holiday on Thursday (${holiday.date}) for a 4-day weekend`,
        dates: [holiday.date, formattedFriday],
        daysOff: 4,
        leavesUsed: 1,
      });
    }

    // Case 2: Holiday on Tuesday - Take Monday off for 4-day weekend
    if (dayOfWeek === 2) {
      // Tuesday
      const mondayDate = new Date(holidayDate);
      mondayDate.setDate(mondayDate.getDate() - 1);

      const formattedMonday = `${mondayDate
        .getDate()
        .toString()
        .padStart(2, "0")}.${(mondayDate.getMonth() + 1)
        .toString()
        .padStart(2, "0")}.${mondayDate.getFullYear()}`;

      suggestions.push({
        type: "Long Weekend",
        strategy: `Take leave on Monday (${formattedMonday}) before the holiday on Tuesday (${holiday.date}) for a 4-day weekend`,
        dates: [formattedMonday, holiday.date],
        daysOff: 4,
        leavesUsed: 1,
      });
    }

    // Case 3: Holiday on Wednesday - Take Monday and Tuesday or Thursday and Friday for a 5-day break
    if (dayOfWeek === 3) {
      // Wednesday
      const mondayDate = new Date(holidayDate);
      mondayDate.setDate(mondayDate.getDate() - 2);
      const tuesdayDate = new Date(holidayDate);
      tuesdayDate.setDate(tuesdayDate.getDate() - 1);

      const formattedMonday = `${mondayDate
        .getDate()
        .toString()
        .padStart(2, "0")}.${(mondayDate.getMonth() + 1)
        .toString()
        .padStart(2, "0")}.${mondayDate.getFullYear()}`;
      const formattedTuesday = `${tuesdayDate
        .getDate()
        .toString()
        .padStart(2, "0")}.${(tuesdayDate.getMonth() + 1)
        .toString()
        .padStart(2, "0")}.${tuesdayDate.getFullYear()}`;

      suggestions.push({
        type: "Mid-week Break",
        strategy: `Take leave on Monday (${formattedMonday}) and Tuesday (${formattedTuesday}) before the holiday on Wednesday (${holiday.date}) for a 5-day break`,
        dates: [formattedMonday, formattedTuesday, holiday.date],
        daysOff: 5,
        leavesUsed: 2,
      });

      const thursdayDate = new Date(holidayDate);
      thursdayDate.setDate(thursdayDate.getDate() + 1);
      const fridayDate = new Date(holidayDate);
      fridayDate.setDate(fridayDate.getDate() + 2);

      const formattedThursday = `${thursdayDate
        .getDate()
        .toString()
        .padStart(2, "0")}.${(thursdayDate.getMonth() + 1)
        .toString()
        .padStart(2, "0")}.${thursdayDate.getFullYear()}`;
      const formattedFriday = `${fridayDate
        .getDate()
        .toString()
        .padStart(2, "0")}.${(fridayDate.getMonth() + 1)
        .toString()
        .padStart(2, "0")}.${fridayDate.getFullYear()}`;

      suggestions.push({
        type: "Mid-week Break",
        strategy: `Take leave on Thursday (${formattedThursday}) and Friday (${formattedFriday}) after the holiday on Wednesday (${holiday.date}) for a 5-day break`,
        dates: [holiday.date, formattedThursday, formattedFriday],
        daysOff: 5,
        leavesUsed: 2,
      });
    }
  }

  // Calculate attendance data
  let attendanceSuggestion = calculateAttendanceRequirement(
    startDate,
    endDate,
    timetable
  );

  return {
    strategicLeaves: suggestions,
    attendanceInfo: attendanceSuggestion,
  };
}

function calculateAttendanceRequirement(startDate, endDate, timetable) {
  // If no timetable or dates, return basic message
  if (!startDate || !endDate || !timetable) {
    return {
      message:
        "To calculate attendance requirements, please upload a timetable and specify semester start/end dates.",
    };
  }

  try {
    // Parse start and end dates
    const start = new Date(startDate.split(".").reverse().join("-"));
    const end = new Date(endDate.split(".").reverse().join("-"));

    // Calculate total days in semester (excluding weekends)
    const totalDays = getWorkingDays(start, end);

    // Calculate total classes based on timetable
    const classesPerWeek = countClassesPerWeek(timetable.timetableData);
    const totalWeeks = Math.ceil(totalDays / 5); // Approximate number of weeks
    const totalClasses = classesPerWeek * totalWeeks;

    // Calculate allowed absences (25% of total)
    const minAttendanceRequired = Math.ceil(totalClasses * 0.75);
    const maxAbsences = totalClasses - minAttendanceRequired;

    return {
      totalClasses: totalClasses,
      minAttendanceRequired: minAttendanceRequired,
      maxAllowedAbsences: maxAbsences,
      message: `You can miss up to ${maxAbsences} classes to maintain 75% attendance. The semester has approximately ${totalClasses} total classes.`,
    };
  } catch (error) {
    console.error("Error calculating attendance:", error);
    return {
      message:
        "Could not calculate attendance requirements. Please ensure semester dates are correctly formatted.",
    };
  }
}

// Count working days between two dates (excluding weekends)
function getWorkingDays(startDate, endDate) {
  let count = 0;
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      // 0 = Sunday, 6 = Saturday
      count++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return count;
}

// Count classes per week from timetable data
function countClassesPerWeek(timetableData) {
  if (!timetableData) return 0;

  let count = 0;

  // Loop through each day
  for (const day in timetableData) {
    // Loop through each time slot for the day
    for (const timeSlot in timetableData[day]) {
      // If there's a class in this time slot, count it
      if (
        timetableData[day][timeSlot] &&
        timetableData[day][timeSlot].trim() !== ""
      ) {
        count++;
      }
    }
  }

  return count;
}
