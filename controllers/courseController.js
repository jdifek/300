// controllers/courseController.js
const Course = require('../models/Course');
const User = require('../models/User');

exports.getCourses = async (req, res) => {
  try {
    const courses = await Course.find();
    const user = await User.findById(req.user.id);

    const coursesWithProgress = courses.map(course => {
      const courseProgress = user.coursesProgress.find(cp => cp.courseId.equals(course._id));
      return {
        ...course.toJSON(),
        progress: courseProgress ? {
          lastStudiedLesson: courseProgress.lastStudiedLesson,
          lessonsCompleted: courseProgress.lessons.filter(l => l.isCompleted).length
        } : { lastStudiedLesson: null, lessonsCompleted: 0 }
      };
    });

    res.json(coursesWithProgress);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const user = await User.findById(req.user.id);
    if (user.subscription.type === 'free' && course.category !== 'ПДД') {
      return res.status(403).json({ message: 'Premium subscription required' });
    }

    let courseProgress = user.coursesProgress.find(cp => cp.courseId.equals(course._id));
    if (!courseProgress) {
      courseProgress = { courseId: course._id, lessons: course.lessons.map(l => ({ lessonId: l._id })) };
      user.coursesProgress.push(courseProgress);
      await user.save();
    }

    res.json({
      ...course.toJSON(),
      progress: {
        lastStudiedLesson: courseProgress.lastStudiedLesson,
        lessons: courseProgress.lessons
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getLesson = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const user = await User.findById(req.user.id);
    if (user.subscription.type === 'free' && course.category !== 'ПДД') {
      return res.status(403).json({ message: 'Premium subscription required' });
    }

    const lesson = course.lessons.id(req.params.lessonId);
    if (!lesson) return res.status(404).json({ message: 'Lesson not found' });

    const courseProgress = user.coursesProgress.find(cp => cp.courseId.equals(course._id));
    const lessonProgress = courseProgress?.lessons.find(lp => lp.lessonId.equals(lesson._id)) || { lessonId: lesson._id };

    res.json({
      ...lesson.toJSON(),
      progress: lessonProgress
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.markLessonCompleted = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const user = await User.findById(req.user.id);
    if (user.subscription.type === 'free' && course.category !== 'ПДД') {
      return res.status(403).json({ message: 'Premium subscription required' });
    }

    const lesson = course.lessons.id(req.params.lessonId);
    if (!lesson) return res.status(404).json({ message: 'Lesson not found' });

    let courseProgress = user.coursesProgress.find(cp => cp.courseId.equals(course._id));
    if (!courseProgress) {
      courseProgress = { courseId: course._id, lessons: course.lessons.map(l => ({ lessonId: l._id })) };
      user.coursesProgress.push(courseProgress);
    }

    let lessonProgress = courseProgress.lessons.find(lp => lp.lessonId.equals(lesson._id));
    if (!lessonProgress) {
      lessonProgress = { lessonId: lesson._id };
      courseProgress.lessons.push(lessonProgress);
    }

    lessonProgress.isCompleted = true;
    courseProgress.lastStudiedLesson = lesson._id;
    user.stats.lessonsCompleted += 1;
    await user.save();

    res.json({ message: 'Lesson marked as completed', lesson: { ...lesson.toJSON(), progress: lessonProgress } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.submitHomework = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const user = await User.findById(req.user.id);
    if (user.subscription.type === 'free' && course.category !== 'ПДД') {
      return res.status(403).json({ message: 'Premium subscription required' });
    }

    const lesson = course.lessons.id(req.params.lessonId);
    if (!lesson) return res.status(404).json({ message: 'Lesson not found' });

    let courseProgress = user.coursesProgress.find(cp => cp.courseId.equals(course._id));
    if (!courseProgress) {
      courseProgress = { courseId: course._id, lessons: course.lessons.map(l => ({ lessonId: l._id })) };
      user.coursesProgress.push(courseProgress);
    }

    let lessonProgress = courseProgress.lessons.find(lp => lp.lessonId.equals(lesson._id));
    if (!lessonProgress) {
      lessonProgress = { lessonId: lesson._id };
      courseProgress.lessons.push(lessonProgress);
    }

    lessonProgress.homeworkSubmitted = true;
    lessonProgress.homeworkData = req.body.homework || 'Submitted';
    await user.save();

    res.json({ message: 'Homework submitted successfully', lesson: { ...lesson.toJSON(), progress: lessonProgress } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};