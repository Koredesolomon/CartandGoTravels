export type InterviewQuestion = readonly [string, string];

export const appointmentCentres = {
  "Biometrics Enrolment": ["Lagos(VFS Global)", "Abuja(VFS global)", "BLS", "TLS"],
  "Medical Examination": ["Lagos(QLife)", "Abuja(QLife)", "IOM(Lagos)", "IOM(Abuja)", "IOM(Benin)", "St Nicholas Hospital"],
} as const;
export type AppointmentType = keyof typeof appointmentCentres;

export const interviewSets = {
  Study: {
    "Canada Study Permit": [
      ["Why did you choose to study in Canada specifically, and why now?", "Destination & Intent"],
      ["Walk me through the source of the funds shown in your bank statement.", "Funding Legitimacy"],
      ["What ties do you have to Nigeria that would bring you back after your studies?", "Home Country Ties"],
      ["What do you know about your specific programme, and how does it fit your career plan?", "Programme Knowledge"],
      ["Why this school and not a more affordable one closer to home?", "Destination & Intent"],
      ["Have you ever been refused a visa to Canada or any other country before?", "Prior Immigration History"],
      ["If your study permit is refused, what will you do?", "Contingency Planning"],
    ],
    "UK Student Visa": [
      ["Why did you choose this UK institution over others offering a similar course?", "Programme Knowledge"],
      ["How will you meet the maintenance funds requirement for the full length of your course?", "Funding Legitimacy"],
      ["What are your plans immediately after completing this course?", "Contingency Planning"],
      ["What ties, family, property or career, do you have in Nigeria?", "Home Country Ties"],
      ["Have you passed the English language requirement for this course?", "Programme Knowledge"],
    ],
    "Germany National D-Visa (Study)": [
      ["Why did you choose Germany over other study destinations?", "Destination & Intent"],
      ["How did you fund your blocked account, and where did that money originally come from?", "Funding Legitimacy"],
      ["What connects you to Nigeria that would bring you back after your studies or job-search period?", "Home Country Ties"],
      ["What do you know about the university and programme you have been admitted to?", "Programme Knowledge"],
      ["What will you do if your visa application is delayed or refused?", "Contingency Planning"],
    ],
    "USA F-1 Student Visa": [
      ["What school issued your I-20, and why did you choose that specific programme?", "Programme Knowledge"],
      ["Who is sponsoring your studies, and how do their finances support the full cost?", "Funding Legitimacy"],
      ["What ties will bring you back to Nigeria after this programme?", "Home Country Ties"],
      ["Why not study this same course in Nigeria or a cheaper destination?", "Destination & Intent"],
      ["US law presumes immigrant intent unless you prove otherwise. How do you prove otherwise?", "Contingency Planning"],
    ],
  },
  Work: {
    "UK Skilled Worker": [
      ["Why did this employer choose to sponsor you specifically for this role?", "Destination & Intent"],
      ["Can you describe your day-to-day responsibilities in the sponsored role?", "Programme Knowledge"],
      ["What ties do you currently have to Nigeria?", "Home Country Ties"],
      ["What is the salary being offered, and does it meet the going rate?", "Funding Legitimacy"],
      ["What is your plan if your Certificate of Sponsorship is withdrawn before you travel?", "Contingency Planning"],
    ],
    "Canada Work Permit": [
      ["What does your LMIA or exemption cover, and why were you selected for this role?", "Programme Knowledge"],
      ["How does your work experience in Nigeria qualify you for this position?", "Programme Knowledge"],
      ["What ties to Nigeria remain while you work abroad?", "Home Country Ties"],
      ["Who is your employer, and how did the job offer come about?", "Destination & Intent"],
      ["What will you do at the end of your work permit validity?", "Contingency Planning"],
    ],
    "UAE / Gulf Employment Visa": [
      ["How did you secure this job offer, and have you verified the employer directly?", "Destination & Intent"],
      ["What is your monthly salary, and how does it compare to the cost of living there?", "Funding Legitimacy"],
      ["What family or financial obligations do you have back home?", "Home Country Ties"],
      ["Do you have a copy of your employment contract, and do the terms match what was promised?", "Programme Knowledge"],
    ],
  },
  Visit: {
    "Schengen Tourist Visa": [
      ["What is the specific purpose of this trip, and why this itinerary?", "Destination & Intent"],
      ["Who is funding this trip, and can it be traced to a legitimate income source?", "Funding Legitimacy"],
      ["What obligations are waiting for you back in Nigeria?", "Home Country Ties"],
      ["Can you walk me through your day-by-day itinerary?", "Programme Knowledge"],
      ["Why should I believe you will leave the Schengen area before your visa expires?", "Contingency Planning"],
    ],
    "UK Visit Visa": [
      ["What is the main purpose of this visit, and where will you stay?", "Destination & Intent"],
      ["How is this trip funded, and can you show a clear paper trail?", "Funding Legitimacy"],
      ["What is pulling you back to Nigeria at the end of the trip?", "Home Country Ties"],
      ["Do you have return or onward flight booking already?", "Programme Knowledge"],
    ],
    "US B1/B2 Visitor Visa": [
      ["What is the purpose of your trip to the United States?", "Destination & Intent"],
      ["Who is paying for this trip, and what do you do for a living?", "Funding Legitimacy"],
      ["What do you own or owe in Nigeria that requires you to return?", "Home Country Ties"],
      ["How long do you intend to stay, and can you show your travel plans?", "Programme Knowledge"],
    ],
  },
} as const;

export type InterviewCategory = keyof typeof interviewSets;
