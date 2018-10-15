
'use strict';

const {dialogflow, SignIn} = require('actions-on-google');
const functions = require('firebase-functions');

const app = dialogflow({debug: true, clientId: 'podiovoiceassistant'});

app.intent('Default Welcome Intent', (conv) => {
    console.log('Prateek welcomeIntent');
    conv.ask(new SignIn('To get your account details'));
});

// Create a Dialogflow intent with the `actions_intent_SIGN_IN` event
app.intent('Get Sign In', (conv, params, signin) => {
    console.log('Prateek signIn');
    if (signin.status === 'OK') {
        console.log('userId', conv.user.raw.userId);
        console.log('P1');
        console.log(conv.user);
        console.log('P2');
        conv.ask(`I got your account details. your userId is ${conv.user.raw.userId}. What do you want to do next?`);
    } else {
        console.log('not signed in');
        conv.ask(`I won't be able to save your data, but what do you want to do next?`);
    }
});

exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app);