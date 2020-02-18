Код написан на основании "идеального примера" - ```excel/brief_example_gi3.xlsx```.

### How to
* открываем файл ```dist/index.html```;
* в открывшемся окне браузера загружаем необходимый excel-файл;
* если парсинг прошел успешно, то через несколько секунд автоматически скачается готовый ```products.js```.

### Процесс парсинга
* если в строке есть такие слова: ```/Первая строка|Вторая строка|Код для заказа/```, то мы ее пропускаем;
* если в строке заполнена одна ячейка, то парсим ее как заголовок либо как условие. Заголовок идет сразу после пустой строки либо товара, условие идет после строки с текстом (заголовка);
* заголовок разбивается таким образом: первая фраза/слово до ```:``` - название таба, дальше смотрим на оставшуюся часть: если есть точка, то текст до нее записываем в ```title```, после - ```condition``` секции внутри таба, если точка не попадается - записываем все в ```title```;
* условия разбиваются таким образом (следующая строка за заголовком, если есть):  первая фраза/слово до ```!``` отбрасывается, остальное записываем в ```condition``` текущего таба;
* при парсинге товаров текущая строка сравнивается с предыдущей: если товар один и в 6 столбце нет указания на ```/цвет|оттенок|размер|состав набора``` - парсим как одиночный тотвар, иначе - как группу;
* группа определяется по совпадению ```profile code``` либо по указанию в 6 столбце на ```/цвет|оттенок|размер|состав набора``` у единичного товара (когда до или после него есть товары с другими ```profile code```).

### Хэши табов
Необходимо расширение списка, пока как-то так:

Название таба | hash
------------- | ----
default | goods
"Макияж", "Все для макияжа" | makeup
"Ароматы" | fragrance
"Уход", "Уход за телом и лицом" | care
"Уход за лицом", "Средства по уходу за лицом" | face
"Мода и стиль" | style
"Мастера Бижутерии" | jewelery

### Менеджеры шутят
Порой эксель-файл парсится с ошибкой либо ```products.js``` получается не совсем таким, как мы задумывали, хотя на первый (а, порой, и на второй, и третий) взгляд все в порядке:
* менеджер может "схлопнуть строки", например: после 45 строки идет 48;
* менеджер может заменить русские буквы ```а```, ```с```, ```е```, ```р``` на английские ```a```, ```c```, ```e```, ```p```. Это особенно актуально при работе с 6 столбцом, где мы определяем ```/цвет|оттенок|размер|состав набора```. В таком случае можно вручную переписать значение поля, а также проверить символы с помощью ```String(user_string).charCodeAt(n)```.
