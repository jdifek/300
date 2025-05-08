const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Course = require('../models/Course');
const User = require('../models/User');
const mongoose = require('mongoose');
const getLastLesson = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const courseProgress = user.coursesProgress.find(cp => cp.courseId.equals(course._id));
    if (!courseProgress || !courseProgress.lastStudiedLesson) {
      // Если нет прогресса или последнего урока, возвращаем первый урок курса
      const firstLesson = course.lessons.sort((a, b) => a.order - b.order)[0];
      if (!firstLesson) return res.status(404).json({ message: 'No lessons available' });

      const lessonProgress = courseProgress?.lessons.find(lp => lp.lessonId.equals(firstLesson._id)) || {
        lessonId: firstLesson._id,
        isCompleted: false,
        homeworkSubmitted: false,
        homeworkData: null,
        isWatched: false
      };

      return res.json({
        ...firstLesson.toJSON(),
        progress: lessonProgress
      });
    }

    const lastLesson = course.lessons.id(courseProgress.lastStudiedLesson);
    if (!lastLesson) return res.status(404).json({ message: 'Last lesson not found' });

    const lessonProgress = courseProgress.lessons.find(lp => lp.lessonId.equals(lastLesson._id)) || {
      lessonId: lastLesson._id,
      isCompleted: false,
      homeworkSubmitted: false,
      homeworkData: null,
      isWatched: false
    };

    res.json({
      ...lastLesson.toJSON(),
      progress: lessonProgress
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getCourseById = async (req, res) => {
  try {
    const { courseId } = req.params; // Получаем ID курса из параметров
    const user = await User.findById(req.user.id); // Получаем пользователя

    // Проверяем, существует ли курс
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Курс не найден' });
    }

    // Получаем прогресс по курсу
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
      await user.save(); // Сохраняем прогресс, если он был добавлен
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
const getCourse = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const courses = await Course.find();

    const coursesWithProgress = courses.map(course => {
      let courseProgress = user.coursesProgress.find(cp =>
        cp.courseId.equals(course._id)
      );

      // Если прогресс по курсу отсутствует — создаём его
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

      return {
        ...course.toJSON(),
        progress: {
          lastStudiedLesson: courseProgress.lastStudiedLesson,
          lessons: courseProgress.lessons
        }
      };
    });

    // сохраняем, если был добавлен хотя бы один новый прогресс
    await user.save();

    res.json(coursesWithProgress);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

const updateLessonThumbnail = async (req, res) => {
  const { lessonId } = req.params;
  const thumbnailPath = `/uploads/${req.file.filename}`;

  try {
    // Находим нужный урок по lessonId внутри всех курсов
    const course = await Course.findOne({ 'lessons._id': lessonId });
    if (!course) return res.status(404).json({ message: 'Курс с уроком не найден' });

    const lesson = course.lessons.id(lessonId);
    if (!lesson) return res.status(404).json({ message: 'Урок не найден' });

    // Удаляем старую картинку если есть
    if (lesson.thumbnail && fs.existsSync('public' + lesson.thumbnail)) {
      fs.unlinkSync('public' + lesson.thumbnail);
    }

    // Сохраняем новую
    lesson.thumbnail = thumbnailPath;
    await course.save();

    res.json({ message: 'Картинка обновлена', thumbnail: thumbnailPath });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

const getLesson = async (req, res) => {
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

const markLessonCompleted = async (req, res) => {
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

const submitHomework = async (req, res) => {
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

const getNextLesson = async (req, res) => {
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

const getPrevLesson = async (req, res) => {
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
const markLessonWatched = async (req, res) => {
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

module.exports = { getLastLesson, upload, updateLessonThumbnail, getCourse, getLesson, markLessonCompleted,markLessonWatched, submitHomework, getNextLesson, getPrevLesson,getCourseById };
