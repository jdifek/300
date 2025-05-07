const Exam = require('../models/Exam');
const Ticket = require('../models/Ticket');
const MarathonExam = require('../models/MarathonExam');
const ExtraQuestion = require('../models/ExtraQuestion');
const ApiError = require('../exceptions/api-error');


class ExamService {
  // Получить все вопросы для марафона (без правильных ответов)
  async getMarathonQuestions() {
    try {
      // Получаем все билеты с вопросами
      const tickets = await Ticket.find().lean();
  
      if (!tickets.length) {
        return []; // Нет билетов — возвращаем пустой массив
      }
  
      // Достаём все вопросы из каждого билета и объединяем в один массив
      const allQuestions = tickets.flatMap(ticket => ticket.questions || []);
  
      return allQuestions;
    } catch (error) {
      throw new Error(`Ошибка при получении вопросов марафона: ${error.message}`);
    }
  }
  
  async processMarathonAnswer(examId, questionIndex, userAnswer) {
    try {
      const marathonExam = await MarathonExam.findById(examId);
      if (!marathonExam) {
        throw new Error('Марафонский экзамен не найден');
      }
  
      // Проверяем, есть ли вопросы в экзамене
      if (!marathonExam.questions || marathonExam.questions.length === 0) {
        throw new Error('Вопросы марафона не найдены');
      }
  
      // Загружаем вопрос из билета
      const ticket = await Ticket.findOne({
        'questions._id': marathonExam.questions[questionIndex].questionId._id
      });
      if (!ticket) {
        throw new Error('Билет не найден');
      }
  
      const questionData = ticket.questions.find(
        q => q._id.toString() === marathonExam.questions[questionIndex].questionId._id.toString()
      );
      if (!questionData) {
        throw new Error('Вопрос не найден');
      }
  
      // Проверяем ответ
      const correctAnswer = questionData.options.findIndex(opt => opt.isCorrect);
      const selectedOptionText = questionData.options[userAnswer]?.text || 'Неизвестно';
      const correctOptionText = questionData.options[correctAnswer]?.text || 'Неизвестно';
  
      const question = marathonExam.questions[questionIndex];
      question.userAnswer = userAnswer;
      question.isCorrect = userAnswer === correctAnswer;
  
      // Обновляем answeredQuestions
      marathonExam.answeredQuestions.push({
        questionId: question.questionId._id.toString(),
        selectedOption: selectedOptionText,
        isCorrect: question.isCorrect,
        hint: questionData.hint || null,
        imageUrl: questionData.imageUrl || null
      });
  
      if (!question.isCorrect) {
        marathonExam.mistakes += 1;
        marathonExam.mistakesDetails.push({
          questionId: question.questionId._id.toString(),
          questionText: questionData.text,
          selectedOption: selectedOptionText,
          correctOption: correctOptionText,
          hint: questionData.hint || null,
          imageUrl: questionData.imageUrl || null
        });
      }
  
      marathonExam.completedQuestions += 1;
  
      // Проверяем, завершён ли марафон
      const totalQuestions = marathonExam.questions.length;
      if (marathonExam.completedQuestions >= totalQuestions) {
        marathonExam.status = 'completed';
        marathonExam.completedAt = new Date(); // Устанавливаем время завершения
      }
  
      await marathonExam.save();
      return marathonExam;
    } catch (error) {
      throw new Error(`Ошибка при обработке ответа марафона: ${error.message}`);
    }
  }
  // Создать марафонский экзамен
  async createMarathonExam(userId) {
    try {
      const questions = await this.getMarathonQuestions();
      if (questions.length === 0) {
        throw new Error('Вопросы для марафона не найдены');
      }
  
      const existingMarathon = await MarathonExam.findOne({ userId, status: 'in_progress' });
      if (existingMarathon) {
        return {
          exam: existingMarathon,
          questions
        };
      }
  
      // Формируем вопросы для марафона
      const examQuestions = questions.map(question => ({
        questionId: {
          _id: question._id,
          text: question.text,
          options: question.options.map(opt => ({ text: opt.text })),
          hint: question.hint || null,
          imageUrl: question.imageUrl || null,
          category: question.category,
          questionNumber: question.questionNumber
        },
        userAnswer: null,
        isCorrect: null
      }));
  
      const marathonExam = new MarathonExam({
        userId,
        questions: examQuestions, // Сохраняем вопросы
        mistakes: 0,
        status: 'in_progress',
        startTime: new Date(),
        completedQuestions: 0
      });
  
      await marathonExam.save();
      return {
        exam: marathonExam,
        questions
      };
    } catch (error) {
      throw new Error(`Ошибка при создании марафонского экзамена: ${error.message}`);
    }
  }


