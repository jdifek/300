import csv
import json
from collections import defaultdict

def convert_csv_to_json():
    # Читаем данные из CSV файла
    with open('tickets.csv', 'r', encoding='utf-8') as csv_file:
        csv_reader = csv.DictReader(csv_file)
        tickets = defaultdict(list)
        
        for row in csv_reader:
            # Пропускаем пустые строки
            if not row['Номер билета']:
                continue
                
            ticket_number = int(row['Номер билета'])
            question_number = int(row['Номер вопроса\n(В билете)'])
            
            # Создаем список вариантов ответов
            options = [
                row['Вариант1'],
                row['Вариант2'],
                row['Вариант3']
            ]
            
            # Добавляем четвертый вариант, если он есть
            if row['Вариант4\n(Если варианта 4 нет,\n то не заполнять)']:
                options.append(row['Вариант4\n(Если варианта 4 нет,\n то не заполнять)'])
            
            question = {
                "text": row['Вопрос'],
                "options": options,
                "correctAnswer": int(row['Правильный ответ']) - 1,  # Преобразуем в 0-based индекс
                "category": row['Тема вопроса\n'],
                "questionNumber": question_number,
                "imageUrl": row['Картинка\n(Прямая ссылка на изображение с расширением .jpg, .png)'],
                "hint": row['Подсказка'],
                "videoUrl": row['Ссылка на видеоразбор вопросов']
            }
            
            tickets[ticket_number].append(question)
    
    # Сортируем вопросы по номеру внутри билета
    for ticket_number in tickets:
        tickets[ticket_number].sort(key=lambda x: x['questionNumber'])
    
    # Формируем финальную структуру
    result = []
    for ticket_number in sorted(tickets.keys()):
        result.append({
            "number": ticket_number,
            "questions": tickets[ticket_number]
        })
    
    # Записываем результат в JSON файл
    with open('tickets.json', 'w', encoding='utf-8') as json_file:
        json.dump(result, json_file, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    convert_csv_to_json() 