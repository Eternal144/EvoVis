
class LFsTable{
    constructor(){
        this.container = d3.select('#table-body')
        this.data = [
            {
                name: '1-award',
                accuracy: 0.124,
                coverage: 0.34,
                conflict: 0.06
            },
            {
                name: '2-award1',
                accuracy: 0.45,
                coverage: 0.43,
                conflict: 0.96
            },
            {
                name: '3-award1',
                accuracy: 0.86,
                coverage: 0.33,
                conflict: 0.96
            },
            {
                name: '4-award1',
                accuracy: 0.2,
                coverage: 0.49,
                conflict: 0.16
            },
            {
                name: '5-award1',
                accuracy: 0.35,
                coverage: 0.43,
                conflict: 0.57
            },
        ]
    }
    updateTable(lfsList){
        let data = this.processData(lfsList)
        let update = this.container.selectAll('tr')
                .data(data)
            
            update.exit().remove()

            update
                .enter()
                .append('tr')
                .merge(update)
                .html((d,i)=>{
                    let str = ''
                    const { tableValue } = d;
                    for (let key in tableValue){
                        if (key === 'state'){
                            str += `<td> ${stateMap[+tableValue[key]]} </td>`
                        }else{
                            str += `<td> ${tableValue[key]} </td>`
                        } 
                    }
                    return str
                })
                .on('mouseover', function(d,i){
                    // zoomLine.highlightLFs(+d.tableValue.name.split('-')[0]-1)

                })
                .on('mouseout', function(d,i){
                    // zoomLine.recoverHightLightLFs()
                })
                .on('click', function(d,i){
                    console.log(d)
                    if(d.state !== DEL){
                        let ids = []
                        d.labelsMap.forEach((v,k)=>{
                            ids = ids.concat(v)
                        })
                        textReview.renderTexts(ids)
                        updateCodeByCodes(d.codes)
                        aggregationChart.highlightRect(ids)
                        // zoomLine.highlightLFs()
                    }
                    zoomLine.highlightPaper(+d.tableValue.name.split('-')[0]-1)

                    let f_index = funcVersion[selectedVersion].lfs_name.findIndex(x=>x === d.tableValue.name.split('-')[1])
                    let lfs = funcVersion[selectedVersion].link2LFs[f_index]
                    sankeyFlow.highlightLink(lfs)

                    //trigger the label relation update. replace burst 
                    togglePie('func')   
                    funcPortionPie.renderBurst(selectedVersion, +d.tableValue.name.split('-')[0]-1)
                    
                })
    } 
    processData(data){
        return data.map((lfs,i)=>{
            const { accuracy, coverage, name,codes,weight,state,labelsMap,version} =  lfs
            return {
                tableValue: {
                    name: `${func2id.get(name)+1}-${name}`,
                    accuracy: accuracy ? accuracy.avg.toFixed(3) : 0,
                    coverage: coverage? coverage.toFixed(3) : 0, 
                    weight: weight? weight.toFixed(3) : 0,
                    state: +state,
                    version
                },
                codes,
                labelsMap,
                state,
            }
        })
    }
}

function sortTable(n) {
    var table, rows, switching, i, x, y, shouldSwitch, dir, switchcount = 0;
    table = document.getElementsByTagName("table")[0];
    switching = true;
    dir = "asc";
    while (switching) {
        switching = false;
        rows = table.rows;
        let key = table.querySelector('thead').querySelectorAll('th')[n].innerHTML.toLowerCase()
        for (i = 1; i < (rows.length - 1); i++) {
            shouldSwitch = false;
            x = rows[i].__data__.tableValue
            y = rows[i + 1].__data__.tableValue
            if (dir == "asc") {
                if (x[key] > y[key]) {
                    shouldSwitch = true;
                    break;
                }
            } else if (dir == "desc") {
                if (x[key] < y[key]) {
                    shouldSwitch = true;
                    break;
                }
            }
        }
        if (shouldSwitch) {
            rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
            switching = true;
            switchcount ++;
        } else {
            if (switchcount == 0 && dir == "asc") {
                dir = "desc";
                switching = true;
            }
        }
}
// 添加排序状态
var ths = table.getElementsByTagName("th");
for (i = 0; i < ths.length; i++) {
if (i == n) {
    ths[i].classList.toggle("asc", dir == "asc");
    ths[i].classList.toggle("desc", dir == "desc");
} else {
    ths[i].classList.remove("asc");
    ths[i].classList.remove("desc");
}
}

}