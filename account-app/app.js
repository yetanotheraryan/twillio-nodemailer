const express = require('express');
const amqp = require("amqplib");
const app = express();
const Account = require('./Account');
const port = process.env.PORT || 4001;

var connection, channel;
var exchange = 'logs';


let a1 = new Account(1, 1000, 6);

a1.on('depositSuccess', (balance) => {
    console.log("Deposit Success Called");

    const data = {
        from: "Accounts",
        value: `Amount Deposited - New Account Balance is: INR ${balance}`
    };
    console.log(data)
    sendData(data);
    console.log("A message is published to the queue: ", data);
});


a1.on('withdrawSuccess', (balance)=>{
    var data = {
        from: "Accounts",
        value: `Amount Withdrawn - New Account Balance is: INR ${balance}`
        }
    sendData(data);
    console.log("A message is published to the queue");
    //res.send("Message Published...");
});

a1.on('withdrawFailure', (balance)=>{
    var data = {
        from: "Bank",
        value: `withdraw failure, account balance is low, current balance is: INR ${balance}`
    }
    sendData(data);
    console.log("message is published to the queue")
})

const connectQueue = async () => {
    connection = await amqp.connect("amqp://localhost:5672");
    console.log(`Publisher Application connected to RabbitMQ`);
    channel = await connection.createChannel();
    await channel.assertExchange(exchange, 'fanout', {
        durable: false
    });
}

const sendData = async (data) => {
    await channel.publish(exchange, '', Buffer.from(JSON.stringify(data)));
}


app.post('/deposit', (req, res) => {
    a1.deposit(1000);
    res.send("Amount Deposited...")
})

app.post('/withdraw', (req, res) => {
    a1.withdraw(1000);
    res.send("Amount withdrawn...")
})


app.listen(port, () => {
    console.log(`Publisher Application started on port ${port}`);
    connectQueue();
});