  async processAnswer(examId, questionIndex, userAnswer) {
    try {
      // Проверяем examId
      if (!examId) {
        throw new ApiError(400, 'examId не указан');
      }
  
      // Находим экзамен
      const exam = await Exam.findById(examId);
      if (!exam) {
        throw new ApiError(404, `Экзамен с ID ${examId} не найден`);
      }
  
      // Проверяем ticketNumber
      if (!exam.ticketNumber) {
        throw new ApiError(400, `ticketNumber отсутствует в экзамене (examId: ${examId})`);
      }
  
      // Загружаем билет
      const ticket = await Ticket.findOne({ number: exam.ticketNumber });
      if (!ticket) {
        throw new ApiError(404, `Билет с номером ${exam.ticketNumber} не найден`);
      }
  
      // Загружаем дополнительные вопросы
      const extraQuestions = await ExtraQuestion.find({
        _id: { $in: exam.extraQuestions.map(q => q.questionId) },
      });
  
      // Проверяем startTime и timeLimit
      if (!exam.startTime) {
        throw new ApiError(400, `startTime отсутствует в экзамене (examId: ${examId})`);
      }
      if (!exam.timeLimit) {
        throw new ApiError(400, `timeLimit отсутствует в экзамене (examId: ${examId})`);
      }
  
      // Проверяем время
      const elapsedTime = Date.now() - exam.startTime.getTime();
      if (elapsedTime > exam.timeLimit + (exam.extraTime || 0)) {
        exam.status = 'failed';
        exam.completedAt = new Date();
        await exam.save();
        throw new ApiError(400, 'Время экзамена истекло');
      }
  
      // Проверяем questionIndex
      if (questionIndex < 0 || questionIndex >= exam.questions.length + exam.extraQuestions.length) {
        throw new ApiError(400, `Неверный questionIndex: ${questionIndex} (доступно вопросов: ${exam.questions.length + exam.extraQuestions.length})`);
      }
  
      // Обрабатываем вопрос
      let question;
      let questionData;
      if (questionIndex < exam.questions.length) {
        question = exam.questions[questionIndex];
        if (!question.questionId || !question.questionId._id) {
          throw new ApiError(400, `Некорректный questionId в вопросе с индексом ${questionIndex} (examId: ${examId})`);
        }
        questionData = ticket.questions.find(
          q => q._id.toString() === question.questionId._id.toString()
        );
      } else {
        question = exam.extraQuestions[questionIndex - exam.questions.length];
        questionData = extraQuestions.find(
          q => q._id.toString() === question.questionId.toString()
        );
      }
  
      if (!questionData) {
        throw new ApiError(404, `Вопрос с ID ${question.questionId._id || question.questionId} не найден в билете с номером ${exam.ticketNumber} или дополнительных вопросах`);
      }
  
      // Проверяем options
      if (!questionData.options || questionData.options.length === 0) {
        throw new ApiError(400, `Вопрос с ID ${question.questionId._id || question.questionId} не содержит вариантов ответа`);
      }
  
      // Находим правильный ответ
      const correctAnswer = questionData.options.findIndex(opt => opt.isCorrect);
      if (correctAnswer === -1) {
        throw new ApiError(400, `Вопрос с ID ${question.questionId._id || question.questionId} не имеет правильного ответа`);
      }
  
      // Проверяем userAnswer
      if (userAnswer < 0 || userAnswer >= questionData.options.length) {
        throw new ApiError(400, `Неверный userAnswer: ${userAnswer} (доступно вариантов: ${questionData.options.length})`);
      }
  
      const selectedOptionText = questionData.options[userAnswer]?.text || 'Неизвестно';
      const correctOptionText = questionData.options[correctAnswer]?.text || 'Неизвестно';
  
      // Обновляем ответ
      question.userAnswer = userAnswer;
      question.isCorrect = userAnswer === correctAnswer;
  
      if (!question.isCorrect) {
        exam.mistakes = (exam.mistakes || 0) + 1;
  
        // Добавляем информацию об ошибке
        exam.mistakesDetails.push({
          questionId: (question.questionId._id || question.questionId).toString(),
          questionText: questionData.text,
          selectedOption: selectedOptionText,
          correctOption: correctOptionText,
          hint: questionData.hint || null,
          imageUrl: questionData.imageUrl || null,
        });
  
        // Проверяем количество ошибок
        if (exam.mistakes >= 3) {
          exam.status = 'failed';
          exam.completedAt = new Date();
          await exam.save();
          return exam;
        }
  
        // Добавляем дополнительные вопросы
        await this.addExtraQuestions(exam, questionData.category);
      }
  
      // Проверяем завершение экзамена
      const allAnswered =
        exam.questions.every(q => q.userAnswer !== null) &&
        exam.extraQuestions.every(q => q.userAnswer !== null);
  
      if (allAnswered) {
        exam.status = exam.mistakes < 3 ? 'passed' : 'failed';
        exam.completedAt = new Date();
      }
  
      await exam.save();
      return exam;
    } catch (error) {
      console.error(`Ошибка в processAnswer (examId: ${examId}, questionIndex: ${questionIndex}, userAnswer: ${userAnswer}):`, error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, `Ошибка при обработке ответа: ${error.message}`);
    }
  }

