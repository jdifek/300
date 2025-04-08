class ExamResult {
  constructor(correctAnswers, incorrectAnswers, timeSpent, incorrectQuestions, topicsWithErrors, passed) {
    this.correctAnswers = correctAnswers;
    this.incorrectAnswers = incorrectAnswers;
    this.timeSpent = timeSpent;
    this.incorrectQuestions = incorrectQuestions;
    this.topicsWithErrors = topicsWithErrors;
    this.passed = passed;
  }
}

class ExamManager {
  constructor() {
    this.config = null;
    this.tickets = null;
    this.currentExam = null;
    this.startTime = 0;
    this.remainingTime = 0;
    this.errorsByTopic = {};

    // Загружаем конфигурацию и билеты
    this.loadConfig();
    this.loadTickets();
  }

  async loadConfig() {
    try {
      const response = await fetch('exam_config.json');
      this.config = await response.json();
    } catch (error) {
      console.error('Ошибка загрузки конфигурации:', error);
    }
  }

  async loadTickets() {
    try {
      const response = await fetch('tickets.json');
      this.tickets = await response.json();
    } catch (error) {
      console.error('Ошибка загрузки билетов:', error);
    }
  }

  startExam(ticketNumber) {
    this.currentExam = {
      ticket: this.tickets.find(t => t.number === ticketNumber),
      answers: {},
      errors: [],
      additionalQuestions: []
    };

    this.startTime = Date.now();
    this.remainingTime = this.config.examRules.baseTimeMinutes * 60 * 1000; // в миллисекундах
    this.errorsByTopic = {};

    // Запускаем таймер
    this.startTimer();
  }

  startTimer() {
    this.timerInterval = setInterval(() => {
      this.remainingTime -= 1000;
      if (this.remainingTime <= 0) {
        this.finishExam();
      }
    }, 1000);
  }

  answerQuestion(questionNumber, answer) {
    const question = this.currentExam.ticket.questions.find(q => q.questionNumber === questionNumber);

    const isCorrect = answer === question.correctAnswer;
    this.currentExam.answers[questionNumber] = {
      question: question,
      givenAnswer: answer,
      isCorrect: isCorrect
    };

    if (!isCorrect) {
      this.currentExam.errors.push(question);
      if (!this.errorsByTopic[question.category]) {
        this.errorsByTopic[question.category] = [];
      }
      this.errorsByTopic[question.category].push(question);
    }

    return {
      isCorrect,
      correctAnswer: question.correctAnswer,
      hint: question.hint,
      videoUrl: question.videoUrl
    };
  }

  getAdditionalQuestions() {
    const errorCount = this.currentExam.errors.length;
    if (errorCount === 0 || errorCount > 2) {
      return [];
    }

    // Проверяем ошибки в одной теме
    if (Object.keys(this.errorsByTopic).length === 1 && errorCount === 2) {
      return []; // Экзамен не сдан
    }

    // Добавляем вопросы из тем с ошибками
    const questionsNeeded = errorCount === 1 ? 5 : 10;
    const additionalQuestions = [];
    const usedQuestionIds = new Set();

    // Добавляем ID уже использованных вопросов
    this.currentExam.ticket.questions.forEach(q => usedQuestionIds.add(q.id));

    for (const topic in this.errorsByTopic) {
      // Находим все вопросы по данной теме из всех билетов
      const topicQuestions = this.tickets.flatMap(ticket =>
        ticket.questions.filter(q =>
          q.category === topic &&
          !usedQuestionIds.has(q.id)
        )
      );

      // Добавляем нужное количество вопросов
      const questionsPerTopic = Math.floor(questionsNeeded / Object.keys(this.errorsByTopic).length);
      const selectedQuestions = topicQuestions
        .filter(q => !usedQuestionIds.has(q.id))
        .slice(0, questionsPerTopic);

      selectedQuestions.forEach(q => usedQuestionIds.add(q.id));
      additionalQuestions.push(...selectedQuestions);
    }

    this.currentExam.additionalQuestions = additionalQuestions;
    this.remainingTime += (errorCount === 1 ? 5 : 10) * 60 * 1000;

    return additionalQuestions;
  }

  finishExam() {
    clearInterval(this.timerInterval);
    return this.getExamResult();
  }

  getExamResult() {
    const totalQuestions = this.currentExam.ticket.questions.length +
      this.currentExam.additionalQuestions.length;
    const correctAnswers = Object.values(this.currentExam.answers)
      .filter(a => a.isCorrect).length;
    const incorrectAnswers = this.currentExam.errors.length;

    // Проверяем условия сдачи
    const passed = incorrectAnswers <= 2 &&
      (incorrectAnswers < 2 || Object.keys(this.errorsByTopic).length > 1);

    return new ExamResult(
      correctAnswers,
      incorrectAnswers,
      (Date.now() - this.startTime) / 1000, // в секундах
      this.currentExam.errors,
      Object.keys(this.errorsByTopic),
      passed
    );
  }

  getShareContent(isPremium) {
    const result = this.getExamResult();

    if (isPremium) {
      return {
        type: 'image',
        template: this.config.sharing.premium.template,
        allowStory: this.config.sharing.premium.allowStorySharing,
        data: {
          correct: result.correctAnswers,
          total: this.currentExam.ticket.questions.length,
          time: result.timeSpent,
          passed: result.passed
        }
      };
    } else {
      return {
        type: 'text',
        message: this.config.sharing.free.messageTemplate.replace(
          '{referralLink}',
          this.config.sharing.free.referralLink
        )
      };
    }
  }

  formatTime(ms) {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  getRemainingTimeFormatted() {
    return this.formatTime(this.remainingTime);
  }

  getTimeSpentFormatted() {
    return this.formatTime(this.getExamResult().timeSpent * 1000);
  }

  getTopicStats() {
    const stats = {};
    const allQuestions = [
      ...this.currentExam.ticket.questions,
      ...this.currentExam.additionalQuestions
    ];

    allQuestions.forEach(question => {
      if (!stats[question.category]) {
        stats[question.category] = {
          total: 0,
          correct: 0,
          incorrect: 0
        };
      }

      stats[question.category].total++;
      const answer = this.currentExam.answers[question.questionNumber];
      if (answer) {
        if (answer.isCorrect) {
          stats[question.category].correct++;
        } else {
          stats[question.category].incorrect++;
        }
      }
    });

    return stats;
  }
}

// Экспортируем класс для использования в других модулях
export default ExamManager; 