export interface Teacher {
  id: string;
  email: string;
  full_name: string;
  password_hash?: string;
  created_at?: string;
}

export interface Student {
  id: string;
  class_id?: string;
  name: string;
  email: string;
  password_hash?: string;
  photo_url?: string;
  phone_number?: string;
  created_at?: string;
}

export interface Class {
  id: string;
  name: string;
  teacher_id?: string;
  created_at?: string;
  teachers?: Teacher;
}

export interface StudentSolution {
  id: string;
  student_id: string;
  class_id: string;
  date: string;
  solved_questions: number;
  created_at?: string;
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