const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose');
const bodyParser = require('body-parser');


//mongo connection
mongoose.Promise = global.Promise;
cosnt mongoURI=""
mongoose.connect(mongoURI, 
{ useNewUrlParser: true, useUnifiedTopology: true });
mongoose.set('useFindAndModify', false);

require('dotenv').config()


//schema
const Schema = mongoose.Schema;
const LogSchema = new Schema({
  description:{
    type:String,
  },
  duration:{
    type:Number
  },
  date:{
    type:Date
  }
}) 
const ExerciseTrackerSchema = new Schema(
  {
    username:{
      type:String,
      unique:true,
      required:true
    },
    logs:[LogSchema],
  }
);

//model
const ExerciseTracker = mongoose.model('exercise_tracker',ExerciseTrackerSchema);
app.use(cors())


//bodyparser setup
const parser= bodyParser.urlencoded({ extended: false })



app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


app.post('/api/exercise/new-user',parser,(req,res)=>{
  let newUser = new ExerciseTracker(
    {username:req.body.username,
    logs:[]
    }
  )
  newUser.save((err,user)=>{
    if(err){
      res.send("invalid username or username already taken!");
    }
    else{
      console.log(user);
      res.json(
          {username:req.body.username,
          _id:user._id._id
          });
    }
  })
});

app.post('/api/exercise/add',parser,(req,res)=>{
  let newLog = {
    description:req.body.description,
    duration:req.body.duration,
    date:req.body.date
  }
  console.log(req.body.userId);

  if(req.body.userId.length!==24){

    res.send('invalid userid');
  }
  else{
  var found;
  ExerciseTracker.findOne({
    _id:mongoose.Types.ObjectId(req.body.userId)
  },(err,resp)=>{
    if(err){
      res.send('invalid userid/userid not found');
    }
    else{
      //console.log(resp);
      if(resp){
      ExerciseTracker.findOneAndUpdate(
        {_id:mongoose.Types.ObjectId(req.body.userId)},
        {"$push":{logs:newLog}},
        (err,resp1)=>{
          if(err){
            res.send("invalid exercise/log, please provide data in required format");
          }
          else{
            res.json(req.body);
          }
        }
        ) 
        }
      else{
      res.send('invalid userid/userid not found');
      }
    }
  }
  )
  
    
  }

});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
