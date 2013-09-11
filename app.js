var express = require('express');
var mongo = require('mongoskin');
var fs = require('fs');
var jade = require('jade');

process.env.TZ = 'IST';
var ip = process.env.IP;
var port = process.env.PORT;
var app_path = __dirname;
var app_uri = 'http://reaper-nr.ap01.aws.af.cm/';

var db_reaper = mongo.db('mongodb://reaper-ng:mZhRgLAa4b@ds037488.mongolab.com:37488/reaper-ng');
var coll_reaper_data = db_reaper.collection('reaper-ng-data');

var latest_log_date = new Date(01,01,01);

function reaper_status(req, res){
  var num_of_logs = 0;

  coll_reaper_data.count(function (err, num_of_docs) {
    num_of_logs = num_of_docs;
    coll_reaper_data.find( {}, {'date': true, 'D.T': true, 'D.S': true, 'D.N': true} ).toArray(function (err, data) {
      //var i_data = data.length - 1;
      //var i_data_D = data[i_data].D.length - 1;
      for(var i=0;i<=data.length-1;i++){
          if(data[i].date > latest_log_date) latest_log_date = data[i].date;
      }
      var latest_log_date_string = latest_log_date.toLocaleDateString();
      //console.log('Latest entry: ');
      //console.log( data[i_data].D[i_data_D].N.toString() + ' ' + data[i_data].D[i_data_D].S.toString() + ' ' + data[i_data].D[i_data_D].T.toISOString()  );
      res.render('reaper-nr', {num_of_logs: num_of_logs, latest_log_date: latest_log_date_string});  
    });
  });
}

function log_file_download(req, res){
  var log_data = '';
  var file = app_path + '/public/logs/log.txt';
  
  fs.writeFileSync(file, '[ REAPER LOG FILE Dated: ' + latest_log_date.toLocaleDateString() + ' ]\r\n\r\n', 'utf-8');

  coll_reaper_data.findOne( {'date': latest_log_date}, {'D.T': true, 'D.S': true, 'D.N': true}, function (err, data) {
      var i_data = data.D.length-1;
      for (var i=0; i<=i_data; i++){
          //console.log( data.D.T.toISOString() + ' ' + data.D.S.toString() + ' ' + data.D.N.toString() );  
          log_data = data.D[i].T.toISOString().substr(11,12) + ' ' + data.D[i].S.toString() + ' ' + data.D[i].N.toString() + '\r\n';
          fs.appendFileSync(file, log_data, 'utf-8');    
      }
      res.download(file);
  });
}


var app = express();

app.use(express.logger());
app.use(express.bodyParser());
app.use(express.static(app_path + '/public'));

app.set('views', app_path + '/views');
app.set('view engine', 'jade');

app.all('/', function(req, res) {
  console.log('<- Reaper accessed ->');
  reaper_status(req, res);
});

app.post('/logs', function(req, res) {
  log_file_download(req, res);
  console.log('<- Log file downloaded ->');
});

app.listen(port, ip);
console.log('Server running on ' + app_uri);