const express = require('express');
const bodyParser = require('body-parser');

const fetchPromise = import('node-fetch').then(mod => mod.default)
const fetch = (...args) => fetchPromise.then(fetch => fetch(...args))

const app = express();

const OS = require('os')
process.env.UV_THREADPOOL_SIZE = OS.cpus().length;

app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const URI_BASE = 'http://challenge.dienekes.com.br/api/numbers?page=';

app.get('/', async (req, res) => {
    let data = await getAllNumbers(1, 100);
    res.status(200).json(data);
})

async function getAllNumbers(init, end) {
    try {

        let pageSelected = init;

        let numbersPerPage = [];

        let urls = [];

        let hasPageValid = true;

        while(hasPageValid) {
            if(pageSelected > end) break;
            let p = await checkPageIfInvalid(pageSelected);
            hasPageValid = (p.numbers != undefined || p.error);
            if(p.numbers != undefined){
                if(p.numbers.length <= 0)break;
            }
            if(hasPageValid) {
                urls.push(URI_BASE+pageSelected);
                console.log(URI_BASE+pageSelected);
                pageSelected++;
            }else{
                break;
            }
        }

        let data = await Promise.all(urls.map(url => fetch(url).then((response) => response.json())));

        for(let i = 0; i < data.length; i++){
            if(!data[i].error){
                data[i].numbers = order(data[i].numbers);
                for(let j = 0; j < data[i].numbers.length; j++){
                    numbersPerPage.push(data[i].numbers[j])
                }
            }
        }

        return (numbersPerPage)
    } catch (error) {
        throw (error)
    }
}

function order (numbers) {
    let tam = numbers.length;
    for (let i = 0; i < tam - 1; i++){
        for (let j = 0; j < tam - i - 1; j++){
            if (numbers[j] > numbers[j + 1]) {
                let temp = numbers[j];
                numbers[j] = numbers[j + 1];
                numbers[j + 1] = temp;
            }
        }
    }
    return numbers;
}

async function checkPageIfInvalid(pageSelected) {
    const res = await fetch(URI_BASE + pageSelected);
    let json = await res.json();
    return json;
}

app.listen(process.env.PORT || 3000);