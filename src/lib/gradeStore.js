const GRADE_STORE_KEY = "fgbi-grading-system-store";

function createDefaultStore() {
  return {
    teachers: [],
    students: [],
    subjects: [],
    grades: [],
  };
}

export function loadGradeStore() {
  if (typeof window === "undefined") {
    return createDefaultStore();
  }

  try {
    const raw = window.localStorage.getItem(GRADE_STORE_KEY);
    if (!raw) {
      return createDefaultStore();
    }

    const parsed = JSON.parse(raw);
    return {
      teachers: parsed.teachers || [],
      students: parsed.students || [],
      subjects: parsed.subjects || [],
      grades: parsed.grades || [],
    };
  } catch (error) {
    console.error("Unable to read grade store", error);
    return createDefaultStore();
  }
}

export function saveGradeStore(store) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(GRADE_STORE_KEY, JSON.stringify(store));
}

export function addTeacher(store, teacher) {
  const nextStore = {
    ...store,
    teachers: [
      ...store.teachers,
      {
        id: teacher.id || `teacher-${Date.now()}`,
        full_name: teacher.full_name,
        email: teacher.email || "",
        assigned_subject: teacher.assigned_subject || "",
      },
    ],
  };

  saveGradeStore(nextStore);
  return nextStore;
}

export function addStudent(store, student) {
  const nextStore = {
    ...store,
    students: [
      ...store.students,
      {
        id: student.id || `student-${Date.now()}`,
        full_name: student.full_name,
        email: student.email || "",
        year_level: student.year_level || "",
      },
    ],
  };

  saveGradeStore(nextStore);
  return nextStore;
}

export function upsertSubject(store, subject) {
  const subjectId = subject.id || `subject-${Date.now()}`;
  const existingSubjects = [...store.subjects];
  const index = existingSubjects.findIndex((item) => item.id === subjectId || item.name === subject.name);

  const normalizedSubject = {
    id: subjectId,
    name: subject.name,
    teacherId: subject.teacherId || "",
    teacherName: subject.teacherName || "",
    students: subject.students || [],
  };

  if (index >= 0) {
    existingSubjects[index] = normalizedSubject;
  } else {
    existingSubjects.push(normalizedSubject);
  }

  const nextStore = {
    ...store,
    subjects: existingSubjects,
  };

  saveGradeStore(nextStore);
  return nextStore;
}

export function enrollStudentInSubject(store, subjectId, student) {
  const nextSubjects = store.subjects.map((subject) => {
    if (subject.id !== subjectId) {
      return subject;
    }

    const studentIds = subject.students || [];
    const alreadyEnrolled = studentIds.some((entry) => entry.id === student.id);
    if (alreadyEnrolled) {
      return subject;
    }

    return {
      ...subject,
      students: [
        ...studentIds,
        {
          id: student.id,
          full_name: student.full_name,
          email: student.email || "",
          year_level: student.year_level || "",
        },
      ],
    };
  });

  const nextStore = {
    ...store,
    subjects: nextSubjects,
  };

  saveGradeStore(nextStore);
  return nextStore;
}

export function addGradeEntry(store, grade) {
  const nextStore = {
    ...store,
    grades: [
      {
        id: grade.id || `grade-${Date.now()}`,
        studentId: grade.studentId,
        studentName: grade.studentName,
        subjectId: grade.subjectId,
        subjectName: grade.subjectName,
        teacherId: grade.teacherId,
        teacherName: grade.teacherName,
        score: grade.score,
        comment: grade.comment || "",
        created_at: grade.created_at || new Date().toISOString(),
      },
      ...store.grades,
    ],
  };

  saveGradeStore(nextStore);
  return nextStore;
}
