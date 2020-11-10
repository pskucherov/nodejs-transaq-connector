
var ffi = require('ffi');
var ref = require('ref');
var json2xml = require('json2xml');
var xml2json = require('xml2json');
var fs = require('fs');
var write = require('write-file-utf8');
const mysql = require('mysql');

const client = '';

var allCBCommands = {};
// var txmlconnector = ffi.Library('txmlconnector64.dll', {

var txmlconnector = ffi.Library('txcn64.dll', {
    // tech
    'Initialize': [ ref.types.CString, [ ref.types.CString, ref.types.int32 ] ],
    'UnInitialize': [ ref.types.CString, [] ],
    'FreeMemory': [ ref.types.bool, [ref.types.CString] ],

    // commands'
    'SendCommand': [ref.types.CString, [ref.types.CString]],
    'SetCallback': [ref.types.bool, ['pointer']]
});

const connection = mysql.createConnection({
   host: '',
   user: '',
   password: '',
   database: ''   
});

console.log('connection', connection);
connection.connect((err) => {
    console.log('mysql connection');
    if (err) console.log(err);
});


let i = 0;
function asyncFunc(cb) {
    return function(msg) { process.nextTick(cb.bind(this, msg)); }
}

const structs = [];

let cb = ffi.Callback(ref.types.bool, [ref.refType(ref.types.CString)], asyncFunc(function(msg) {
    try {
        i++;
        // console.log('1', msg.deref());
        // console.log('2', msg.toString());
        
        // var buffer = new Buffer(100500); // allocate 32 bytes for the output data, an imaginary MD5 hex string.
        const actualString = ref.readCString(msg, 0);
        if (actualString) {
		// fs.writeFileSync('t/' + 0 + '_cb.txt', actualString, { flag: 'a' });
		// console.log(actualString);
                const sStr = actualString.substr(0, 5);
		const json = xml2json.toJson(actualString);
                const sJson = JSON.parse(json);


// console.log(sStr);



		//if (sJson['securities']) {
	        if (!sJson['sec_info_upd']) {	
         	console.log(Object.keys(sJson));
		//} else if (1 || !structs.includes(sStr)) {
                structs.push(sStr);
		connection.query("INSERT INTO `tconnectcallbacks` (`answer`) VALUES (" + (connection.escape(json)) + ")", (err, result) => {
			// console.log('insert into tconnectcallbacks', err, result, sStr);
		});
		}
        }

        if (actualString && actualString.indexOf('server_status') !== -1) {
            // console.log(actualString);
            // const x = JSON.parse(xml2json.toJson(actualString));
            // allCBCommands[Object.keys(x)[0]] = 1;
            // console.log(allCBCommands);
        }

        const m = msg;
        process.nextTick(function() { txmlconnector.FreeMemory(msg); });
    } catch(e) {
        console.log(e);
    }
    return;
   
   
    ++i;
    // console.log(i);

    // msg && msg.toString && msg.toString() && fs.writeFileSync('t/' + i + '_cb.txt', msg.toString());
    // return true;
    //buf = new Buffer(255);
    //name = ref.readCString(buf, 0);
    //console.log(name);
    //return true;
    //console.log('free cb', msg.toString().length, txmlconnector.FreeMemory(msg));
    if (msg) {
        //console.log(msg);
        //const buf = Buffer.from(msg.buffer);
        //const t = buf.toString();

        if (1) {
            //console.log(t)
            //console.log(msg);
            //console.log(msg.toString());
        }
        //if (msg) console.log(typeof msg);
        let saveMsg = msg;
        process.nextTick(function() { txmlconnector.FreeMemory(saveMsg); });
    }
    //console.log(typeof msg);
    //return true;
}));


// function cb(abc) { console.log(abc); return true; }

var init = txmlconnector.Initialize('C:\\logs\\\0', 1);
console.log(init);

if (init) {
    console.log('free', txmlconnector.FreeMemory(init));
}

