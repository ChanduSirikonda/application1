const express = require('express');
const {config} = require('dotenv');
const mongoose = require('mongoose');
const {User,Task} = require('./schema');
const { urlencoded } = require('body-parser');
const bodyParser = require('body-parser');
const router = express.Router();
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const nodeCache = require('node-cache');
const jwt = require('jsonwebtoken')
const validator = require('validator');

config();
const app = express();
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.set('views','./pages');
app.set('view engine','ejs');
router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());
app.use(cookieParser());
router.use(session({
    secret:'Anvitha, this is a secret',
    resave:false,
    saveUninitialized:false
}))
const myCache = new nodeCache();

mongoose.connect(process.env.ATLAS_URI
    //,{
    //useNewUrlParser : true,
    //useUnifiedTopology : true
//}
);

function authenticate(req,res,next){
    if(req.session.user){
        return next();
    }
    else{
        res.redirect('/login');
    }
}

const db = mongoose.connection;
db.on("error",err=>{console.log(err)});
db.once('open',()=>{ console.log("connected to database");});

router.post('/register/success', async (req,res)=>{
    console.log('req.body is: ',req.body);
    const unamev = /^[a-zA-Z][a-zA-Z0-9]*$/;
    const passv = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+[\]{};':"\\|,.<>/?]).{8,}$/;
    const dob = req.body.dob;
    const unameexisting = await User.findOne({username:req.body.username});
    if(unameexisting){
        return res.json({message:'Username already exists.Please choose another username'});
    }
    if(!validator.matches(req.body.username,unamev)){
        return res.json({message:'username should start with alphabet and should not contain any special characters.'})
    }
    if(!validator.matches(req.body.password,passv)){
        return res.json({message:'password must have special character,lowercase,uppercase and lenght should be atleast 8 characters long.'})
    }
    if(!validator.isEmail(req.body.email)){
        return res.json({message:'gmail format is not right'});
    }
    if(!validator.isBefore(dob,new Date().toISOString().split('T')[0])){
        return res.json({message: 'dob cannot be today or in future.'});
    }

    try{
        const hashedpassword =await bcrypt.hash(req.body.password,10)
        const userA = new User({
            firstname: req.body.first_name,
            lastname: req.body.last_name,
            username: req.body.username,
            password: hashedpassword,
            email: req.body.email,
            dateofbirth: req.body.dob
        });

        await userA.save();
        res.send('User registered successfully');
    }
    catch(error){
        console.log("error",error);
    }
})

router.post('/login/success',async (req,res)=>{
    const {username,password} = req.body;
    console.log(username);
    const uName = await User.findOne({username});
    if(!uName){
        res.redirect('/login');
    }
    if(uName){
        const uPassword = await bcrypt.compare(password,uName.password);
        if(uPassword){
            const token = jwt.sign({username: uName.username,userId : uName._id}, 'shh secret',{expiresIn: '1h'});
            res.cookie("user",username,{httpOnly:true} );
            //res.send(`hey ${username}, you've logged in successfully here is the token ${token} `);
            req.session.username = username;
            req.session.userId = uName._id.toString();
            req.session.page_views = req.session.page_views ? req.session.page_views+1:1 ;
            if(req.session.page_views==1){
                console.log(`you visited this page for once`);
            }
            else{
                console.log(`you visited this page for ${req.session.page_views} times`);
            }
            
            //res.send(`Hey ${username}, you've logged in successfully`);
            if(!myCache.has(username)){
                myCache.set(username,uName,3600);
            }
            else{
                cachedData = myCache.get(username);
                console.log("retrieve from cache");
                console.log(`email address of the user is`,cachedData.email)
            }
            //res.redirect('/dashboard');
            res.redirect('/dashboard');
            //res.send('successfully logged in')
        }
        else{
            res.redirect('/login');
        }

    }
});

router.post('/tasks',async (req,res)=>{
   const taskNames = req.body.taskNames;
   console.log('chanduuuuuuuuuuuu',req.body);
   const createdTasks =[];
   for(const taskName of taskNames){
    const newTask = new Task({
        Title:taskName,
        Completed:false,
        userId: req.session.userId
       });
   
   
   const savedTask = await newTask.save();
   //createdTasks.push(savedTask);
   
    }
    res.redirect('/tasks');
});

router.post('/complete/:id', async (req, res) => {
    try {
        const taskId = req.params.id;
        //console.log(taskId);
        console.log('Task ID:', taskId);
        
        // Check if the task exists
        const task = await Task.findById(taskId);
        
        if (!task) {
            console.log('Task not found');
            return res.status(404).send('Task not found');
        }

        // Update the task
        await Task.findByIdAndUpdate(taskId, { Completed: true });
        res.redirect('/tasks');

        console.log('Task completed successfully');
        //res.send('Task completed successfully');
    } catch (error) {
        console.error('Error completing task:', error);
        res.status(500).send('Error completing task');
    }
});
router.post('/delete/:id',async (req,res)=>{
    const taskId = req.params.id;
    await Task.findByIdAndDelete(taskId);
        res.redirect('/tasks');

});


router.get('/dashboard',(req,res)=>{
    if(req.session.username){
        res.render('dashboard',{username:req.session.username});
        
    }
    else{
        res.redirect('/login');
    }
});

router.get('/tasks',async (req,res)=>{
    if(req.session.username){
        const tasks = await Task.find({ userId: req.session.userId });
        console.log(tasks);
        res.render('toDo',{tasks: tasks});
    }
    else{
        res.redirect('/login');
    }
});

router.get('/logout',(req,res)=>{
    req.session.destroy(err=>{
        if(err){
            res.send('error logging out');
        }
        else{
            res.send("you've logged out");
            console.log("successfully loggedout");
        }
    })
})

module.exports = router;