  async getMarathonProgress(userId) {
    try {
      const marathonExam = await MarathonExam.findOne({ userId, status: 'in_progress' });
      if (!marathonExam) {
        return {
          status: 'not_started',
          totalQuestions: 800,
          progress: 0,
          correctAnswers: 0,
          mistakes: 0,
          mistakesDetails: []
        };
      }
  
      const totalQuestions = marathonExam.questions.length;
      const correctAnswers = marathonExam.questions.filter(q => q.isCorrect).length;
      const progress = Math.round((correctAnswers / totalQuestions) * 100);
  
      // Вычисляем timeSpent
      const timeSpent = marathonExam.startTime
        ? marathonExam.completedAt
          ? Math.floor((marathonExam.completedAt.getTime() - marathonExam.startTime.getTime()) / 1000) // Время в секундах для завершённых
          : Math.floor((Date.now() - marathonExam.startTime.getTime()) / 1000) // Время в секундах для незавершённых
        : 0;
  
      // Форматируем время
      const minutes = Math.floor(timeSpent / 60);
      const seconds = timeSpent % 60;
      const formattedTimeSpent = `${minutes} мин ${seconds} сек`;
  
      return {
        status: marathonExam.status,
        totalQuestions,
        progress,
        correctAnswers,
        mistakes: marathonExam.mistakes,
        mistakesDetails: marathonExam.mistakesDetails,
        timeSpent, // Время в секундах
        formattedTimeSpent, // Форматированное время
        completedAt: marathonExam.completedAt // Время завершения
      };
    } catch (error) {
      throw new Error(`Ошибка при получении прогресса марафона: ${error.message}`);
    }
  }
  async getAnswers() {
    try {
      const tickets = await Ticket.find().lean();

      const allQuestions = tickets.flatMap(ticket =>
        ticket.questions.map(question => ({
          questionText: question.text,
          questionId: question._id,
          options: question.options,
          correctAnswer: question.options.find(opt => opt.isCorrect)?.text || null
        }))
      );

      return allQuestions;
    } catch (error) {
      throw new Error(`Ошибка при получении вопросов: ${error.message}`);
    }
  }
  async selectTicket(userId) {
    try {
      // Проверяем, что userId передан
      if (!userId) {
        throw new ApiError(400, 'ID пользователя обязателен');
      }

      // Получаем все билеты
      const tickets = await Ticket.find({}, 'number');
      if (tickets.length === 0) {
        throw new ApiError(404, 'В базе данных нет билетов');
      }

      // Выбираем случайный билет
      const randomIndex = Math.floor(Math.random() * tickets.length);
      const ticketNumber = tickets[randomIndex].number;

      // Находим последний завершенный экзамен пользователя
      const lastExam = await Exam.findOne({
        userId,
        status: { $in: ['passed', 'failed'] }, // Учитываем только завершенные экзамены
      })
        .sort({ completedAt: -1 }) // Сортируем по времени завершения, чтобы взять последний
        .lean();

      // Формируем результат последнего экзамена (если он есть)
      let lastExamResult = null;
      if (lastExam) {
        const totalQuestions = lastExam.questions.length + lastExam.extraQuestions.length;
        const correctAnswers =
          lastExam.questions.filter(q => q.isCorrect).length +
          lastExam.extraQuestions.filter(q => q.isCorrect).length;

        lastExamResult = {
          examId: lastExam._id.toString(),
          ticketNumber: lastExam.ticketNumber,
          status: lastExam.status,
          statistics: {
            totalQuestions,
            correctAnswers,
            mistakes: lastExam.mistakes || 0,
            timeSpent: lastExam.completedAt
              ? Math.floor((lastExam.completedAt.getTime() - lastExam.startTime.getTime()) / 1000) * 1000 // Время в миллисекундах
              : 0,
          },
        };
      }

      // Возвращаем результат в формате, указанном в Swagger
      return {
        ticketNumber,
        lastExamResult,
      };
    } catch (error) {
      console.error(`Ошибка в selectTicket (userId: ${userId}):`, error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, `Ошибка при выборе билета: ${error.message}`);
    }
  }

