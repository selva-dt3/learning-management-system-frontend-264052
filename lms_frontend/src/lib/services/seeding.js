/**
 * Seed utility for inserting demo data into Supabase: courses, lessons, assignments and optional progress.
 * Uses idempotent UPSERTs with stable unique keys and returns counts & messages for UI feedback.
 * No secrets are used; relies on existing Supabase client configuration.
 */

// PUBLIC_INTERFACE
/**
 * SeedResult object describing the outcome of a seed operation.
 * @typedef {Object} SeedResult
 * @property {number} coursesInserted - number of courses inserted or updated
 * @property {number} lessonsInserted - number of lessons inserted or updated
 * @property {number} assignmentsInserted - number of assignments inserted or updated
 * @property {number} progressInserted - number of progress rows inserted or updated
 * @property {string[]} warnings - non-fatal warnings encountered
 * @property {string[]} errors - fatal errors encountered; if non-empty consider seed failed
 */

import { supabase } from "../supabaseClient";

/**
 * Checks if a table exists by attempting a minimal select with limit 1.
 * Surfaces actionable error messages suggesting to review README SQL if missing or RLS blocks access.
 * @param {string} table
 * @returns {Promise<boolean>}
 */
async function tableExists(table) {
  const { error } = await supabase.from(table).select("*", { count: "exact", head: true }).limit(1);
  if (!error) return true;

  const msg = (error?.message || "").toLowerCase();
  const code = error?.code || "";
  // If RLS blocks or table missing, provide hint; still return false to allow caller to handle.
  console.warn(`[seed] Table existence check error for ${table}:`, error);
  return false;
}

/**
 * Find users by provided emails or by domain heuristic (e.g., *@demo.com).
 * Returns a map email -> user record for fast lookup.
 * Non-fatal failures are returned as warnings.
 * @param {string[]} emails
 * @returns {Promise<{ usersByEmail: Record<string, any>, warnings: string[] }>}
 */
async function resolveUsersByEmailOrDemoDomain(emails) {
  const warnings = [];
  const usersByEmail = {};

  // If auth schema view or users table not exposed, we can't resolve. Try common public "profiles" or "users".
  // Attempt profile-like table first.
  const candidateTables = ["profiles", "users"];
  let profilesTable = null;

  for (const t of candidateTables) {
    const exists = await tableExists(t);
    if (exists) {
      profilesTable = t;
      break;
    }
  }

  if (!profilesTable) {
    warnings.push(
      "Could not locate a user directory table (profiles/users). Assignments may not be linked by email. See README for exposing a profiles view."
    );
    return { usersByEmail, warnings };
  }

  // Lookup specific emails
  const normalizedEmails = (emails || []).map((e) => (e || "").trim().toLowerCase()).filter(Boolean);
  if (normalizedEmails.length > 0) {
    const { data, error } = await supabase
      .from(profilesTable)
      .select("*")
      .in("email", normalizedEmails);

    if (error) {
      console.warn("[seed] Error fetching users by email:", error);
      warnings.push(
        `Failed to fetch users by email from ${profilesTable}. Check RLS and README_RLS_TROUBLESHOOTING.md.`
      );
    } else if (data && data.length) {
      data.forEach((u) => {
        if (u.email) usersByEmail[(u.email || "").toLowerCase()] = u;
      });
    }
  }

  // If not all found, try demo domain heuristic
  const missingEmails = normalizedEmails.filter((e) => !usersByEmail[e]);
  if (missingEmails.length > 0 || normalizedEmails.length === 0) {
    const demoDomain = "demo.com";
    const { data, error } = await supabase
      .from(profilesTable)
      .select("*")
      .ilike("email", `%.${demoDomain}`);

    if (error) {
      console.warn("[seed] Error fetching users by demo domain:", error);
      warnings.push(
        `Failed to fetch users by domain from ${profilesTable}. Check RLS and README_RLS_TROUBLESHOOTING.md.`
      );
    } else if (data && data.length) {
      data.forEach((u) => {
        if (u.email) usersByEmail[(u.email || "").toLowerCase()] = u;
      });
      if (normalizedEmails.length === 0) {
        warnings.push(
          `No emails provided; using demo domain matches from ${profilesTable} (%.${demoDomain}).`
        );
      } else if (missingEmails.length > 0) {
        warnings.push(
          `Some emails not found; assignments may be created for users discovered under %.${demoDomain}.`
        );
      }
    }
  }

  return { usersByEmail, warnings };
}

