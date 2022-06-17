import express from "express";
import bodyParser from "body-parser";
import { MongoClient } from "mongodb";
import path from 'path';

const app = express();

app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, '/build')));

const withDB=(operations, res)=>{
    MongoClient.connect('mongodb://localhost:27017',async (err, client) => {
        try{
            if (err) throw err;
            const db = client.db('brokedb');
            await operations(db);
            client.close();
        } catch(error){
            res.status(500).json({message: "Error connecting to db", error});
        }
    });
}

app.get("/api/projects/:name", (req,res)=>{
    const projectName = req.params.name;
    withDB(async (db)=>{
        const projectInfo = await db.collection('projects').findOne({name: projectName});
        res.status(200).json(projectInfo);
    }, res);
});

app.post("/api/projects/:name/upvote", (req,res)=>{
    const projectName = req.params.name;
    withDB(async (db)=>{
        const projectInfo = await db.collection('projects').findOne({name: projectName});
        await db.collection('projects').updateOne({name: projectName}, {
            '$set':{
                upvotes: projectInfo.upvotes+1
            }
        });
        const updatedProjectInfo = await db.collection('projects').findOne({name: projectName});
        res.status(200).json(updatedProjectInfo);
    }, res);
});

app.post("/api/projects/:name/add-comment", (req, res)=>{
    const {username, comment}=req.body;
    const projectName = req.params.name;
    withDB(async (db)=>{
        const projectInfo = await db.collection('projects').findOne({name: projectName});
        await db.collection('projects').updateOne({name:projectName},{
            '$set':{
                comments: projectInfo.comments.concat({username, comment})
            }
        });
        const updatedProjectInfo = await db.collection('projects').findOne({name: projectName});
        res.status(200).json(updatedProjectInfo);
    }, res);
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname+'/build/index.html'));
});

// to start the server
app.listen(8000, ()=>console.log('Listening on port 8000'));