  async createExam(userId, ticketNumber) {
    try {
      const ticket = await Ticket.findOne({ number: ticketNumber });
      if (!ticket) {
        throw new Error('Билет не найден');
      }
  
      // Формируем вопросы с полными данными
      const examQuestions = ticket.questions.map((question) => ({
        questionId: {
          _id: question._id,
          text: question.text,
          options: question.options.map(opt => ({
            text: opt.text // Исключаем isCorrect для безопасности
          })),
          hint: question.hint || null,
          imageUrl: question.imageUrl || null,
          category: question.category,
          questionNumber: question.questionNumber
        },
        userAnswer: null,
        isCorrect: null
      }));
  
      const exam = new Exam({
        userId,
        ticketNumber,
        questions: examQuestions,
        extraQuestions: [],
        mistakes: 0,
        status: 'in_progress',
        startTime: new Date(),
        timeLimit: 20 * 60 * 1000
      });
  
      await exam.save();
      return exam;
    } catch (error) {
      throw new Error(`Ошибка при создании экзамена: ${error.message}`);
    }
  }

  async addExtraQuestions(exam, category) {
    try {
      // Добавляем вопросы только если ошибок меньше 3 (при 3-й ошибке экзамен уже завершается)
      if (exam.mistakes >= 3) {
        return; // Экзамен завершён, дополнительные вопросы не добавляем
      }
  
      // Добавляем 5 новых вопросов за каждую ошибку
      let extraQuestions = await ExtraQuestion.find({ category }).limit(5);
      if (extraQuestions.length < 5) {
        const additionalQuestions = await ExtraQuestion.aggregate([
          { $match: { category: { $ne: category } } },
          { $sample: { size: 5 - extraQuestions.length } }
        ]);
        extraQuestions = extraQuestions.concat(additionalQuestions);
      }
  
      // Добавляем новые вопросы в массив extraQuestions
      exam.extraQuestions.push(...extraQuestions.map((q) => ({
        questionId: q._id,
        userAnswer: null,
        isCorrect: null
      })));
  
      // Добавляем 5 минут дополнительного времени за каждую ошибку
      exam.extraTime = (exam.extraTime || 0) + 5 * 60 * 1000; // +5 минут за каждую ошибку
  
      // Логируем для отладки
      console.log(`Добавлено 5 дополнительных вопросов после ${exam.mistakes}-й ошибки. Всего дополнительных вопросов: ${exam.extraQuestions.length}`);
    } catch (error) {
      throw new Error(`Ошибка при добавлении дополнительных вопросов: ${error.message}`);
    }
  }

