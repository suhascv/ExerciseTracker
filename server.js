const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
require('dotenv').config();


//mongo connection
mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGO_URI, 
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
  //console.log('adding');
  //console.log(req.body);
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

  ExerciseTracker.findOne({
    _id:mongoose.Types.ObjectId(req.body.userId)
  },(err,resp)=>{
    if(err){
      //console.log('jaksdnjabsdkad')
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
            //console.log('here')
            let response = {
              _id:resp1._id,
              username:resp1.username,
              date:req.body.date?new Date(req.body.date).toDateString():new Date().toDateString(),
              duration:parseInt(req.body.duration),
              description:req.body.description
              
            }
            //console.log(response);
            res.json(response);
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
      //console.log(err);
    }
    else{
      //console.log(users);
      res.json(users)
    }
  })
});

app.get('/api/exercise/log',(req,res)=>{
  let data=req.query.userId.split('?')
  var limit=100;
 // console.log(req.query);
 
 
  let query=[];
  if(req.query.userId){
    query.push({'$match':{_id:mongoose.Types.ObjectId(req.query.userId)}})
    query.push({'$unwind': {'path': '$log'}})
      if(req.query.from){
        
        query.push({
      '$match': {
      'log.date': {
        '$gte': new Date(req.query.from), 
        '$lte': new Date(req.query.to)
            }
          }
        })
        }
    query.push({ '$group': {
        '_id': '$_id', 
        'log': {'$push': '$log'}}
        })
    query.push({
      '$project': {
        '_id': 1, 
        'log': 1, 
        'cnt': {
          '$size': '$log'
        }
      }
    })
      }
    
      
      if(req.query.limit){
        limit=req.query.limit;
      }

      //console.log(query)
      ExerciseTracker.aggregate(
        query,
      (err,logs)=>{
        if(err){
          res.send('error')
        }
        else{
        if(logs){
        //console.log(logs[0])
        res.json({
          _id:logs[0]._id,
          log:logs[0].log.slice(0,limit),
          count:logs[0].cnt
        })}
        
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
  )




const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

