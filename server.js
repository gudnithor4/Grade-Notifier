var express    = require('express');
var fs         = require('fs'); //access to computers file system
var request    = require('request');
var cheerio    = require('cheerio');
var nodemailer = require('nodemailer');
var username = 'yourUser f.x. gthb7'; //university intraweb login
var password = 'yourpass'; //university intraweb password
var app     = express();
var changed = false;

var name = 'YourName' //just you name
var emailaddress = 'xxx@hi.is' //university email address (Sender)
var gmail = 'xxx@gmail.com' //receiving email address (Receiver) does not need to be a gmail address

var oldJson; //old json file to compare, initialized after first run
var counter = 0;

// create reusable transporter object using SMTP transport
var transporter = nodemailer.createTransport({
    host : "smtp.hi.is",
    auth: {
        user: emailaddress,
        pass: password
    }
});

app.get('/scrape', function(req, res){
	//All the web scraping magic will happen here
    url = 'https://ugla.hi.is/vk/namskeidin_min.php?sid=40'

    // The structure of our request call
    // The first parameter is our URL with headers and body for authentication
    // The callback function takes 3 parameters, an error, response status code and the html
    request.post({
    	headers: {'content-type' : 'application/x-www-form-urlencoded'},
    	url: url,
    	body: 'username=' + username + '&password=' + password + '&submit=Login'
    	}, function(error, response, html){

        // First we'll check to make sure no errors occurred when making the request
        if(!error){
            // Next, we'll utilize the cheerio library on the returned html which will essentially give us jQuery functionality
            var $ = cheerio.load(html);

            var jsonArray = [];
            var timejson = {lastupdate : ""};
            timejson.lastupdate = new Date();
			jsonArray.push(timejson);

            $('.standardTable .olokid').each(function(){
            	// Let's store the data we filter into a variable so we can easily see what's going on.
                var data = $(this);

                data.each(function (i, el) {
			        var $tds = $(this).find('td'),
			            course = $tds.eq(1).text(),
			            units = $tds.eq(2).text(),
			            grade = $tds.eq(3).text();

			        if((typeof course != 'undefined') && (typeof units != 'undefined') && (typeof grade != 'undefined')){
			        	var tmpjson = new Object();
			        	tmpjson.course = course;
			        	tmpjson.units = units;
			        	tmpjson.grade = grade;
			        	jsonArray.push(tmpjson);
			        }
			    });
            })

            counter += 1;

            //Check for changes
            //Ignore the first round
            if (counter > 1) {
            	//Get the json created last time the script was run
            	oldJson = fs.readFileSync('output.json').toString();
            	oldJson = JSON.parse(oldJson);

            	for (var i = 1; i <= jsonArray.length - 1; i++) {

	            	if (JSON.stringify(oldJson[i]) !== JSON.stringify(jsonArray[i])) {
						console.log("There have been changes");
						changed = true;

						//set email message
						var mailOptions = {
						    from: "'" + name + ' <' + emailaddress + '>', // sender address
						    to: gmail, // list of receivers
						    subject: 'New grade has arrived', // Subject line
						    text: JSON.stringify(jsonArray[i]), // plaintext body
						    html: '<b>' + JSON.stringify(jsonArray[i]) + '</b>' // html body
						};
					}
					else{
						console.log('No changes');
					}
				}
            }
        }
        else{
        	console.log("Error occurred: " + error);
        }

        fs.writeFile('output.json', JSON.stringify(jsonArray, null, 4), function(err){
            console.log('File successfully written! - Check your project directory for the output.json file');
        })

        //Notify via email if grades have been updated
        if (changed) {
			transporter.sendMail(mailOptions, function(error, info){
			    if(error){
			        console.log(error);
			    }else{
			        console.log('Message sent: ' + info.response);
			    }
			});
        }
        else{
        	console.log('No email needed');
        }
        changed = false;

        // Finally, we'll just send out a message to the browser reminding you that this app does not have a UI.
        res.send('Check your console!')
    })
})

app.listen('8081')
console.log('Magic happens on port 8081');
exports = module.exports = app;