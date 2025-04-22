const mongoose = require('mongoose');
const Course = require('./models/Course.js');
require('dotenv').config();

async function importCourses(jsonData) {
  try {
    // Подключение к MongoDB
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('Connected to MongoDB');
    }

    // Логирование общего количества курсов
    console.log(`Total courses in JSON: ${jsonData.length}`);
    jsonData.forEach((course) => {
      console.log(`Course title: ${course.title}, lessons: ${course.lessons.length}`);
    });

    // Трансформация данных
    const transformedData = [];
    for (const course of jsonData) {
      try {
        const transformedCourse = {
          title: course.title,
          description: course.description,
          category: course.category,
          lessons: course.lessons.map((lesson, lIndex) => {
            // Проверка videoUrl (в схеме required: true)
            if (!lesson.videoUrl || !Array.isArray(lesson.videoUrl)) {
              console.warn(
                `Warning: videoUrl is invalid for lesson "${lesson.title}" (order: ${lesson.order}) in course "${course.title}". Setting as empty array.`
              );
              lesson.videoUrl = [];
            }

            // Проверка additionalFiles
            if (!lesson.additionalFiles || !Array.isArray(lesson.additionalFiles)) {
              console.warn(
                `Warning: additionalFiles is invalid for lesson "${lesson.title}" (order: ${lesson.order}) in course "${course.title}". Setting as empty array.`
              );
              lesson.additionalFiles = [];
            }

            // Проверка структуры additionalFiles
            lesson.additionalFiles.forEach((file, fIndex) => {
              if (!file.name || !file.url) {
                throw new Error(
                  `Invalid additionalFile at index ${fIndex} in lesson "${lesson.title}" (order: ${lesson.order}) in course "${course.title}"`
                );
              }
            });

            return {
              title: lesson.title,
              description: lesson.description,
              videoUrl: lesson.videoUrl,
              additionalFiles: lesson.additionalFiles,
              order: lesson.order,
              thumbnail: lesson.thumbnail
            };
          }),
          thumbnail: course.thumbnail,
          createdAt: new Date(),
        };
        transformedData.push(transformedCourse);
        console.log(`Transformed course title: ${course.title}`);
      } catch (err) {
        console.error(`Error transforming course "${course.title}":`, err.message);
      }
    }

    // Логирование количества курсов для вставки
    console.log(`Total courses to insert: ${transformedData.length}`);

    // Очистка существующей коллекции
    await Course.deleteMany({});
    console.log('Cleared existing courses in DB');

    // Вставка данных
    let insertedCount = 0;
    for (const course of transformedData) {
      try {
        await Course.create(course);
        console.log(`Inserted course title: ${course.title}`);
        insertedCount++;
      } catch (err) {
        console.error(`Error inserting course "${course.title}":`, err.message);
      }
    }

    // Логирование результата
    console.log(`Total courses inserted: ${insertedCount}`);

    // Проверка данных в базе
    const coursesInDb = await Course.find({}).sort({ createdAt: 1 });
    console.log(`Total courses in DB: ${coursesInDb.length}`);
    coursesInDb.forEach((course) => {
      console.log(`DB Course: title=${course.title}, lessons=${course.lessons.length}`);
    });

  } catch (error) {
    console.error('Error importing courses:', error);
  } finally {
    // Закрытие соединения
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      console.log('MongoDB connection closed');
    }
  }
}

module.exports = importCourses;

// Импорт JSON-данных (замените на ваш полный JSON)
const coursesData = require('./courses.json'); // Укажите путь к вашему JSON-файлу
importCourses(coursesData);