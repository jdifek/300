const Exam = require('../models/Exam');
const TempQuestion = require('../models/TempQuestion');
const Ticket = require('../models/Ticket');
const MarathonExam = require('../models/MarathonExam');
const ExtraQuestion = require('../models/ExtraQuestion');
const User = require('../models/User');
const mongoose = require('mongoose');
const ApiError = require('../exceptions/api-error');

class ExamService {
  async getMarathonQuestions() {
    try {
      const tickets = await Ticket.find().lean();
      if (!tickets.length) {
        return [];
      }
      const allQuestions = tickets.flatMap(ticket => ticket.questions || []);
      return allQuestions;
    } catch (error) {
      throw new Error(`Ошибка при получении вопросов марафона: ${error.message}`);
    }
  }

  async addExtraQuestionsToMarathon(exam, category) {
    try {
      if (exam.mistakes >= 3) {
        return;
      }

      const allTickets = await Ticket.find();
      let availableQuestions = [];

      for (const ticket of allTickets) {
        const newQuestions = ticket.questions.filter(q =>
          q.category === category &&
          !exam.questions.some(eq => eq.questionId.text === q.text) &&
          !exam.extraQuestions?.some(eq => eq.questionId.toString() === q.text)
        );
        availableQuestions = availableQuestions.concat(newQuestions);
      }

      const selectedQuestions = [];
      const seenTexts = new Set();
      for (const q of availableQuestions) {
        if (!seenTexts.has(q.text) && selectedQuestions.length < 5) {
          seenTexts.add(q.text);
          selectedQuestions.push(q);
        }
      }

      if (selectedQuestions.length === 0) {
        return;
      }

      const tempQuestions = await TempQuestion.insertMany(selectedQuestions.map(q => ({
        text: q.text,
        options: q.options,
        category: q.category,
        hint: q.hint || null,
        imageUrl: q.imageUrl || null
      })));

      const newExtraQuestions = tempQuestions.map((q) => ({
        questionId: q._id,
        userAnswer: null,
        isCorrect: null
      }));
      if (!exam.extraQuestions) {
        exam.extraQuestions = [];
      }
      exam.extraQuestions.push(...newExtraQuestions);

      await exam.save();
    } catch (error) {
      console.error(`Ошибка при добавлении дополнительных вопросов в марафон: ${error.message}`);
      throw new ApiError(500, `Ошибка при добавлении дополнительных вопросов: ${error.message}`);
    }
  }

