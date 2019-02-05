const process = require('process');
const request = require('http').get;

let reqDataArr = [];

const REQ_URL = "http://test-1347893996.us-west-1.elb.amazonaws.com/";
const RPS     = 2;

class RequestData {
  constructor() {
    this._startTime = process.hrtime.bigint();
  }
  adjustStat(dataElement) {
    this[dataElement] = Number(process.hrtime.bigint() - this._startTime);
  }
}


process.on('SIGINT', () => {
  console.log("Caught a SIGINT");
  console.log("Collecting stats!");
  let totalReqs = reqDataArr.length;
  let totalFailed = 0;
  let avgTTFB = 0;
  let avgTTLB = 0;
  let avgTotalTTFB = 0;
  let avgTotalTTLB = 0;
  for(let rd of reqDataArr) {
    if(rd.failed) {
       totalFailed++;
    } else {
      avgTotalTTFB += rd.TTFB;
      avgTotalTTLB += rd.TTLB;
    }
  }
  let totalSuccess = totalReqs - totalFailed;
  if(totalSuccess > 0) {
    avgTTFB = avgTotalTTFB / totalSuccess * Math.pow(10, -6);
    avgTTLB = avgTotalTTLB / totalSuccess * Math.pow(10, -6);
  }
  console.log(`Total Requests: ${totalReqs}, Total Failed: ${totalFailed}, TTFB: ${avgTTFB}, TTLB: ${avgTTLB}`);
  process.exit();
});

function doRequest() {
  let first = true;
  let rd = new RequestData();
  let req = request(REQ_URL, (res) => {
    res.on('data', () => { if(first) {rd.adjustStat('TTFB'); first = false;}});
    res.on('end', () => { rd.adjustStat('TTLB')});
    rd.failed = res.statusCode != 200;
    console.log("Did Request");
  });
  req.on('error', () => {
    console.log("Request died :(");
    rd.failed = true;
  });
  reqDataArr.push(rd);
}

setInterval(doRequest, 1000/RPS);
