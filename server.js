const express = require('express');
const {config} = require('dotenv');
const path = require('path');
const registerRoute1= require('./auth');

config();

const app = express();
app.use(express.json());
app.set('view engine','ejs');
app.set('views',path.join(__dirname,'pages'));

app.use(express.static(path.join(__dirname, 'pages')));
app.get('/login',(req,res)=>{
    //res.sendFile(path.join(__dirname, 'pages', 'index.html'));
    res.render('index');
});
app.get('/register',(req,res)=>{
    res.render('register');
});


app.use(registerRoute1);


const port = 4000;
app.listen(port||4000, ()=>{
    console.log(`server started on ${port}`);
});