  async processMarathonAnswer(examId, questionIndex, userAnswer) {
    try {
      const marathonExam = await MarathonExam.findById(examId);
      if (!marathonExam) {
        throw new ApiError(404, 'Марафонский экзамен не найден');
      }

      if (!marathonExam.questions || marathonExam.questions.length === 0) {
        throw new ApiError(400, 'Вопросы марафона не найдены');
      }

      if (questionIndex < 0 || questionIndex >= marathonExam.questions.length) {
        throw new ApiError(400, `Неверный индекс вопроса: ${questionIndex}`);
      }

      const question = marathonExam.questions[questionIndex];
      if (question.userAnswer !== null) {
        throw new ApiError(400, 'На этот вопрос уже дан ответ');
      }

      const ticket = await Ticket.findOne({
        'questions._id': question.questionId._id
      });
      if (!ticket) {
        throw new ApiError(404, 'Билет не найден');
      }

      const questionData = ticket.questions.find(
        q => q._id.toString() === question.questionId._id.toString()
      );
      if (!questionData) {
        throw new ApiError(404, 'Вопрос не найден в билете');
      }

      if (!questionData.options || questionData.options.length === 0) {
        throw new ApiError(400, `Вопрос не содержит вариантов ответа`);
      }

      const correctAnswer = questionData.options.findIndex(opt => opt.isCorrect);
      if (correctAnswer === -1) {
        throw new ApiError(400, `Вопрос не имеет правильного ответа`);
      }

      if (userAnswer < 0 || userAnswer >= questionData.options.length) {
        throw new ApiError(400, `Неверный ответ: ${userAnswer} (доступно вариантов: ${questionData.options.length})`);
      }

      const selectedOptionText = questionData.options[userAnswer]?.text || 'Неизвестно';
      const correctOptionText = questionData.options[correctAnswer]?.text || 'Неизвестно';

      question.userAnswer = userAnswer;
      question.isCorrect = userAnswer === correctAnswer;

      marathonExam.answeredQuestions.push({
        questionId: question.questionId._id.toString(),
        selectedOption: selectedOptionText,
        isCorrect: question.isCorrect,
        hint: questionData.hint || null,
        imageUrl: questionData.imageUrl || null
      });

      const user = await User.findById(marathonExam.userId);
      if (!user) {
        throw new ApiError(404, 'Пользователь не найден');
      }

      if (!question.isCorrect) {
        marathonExam.mistakes += 1;
        user.stats.mistakes += 1;
        marathonExam.mistakesDetails.push({
          questionId: question.questionId._id.toString(),
          questionText: questionData.text,
          selectedOption: selectedOptionText,
          correctOption: correctOptionText,
          hint: questionData.hint || null,
          imageUrl: questionData.imageUrl || null
        });

        if (marathonExam.mistakes < 3) {
          await this.addExtraQuestionsToMarathon(marathonExam, questionData.category);
        }
      }

      marathonExam.completedQuestions += 1;

      const totalQuestions = marathonExam.questions.length;
      if (marathonExam.completedQuestions >= totalQuestions) {
        marathonExam.status = 'completed';
        marathonExam.completedAt = new Date();
        const timeSpent = Math.floor((marathonExam.completedAt.getTime() - marathonExam.startTime.getTime()) / 1000);
        user.stats.totalTimeSpent += timeSpent;
      }

      await marathonExam.save();
      await user.save();
      return marathonExam;
    } catch (error) {
      console.error(`Ошибка в processMarathonAnswer (examId: ${examId}, questionIndex: ${questionIndex}, userAnswer: ${userAnswer}):`, error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, `Ошибка при обработке ответа марафона: ${error.message}`);
    }
  }

  async getUnansweredQuestions(examId) {
    try {
      const marathonExam = await MarathonExam.findById(examId);
      if (!marathonExam) {
        throw new ApiError(404, 'Марафонский экзамен не найден');
      }

      const unansweredQuestions = marathonExam.questions.filter(q => q.userAnswer === null);
      return unansweredQuestions;
    } catch (error) {
      throw new ApiError(500, `Ошибка при получении неотвеченных вопросов: ${error.message}`);
    }
  }

