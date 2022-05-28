import './App.css';
import {observer} from "mobx-react";
import {useEffect, useState} from "react";

const App = observer(() => {

        let xhr = new XMLHttpRequest();
        xhr.responseType = "document";
        const url = 'https://penzanews.ru/archive/?start='; //Ссылка на страницу новостей
        const cors = 'https://cors-anywere.herokuapp.com/'; //API для обхода CORS


        let getData = [] //Для загрузки файла с бэка
        let dataLength = 100 //Длина файла с бэка
        let newHeadings = [] //Новые новости
        let i = 0 //Итератор страниц
        let data = [] //Массив новых записей
        const time = 1.5 //Время через которое будет повторяться запрос в минутах
        const requestToNews = (time * 30000) // Время запроса к ресурсу
        const [dataSource, setDataSource] = useState() //Вывод новых записей в окно на странице
        const [status, setStatus] = useState("processing..") //Статус выполнения на странице

        //Запрос на получение данных
        const fetchToGET = () => {
            return fetch('http://localhost:3001/getJSON', {
                method: "GET",
            }).then(response => response.json())
        }

        //Запрос на отправку данных
        const fetchToPOST = (Array) => {
            return fetch('http://localhost:3001/postJSON', {
                method: "POST",
                headers: {
                    'Content-type': 'application/json; charset=utf-8'
                },
                body: JSON.stringify(Array)
            }).then(response => response.json())

        }

        //Функция при успешном получении данных с ресурса
        xhr.onload = function () {
            //i должно быть меншьше количества новостей на сайте
            if (xhr.readyState === 4 && xhr.status === 200 && i < 100) {
                //Выбираем тэг внутри которого хранятся записи
                let response = xhr.responseXML.querySelectorAll(".NewsListBig tr")
                //Раскоментировать это чтобы посмотреть тэги входящие в запись *console.log(response[0].children[1])*
                for (let j = 0; j < response.length; j++) {
                    //Полностью опциональная часть, если требуется можно поменять поля
                    // и тэги в querySelector из которых мы эти данные подтягиваем
                    let cut = response[j].children[1].querySelector("b").textContent.length
                    uniqNews({
                        title: response[j].children[1].querySelector("h4").textContent,
                        date: response[j].children[1].querySelector("span").textContent.slice(0, -cut),
                        description: response[j].children[1].querySelector("p").textContent,
                        category: response[j].children[1].querySelector("b").textContent.slice(3),
                        link: 'https://penzanews.ru' + response[j].children[1].querySelector("a").getAttribute("href")
                    }, -1)
                }
                i += 10 //Увеличиваем итератор на количество новостей на странице
                //Выполняем повторный запрос если есть ещё страницы
                xhr.open("GET", cors + url + i, true);
                xhr.send();
            } else {
                //После прохождения всех страниц обнуляем счётчик страниц, устанавливаем, статус, 
                // выводим новые новости объеденяем новые новости со старыми и отправляем на бэк
                let result = data
                if (result !== []) {
                    fetchToPOST(result)
                    let rev = newHeadings.reverse()
                    getData = [...getData, ...rev]

                    if (getData.length > 100) {
                        let dif = getData.length - 100
                        getData.slice(dif)
                    }
                }

                setDataSource(data)
                setStatus("READY!!!")

                //Обработку следующего запроса к сайту
                setTimeout(() => {
                    console.log(getData)
                    i = 0
                    newHeadings = []
                    data = []
                    setDataSource([])
                    setStatus("processing..")
                    xhr.open("GET", cors + url + 0, true);
                    xhr.send()
                }, requestToNews);
            }
        }

        //Обработка ошибки если данные с запрашиваемого ресурса не пришли
        xhr.onerror = function () {
            console.log(xhr.status, xhr.statusText)
        }

        //Проверка уникальности новойстей (Если изменены поля меняется условие)
        const uniqNews = (news, index) => {
            for (let i = 0; i < dataLength; i++) {
                if (news.link === getData[i]) {
                    index = i;
                }
            }
            if (index > -1) {

            } else {
                newHeadings.push(news.link)
                data.push(news);
            }
        }

        //Сохранить новые новости в JSON руками
        const saveJsonObjToFile = () => {
            const text = JSON.stringify(dataSource, null, 3);
            const name = "result.json";
            const type = "text/plain";

            const a = document.createElement("a");
            const file = new Blob([text], {type: type});
            a.href = URL.createObjectURL(file);
            a.download = name;
            document.body.appendChild(a);
            a.click();
            a.remove();
        }

        useEffect(() => {
            fetchToGET().then(v => {
                if (v !== false) {
                    dataLength = v.length
                    getData = v
                }
            }).then(() => {
                    xhr.open("GET", cors + url + 0, true)
                    xhr.send()
                }
            )
        }, [])

        return <div>
            <h1>{status}</h1>
            <button onClick={saveJsonObjToFile}>Сохранить</button>
            <br/>
            <textarea cols="200" rows="50" value={JSON.stringify(dataSource, null, 3)}/>
        </div>
    });
export default App