/**
 * Idempotent upsert helper with stable conflict target.
 * @param {string} table
 * @param {Array<Object>} rows
 * @param {string|string[]} onConflict - column or columns for conflict target
 * @returns {Promise<{count: number, error?: any}>}
 */
async function upsertRows(table, rows, onConflict) {
  if (!rows || rows.length === 0) return { count: 0 };
  const { data, error } = await supabase
    .from(table)
    .upsert(rows, { onConflict, ignoreDuplicates: false })
    .select();

  if (error) {
    return { count: 0, error };
  }
  return { count: Array.isArray(data) ? data.length : 0 };
}

/**
 * Generate sample data per acceptance criteria.
 * 3 courses, 5-6 lessons (pdf/video/link - use link_url), 3-4 assignments.
 */
function buildSampleData({ userEmailsResolved = [] } = {}) {
  const now = new Date().toISOString();

  const courses = [
    {
      code: "COURSE_REACT_BASICS",
      title: "React Basics",
      description: "Introduction to React components, state, and props.",
      created_at: now,
      updated_at: now,
    },
    {
      code: "COURSE_ADV_REACT",
      title: "Advanced React",
      description: "Hooks, context, performance, and advanced patterns.",
      created_at: now,
      updated_at: now,
    },
    {
      code: "COURSE_HR_COMPLIANCE",
      title: "HR Compliance",
      description: "Mandatory HR policies and workplace compliance.",
      created_at: now,
      updated_at: now,
    },
  ];

  // Lessons reference course_code stable key for idempotent linking
  const lessons = [
    {
      lesson_key: "REACT_BASICS_PDF_1",
      course_code: "COURSE_REACT_BASICS",
      title: "React Intro (PDF)",
      type: "pdf",
      link_url:
        "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      asset_url: null,
      order_index: 1,
      created_at: now,
      updated_at: now,
    },
    {
      lesson_key: "REACT_BASICS_VIDEO_1",
      course_code: "COURSE_REACT_BASICS",
      title: "JSX and Rendering (Video)",
      type: "video",
      link_url: "https://www.youtube.com/watch?v=Ke90Tje7VS0",
      asset_url: null,
      order_index: 2,
      created_at: now,
      updated_at: now,
    },
    {
      lesson_key: "ADV_REACT_LINK_1",
      course_code: "COURSE_ADV_REACT",
      title: "Hooks Overview (Link)",
      type: "link",
      link_url: "https://react.dev/learn",
      asset_url: null,
      order_index: 1,
      created_at: now,
      updated_at: now,
    },
    {
      lesson_key: "ADV_REACT_VIDEO_1",
      course_code: "COURSE_ADV_REACT",
      title: "useEffect Deep Dive (Video)",
      type: "video",
      link_url: "https://www.youtube.com/watch?v=0ZJgIjIuY7U",
      asset_url: null,
      order_index: 2,
      created_at: now,
      updated_at: now,
    },
    {
      lesson_key: "HR_COMP_LINK_1",
      course_code: "COURSE_HR_COMPLIANCE",
      title: "Workplace Safety (Link)",
      type: "link",
      link_url: "https://www.osha.gov/sites/default/files/publications/OSHA3195.pdf",
      asset_url: null,
      order_index: 1,
      created_at: now,
      updated_at: now,
    },
    {
      lesson_key: "HR_COMP_PDF_1",
      course_code: "COURSE_HR_COMPLIANCE",
      title: "Code of Conduct (PDF)",
      type: "pdf",
      link_url:
        "https://unec.edu.az/application/uploads/2014/12/pdf-sample.pdf",
      asset_url: null,
      order_index: 2,
      created_at: now,
      updated_at: now,
    },
  ];

  // Assignments link user by email (resolved to id later if schema requires).
  const assignments = [];
  const candidateCourses = ["COURSE_REACT_BASICS", "COURSE_ADV_REACT", "COURSE_HR_COMPLIANCE"];
  const titles = ["Complete Lesson 1", "Quiz 1", "Watch Video", "Acknowledge Policy"];

  const emails = userEmailsResolved.filter(Boolean);
  const choose = (arr) => arr[Math.floor(Math.random() * arr.length)];

  // 3-4 assignments mapped to provided emails or discovered demo users
  const totalAssignments = Math.min(Math.max(emails.length, 3), 4);
  for (let i = 0; i < totalAssignments; i++) {
    const email = emails[i % emails.length] || `unknown${i}@demo.com`;
    assignments.push({
      assignment_key: `ASSIGN_${email}_${i}`.toUpperCase(),
      user_email: email.toLowerCase(),
      course_code: choose(candidateCourses),
      title: choose(titles),
      due_date: new Date(Date.now() + (i + 3) * 24 * 60 * 60 * 1000).toISOString(),
      status: "assigned",
      created_at: now,
      updated_at: now,
    });
  }

  return { courses, lessons, assignments };
}

