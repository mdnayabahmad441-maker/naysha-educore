-- Create admission_enquiries table
CREATE TABLE IF NOT EXISTS admission_enquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  father_name TEXT NOT NULL,
  class_wanted TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  address TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'admitted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_admission_enquiries_school_id ON admission_enquiries(school_id);
CREATE INDEX IF NOT EXISTS idx_admission_enquiries_status ON admission_enquiries(status);
CREATE INDEX IF NOT EXISTS idx_admission_enquiries_created_at ON admission_enquiries(created_at DESC);

-- Enable Row Level Security
ALTER TABLE admission_enquiries ENABLE ROW LEVEL SECURITY;

-- Create policies for admission_enquiries
-- Allow anyone to insert (for public enquiry form)
CREATE POLICY "Allow public to insert admission enquiries" ON admission_enquiries
  FOR INSERT WITH CHECK (true);

-- Allow school admins to view enquiries for their school
CREATE POLICY "Allow school admins to view admission enquiries" ON admission_enquiries
  FOR SELECT USING (
    school_id IN (
      SELECT school_id FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Allow school admins to update enquiries for their school
CREATE POLICY "Allow school admins to update admission enquiries" ON admission_enquiries
  FOR UPDATE USING (
    school_id IN (
      SELECT school_id FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );