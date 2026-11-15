import type { Issue } from "./types";
import type { WhitelistEntry } from "./whitelist";

/** Phone of the simulated logged-in resident (prototype only, replaced by auth later). */
export const MOCK_CURRENT_USER_PHONE = "052-1234567";
/** The dev admin number from CLAUDE.md §1 (admin privileges come with the number). */
export const MOCK_ADMIN_PHONE = "050-0000000";
export const MOCK_HAS_UNREAD_ADMIN_MESSAGE = true;

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * Demo issues for the local-first prototype. Ages are relative to `now`, so a
 * fresh install always looks current ("לפני 40 דקות", "אתמול", ...). They cover
 * every status and category, with and without photos, admin notes and votes;
 * three (102, 105, 108) belong to the current user.
 */
export function createSeedIssues(now: number): Issue[] {
  const ago = (ms: number) => new Date(now - ms).toISOString();
  const image = (file: string, alt: string) => ({
    type: "image" as const,
    thumbnailUrl: `/mock/${file}`,
    fullUrl: `/mock/${file}`,
    alt,
  });

  return [
    {
      id: "101",
      title: "בור גדול בכביש ליד הכניסה לגן הילדים",
      description:
        "בור עמוק שמתמלא במים בכל גשם. רכבים נאלצים לסטות לנתיב הנגדי, מסוכן במיוחד בשעות הבוקר.",
      status: "בתהליך",
      category: "תשתיות וכבישים",
      location: "רחוב הבנים 12",
      media: image("pothole.svg", "בור בכביש"),
      adminNote: "הועבר לקבלן המועצה, צפי לתיקון עד סוף השבוע.",
      createdAt: ago(26 * HOUR),
      authorPhone: "054-7654321",
      ratingSum: 113,
      voteCount: 24,
    },
    {
      id: "102",
      title: "פנס רחוב לא עובד כבר שבועיים",
      description: "הפנס בפינת הרחוב כבוי והקטע חשוך לגמרי בלילה.",
      status: "בהמתנה",
      category: "תאורה חשמל",
      location: "רחוב הזית 4",
      media: image("streetlight.svg", "פנס רחוב כבוי"),
      createdAt: ago(3 * HOUR),
      authorPhone: MOCK_CURRENT_USER_PHONE,
      ratingSum: 9,
      voteCount: 2,
      myVote: 5,
    },
    {
      id: "103",
      title: "גיזום עצים בגינה הציבורית",
      description: "ענפים נמוכים חוסמים את השביל ומגיעים לגובה העיניים של ילדים.",
      status: "בוצע",
      category: "ניקיון וגינון",
      media: image("garden.svg", "גינה ציבורית"),
      adminNote: "הגיזום בוצע ביום ראשון. תודה על הדיווח!",
      createdAt: ago(5 * DAY),
      resolvedAt: ago(3 * DAY), // photo is deleted 4 days from now
      authorPhone: "050-1112233",
      ratingSum: 34,
      voteCount: 11,
    },
    {
      id: "104",
      title: "שער הכניסה הצפוני נשאר פתוח בלילות",
      description: "כבר כמה לילות שהשער לא נסגר אוטומטית אחרי 22:00.",
      status: "בהמתנה",
      category: "ביטחון",
      createdAt: ago(2 * DAY),
      authorPhone: "053-9998877",
      ratingSum: 14,
      voteCount: 3,
    },
    {
      id: "105",
      title: "בקשה להוספת ספסל בתחנת האוטובוס",
      description: "קשישים רבים ממתינים בעמידה, יהיה נחמד להוסיף ספסל וצל.",
      status: "נדחה",
      category: "אחר",
      adminNote: "התחנה באחריות משרד התחבורה, הפנייה הועברה אליהם.",
      // Just over a week old, so it never flips in and out of "new this week" by the minute.
      createdAt: ago(7 * DAY + 3 * HOUR),
      resolvedAt: ago(6 * DAY),
      authorPhone: MOCK_CURRENT_USER_PHONE,
      ratingSum: 16,
      voteCount: 6,
    },
    {
      id: "106",
      title: "פח האשפה עולה על גדותיו ליד המכולת",
      description:
        "הפח לא מרוקן כבר ארבעה ימים, האשפה מתפזרת ברוח ומושכת חתולים ומזיקים.",
      status: "בהמתנה",
      category: "ניקיון וגינון",
      location: "רחוב האלה 3, ליד המכולת",
      media: image("trash.svg", "פח אשפה עולה על גדותיו"),
      createdAt: ago(5 * HOUR),
      authorPhone: "050-2223344",
      ratingSum: 41,
      voteCount: 9,
    },
    {
      id: "107",
      title: "נזילת מים מתמשכת בצנרת הראשית",
      description:
        "מים זולגים לכביש כבר יומיים ויוצרים שלולית גדולה שמסוכנת להולכי רגל בבוקר.",
      status: "בתהליך",
      category: "תשתיות וכבישים",
      location: "רחוב התמר 7",
      media: image("leak.svg", "נזילת מים בכביש"),
      adminNote: "צוות שירות הוזמן למקום. צפי לסיום התיקון עד מחר בערב.",
      createdAt: ago(2 * DAY + 3 * HOUR),
      authorPhone: "054-1002003",
      ratingSum: 52,
      voteCount: 11,
    },
    {
      id: "108",
      title: 'שצ"פ מוזנח עם זכוכיות שבורות',
      description:
        "בשטח הציבורי הפתוח ליד בית הכנסת יש שברי זכוכית על הדשא, וילדים משחקים שם בכל אחר צהריים.",
      status: "בהמתנה",
      category: "ניקיון וגינון",
      location: 'השצ"פ ליד בית הכנסת',
      media: image("park.svg", "שצ״פ עם שברי זכוכית"),
      createdAt: ago(4 * DAY),
      authorPhone: MOCK_CURRENT_USER_PHONE,
      ratingSum: 28,
      voteCount: 6,
    },
    {
      id: "109",
      title: "מצלמת האבטחה בכניסה לשכונה לא מקליטה",
      description:
        "המצלמה בשער הראשי מציגה מסך שחור מאז סוף השבוע, ואין תיעוד של מי שנכנס בלילה.",
      status: "בתהליך",
      category: "ביטחון",
      location: "השער הראשי",
      adminNote: "הטכנאי יגיע ביום שלישי להחלפת המצלמה.",
      createdAt: ago(6 * DAY),
      authorPhone: "053-7778899",
      ratingSum: 19,
      voteCount: 4,
    },
    {
      id: "110",
      title: "צומת מסוכן ללא מראה בפינת הבנים והזית",
      description:
        "הנהגים לא רואים תנועה מהצד בצומת, וכבר היו כמה כמעט-תאונות. מבקשים להציב מראה קמורה.",
      status: "בהמתנה",
      category: "תשתיות וכבישים",
      location: "צומת הבנים והזית",
      createdAt: ago(9 * DAY),
      authorPhone: "050-8889900",
      ratingSum: 47,
      voteCount: 10,
    },
    {
      id: "111",
      title: "תאורה חלשה בשביל לבית הספר",
      description:
        "השביל חשוך בבקרים של החורף ובערב, והילדים הולכים בו בלי תאורה מספקת.",
      status: "בוצע",
      category: "תאורה חשמל",
      location: "השביל לבית הספר",
      adminNote: "הוחלפו שלושה גופי תאורה והוגברה העוצמה. תודה על הדיווח!",
      createdAt: ago(12 * DAY),
      resolvedAt: ago(10 * DAY),
      mediaRemovedAt: ago(3 * DAY), // its photo was deleted after the 7-day grace period
      authorPhone: "052-6667788",
      ratingSum: 31,
      voteCount: 7,
    },
    {
      id: "112",
      title: "כלבים משוטטים ללא השגחה בשעות הערב",
      description:
        "בערבים מסתובבים בשכונה כלבים בלי רצועה, והם מפחידים הולכי רגל ורוכבי אופניים.",
      status: "נדחה",
      category: "ביטחון",
      adminNote: "הנושא באחריות הפיקוח העירוני ולכן הועבר אליהם לטיפול.",
      createdAt: ago(18 * DAY),
      resolvedAt: ago(15 * DAY),
      authorPhone: "058-1231231",
      ratingSum: 12,
      voteCount: 5,
    },
    {
      id: "113",
      title: "רעש מתמשך ממגרש הכדורסל אחרי חצות",
      description:
        "בשבוע האחרון יש משחקים וצעקות במגרש עד אחת בלילה, ותושבים בבתים הסמוכים לא מצליחים לישון.",
      status: "בהמתנה",
      category: "אחר",
      location: "מגרש הכדורסל ברחוב הדקל",
      createdAt: ago(40 * MINUTE),
      authorPhone: "058-4455667",
      ratingSum: 22,
      voteCount: 7,
    },
  ];
}

/** Demo whitelist: the dev admin number plus every resident who authored a demo issue. */
export function createSeedWhitelist(now: number): WhitelistEntry[] {
  const addedAgo = (days: number) => new Date(now - days * DAY).toISOString();
  const residents = [...new Set(createSeedIssues(now).map((issue) => issue.authorPhone))];

  return [
    { phone: MOCK_ADMIN_PHONE, role: "admin", addedAt: addedAgo(60) },
    { phone: "054-8034099", role: "resident", addedAt: addedAgo(1) },
    ...residents.map((phone, index) => ({
      phone,
      role: "resident" as const,
      addedAt: addedAgo(45 - index * 3),
    })),
  ];
}
