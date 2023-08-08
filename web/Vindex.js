const ADD = 0
const UPD = 1
const DEL = 2
const KEEP = 3

const SPAM = 1
const HAM = 0
const ABSTAIN = -1

let stateMap = ['ADD', 'UPD', 'DEL', 'KEEP']

let funcVersion = []
let modelPerf = []
let funcInfo = []
let gFunc2id = new Map() 
let gId2func = []
let togglePieFlag = false

let func2id = new Map() 
let id2func = []

let texts = []
let exampleNumber = 0
let toalVersions = 0
let textReview = new TextReview()
let relationPie = new SunBurst()
let funcPortionPie = new LFsBurst()
let aggregationChart = new Aggregated()
let perfLine = new PerformanceLine()
let lfsList = new LFsTable()
let versionFilter = new VersionFilter({
    width: 720, 
    margin: { top: 4, left: 10, bottom: 10, right: 0 }
})
let zoomLine = new ZoomLine({
    width: 780, 
    margin: { top: 10, left: 36, bottom: 10, right: 80 },
    container_name: 'lfs-version-container' }
)

let sankeyFlow = new Sankey({
    width: 790,
    margin: { top: 40, left: 20, bottom: 0, right: 80 },
})
let testFlag = false
let sampleNumber = 15000

d3.select('#middle').on('click',()=>{
    aggregationChart.lock = false;
    aggregationChart.clearHighlight()
    zoomLine.lock = false;
    zoomLine.recoverHightLightLFs()
    sankeyFlow.lock = false;
    sankeyFlow.clearHighlight()
})


let pointsN = 0
let selectedVersion = 0


let aggDataStore = []
let dataInfoStore = []
let perfStore = []
let data2rectStore = []
let labelTotal = 0
let codesStore = []

let labelNameList = []
let colors = []

let colorMap = new Map()
let lfsColor = '#A86464'
colorMap.set(-1, {
    color: '#B2B2B2',
    labelName: 'Abstain',
    opacityColor: hexToRgba('#B2B2B2', 0.3)
})

let tooltip= d3.select("#root")
.append("div")
.attr("class", "tooltip")

const initSummary = ()=>{
    exampleNumber = funcVersion[0].label_train.length
    $('#total-count').text(exampleNumber)
    $('#total-version').text(funcVersion.length)
}

const processData = (funcs)=>{
    funcVersion = funcs
    funcVersion = funcVersion.map((x,i)=>{
        const { funcs_info, weights} = x
        for(key in funcs_info){
            funcs_info[key].name = key
            let index = x.lfs_name.findIndex(d=>d === key)
            let map = new Map()
            let total = 0
            x.apply_train.forEach((labels,id)=>{
                let label = labels[index]
                if(label !== -1){
                    if( map.has(label) ){
                        let ids = map.get(label)
                        ids.push(id)
                        map.set(label, ids)
                        total++
                    }else{
                        map.set(label, [id])
                        total++
                    }
                }
            })
            funcs_info[key].labelsMap = map
            funcs_info[key].totalLabel = total
            funcs_info[key].weight = weights[index]
        }
        let link2LFs = [...Array(x.lfs_name.length)].map(x=>[])
        return {...x, funcs_info, link2LFs}
    })
    funcInfo = funcVersion.map(x=>(x.funcs_info))
    modelPerf = funcVersion.map(x=>(x.model_performance))
    pointsN = funcVersion[0]['label_train'].length
    let count = 0
    gFunc2id = new Map()
    funcInfo.forEach(funcs=>{
        for (let name in funcs){
            if(!gFunc2id.has(name)){
                gFunc2id.set(name, count++)
            }
        }
    })
    gId2func = [...Array(gFunc2id.size)].map(_=>'')
    for (let [name, id] of gFunc2id){
        gId2func[id] = name
    }
    aggDataStore = [...Array(funcVersion.length)].map(_=>{
        return [[],[],[]]
    })
    dataInfoStore = [...Array(funcVersion.length)].map(_=>null)
    data2rectStore = [...Array(funcVersion.length)].map(_=>{
        return [[],[],[]]
    })
    codesStore = [...Array(funcVersion.length)].map(_=>'')
    funcVersion[funcVersion.length-1].apply_test.forEach(x=>{
        if(x !== -1){ labelTotal++ }
    })
    perfStore = [...Array(labelNameList.length)].map(_=>[])
    funcVersion.forEach((x,i)=>{
        x.model_performance.forEach((perf,j)=>{
            perfStore[j].push(+(perf.toFixed(2)))
        })
    })     

    initSummary()
}

async function init(){
    points = await eel.get_coords()()
    testFlag = await eel.testState()()

    sampleNumber = testFlag ? 4000 : 15000
    dataFile = testFlag ? '../data/spam.csv' : '../data/yahoo.csv'
    labelNameList = testFlag ? ['HAM', 'SPAM'] : ['Society', 'Science', 'Health', 'Education', 'Computers','Sports']
    colors = testFlag ? ['#FF7F0E', '#98DF8A'] : ['#FF7F0E', '#1f77b4', '#8D7B68', '#98DF8A', '#F2CD5C', '#BFACE2']

    labelNameList.forEach((name,i)=>{
        colorMap.set(i, {
            color: colors[i],
            labelName: name,
            opacityColor: hexToRgba(colors[i], 0.3)
        })
    })
    d3.selectAll('.color-block')
        .style('background-color', (d,i)=>colors[i])

    points = points.slice(0, sampleNumber)

    d3.tsv(dataFile,async function(err, d){
        texts = d.slice(0, sampleNumber).map((x,i)=>({...x, id: i}))  
    })
}

const visUpdate = (funcs)=>{
    selectedRange = [0, funcs.length]
    processData(funcs)
    versionFilter.updateRange()    
    textReview.renderTexts([1,2,3,5,156,235,34,24])
    trainLock = false
}


const clearTooltip = ()=>{
    tooltip.style('display', 'none')
}

const renderTooltip = (data)=>{
    tooltip.style('display', 'flex')
    tooltip.html(()=>{
        return generateTooltip(data)
    })
    .style("left", ()=>{
        let node = tooltip.node()
        const { offsetLeft, offsetTop, offsetWidth,offsetHeight} = node
        return `${d3.event.pageX > 1200 ? d3.event.pageX - offsetWidth - 14  : d3.event.pageX - 14}px`
    })
    .style("top", ()=>{
        let node = tooltip.node()
        const { offsetLeft, offsetTop, offsetWidth,offsetHeight} = node
        return `${d3.event.pageY > 720 ? d3.event.pageY - offsetHeight-20 : d3.event.pageY + 14}px`
    });
}

const generateTooltip = (data)=>{
    let labels = data.map(x=>{
        return `<div class="tooltip-label">${x.key}:</div>`
    }).join('')
    let values = data.map(x=>{
        return `<div class="tooltip-value">${x.value}</div>`
    }).join('')
    return `<div class="tooltip-labels">${labels}</div><div class="tooltip-values">${values}</div>`
}

const togglePie = (type)=>{
    if(type === 'func'){
        relationPie.hide()
        funcPortionPie.show()
    }else{
        funcPortionPie.hide()
        relationPie.show()
    }
}

init()