/**
 * Resolve course and user foreign keys if schema uses ids, with graceful fallback if only codes/emails exist.
 * This function tries to fetch course IDs by code and user IDs by email, transforming rows accordingly.
 * If the target schema uses code/email directly, the UPSERT will still succeed.
 */
async function transformForForeignKeys(sample) {
  const { courses, lessons, assignments } = sample;

  // Attempt to load courses to map code -> id
  let courseIdByCode = {};
  const coursesTable = "courses";
  const lessonsTable = "lessons";
  const assignmentsTable = "assignments";
  const progressTable = "progress"; // optional

  const { data: courseRows, error: courseErr } = await supabase
    .from(coursesTable)
    .select("id, code");

  if (!courseErr && Array.isArray(courseRows)) {
    courseRows.forEach((c) => {
      if (c.code && c.id) courseIdByCode[c.code] = c.id;
    });
  }

  // Course upsert first so subsequent lookups can succeed
  return {
    courseIdByCode,
    coursesTable,
    lessonsTable,
    assignmentsTable,
    progressTable,
    courses,
    lessons,
    assignments,
  };
}

// PUBLIC_INTERFACE
/**
 * Seed sample data into Supabase. Safe to run multiple times due to UPSERT semantics.
 * Tables expected: courses (unique code), lessons (unique lesson_key), assignments (unique assignment_key), progress (optional unique composite).
 *
 * @param {Object} options
 * @param {string[]} [options.userEmails] - Optional list of user emails to target for assignments
 * @param {boolean} [options.includeProgress=false] - Whether to seed simple progress entries
 * @returns {Promise<SeedResult>}
 */
