// server/services/leaveOptimizationService.js
import AcademicCalendar from "../models/AcademicCalendar.js";
import Timetable from "../models/Timetable.js";

// Get leave optimization suggestions
exports.getLeaveOptimizations = async (userId) => {
  try {
    const calendar = await AcademicCalendar.findOne({ userId });
    if (!calendar) throw new Error("Academic calendar not found");

    const timetable = await Timetable.findOne({ userId });
    const calendarData = calendar.calendarData;

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

function calculateLeaveOptimizations(
  calendarData,
  startDate,
  endDate,
  timetable
) {
  const sortedHolidays = calendarData
    .filter((entry) => entry.date && entry.day) // FIXED: include all valid holidays even if no 'holiday' label
    .sort((a, b) => {
      const dateA = new Date(a.date.split(".").reverse().join("-"));
      const dateB = new Date(b.date.split(".").reverse().join("-"));
      return dateA - dateB;
    });
  const suggestions = [];
  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  for (let i = 0; i < sortedHolidays.length; i++) {
    const holiday = sortedHolidays[i];
    const holidayDate = new Date(holiday.date.split(".").reverse().join("-"));
    const dayOfWeek = holidayDate.getDay();
    const holidayDayName = dayNames[dayOfWeek];

    console.log("➡️ Checking holiday:", holiday);

    if (dayOfWeek === 4) {
      const fridayDate = new Date(holidayDate);
      fridayDate.setDate(fridayDate.getDate() + 1);
      const formattedFriday = formatDate(fridayDate);

      suggestions.push({
        type: "Long Weekend",
        strategy: `Take leave on Friday (${formattedFriday}) after the holiday on Thursday (${holiday.date}) for a 4-day weekend`,
        leaveDays: [{ date: formattedFriday, day: "Friday" }],
        holidays: [{ date: holiday.date, day: holidayDayName }],
        daysOff: 4,
        leavesUsed: 1,
      });
      console.log("✅ Triggered Thursday-Long Weekend suggestion");
    }

    if (dayOfWeek === 2) {
      const mondayDate = new Date(holidayDate);
      mondayDate.setDate(mondayDate.getDate() - 1);
      const formattedMonday = formatDate(mondayDate);

      suggestions.push({
        type: "Long Weekend",
        strategy: `Take leave on Monday (${formattedMonday}) before the holiday on Tuesday (${holiday.date}) for a 4-day weekend`,
        leaveDays: [{ date: formattedMonday, day: "Monday" }],
        holidays: [{ date: holiday.date, day: holidayDayName }],
        daysOff: 4,
        leavesUsed: 1,
      });
      console.log("✅ Triggered Tuesday-Long Weekend suggestion");
    }

    if (dayOfWeek === 3) {
      const monday = new Date(holidayDate);
      monday.setDate(monday.getDate() - 2);
      const tuesday = new Date(holidayDate);
      tuesday.setDate(tuesday.getDate() - 1);

      suggestions.push({
        type: "Mid-week Break",
        strategy: `Take leave on Monday (${formatDate(
          monday
        )}) and Tuesday (${formatDate(
          tuesday
        )}) before the holiday on Wednesday (${
          holiday.date
        }) for a 5-day break`,
        leaveDays: [
          { date: formatDate(monday), day: "Monday" },
          { date: formatDate(tuesday), day: "Tuesday" },
        ],
        holidays: [{ date: holiday.date, day: holidayDayName }],
        daysOff: 5,
        leavesUsed: 2,
      });

      const thursday = new Date(holidayDate);
      thursday.setDate(thursday.getDate() + 1);
      const friday = new Date(holidayDate);
      friday.setDate(friday.getDate() + 2);

      suggestions.push({
        type: "Mid-week Break",
        strategy: `Take leave on Thursday (${formatDate(
          thursday
        )}) and Friday (${formatDate(
          friday
        )}) after the holiday on Wednesday (${holiday.date}) for a 5-day break`,
        leaveDays: [
          { date: formatDate(thursday), day: "Thursday" },
          { date: formatDate(friday), day: "Friday" },
        ],
        holidays: [{ date: holiday.date, day: holidayDayName }],
        daysOff: 5,
        leavesUsed: 2,
      });
      console.log("✅ Triggered Wednesday-Mid-week Break suggestions");
    }
  }

  const attendanceSuggestion = calculateAttendanceRequirement(
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
  if (!startDate || !endDate || !timetable || !timetable.timetableData) {
    return {
      message:
        "To calculate attendance requirements, please upload a timetable and specify semester start/end dates.",
    };
  }

  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const totalDays = getWorkingDays(start, end);
    const totalWeeks = Math.ceil(totalDays / 5);
    const perSubjectCounts = {};

    for (const day in timetable.timetableData) {
      const slots = timetable.timetableData[day];
      for (const slot in slots) {
        const subject = slots[slot].trim();
        if (subject && subject.toLowerCase() !== "free") {
          const matches = subject.match(/(CSE|SEC|MGT|VAC)\s*\d+/gi);
          if (matches) {
            for (const match of matches) {
              const subjectCode = match.replace(/\s+/g, " ");
              perSubjectCounts[subjectCode] =
                (perSubjectCounts[subjectCode] || 0) + 1;
            }
          }
        }
      }
    }

    const subjectAttendance = {};
    for (const subject in perSubjectCounts) {
      const weekly = perSubjectCounts[subject];
      const total = weekly * totalWeeks;
      const minRequired = Math.ceil(total * 0.75);
      const maxMiss = total - minRequired;

      subjectAttendance[subject] = {
        totalClasses: total,
        minAttendanceRequired: minRequired,
        maxAllowedAbsences: maxMiss,
      };
    }

    return {
      subjectWise: subjectAttendance,
      message: `Attendance requirements calculated for each subject.`,
    };
  } catch (error) {
    console.error("Error calculating per-subject attendance:", error);
    return {
      message:
        "Could not calculate attendance per subject. Check date formatting and timetable data.",
    };
  }
}

function getWorkingDays(startDate, endDate) {
  let count = 0;
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) count++;
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return count;
}

function formatDate(dateObj) {
  return `${dateObj.getDate().toString().padStart(2, "0")}.${(
    dateObj.getMonth() + 1
  )
    .toString()
    .padStart(2, "0")}.${dateObj.getFullYear()}`;
}