  async processUnansweredQuestionAnswer(examId, questionIndex, userAnswer) {
    try {
      const marathonExam = await MarathonExam.findById(examId);
      if (!marathonExam) {
        throw new ApiError(404, 'Марафонский экзамен не найден');
      }

      const unansweredQuestions = marathonExam.questions.filter(q => q.userAnswer === null);
      if (!unansweredQuestions || unansweredQuestions.length === 0) {
        throw new ApiError(400, 'Неотвеченные вопросы не найдены');
      }

      if (questionIndex < 0 || questionIndex >= unansweredQuestions.length) {
        throw new ApiError(400, `Неверный индекс вопроса: ${questionIndex}`);
      }

      const question = unansweredQuestions[questionIndex];
      const originalQuestionIndex = marathonExam.questions.findIndex(
        q => q.questionId._id.toString() === question.questionId._id.toString()
      );

      if (originalQuestionIndex === -1) {
        throw new ApiError(400, 'Вопрос не найден в исходном списке');
      }

      const ticket = await Ticket.findOne({
        'questions._id': question.questionId._id
      });
      if (!ticket) {
        throw new ApiError(404, 'Билет не найден');
      }

      const questionData = ticket.questions.find(
        q => q._id.toString() === question.questionId._id.toString()
      );
      if (!questionData) {
        throw new ApiError(404, 'Вопрос не найден в билете');
      }

      if (!questionData.options || questionData.options.length === 0) {
        throw new ApiError(400, `Вопрос не содержит вариантов ответа`);
      }

      const correctAnswer = questionData.options.findIndex(opt => opt.isCorrect);
      if (correctAnswer === -1) {
        throw new ApiError(400, `Вопрос не имеет правильного ответа`);
      }

      if (userAnswer < 0 || userAnswer >= questionData.options.length) {
        throw new ApiError(400, `Неверный ответ: ${userAnswer} (доступно вариантов: ${questionData.options.length})`);
      }

      const selectedOptionText = questionData.options[userAnswer]?.text || 'Неизвестно';
      const correctOptionText = questionData.options[correctAnswer]?.text || 'Неизвестно';

      marathonExam.questions[originalQuestionIndex].userAnswer = userAnswer;
      marathonExam.questions[originalQuestionIndex].isCorrect = userAnswer === correctAnswer;

      marathonExam.answeredQuestions.push({
        questionId: question.questionId._id.toString(),
        selectedOption: selectedOptionText,
        isCorrect: userAnswer === correctAnswer,
        hint: questionData.hint || null,
        imageUrl: questionData.imageUrl || null
      });

      const user = await User.findById(marathonExam.userId);
      if (!user) {
        throw new ApiError(404, 'Пользователь не найден');
      }

      if (userAnswer !== correctAnswer) {
        marathonExam.mistakes += 1;
        user.stats.mistakes += 1;
        marathonExam.mistakesDetails.push({
          questionId: question.questionId._id.toString(),
          questionText: questionData.text,
          selectedOption: selectedOptionText,
          correctOption: correctOptionText,
          hint: questionData.hint || null,
          imageUrl: questionData.imageUrl || null
        });

        if (marathonExam.mistakes < 3) {
          await this.addExtraQuestionsToMarathon(marathonExam, questionData.category);
        }
      }

      marathonExam.completedQuestions += 1;

      const totalQuestions = marathonExam.questions.length;
      if (marathonExam.completedQuestions >= totalQuestions) {
        marathonExam.status = 'completed';
        marathonExam.completedAt = new Date();
        const timeSpent = Math.floor((marathonExam.completedAt.getTime() - marathonExam.startTime.getTime()) / 1000);
        user.stats.totalTimeSpent += timeSpent;
      }

      await marathonExam.save();
      await user.save();
      return marathonExam;
    } catch (error) {
      console.error(`Ошибка в processUnansweredQuestionAnswer (examId: ${examId}, questionIndex: ${questionIndex}, userAnswer: ${userAnswer}):`, error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, `Ошибка при обработке ответа на неотвеченный вопрос: ${error.message}`);
    }
  }

  async getUnansweredResults(examId) {
    try {
      const marathonExam = await MarathonExam.findById(examId);
      if (!marathonExam) {
        throw new ApiError(404, 'Марафонский экзамен не найден');
      }

      const tickets = await Ticket.find().lean();
      if (!tickets.length) {
        throw new ApiError(404, 'Билеты не найдены');
      }

      const unansweredQuestions = marathonExam.questions.filter(q => q.userAnswer === null);
      const answeredQuestions = marathonExam.questions.filter(q => q.userAnswer !== null);

      const questionsWithDetails = answeredQuestions.map(q => {
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

      const totalQuestions = marathonExam.questions.length;
      const correctAnswers = answeredQuestions.filter(q => q.isCorrect).length;
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
          unansweredQuestions: unansweredQuestions.length,
          correctAnswers,
          mistakes: marathonExam.mistakes,
          timeSpent,
          status: marathonExam.status,
          completedAt: marathonExam.completedAt
        }
      };
    } catch (error) {
      console.error(`Ошибка в getUnansweredResults (examId: ${examId}):`, error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, `Ошибка при получении результатов по неотвеченным вопросам: ${error.message}`);
    }
  }

