const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose');
const bodyParser = require('body-parser');


//mongo connection
mongoose.Promise = global.Promise;
const mongoURI="";
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
    type:Date,
    required:false
  }
}) 
const ExerciseTrackerSchema = new Schema(
  {
    username:{
      type:String,
      unique:true,
      required:true
    },
    log:[LogSchema],
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
      //console.log(user);
      res.json(
          {username:req.body.username,
          _id:user._id._id
          });
    }
  })
});

app.post('/api/exercise/add',parser,(req,res)=>{
  console.log(req.body);
  let date1 = req.body.date?req.body.date:new Date();
  let newLog = {
    description:req.body.description,
    duration:req.body.duration,
    date:date1
  }
  //console.log(req.body.userId);

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
        {"$push":{log:newLog}},
        (err,resp1)=>{
          if(err){
            res.send("invalid exercise/log, please provide data in required format");
          }
          else{
            res.json({
              _id:resp1._id,
              username:resp1.username,
              description:req.body.description,
              duration:req.body.duration,
              date:req.body.date?req.body.date:new Date().toDateString()
            });
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


app.get('/api/exercise/users',(req,res)=>{
  ExerciseTracker.find({},{_id:1,username:1},(err,users)=>{
    if(err){
      console.log(err);
    }
    else{
      //console.log(users);
      res.json(users)
    }
  })
});

app.get('/api/exercise/log',(req,res)=>{
  
  if(req.query.userId){
      let query={_id:req.query.userId}
      let limit=100;
      if(req.query.from){
        query['date']={'$gte':req.query.from}
      }
      if(req.query.to){
        query['date']['$lte']=req.query.to
      }
      console.log(query)
      if(req.query.limit){
        limit=req.query.limit
      }

      ExerciseTracker.findOne(
        query,
        {_id:1,username:1,log:1},
      (err,logs)=>{
        if(err){
          res.send(err)
        }
        else{
        if(logs){
        console.log(logs)
        res.json({
          _id:logs._id,
          username:logs.username,
          log:logs.log.slice(limit),
          count:logs.log.length
        });}
        
        else{
          res.json({
            _id:req.query.userId,
            log:[],
          count:0
          })
        }
        }
      })
    }
  
})




const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