  async getExamResults(examId) {
    try {
      const exam = await Exam.findById(examId);
      if (!exam) {
        throw new Error('Экзамен не найден');
      }
  
      const ticket = await Ticket.findOne({ number: exam.ticketNumber });
      if (!ticket) {
        throw new Error('Билет не найден');
      }
  
      const extraQuestions = await ExtraQuestion.find({
        _id: { $in: exam.extraQuestions.map(q => q.questionId) },
      }).lean();
  
      // Map questions with all details from the Ticket model
      const questionsWithDetails = exam.questions.map(q => {
        const ticketQuestion = ticket.questions.find(tq => tq._id.toString() === q.questionId._id);
        return {
          questionId: q.questionId._id,
          text: ticketQuestion?.text || q.questionId.text || 'Вопрос не найден',
          options: (ticketQuestion?.options || q.questionId.options || []).map(opt => ({
            text: opt.text,
            _id: opt._id,
          })),
          hint: ticketQuestion?.hint || q.questionId.hint || null,
          imageUrl: ticketQuestion?.imageUrl || q.questionId.imageUrl || null,
          videoUrl: ticketQuestion?.videoUrl || null,
          category: ticketQuestion?.category || q.questionId.category || null,
          questionNumber: ticketQuestion?.questionNumber || q.questionId.questionNumber || null,
          userAnswer: q.userAnswer,
          isCorrect: q.isCorrect,
        };
      });
  
      // Map extra questions with details
      const extraQuestionsWithDetails = exam.extraQuestions.map(q => {
        const extraQuestion = extraQuestions.find(eq => eq._id.toString() === q.questionId.toString());
        return {
          questionId: q.questionId,
          text: extraQuestion?.text || 'Вопрос не найден',
          options: (extraQuestion?.options || []).map(opt => ({
            text: opt.text,
            isCorrect: opt.isCorrect || false,
          })) || [],
          hint: extraQuestion?.hint || null,
          imageUrl: extraQuestion?.imageUrl || null,
          videoUrl: extraQuestion?.videoUrl || null,
          category: extraQuestion?.category || null,
          questionNumber: extraQuestion?.questionNumber || null,
          userAnswer: q.userAnswer,
          isCorrect: q.isCorrect,
        };
      });
  
      const totalQuestions = exam.questions.length + exam.extraQuestions.length;
      const correctAnswers =
        exam.questions.filter(q => q.isCorrect).length +
        exam.extraQuestions.filter(q => q.isCorrect).length;
  
      // Вычисляем timeSpent
      const timeSpent = exam.startTime
        ? exam.completedAt
          ? Math.floor((exam.completedAt.getTime() - exam.startTime.getTime()) / 1000) // Время в секундах для завершённых
          : Math.floor((Date.now() - exam.startTime.getTime()) / 1000) // Время в секундах для незавершённых
        : 0;
  
      return {
        exam: {
          ...exam.toObject(),
          questions: questionsWithDetails,
          extraQuestions: extraQuestionsWithDetails,
          mistakesDetails: exam.mistakesDetails,
        },
        statistics: {
          totalQuestions,
          correctAnswers,
          mistakes: exam.mistakes,
          timeSpent, // Теперь в секундах
          status: exam.status,
          completedAt: exam.completedAt // Добавляем время завершения
        },
      };
    } catch (error) {
      throw new Error(`Ошибка при получении результатов: ${error.message}`);
    }
  }
 
