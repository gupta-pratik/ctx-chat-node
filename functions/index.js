'use strict';

const PODIO_ENDPOINT = '';

const {
  dialogflow,
  SignIn
} = require('actions-on-google');
const functions = require('firebase-functions');

const app = dialogflow({
  debug: true,
  clientId: 'podiovoiceassistant'
});

var http = require('https');

const host = 'api.podio.com';

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

app.intent('GetMeetingSchedule', (conv) => {
  console.log('Get Meeting Schdeule Intent Called');
  //console.log('Conv'+JSON.parse(conv));
  //console.log('param'+params);
  //console.log('res'+JSON.parse(res));
  return callAppointments(conv.user.access.token).then((output) => {
    console.log(conv);
    conv.json({
      'fulfillmentText': output
    }); // Return the results of the weather API to Dialogflow
  })
  // .catch(() => {
  //   conv.json({
  //     'fulfillmentText': `I don't know the weather but I hope it's good!`
  //   });
  //});
})

function getAppointments(authToken) {
  var options = {
    hostname: host,
    path: '/calendar/summary',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'OAuth2 ' + authToken
    }
  };
  console.log('Status: ' + res.statusCode);
  var req = http.request(options, function (res) {
    console.log('Status: ' + res.statusCode);
    console.log('Headers: ' + JSON.stringify(res.headers));
    res.setEncoding('utf8');
    res.on('data', function (body) {
      console.log('Body: ' + body);
    });
  });
  req.on('error', function (e) {
    console.log('problem with request: ' + e.message);
  });
}


function callAppointments(authToken) {
  // Create the path for the HTTP request to get the weather
  let path = '/calendar/summary';
  var options = {
    hostname: host,
    path: path,
   // port: 8080,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'OAuth2 ' + authToken
    }
  };
  console.log('Auth Token: ' + authToken);
  return new Promise((resolve, reject) => {

    console.log('API Request: ' + host + path);

    // Make the HTTP request to get the weather
    http.get(options, (res) => {
      let body = ''; // var to store the response chunks
      res.on('data', (d) => {
        body += d;
      }); // store each response chunk
      res.on('end', () => {
        // After all the data has been received parse the JSON for desired data
        let response = JSON.parse(body);
        // Resolve the promise with the output text
        console.log(response);
        resolve(response);
      });
      res.on('error', (error) => {
        console.log(`Error calling the weather API: ${error}`)
        reject();
      });
    });
  });
}


exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app);