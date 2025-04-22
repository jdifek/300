const Course = require('../models/Course');
const User = require('../models/User');
const mongoose = require('mongoose');


exports.getCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: 'Неверный ID курса' });
    }

    const user = await User.findById(req.user.id);
    const course = await Course.findById(req.params.courseId);
    
    if (!course) return res.status(404).json({ message: 'Курс не найден' });

    let courseProgress = user.coursesProgress.find(cp => cp.courseId.equals(course._id));
    if (!courseProgress) {
      courseProgress = { 
        courseId: course._id, 
        lastStudiedLesson: null,
        lessons: course.lessons.map(l => ({ 
          lessonId: l._id,
          isCompleted: false,
          homeworkSubmitted: false,
          homeworkData: null,
          isWatched: false // Задаём значение по умолчанию для нового поля
        })) 
      };
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
    const user = await User.findById(req.user.id);
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const lesson = course.lessons.id(req.params.lessonId);
    if (!lesson) return res.status(404).json({ message: 'Lesson not found' });

    const courseProgress = user.coursesProgress.find(cp => cp.courseId.equals(course._id));
    const lessonProgress = courseProgress?.lessons.find(lp => lp.lessonId.equals(lesson._id)) || { 
      lessonId: lesson._id,
      isCompleted: false,
      homeworkSubmitted: false,
      homeworkData: null,
      isWatched: false // Задаём значение по умолчанию
    };

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
    const user = await User.findById(req.user.id);
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });

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
    const user = await User.findById(req.user.id);
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });

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

exports.subscribeToChannel = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.subscribedToChannel = true;
    await user.save();

    res.json({ message: 'Successfully subscribed to channel' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getNextLesson = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const currentLesson = course.lessons.id(req.params.lessonId);
    if (!currentLesson) return res.status(404).json({ message: 'Lesson not found' });

    const lessons = course.lessons.sort((a, b) => a.order - b.order);
    const currentIndex = lessons.findIndex(l => l._id.equals(currentLesson._id));
    if (currentIndex === -1 || currentIndex === lessons.length - 1) {
      return res.status(404).json({ message: 'No next lesson available' });
    }

    const nextLesson = lessons[currentIndex + 1];
    const courseProgress = user.coursesProgress.find(cp => cp.courseId.equals(course._id));
    const lessonProgress = courseProgress?.lessons.find(lp => lp.lessonId.equals(nextLesson._id)) || { 
      lessonId: nextLesson._id,
      isCompleted: false,
      homeworkSubmitted: false,
      homeworkData: null,
      isWatched: false // Задаём значение по умолчанию
    };

    res.json({
      ...nextLesson.toJSON(),
      progress: lessonProgress
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPrevLesson = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const currentLesson = course.lessons.id(req.params.lessonId);
    if (!currentLesson) return res.status(404).json({ message: 'Lesson not found' });

    const lessons = course.lessons.sort((a, b) => a.order - b.order);
    const currentIndex = lessons.findIndex(l => l._id.equals(currentLesson._id));
    if (currentIndex === -1 || currentIndex === 0) {
      return res.status(404).json({ message: 'No previous lesson available' });
    }

    const prevLesson = lessons[currentIndex - 1];
    const courseProgress = user.coursesProgress.find(cp => cp.courseId.equals(course._id));
    const lessonProgress = courseProgress?.lessons.find(lp => lp.lessonId.equals(prevLesson._id)) || { 
      lessonId: prevLesson._id,
      isCompleted: false,
      homeworkSubmitted: false,
      homeworkData: null,
      isWatched: false // Задаём значение по умолчанию
    };

    res.json({
      ...prevLesson.toJSON(),
      progress: lessonProgress
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.markLessonWatched = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const lesson = course.lessons.id(req.params.lessonId);
    if (!lesson) return res.status(404).json({ message: 'Lesson not found' });

    let courseProgress = user.coursesProgress.find(cp => cp.courseId.equals(course._id));
    if (!courseProgress) {
      courseProgress = { 
        courseId: course._id, 
        lastStudiedLesson: null,
        lessons: course.lessons.map(l => ({ 
          lessonId: l._id,
          isCompleted: false,
          homeworkSubmitted: false,
          homeworkData: null,
          isWatched: false
        })) 
      };
      user.coursesProgress.push(courseProgress);
    }

    let lessonProgress = courseProgress.lessons.find(lp => lp.lessonId.equals(lesson._id));
    if (!lessonProgress) {
      lessonProgress = { 
        lessonId: lesson._id,
        isCompleted: false,
        homeworkSubmitted: false,
        homeworkData: null,
        isWatched: false
      };
      courseProgress.lessons.push(lessonProgress);
    }

    lessonProgress.isWatched = true;
    courseProgress.lastStudiedLesson = lesson._id; // Обновляем последний изученный урок
    await user.save();

    res.json({ 
      message: 'Lesson marked as watched', 
      lesson: { ...lesson.toJSON(), progress: lessonProgress } 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};