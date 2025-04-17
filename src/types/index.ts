export interface Teacher {
  id: string;
  email: string;
  full_name?: string;
  photo_url?: string;
  created_at?: string;
}

export interface Student {
  id: string;
  class_id: string;
  name: string;
  email?: string;
  photo_url?: string;
  created_at: string;
}

export interface Class {
  id: string;
  teacher_id: string;
  name: string;
  created_at: string;
}

export interface StudentSolution {
  id: string;
  student_id: string;
  date: string;
  solved_questions: number;
  class_id?: string;
  created_at?: string;
}

export interface ClassAnalytics {
  studentCount: number;
  averageSolvedQuestions: number;
  totalSolutions: number;
}

// Sınıf Duvarı Tipleri
export interface WallPost {
  id: string;
  class_id: string;
  author_id: string;
  content: string;
  link?: string;
  file_url?: string;
  created_at: string;
  author_name: string;
  author_is_teacher: boolean;
  author_photo?: string;
  is_teacher?: boolean;
  comments_count?: number;
}

export interface WallPostComment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
  author_name?: string;
  author_photo?: string;
  is_teacher?: boolean;
}

export interface MutedStudent {
  id: string;
  class_id: string;
  student_id: string;
  muted_by: string;
  muted_until?: string;
  created_at: string;
}

export interface ClassInvitation {
  id: string;
  class_id: string;
  invitation_code: string;
  created_by: string;
  expires_at?: string;
  is_active: boolean;
  max_uses?: number;
  current_uses: number;
  created_at?: string;
  classes?: Class;
}

export interface Assignment {
  id: string;
  class_id: string;
  title: string;
  description?: string;
  due_date: string;
  created_by: string;
  created_at?: string;
  classes?: Class;
}

export interface StudentAssignment {
  id: string;
  student_id: string;
  assignment_id: string;
  status: 'not_submitted' | 'submitted' | 'graded';
  submission_date?: string;
  photo_url?: string[] | string;
  teacher_comment?: string;
  grade?: number;
  created_at?: string;
  students?: Student;
  assignments?: Assignment;
} 