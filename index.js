const { Client, Intents} = require('discord.js');
const express = require('express');
const bodyParser = require('body-parser');
const { MongoClient } = require('mongodb');

const client = new Client({ partials: ["CHANNEL"], intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.DIRECT_MESSAGES, ] });;
const uri = process.env.URI;
const mongoClient = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

const readFromDatabase = async () => {
    try{
        await mongoClient.connect();
        const collection = mongoClient.db('emails').collection('emails');
        const returnedCollection = await collection.findOne({
            document: 'emails',
        });
        if(returnedCollection === null)
            return [];
        return returnedCollection.emails;
    }
    catch(err){
        console.log(err)
    }
    finally{
        mongoClient.close();
    }
}

const writeToDataBase = async (data) => {
    try{
        await mongoClient.connect();
        const collection = mongoClient.db('emails').collection('emails');
        await collection.replaceOne({
            document: 'emails',
        }, {
            document: 'emails',
            emails: data,
        }, {
            upsert: true,
        });
    }
    catch(err){
        console.log(err);
    } 
    finally{
        mongoClient.close();
    }
};

client.on('ready', function () {
    console.log('Bot is ready');
});

client.on('messageCreate', async (message) => {
    if(message.author.bot) return;
    const sentEmail = message.content;
    const emails = await readFromDatabase();
    if(!emails)
        return message.channel.send('An error occured, please try again later');
    if(emails.includes(sentEmail)){
        const guild = client.guilds.cache.get('902745903213973517')
        const role = guild.roles.cache.find(role => role.name === 'PREMIUM MEMBER');
        if(!role){
            console.log('Role Not Found');
        }
        const memberId = message.author.id;
        await guild.members.fetch();
        const member = guild.members.cache.get(memberId);
        if(member.roles.cache.find(role => role.name === 'PREMIUM MEMBER')){
            message.channel.send('Unfortunately you have already claimed your membership');
        }
        else{
            try{
                await member.roles.add(role);
                message.channel.send('Thank you for providing your email. Enjoy your premium access to Maverick Sports Bets!');
            }
            catch(e){
                console.log('Problem with administations');
                message.channel.send('Try again later');
            }
        }
    }
    else{
        message.channel.send(`Couldn't find your email`);
    }
});

const app = express();
app.use(bodyParser.json());
const port = process.env.PORT || 8080;

app.post('/', async(req, res) => {
    console.log('Request Received');
    const customerEmail = req.body?.customer?.email;
    const lineItems = req.body?.line_items;
    if(!customerEmail || !lineItems)
        return res.sendStatus(204);
    for(const item of lineItems){
        if(item.name === 'Monthly Premium Membership'){
            const emails = await readFromDatabase();
            if(!emails)
                break;
            if(!emails.includes(customerEmail)){
                emails.push(customerEmail);
                writeToDataBase(emails);
            }
            break;
        }
    }
    res.sendStatus(204);
});

client.login(process.env.TOKEN);
app.listen(port, function () {
    console.log(`Listening on port ${port}`);
});
