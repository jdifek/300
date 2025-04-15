const Exam = require('../models/Exam');
const Ticket = require('../models/Ticket');
const ExtraQuestion = require('../models/ExtraQuestion');

class ExamService {
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
  async createExam(userId) {
    try {
      // Получаем все существующие билеты
      const tickets = await Ticket.find({}, 'number');
      if (tickets.length === 0) {
        throw new Error('В базе данных нет билетов');
      }
  
      // Выбираем случайный билет из существующих
      const randomIndex = Math.floor(Math.random() * tickets.length);
      const ticketNumber = tickets[randomIndex].number;
      const ticket = await Ticket.findOne({ number: ticketNumber });
  
      if (!ticket) {
        throw new Error('Билет не найден'); // Это не должно произойти, но оставим для безопасности
      }
  
      // Формируем список вопросов для экзамена
      const examQuestions = ticket.questions.map((question) => ({
        questionId: question._id,
        userAnswer: null,
        isCorrect: null
      }));
  
      // Создаем новый экзамен
      const exam = new Exam({
        userId,
        ticketNumber,
        questions: examQuestions,
        extraQuestions: [],
        mistakes: 0,
        status: 'in_progress',
        startTime: new Date(),
        timeLimit: 20 * 60 * 1000 // 20 минут
      });
  
      await exam.save();
      return exam;
    } catch (error) {
      throw new Error(`Ошибка при создании экзамена: ${error.message}`);
    }
  }

  async processAnswer(examId, questionIndex, userAnswer) {
    try {
      const exam = await Exam.findById(examId);
      if (!exam) {
        throw new Error('Экзамен не найден');
      }
  
      // Загружаем билет и дополнительные вопросы
      const ticket = await Ticket.findOne({ number: exam.ticketNumber });
      const extraQuestions = await ExtraQuestion.find({
        _id: { $in: exam.extraQuestions.map(q => q.questionId) }
      });
  
      // Проверяем, не истекло ли время
      const elapsedTime = Date.now() - exam.startTime.getTime();
      if (elapsedTime > exam.timeLimit + exam.extraTime) {
        exam.status = 'failed';
        await exam.save();
        throw new Error('Время экзамена истекло');
      }
  
      // Обрабатываем ответ
      let question;
      let questionData;
      if (questionIndex < exam.questions.length) {
        question = exam.questions[questionIndex];
        questionData = ticket.questions.find(q => q._id.toString() === question.questionId.toString());
      } else {
        question = exam.extraQuestions[questionIndex - exam.questions.length];
        questionData = extraQuestions.find(q => q._id.toString() === question.questionId.toString());
      }
  
      if (!questionData) {
        throw new Error('Вопрос не найден');
      }
  
      const correctAnswer = questionData.options.findIndex((opt) => opt.isCorrect);
      question.userAnswer = userAnswer;
      question.isCorrect = userAnswer === correctAnswer;
  
      if (!question.isCorrect) {
        exam.mistakes += 1;
  
        // Если это третья ошибка, экзамен провален
        if (exam.mistakes >= 3) {
          exam.status = 'failed';
          await exam.save();
          return exam;
        }
  
        // Добавляем дополнительные вопросы
        await this.addExtraQuestions(exam, questionData.category);
      }
  
      // Проверяем, закончен ли экзамен
      const allAnswered = exam.questions.every((q) => q.userAnswer !== null) &&
        exam.extraQuestions.every((q) => q.userAnswer !== null);
  
      if (allAnswered) {
        exam.status = exam.mistakes < 3 ? 'passed' : 'failed';
      }
  
      await exam.save();
      return exam;
    } catch (error) {
      throw new Error(`Ошибка при обработке ответа: ${error.message}`);
    }
  }

  async addExtraQuestions(exam, category) {
    try {
      if (exam.mistakes === 1) {
        // Первая ошибка: добавляем 5 вопросов
        let extraQuestions = await ExtraQuestion.find({ category }).limit(5);
        if (extraQuestions.length < 5) {
          const additionalQuestions = await ExtraQuestion.aggregate([
            { $match: { category: { $ne: category } } },
            { $sample: { size: 5 - extraQuestions.length } }
          ]);
          extraQuestions = extraQuestions.concat(additionalQuestions);
        }

        exam.extraQuestions = extraQuestions.map((q) => ({
          questionId: q._id,
          userAnswer: null,
          isCorrect: null
        }));
        exam.extraTime = 5 * 60 * 1000; // 5 минут
      } else if (exam.mistakes === 2) {
        // Вторая ошибка: добавляем еще 5 вопросов
        let extraQuestions = await ExtraQuestion.find({ category }).limit(5);
        if (extraQuestions.length < 5) {
          const additionalQuestions = await ExtraQuestion.aggregate([
            { $match: { category: { $ne: category } } },
            { $sample: { size: 5 - extraQuestions.length } }
          ]);
          extraQuestions = extraQuestions.concat(additionalQuestions);
        }

        exam.extraQuestions.push(...extraQuestions.map((q) => ({
          questionId: q._id,
          userAnswer: null,
          isCorrect: null
        })));
        if (exam.mistakes === 1) {
          exam.extraTime += 5 * 60 * 1000; // Добавляем 5 минут
        } else if (exam.mistakes === 2) {
          exam.extraTime += 5 * 60 * 1000; // Добавляем еще 5 минут (итого 10)
        }      }
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
      const extraQuestions = await ExtraQuestion.find({
        _id: { $in: exam.extraQuestions.map(q => q.questionId) }
      });
  
      // Присоединяем данные вопросов
      exam.questions.forEach(q => {
        q.questionId = ticket.questions.find(tq => tq._id.toString() === q.questionId.toString());
      });
      exam.extraQuestions.forEach(q => {
        q.questionId = extraQuestions.find(eq => eq._id.toString() === q.questionId.toString());
      });
  
      const totalQuestions = exam.questions.length + exam.extraQuestions.length;
      const correctAnswers = exam.questions.filter(q => q.isCorrect).length +
        exam.extraQuestions.filter(q => q.isCorrect).length;
  
      return {
        exam,
        statistics: {
          totalQuestions,
          correctAnswers,
          mistakes: exam.mistakes,
          timeSpent: Date.now() - exam.startTime.getTime(),
          status: exam.status
        }
      };
    } catch (error) {
      throw new Error(`Ошибка при получении результатов: ${error.message}`);
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