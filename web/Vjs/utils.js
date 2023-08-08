Date.prototype.format = function (fmt) {
    let o = {
        "M+": this.getMonth() + 1,                 //月份 
        "d+": this.getDate(),                    //日 
        "h+": this.getHours(),                   //小时 
        "m+": this.getMinutes(),                 //分 
        "s+": this.getSeconds(),                 //秒 
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度 
        "S": this.getMilliseconds()             //毫秒 
    };
    if (/(y+)/.test(fmt)) {
        fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    }
    for (let k in o) {
        if (new RegExp("(" + k + ")").test(fmt)) {
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
        }
    }
    return fmt;
}

const parseData = (rowRecords, rowCodes)=>{
    return parseRecord(rowRecords, rowCodes)
}

const refresh = (lastFuncs)=>{
    let temp = {}
    for (let func in lastFuncs){
        if(lastFuncs[func].state !== DEL){
            temp[func] = {changed: 0, state: KEEP, codes: lastFuncs[func].codes}
        }
    }
    return temp
}
const parseMap = (funcs)=>{
    let map = new Map()
    funcs.forEach(x=>{
        map.set(getFuncName(x), x)
    })
    return map
}

const parseRecord = (rowRecords,rowCodes)=>{
    // let f_set = new Set()
    let mapList = []
    rowCodes.forEach(codes=>{
        mapList.push(parseMap(codes))
    })
    rowRecords.forEach((rec,i)=>{
        let deltaCodesMap = mapList[i]
        let { add, del, update } = rec
        funcVersion[i] = i === 0 ? {} : refresh(funcVersion[i-1])
        if(add.length){
            add.forEach(x=>{
                funcVersion[i][x] = {
                    changed: 1,
                    state: ADD,
                    codes: deltaCodesMap.get(x)
                }
                // if(!f_set.has(x)){
                //     f_set.add(x)
                // }
            })
        }
        if(del.length){
            del.forEach(x=>{
                funcVersion[i][x] = {
                    changed: 1,
                    state: DEL,
                    // codes: mapList[i-1].get(x)
                }
            })
        }
        if(update.length){
            update.forEach(x=>{
                funcVersion[i][x] = {
                    changed: 1,
                    state: UPD,
                    codes: deltaCodesMap.get(x)
                }
            })
        }
    })
    return funcVersion
    // id2func = Array.from(f_set)
    // id2func.forEach((x,i)=>{
    //     func2id.set(x,i)
    //     funcEvoluaiton.push({
    //         name: x,
    //         update: [],
    //         lines: []
    //     })
    // })
}




const getFuncName = (code)=>{
    return code.split('def ')[1].split('(x)')[0]
}

// 根据range，获取scaleBand比例尺的domain
function scaleBandInvert(scale) {
    let domain = scale.domain();
    let paddingOuter = scale(domain[0]);
    let eachBand = scale.step();
    return function (value) {
      let index = Math.floor(((value - paddingOuter) / eachBand));
      return domain[Math.max(0,Math.min(index, domain.length-1))];
    }
  }


function shuffle(array) {
    let currentIndex = array.length,  randomIndex;
  
    // While there remain elements to shuffle.
    while (currentIndex != 0) {
  
      // Pick a remaining element.
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
  
      // And swap it with the current element.
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }
  
    return array;
}

const map2arr= (map)=>{
    if(!map){ return; }
    let newArr = []
    map.forEach((v,k)=>{
        // let newObj = {}
        // newObj[k] =v
        newArr.push( { key: k, value: v } )
    })
    return newArr
}

const hexToRgba = (hex, opacity) => {
    var r = parseInt(hex.substring(1, 3), 16);
    var g = parseInt(hex.substring(3, 5), 16);
    var b = parseInt(hex.substring(5, 7), 16);
    return "rgba(" + r + ", " + g + ", " + b + ", " + opacity + ")";
  }
  