export async function seedDemoData({ userEmails = [], includeProgress = false } = {}) {
  const result = {
    coursesInserted: 0,
    lessonsInserted: 0,
    assignmentsInserted: 0,
    progressInserted: 0,
    warnings: [],
    errors: [],
  };

  // Basic table existence checks to provide actionable messages early
  const requiredTables = ["courses", "lessons", "assignments"];
  for (const table of requiredTables) {
    const exists = await tableExists(table);
    if (!exists) {
      result.errors.push(
        `Missing or inaccessible table '${table}'. Please ensure schema is created and RLS configured. See lms_frontend/README.md and README_RLS_TROUBLESHOOTING.md.`
      );
    }
  }
  if (result.errors.length > 0) {
    return result;
  }

  // Resolve user emails if provided or discover demo domain
  const { usersByEmail, warnings } = await resolveUsersByEmailOrDemoDomain(userEmails);
  result.warnings.push(...warnings);

  const resolvedEmails = Object.keys(usersByEmail);
  const effectiveEmails = userEmails.length ? userEmails : resolvedEmails;
  const sample = buildSampleData({ userEmailsResolved: effectiveEmails });

  // Upsert courses first by unique code
  const { count: cCount, error: cErr } = await upsertRows("courses", sample.courses, "code");
  if (cErr) {
    console.error("[seed] Courses upsert error:", cErr);
    const m = (cErr.message || "").toLowerCase();
    if (m.includes("permission denied") || m.includes("rls")) {
      result.errors.push(
        "RLS prevented inserting into courses. See README_RLS_TROUBLESHOOTING.md to allow insert for your role."
      );
    } else {
      result.errors.push(
        `Failed to insert courses: ${cErr.message}. Ensure schema matches README.`
      );
    }
    return result;
  }
  result.coursesInserted = cCount;

  // After courses inserted, load ids by code for lesson/assignment foreign keys if needed
  const {
    courseIdByCode,
    lessonsTable,
    assignmentsTable,
  } = await transformForForeignKeys(sample);

  // Prepare lessons
  const lessonsToInsert = sample.lessons.map((l) => {
    const course_id = courseIdByCode[l.course_code];
    return {
      // If schema supports foreign key by id, include; if not, leaving it simply won't be used
      course_id: course_id || null,
      course_code: l.course_code,
      lesson_key: l.lesson_key,
      title: l.title,
      type: l.type,
      link_url: l.link_url,
      asset_url: l.asset_url,
      order_index: l.order_index,
      created_at: l.created_at,
      updated_at: l.updated_at,
    };
  });

  const { count: lCount, error: lErr } = await upsertRows(lessonsTable, lessonsToInsert, "lesson_key");
  if (lErr) {
    console.error("[seed] Lessons upsert error:", lErr);
    const m = (lErr.message || "").toLowerCase();
    if (m.includes("permission denied") || m.includes("rls")) {
      result.errors.push(
        "RLS prevented inserting into lessons. See README_RLS_TROUBLESHOOTING.md."
      );
    } else if (m.includes("relation") || m.includes("not exist")) {
      result.errors.push(
        "Table 'lessons' missing. Create tables using README SQL before seeding."
      );
    } else {
      result.errors.push(`Failed to insert lessons: ${lErr.message}`);
    }
    return result;
  }
  result.lessonsInserted = lCount;

  // Prepare assignments
  const assignmentsToInsert = sample.assignments.map((a) => {
    const email = (a.user_email || "").toLowerCase();
    const user = usersByEmail[email] || null;
    return {
      assignment_key: a.assignment_key,
      title: a.title,
      status: a.status,
      due_date: a.due_date,
      user_email: email,
      // In case schema expects user_id
      user_id: user?.id || null,
      course_code: a.course_code,
      // In case schema expects course_id
      // We can map code -> id if available
      course_id: null, // safe default, not all schemas use it
      created_at: a.created_at,
      updated_at: a.updated_at,
    };
  });

  const { count: aCount, error: aErr } = await upsertRows(assignmentsTable, assignmentsToInsert, "assignment_key");
  if (aErr) {
    console.error("[seed] Assignments upsert error:", aErr);
    const m = (aErr.message || "").toLowerCase();
    if (m.includes("permission denied") || m.includes("rls")) {
      result.errors.push(
        "RLS prevented inserting into assignments. See README_RLS_TROUBLESHOOTING.md."
      );
    } else if (m.includes("relation") || m.includes("not exist")) {
      result.errors.push(
        "Table 'assignments' missing. Create tables using README SQL before seeding."
      );
    } else {
      result.errors.push(`Failed to insert assignments: ${aErr.message}`);
    }
    return result;
  }
  result.assignmentsInserted = aCount;

  // Optionally seed progress
  if (includeProgress) {
    const progressRows = [];
    // simple heuristic: for first user/course, mark first lesson completed
    const firstEmail = Object.keys(usersByEmail)[0];
    if (firstEmail) {
      const user = usersByEmail[firstEmail];
      // fetch one lesson for react basics
      const { data: oneLesson } = await supabase
        .from("lessons")
        .select("lesson_key")
        .eq("course_code", "COURSE_REACT_BASICS")
        .order("order_index", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (oneLesson?.lesson_key) {
        const pk = `PROG_${firstEmail}_${oneLesson.lesson_key}`.toUpperCase();
        progressRows.push({
          progress_key: pk,
          user_email: firstEmail,
          user_id: user?.id || null,
          lesson_key: oneLesson.lesson_key,
          status: "completed",
          completed_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        });
      }
    }

    if (progressRows.length > 0) {
      const { count: pCount, error: pErr } = await upsertRows("progress", progressRows, "progress_key");
      if (pErr) {
        console.warn("[seed] Progress upsert error:", pErr);
        result.warnings.push(
          "Could not insert progress rows. If 'progress' table or RLS is not configured, see README and README_RLS_TROUBLESHOOTING.md."
        );
      } else {
        result.progressInserted = pCount;
      }
    }
  }

  return result;
}
