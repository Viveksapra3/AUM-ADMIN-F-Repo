import { NextResponse } from 'next/server';

// Mock courses data - in a real app, this would come from a database
const coursesData = [
  
];

export async function GET() {
  try {
    // Simulate a small delay to mimic real API behavior
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return NextResponse.json({
      success: true,
      courses: coursesData,
      total: coursesData.length
    });
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch courses',
        courses: []
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { courseId } = body;
    
    const course = coursesData.find(c => c.id === courseId);
    
    if (!course) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      course: course,
      message: `Selected course: ${course.name}`
    });
  } catch (error) {
    console.error('Error selecting course:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to select course' },
      { status: 500 }
    );
  }
}
