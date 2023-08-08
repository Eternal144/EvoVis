
let toggleFlag = true
let updateId = 0
var candidateLFs = []
var selectedLFs = []
var updateRecord = {
    "id": updateId,
    "add": [],
    "del": [],
    "update": [],
    "date": "2023/03/07 08:23"
}
var trainLock = false
let candidateView = new CandidateView()
let selectedView = new SelectedView()

async function init() {
    d3.select('.maneuver-container').style('display', 'flex')
    d3.select('.visualization-container').style('display', 'none')
    candidateLFs = await eel.readLFsList()()
    candidateView.updateCandidate()
}

const toggleView = ()=>{
    if(toggleFlag){
        d3.select('.maneuver-container').style('display', 'none')
        d3.select('.visualization-container').style('display', 'flex')
    }else{
        d3.select('.visualization-container').style('display', 'none')
        d3.select('.maneuver-container').style('display', 'flex')
    }
    toggleFlag = !toggleFlag
}

const updateFunc = (type, data)=>{
    let index = updateRecord.add.findIndex(x=>x.id === data.id)
    // let index = updateRecord.update.findIndex(x=>x.id === data.id)
    if(type === 'del'){
        if (index!==-1){
            updateRecord.add.splice(index, 1)
        }else{
            updateRecord[type].push(data)
        }
    }else if(type === 'update'){
        if(index !== -1){
            updateRecord.add[index] = data
        }else{
            uid = updateRecord.update.findIndex(x=>x.id === data.id)
            if(uid !==-1){return}
            updateRecord[type].push(data)
        }
    }else{
        updateRecord[type].push(data)
    }
}

async function trainModel() {
    if(!trainLock){
        updateRecord.date = getCurrentTime()
        let funcs =  await eel.writeFile(updateRecord)()
        if(funcs.length){
            trainLock = true
            visUpdate(funcs)
            updateRecord = {
                "id": ++updateId,
                "add": [],
                "del": [],
                "update": [],
                "date": ''
            }
        }
    }
}

const  getCurrentTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    const formattedTime = `${year}/${month}/${day} ${hours}:${minutes}`;
    return formattedTime;
}

init()