setTimeout(() => {
console.log('callback', txmlconnector.SetCallback(cb));

// Make an extra reference to the callback pointer to avoid GC
process.on('exit', function() {
    cb;
    connection.end();
});


/* <command id="connect"> <login>user_id</login> <password>user_password</password> <host>server_ip</host> <port>server_port</port> <language>ru/en</language> <autopos>true/false</autopos> <micex_registers>true/false</micex_registers> <milliseconds>true/false</milliseconds> <utc_time>true/false</utc_time> <proxy type="тип" addr="адрес" port="порт" login="логин" password="пароль"/> <rqdelay>Частота запросов к серверу</rqdelay> <session_timeout>Таймаут на сессию в секундах</session_timeout> <request_timeout>Таймаут на запрос в секундах </request_timeout> <push_u_limits>Период в секундах</push_u_limits> <push_pos_equity>Период в секундах</push_pos_equity> </command> */
// json2xml({ a: 1, attr: { b: 2, c: 3 } }, { attributes_key: 'attr' });

var connectObj = {
    command: {
        login: '',
        password: '',

        host: ['hft.finam.ru', 'tr1.finam.ru', 'tr2.finam.ru'][0],
        port: [13900, 3900][0],
        language: 'en',
        autopos: true,

        // rqdelay: 1000,
   	// push_u_limits: 1,
	// push_pos_equity: 1
    },
    attr: {
        id: 'connect'
    }
};
var connectXml = json2xml(connectObj, { attributes_key: 'attr' });

console.log(connectXml);
var connectCommand = txmlconnector.SendCommand(connectXml);
console.log(connectCommand)

if (connectCommand) {
    console.log('free connectCommand', txmlconnector.FreeMemory(connectCommand));
}

setTimeout(() => {
    // console.log('serverstatus',  txmlconnector.SendCommand('<command id="server_status"/>'));
    // console.log('get_securities',  txmlconnector.SendCommand('<command id="get_securities"/>'));
    // console.log('get_markets',  txmlconnector.SendCommand('<command id="get_markets"/>'));

setTimeout(() => { 
    var board = 'FUT';
    var seccode = 'SiZ0'; // 'SRU0';
    var security = `<security><board>${board}</board><seccode>${seccode}</seccode></security>`;
    var command = `<command id="neworder">${security}<client>${client}</client>` + // <union>union code</union>
`<price>0</price><hidden>0</hidden><quantity>1</quantity><buysell>B</buysell><bymarket/><brokerref>brokerreftext</brokerref><unfilled>PutInQueue</unfilled>` + // <usecredit/><nosplit/>` + // <expdate>дата экспирации (только для ФОРТС)</expdate>(задается в формате 23.07.2012 00:00:00 (не обязательно)
`</command>`;

//    console.log('neworder',  txmlconnector.SendCommand(command));


var stopOrderCommand = `<command id="newstoporder">${security}<client>${client}</client>
<buysell>B</buysell>` + 
// <linkedorderno>номер связной заявки</linkedorderno>
// (при отсутствии тэга без привязки)
// <validfor>заявка действительно до</validfor>
// (не обязательно)
// <expdate>дата экспирации (только для ФОРТС)</expdate>
// (не обязательно)
`<stoploss>
<activationprice>76000</activationprice>
<bymarket/>
<quantity>1</quantity>` + 

// <guardtime>Защитное время</guardtime>

`</stoploss>
<takeprofit>
<activationprice>79000</activationprice>
<quantity>1</quantity>` + 
// <guardtime>Защитное время</guardtime>

`<correction>10</correction>
<spread>20</spread>
<bymarket/>
</takeprofit>
</command>`;

    console.log('newSTOPorder',  txmlconnector.SendCommand(stopOrderCommand));














// tPasswordNew 
    // console.log('passwd', txmlconnector.SendCommand(`<command id="change_pass" oldpass="${tPassword}" newpass="${tPasswordNew}" />`));
}, 25000);
/*
setTimeout(() => { 
    var board = 'FUT';
    var seccode = 'SRU0';
    var security = `<security><board>${board}</board><seccode>${seccode}</seccode></security>`;
    console.log('subscribe',  txmlconnector.SendCommand(`<command id="subscribe"><alltrades>${security}</alltrades><quotations>${security}</quotations><quotes>${security}</quotes></command>`));
}, 15000);
*/

}, 15000)




}, 1000);




setTimeout(() => {
    console.log('disconnect',  txmlconnector.SendCommand('<command id="disconnect"/>'));
    connection.end();
    setTimeout(() => {
        console.log('disconnect');
        console.log(txmlconnector.UnInitialize());
    }, 1000);
}, 150000);

