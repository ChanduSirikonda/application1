const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    firstname:{
        type:String,
        required:true
    },
    lastname:{
        type:String,
        required:true
    },
    username:{
        type:String, 
        required:true
    },
    password:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique: true
    }
    ,
    dateofbirth:{
        type:Date,
        required:true,
        default:new Date()
    }

});
const taskSchema = new Schema({
    Title:{
        type: String,
        required: true
    },
    Completed:{
        type:Boolean,
        default:false
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    }
});
const User = mongoose.model('User', userSchema);
const Task = mongoose.model('Task',taskSchema);

module.exports={User,Task};
