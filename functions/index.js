'use strict';

const {
  dialogflow,
  SignIn,
  BasicCard,
  Button,
  BrowseCarousel,
  BrowseCarouselItem
} = require('actions-on-google');
const functions = require('firebase-functions');

const app_podio = dialogflow({
  debug: true,
  clientId: 'podiovoiceassistant'
});

const app_sf = dialogflow({
  debug: true,
  clientId: 'sfagent-c96e9'
});

var http = require('https');
const axios = require('axios')

const podio_host = 'api.podio.com';
const sf_host = 'cwprod.sharefile.com';

app_podio.intent('Default Welcome Intent', (conv) => {
  conv.ask(new SignIn('To get your account details'));
});

app_sf.intent('Default Welcome Intent', (conv) => {
  conv.ask(new SignIn('To get your account details'));
});

// Create a Dialogflow intent with the `actions_intent_SIGN_IN` event
app_podio.intent('Get Sign In', (conv, params, signin) => {
  signIN(conv, params, signin);
});

app_sf.intent('Get Sign In', (conv, params, signin) => {
  signIN(conv, params, signin);
});

function signIN(conv, params, signin){
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
}

app_sf.intent('Create Folder', (conv) => {
  return createSFFolder(conv.user.access.token).then((output) => {
    conv.add('Folder created')
  }); 
});


function createSFFolder(authToken) {
  var item_id;
  return getSFHome(authToken).then((response) => {
    item_id = response['Id'];

    let path = `/sf/v3/items(${item_id})/Folder?overwrite=true&passthrough=false`;
    var options = {
      hostname: sf_host,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + authToken
      }
    };
    return new Promise((resolve, reject) => {
      console.log('API Request: ' + sf_host + path);

      // Make the HTTP request to get the weather
      http.request(options, (res) => {
        let body = ''; // var to store the response chunks
        res.on('data', (d) => {
          body += d;
        }); // store each response chunk
        res.on('end', () => {
          // After all the data has been received parse the JSON for desired data

          resolve();
        });
        res.on('error', (error) => {
          console.log(`Error calling the API: ${error}`);
          reject();
        });
      });
    });
  })

}

app_sf.intent('DownloadContent', (conv) => {
  return downloadSFContent(conv.user.access.token).then((output) => {
    conv.ask('Here is your download link')
    conv.add(new BasicCard({
      text: 'Click here to download',
      buttons: new Button({
        title: 'Download',
        url: `${output}`,
      })
    }));
  });
    
});

async function downloadFileSFContent(authToken, item_id) {
  let path = `/sf/v3/items(${item_id})/Download?includeallversions=false&includeDeleted=false&redirect=false`;
  var options = {
    hostname: sf_host,
    path: path,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + authToken
    }
  };
  return new Promise((resolve, reject) => {
    console.log('API Request: ' + sf_host + path);

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
        console.log(response)

        let url = response['DownloadUrl'];
      
        let output = url;
        resolve(output);
      });
      res.on('error', (error) => {
        console.log(`Error calling the API: ${error}`);
        reject();
      });
    });
  });
}


function downloadSFContent(authToken) {
  var item_id;
  return getSFHome(authToken).then((response) => {
    item_id = response['Id'];

    let path = `/sf/v3/items(${item_id})/Download?includeallversions=false&includeDeleted=false&redirect=false`;
    var options = {
      hostname: sf_host,
      path: path,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + authToken
      }
    };
    return new Promise((resolve, reject) => {
      console.log('API Request: ' + sf_host + path);

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
          console.log(response)

          let url = response['DownloadUrl'];
        
          let output = url;
          resolve(output);
        });
        res.on('error', (error) => {
          console.log(`Error calling the API: ${error}`);
          reject();
        });
      });
    });
  })
    .catch(() => {
    return new Promise((resolve, reject) => { 
      res.on('error', (error) => {
        console.log(`Error calling the API: ${error}`);
        reject();
      });
    });
  });
}

app_sf.intent('SearchFile', async (conv, params) => {
  return searchSFContent(conv.user.access.token, params.any).then((output) => {
    conv.ask('Top 3 results:');
    var arr = [];

    for (let i = 0; i < output["Results"].length ; i++) {
      arr.push(
        new BrowseCarouselItem({
          title: output["Results"][i]["DisplayName"],
          url: "https://sharefile.com",
          description: `Creator name: ${output["Results"][i]["CreatorName"]} & Item Id:${output["Results"][i]["ItemID"]}`,
        })
      );
    }
    conv.add(new BrowseCarousel({
      items: arr,
    }));
  });
});


function searchSFContent(authToken, query) {
  // Create the path for the HTTP request to get the weather
  let path = encodeURI(`/sf/v3/Items/Search?query=${query}&homefolderonly=false&maxResumts=3`);
  var options = {
    hostname: sf_host,
    path: path,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + authToken
    }
  };

  return new Promise((resolve, reject) => {

    console.log('API Request: ' + sf_host + path);

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
        resolve(response);
      });
      res.on('error', (error) => {
        console.log(`Error calling the API: ${error}`);
        reject();
      });
    });
  });
}

app_sf.intent('GetHomeFolder', (conv) => {
  console.log('testing')
  return getSFHome(conv.user.access.token).then((response) => {
    let folder_name = response['Name'];
    
    let output = `Parent folder name is ${folder_name}`;
    conv.json({
      'fulfillmentText': output
    }); // Return the results of the weather API to Dialogflow
  })
    .catch(() => {
    conv.json({
      'fulfillmentText': `Sorry can't fetch your parent folder`
    });
  });
});

function getSFHome(authToken) {
  let path = '/sf/v3/Items';
  var options = {
    hostname: sf_host,
    path: path,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + authToken
    }
  };
  return new Promise((resolve, reject) => {
    console.log('API Request: ' + sf_host + path);

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
        console.log(response)

        resolve(response);
      });
      res.on('error', (error) => {
        console.log(`Error calling the API: ${error}`);
        reject();
      });
    });
  });
}

app_podio.intent('GetMeetingSchedule', (conv) => {
  return getMeetings(conv.user.access.token).then((output) => {
    conv.json({
      'fulfillmentText': output
    }); // Return the results of the weather API to Dialogflow
  })
    .catch(() => {
    conv.json({
      'fulfillmentText': `Sorry can't fetch your schedule`
    });
  });
});

function getMeetings(authToken) {
  // Create the path for the HTTP request to get the weather
  let path = '/calendar/summary';
  var options = {
    hostname: podio_host,
    path: path,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'OAuth2 ' + authToken
    }
  };
  console.log('Auth Token: ' + authToken);
  return new Promise((resolve, reject) => {

    console.log('API Request: ' + podio_host + path);

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
        let events = '';
        let event_arr = response['upcoming']['events'];
        for (var i = 0; i < event_arr.length; i++)
          events += event_arr[i]['app']['item_name'] +"@" + event_arr[i]['start'] + "\n";

        let output = `You have total ${response['upcoming']['total']} events and top 5 events are: \n${events}`;
        resolve(output);
      });
      res.on('error', (error) => {
        console.log(`Error calling the API: ${error}`);
        reject();
      });
    });
  });
}



exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app_podio);
exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app_sf);