  async getMarathonResults(examId) {
    try {
      const marathonExam = await MarathonExam.findById(examId);
      if (!marathonExam) {
        throw new ApiError(404, 'Марафонский экзамен не найден');
      }

      // Получаем все билеты для поиска вопросов
      const tickets = await Ticket.find().lean();
      if (!tickets.length) {
        throw new ApiError(404, 'Билеты не найдены');
      }

      // Формируем подробные данные о вопросах
      const questionsWithDetails = marathonExam.questions.map(q => {
        const ticket = tickets.find(t => t.questions.some(tq => tq._id.toString() === q.questionId._id.toString()));
        const ticketQuestion = ticket?.questions.find(tq => tq._id.toString() === q.questionId._id.toString());
        return {
          questionId: {
            _id: q.questionId._id,
            text: ticketQuestion?.text || q.questionId.text || 'Вопрос не найден',
            options: (ticketQuestion?.options || q.questionId.options || []).map(opt => ({
              text: opt.text
            })),
            hint: ticketQuestion?.hint || q.questionId.hint || null,
            imageUrl: ticketQuestion?.imageUrl || q.questionId.imageUrl || null,
            videoUrl: ticketQuestion?.videoUrl || null,
            category: ticketQuestion?.category || q.questionId.category || null,
            questionNumber: ticketQuestion?.questionNumber || q.questionId.questionNumber || null
          },
          userAnswer: q.userAnswer,
          isCorrect: q.isCorrect
        };
      });

      // Вычисляем статистику
      const totalQuestions = marathonExam.questions.length;
      const correctAnswers = marathonExam.questions.filter(q => q.isCorrect).length;
      const timeSpent = marathonExam.startTime
        ? marathonExam.completedAt
          ? Math.floor((marathonExam.completedAt.getTime() - marathonExam.startTime.getTime()) / 1000)
          : Math.floor((Date.now() - marathonExam.startTime.getTime()) / 1000)
        : 0;

      return {
        exam: {
          ...marathonExam.toObject(),
          questions: questionsWithDetails,
          answeredQuestions: marathonExam.answeredQuestions,
          mistakesDetails: marathonExam.mistakesDetails
        },
        statistics: {
          totalQuestions,
          correctAnswers,
          mistakes: marathonExam.mistakes,
          timeSpent,
          status: marathonExam.status,
          completedAt: marathonExam.completedAt
        }
      };
    } catch (error) {
      console.error(`Ошибка в getMarathonResults (examId: ${examId}):`, error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, `Ошибка при получении результатов марафона: ${error.message}`);
    }
  }
  async generateShareTemplate(examId, isPremium) {
    try {
      const { exam, statistics } = await this.getExamResults(examId);

      if (isPremium) {
        return {
          type: 'image',
          template: 'premium_result_template.jpg',
          data: {
            score: statistics.correctAnswers,
            total: statistics.totalQuestions,
            mistakes: statistics.mistakes,
            time: Math.floor(statistics.timeSpent / 1000 / 60)
          },
          shareOptions: ['story', 'post']
        };
      } else {
        return {
          type: 'text',
          template: `Вы набрали ${statistics.correctAnswers} из ${statistics.totalQuestions} баллов!`,
          referralLink: 'https://app.link/referral'
        };
      }
    } catch (error) {
      throw new Error(`Ошибка при генерации шаблона: ${error.message}`);
    }
  }
}

module.exports = new ExamService(); 