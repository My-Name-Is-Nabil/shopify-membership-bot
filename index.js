const fs = require('fs');
const { Client, Intents} = require('discord.js');
const express = require('express');
const bodyParser = require('body-parser');
const client = new Client({ partials: ["CHANNEL"], intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.DIRECT_MESSAGES, ] });;

client.on('ready', function () {
    console.log('Bot is ready');
});

client.on('messageCreate', async (message) => {
    if(message.author.bot) return;
    const sentEmail = message.content;
    let data = await fs.promises.readFile('emails.json');
    data = JSON.parse(data);
    if(!data.emails){
        message.channel.send(`Couldn't find your email`);
        return;
    }
    if(data.emails.includes(sentEmail)){
        const guild = client.guilds.cache.get('902745903213973517')
        const role = guild.roles.cache.find(role => role.name === 'PREMIUM MEMBER');
        if(!role){
            console.log('Role Not Found');
        }
        const memberId = message.author.id;
        await guild.members.fetch();
        const member = guild.members.cache.get(memberId);
        console.log(guild.members.cache);
        if(member.roles.cache.find(role => role.name === 'PREMIUM MEMBER')){
            message.channel.send('You already have the role');
        }
        else{
            try{
                await member.roles.add(role);
                message.channel.send('Role has been added');
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

try{
    fs.accessSync('emails.json', fs.constants.R_OK | fs.constants.W_OK,); 
}
catch(e){
    fs.writeFileSync('emails.json', '{}',);
}

const app = express();
app.use(bodyParser.json());
const port = 8080;

app.post('/', async(req, res) => {
    console.log('Request Received');
    const customerEmail = req.body.customer.email;
    const lineItems = req.body.line_items;
    for(const item of lineItems){
        if(item.name === 'Monthly Premium Membership'){
            let data = await fs.promises.readFile('emails.json');
            data = JSON.parse(data);
            if(Array.isArray(data.emails)){
                if(!data.emails.includes(customerEmail))
                    data.emails.push(customerEmail);
            }
            else{
                data.emails = [customerEmail];
            }
            await fs.promises.writeFile('emails.json', JSON.stringify(data));
            break;
        }
    }
});

client.login("");
app.listen(port, function () {
    console.log(`Listening on port ${port}`);
});
