const fs = require('fs');

fs.readFile('records_yahoo.json', 'utf8', (err, data) => {
    if (err) { return; }
    obj = JSON.parse(data);
    obj = obj.map(x=>{
        return { ...x, id: x.id+1 }
    })
    const json = JSON.stringify(obj);

    fs.writeFile('records_yahoo.json', json, 'utf8', (err) => {
        if (err) { return; }
        console.log('Data written to file');
      });
  });