  async createMarathonExam(userId) {
    try {
      const questions = await this.getMarathonQuestions();
      if (questions.length === 0) {
        throw new ApiError(404, 'Вопросы для марафона не найдены');
      }

      const existingMarathon = await MarathonExam.findOne({ userId, status: 'in_progress' });
      if (existingMarathon) {
        return {
          exam: existingMarathon,
          questions
        };
      }

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
        questions: examQuestions,
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
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, `Ошибка при создании марафонского экзамена: ${error.message}`);
    }
  }

  async processAnswer(examId, questionIndex, userAnswer) {
    try {
      if (!examId) {
        throw new ApiError(400, 'examId не указан');
      }

      const exam = await Exam.findById(examId);
      if (!exam) {
        throw new ApiError(404, `Экзамен с ID ${examId} не найден`);
      }

      if (!exam.ticketNumber) {
        throw new ApiError(400, `ticketNumber отсутствует в экзамене (examId: ${examId})`);
      }

      const ticket = await Ticket.findOne({ number: exam.ticketNumber });
      if (!ticket) {
        throw new ApiError(404, `Билет с номером ${exam.ticketNumber} не найден`);
      }

      const extraQuestions = await ExtraQuestion.find({
        _id: { $in: exam.extraQuestions.map(q => q.questionId) },
      });

      if (!exam.startTime) {
        throw new ApiError(400, `startTime отсутствует в экзамене (examId: ${examId})`);
      }
      if (!exam.timeLimit) {
        throw new ApiError(400, `timeLimit отсутствует в экзамене (examId: ${examId})`);
      }

      const elapsedTime = Date.now() - exam.startTime.getTime();
      if (elapsedTime > exam.timeLimit + (exam.extraTime || 0)) {
        exam.status = 'failed';
        exam.completedAt = new Date();
        await exam.save();
        throw new ApiError(400, 'Время экзамена истекло');
      }

      if (questionIndex < 0 || questionIndex >= exam.questions.length + exam.extraQuestions.length) {
        throw new ApiError(400, `Неверный questionIndex: ${questionIndex} (доступно вопросов: ${exam.questions.length + exam.extraQuestions.length})`);
      }

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

      if (question.userAnswer !== null) {
        throw new ApiError(400, 'На этот вопрос уже дан ответ');
      }

      if (!questionData.options || questionData.options.length === 0) {
        throw new ApiError(400, `Вопрос с ID ${question.questionId._id || question.questionId} не содержит вариантов ответа`);
      }

      const correctAnswer = questionData.options.findIndex(opt => opt.isCorrect);
      if (correctAnswer === -1) {
        throw new ApiError(400, `Вопрос с ID ${question.questionId._id || question.questionId} не имеет правильного ответа`);
      }

      if (userAnswer < 0 || userAnswer >= questionData.options.length) {
        throw new ApiError(400, `Неверный userAnswer: ${userAnswer} (доступно вариантов: ${questionData.options.length})`);
      }

      const selectedOptionText = questionData.options[userAnswer]?.text || 'Неизвестно';
      const correctOptionText = questionData.options[correctAnswer]?.text || 'Неизвестно';

      question.userAnswer = userAnswer;
      question.isCorrect = userAnswer === correctAnswer;

      const user = await User.findById(exam.userId);
      if (!user) {
        throw new ApiError(404, 'Пользователь не найден');
      }

      if (!question.isCorrect) {
        exam.mistakes = (exam.mistakes || 0) + 1;
        user.stats.mistakes += 1;

        exam.mistakesDetails.push({
          questionId: (question.questionId._id || question.questionId).toString(),
          questionText: questionData.text,
          selectedOption: selectedOptionText,
          correctOption: correctOptionText,
          hint: questionData.hint || null,
          imageUrl: questionData.imageUrl || null,
        });

        if (exam.mistakes >= 3) {
          exam.status = 'failed';
          exam.completedAt = new Date();
          const timeSpent = Math.floor((exam.completedAt.getTime() - exam.startTime.getTime()) / 1000);
          user.stats.totalTimeSpent += timeSpent;
          await exam.save();
          await user.save();
          return exam;
        }

        await this.addExtraQuestions(exam, questionData.category);
      }

      const allAnswered =
        exam.questions.every(q => q.userAnswer !== null) &&
        exam.extraQuestions.every(q => q.userAnswer !== null);

      if (allAnswered) {
        exam.status = exam.mistakes < 3 ? 'passed' : 'failed';
        exam.completedAt = new Date();
        const timeSpent = Math.floor((exam.completedAt.getTime() - exam.startTime.getTime()) / 1000);
        user.stats.totalTimeSpent += timeSpent;
        if (exam.status === 'passed') {
          user.stats.ticketsCompleted += 1;
        }
      }

      await exam.save();
      await user.save();
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
          mistakesDetails: [],
          timeSpent: 0,
          formattedTimeSpent: '0 мин 0 сек'
        };
      }

      const totalQuestions = marathonExam.questions.length;
      const correctAnswers = marathonExam.questions.filter(q => q.isCorrect).length;
      const progress = Math.round((correctAnswers / totalQuestions) * 100);

      const timeSpent = marathonExam.startTime
        ? marathonExam.completedAt
          ? Math.floor((marathonExam.completedAt.getTime() - marathonExam.startTime.getTime()) / 1000)
          : Math.floor((Date.now() - marathonExam.startTime.getTime()) / 1000)
        : 0;

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
        timeSpent,
        formattedTimeSpent,
        completedAt: marathonExam.completedAt
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
      if (!userId) {
        throw new ApiError(400, 'ID пользователя обязателен');
      }
      const tickets = await Ticket.find({}, 'number');
      if (tickets.length === 0) {
        throw new ApiError(404, 'В базе данных нет билетов');
      }
      const randomIndex = Math.floor(Math.random() * tickets.length);
      const ticketNumber = tickets[randomIndex].number;
      const lastExam = await Exam.findOne({
        userId,
        status: { $in: ['passed', 'failed'] },
      })
        .sort({ completedAt: -1 })
        .lean();
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
              ? Math.floor((lastExam.completedAt.getTime() - lastExam.startTime.getTime()) / 1000) * 1000
              : 0,
          },
        };
      }
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
        throw new ApiError(404, 'Билет не найден');
      }

      const examQuestions = ticket.questions.map((question) => ({
        questionId: {
          _id: question._id,
          text: question.text,
          options: question.options.map(opt => ({
            text: opt.text
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
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, `Ошибка при создании экзамена: ${error.message}`);
    }
  }

  async addExtraQuestions(exam, category) {
    try {
      if (exam.mistakes >= 3) {
        return;
      }

      const allTickets = await Ticket.find();
      let availableQuestions = [];

      for (const ticket of allTickets) {
        const newQuestions = ticket.questions.filter(q => 
          q.category === category &&
          !exam.questions.some(eq => eq.questionId.text === q.text) &&
          !exam.extraQuestions.some(eq => eq.questionId.toString() === q.text)
        );
        availableQuestions = availableQuestions.concat(newQuestions);
      }

      const selectedQuestions = [];
      const seenTexts = new Set();
      for (const q of availableQuestions) {
        if (!seenTexts.has(q.text) && selectedQuestions.length < 5) {
          seenTexts.add(q.text);
          selectedQuestions.push(q);
        }
      }

      if (selectedQuestions.length === 0) {
        return;
      }

      const tempQuestions = await TempQuestion.insertMany(selectedQuestions.map(q => ({
        text: q.text,
        options: q.options,
        category: q.category,
        hint: q.hint || null,
        imageUrl: q.imageUrl || null
      })));

      const newExtraQuestions = tempQuestions.map((q) => ({
        questionId: q._id,
        userAnswer: null,
        isCorrect: null
      }));
      exam.extraQuestions.push(...newExtraQuestions);

      exam.extraTime = (exam.extraTime || 0) + 5 * 60 * 1000;

      await exam.save();
    } catch (error) {
      console.error(`Ошибка при добавлении дополнительных вопросов: ${error.message}`);
      throw new ApiError(500, `Ошибка при добавлении дополнительных вопросов: ${error.message}`);
    }
  }

  async getExamResults(examId) {
    try {
      const exam = await Exam.findById(examId);
      if (!exam) {
        throw new ApiError(404, 'Экзамен не найден');
      }

      const ticket = await Ticket.findOne({ number: exam.ticketNumber });
      if (!ticket) {
        throw new ApiError(404, 'Билет не найден');
      }

      const extraQuestions = await ExtraQuestion.find({
        _id: { $in: exam.extraQuestions.map(q => q.questionId) },
      }).lean();

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

      const timeSpent = exam.startTime
        ? exam.completedAt
          ? Math.floor((exam.completedAt.getTime() - exam.startTime.getTime()) / 1000)
          : Math.floor((Date.now() - exam.startTime.getTime()) / 1000)
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
          timeSpent,
          status: exam.status,
          completedAt: exam.completedAt
        },
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, `Ошибка при получении результатов: ${error.message}`);
    }
  }

  async getMarathonResults(examId) {
    try {
      const marathonExam = await MarathonExam.findById(examId);
      if (!marathonExam) {
        throw new ApiError(404, 'Марафонский экзамен не найден');
      }

      const tickets = await Ticket.find().lean();
      if (!tickets.length) {
        throw new ApiError(404, 'Билеты не найдены');
      }

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
            time: Math.floor(statistics.timeSpent / 60)
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
      throw new ApiError(500, `Ошибка при генерации шаблона: ${error.message}`);
    }
  }

  async createRandomQuestionSession(userId, questions) {
    try {
      const session = new mongoose.model('RandomQuestionSession')({
        userId,
        questions: questions.map(q => ({
          questionId: q._id,
          ticketNumber: q.ticketNumber,
          text: q.text,
          options: q.options,
          category: q.category,
          hint: q.hint || null,
          imageUrl: q.imageUrl || null
        })),
        createdAt: new Date()
      });
      await session.save();
      return session._id.toString();
    } catch (error) {
      throw new ApiError(500, `Ошибка при создании сессии случайных вопросов: ${error.message}`);
    }
  }

  async processRandomQuestionAnswer(userId, sessionId, questionId, userAnswer) {
    try {
      const session = await mongoose.model('RandomQuestionSession').findById(sessionId);
      if (!session || session.userId !== userId) {
        throw new ApiError(404, 'Сессия не найдена или не принадлежит пользователю');
      }

      const question = session.questions.find(q => q.questionId.toString() === questionId);
      if (!question) {
        throw new ApiError(404, 'Вопрос не найден в сессии');
      }

      const ticket = await Ticket.findOne({ number: question.ticketNumber });
      if (!ticket) {
        throw new ApiError(404, 'Билет не найден');
      }

      const questionData = ticket.questions.find(q => q._id.toString() === questionId);
      if (!questionData) {
        throw new ApiError(404, 'Вопрос не найден в билете');
      }

      const correctAnswer = questionData.options.findIndex(opt => opt.isCorrect);
      const isCorrect = userAnswer === correctAnswer;
      const selectedOptionText = questionData.options[userAnswer]?.text || 'Неизвестно';
      const correctOptionText = questionData.options[correctAnswer]?.text || 'Неизвестно';

      const user = await User.findById(userId);
      if (!user) {
        throw new ApiError(404, 'Пользователь не найден');
      }

      let ticketProgress = user.ticketsProgress.find(tp => tp.ticketNumber === question.ticketNumber);
      if (!ticketProgress) {
        ticketProgress = {
          ticketNumber: question.ticketNumber,
          isCompleted: false,
          mistakes: 0,
          correctAnswers: 0,
          totalQuestions: ticket.questions.length,
          startedAt: new Date(),
          answeredQuestions: [],
          mistakesDetails: []
        };
        user.ticketsProgress.push(ticketProgress);
      }

      if (ticketProgress.answeredQuestions.some(aq => aq.questionId === questionId)) {
        throw new ApiError(400, 'На этот вопрос уже дан ответ в рамках этого билета');
      }

      ticketProgress.answeredQuestions.push({
        questionId,
        selectedOption: selectedOptionText,
        isCorrect,
        hint: questionData.hint || null,
        imageUrl: questionData.imageUrl || null
      });

      if (isCorrect) {
        ticketProgress.correctAnswers += 1;
      } else {
        ticketProgress.mistakes += 1;
        user.stats.mistakes += 1;
        ticketProgress.mistakesDetails.push({
          questionId,
          questionText: questionData.text,
          selectedOption: selectedOptionText,
          correctOption: correctOptionText,
          hint: questionData.hint || null,
          imageUrl: questionData.imageUrl || null
        });
      }

      if (ticketProgress.answeredQuestions.length === ticketProgress.totalQuestions) {
        ticketProgress.isCompleted = true;
        ticketProgress.completedAt = new Date();
        const timeSpent = Math.floor((ticketProgress.completedAt.getTime() - ticketProgress.startedAt.getTime()) / 1000);
        user.stats.totalTimeSpent += timeSpent;
        if (ticketProgress.mistakes < 3) {
          user.stats.ticketsCompleted += 1;
        }
      }

      await user.save();
      return {
        questionId,
        isCorrect,
        correctOption: correctOptionText
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, `Ошибка при обработке ответа на случайный вопрос: ${error.message}`);
    }
  }
}

module.exports = new ExamService();