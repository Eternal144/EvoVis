class Aggregated{
    constructor(){
        this.lasso = d3.lasso()
        this.width = 720
        this.height = 360
        // this.height = 500

        this.scale = 5
        this.aggn = 1

        this.max_agg_w = this.scale
        this.min_agg_w = 3

        this.x_block_n = this.width / this.scale
        this.y_block_n = this.height / this.scale

        this.margin = {top: 6, left: 70, bottom: 6, right: 80};
        this.color = ['#FA58B6', '#42855B','#E0DDAA']
        this.container = d3.select('#aggregate-container')
            .append('svg')
            .attr('id', 'agg-container-svg')
            .attr('width', this.width + this.margin.left + this.margin.right)
            .attr('height', this.height + this.margin.top + this.margin.bottom)
            .append('g')
            .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`)
        this.xScale = d3.scaleLinear()
            .range([0, this.width])
        this.yScale = d3.scaleLinear()
            .range([this.height, 0])
        this.wScale = d3.scaleQuantize()
        this.xAxis = this.container.append('g')
            .attr('class', 'agg-axis')
            .attr('transform', `translate(0, ${this.height})`)
        this.yAxis = this.container.append('g')
            .attr('class', 'agg-axis') 
        this.labelsMap = new Map()
        // legend,考虑不变咯
        this.legend_container = d3.select('#agg-container-svg')
            .append('g')
            .attr('class', 'agg-legend-container')
            .attr('transform', `translate(${this.margin.left + this.width+30},${this.height - 140})`)
        this.level = 1
        this.lock = false
        
        d3.select('#agg-container-svg')
            .on("wheel", ()=> {
                const { level } = this
                console.log(d3.event.wheelDeltaY)
                if(d3.event.wheelDeltaY > 100){
                    if(level < 2){
                        zoomIn(this.level+1)
                        this.updateAggregated(this.level+1)
                    }
                }else{
                    if(level > 0){
                        zoomOut(this.level-1)
                        this.updateAggregated(this.level-1)
                    }
                }
            });

        
    }

    setLock(){
        this.lock = true
    }

    // 计算距离
    displacement(points, aggPoints){
        const { max_agg_w, width, height } = this
        let totalDistance = 0

        let xScale = d3.scaleLinear()
            .range([0, width])
            .domain(d3.extent(points.map(x=>x[0])))
            .nice()
        let yScale = d3.scaleLinear()
            .range([height, 0])
            .domain(d3.extent(points.map(x=>x[1])))
            .nice()

        aggPoints.forEach(block=>{
            let x = block.cid*max_agg_w+max_agg_w/2
            let y = block.rid*max_agg_w+max_agg_w/2
            
            block.points.forEach(p=>{
                const { label, id } = p
                let { distance, number } = this.labelsMap.get(+label)
                let x1 =  xScale(points[id][0])
                let y1 = yScale(points[id][1])
                totalDistance += Math.sqrt(Math.pow(x1-x, 2) + Math.pow(y1-y, 2))
                this.labelsMap.set(+label, {
                    distance: distance+Math.sqrt(Math.pow(x1-x, 2) + Math.pow(y1-y, 2)),
                    number: ++number
                })
            })
        })
        this.labelsMap.forEach((value, key, map)=>{
            console.log(`label: ${key} distance: ${value.distance.toFixed(2)} avg_distance: ${(value.distance/value.number).toFixed(2)}`)
        })
        console.log(`total:${totalDistance.toFixed(2)}`)
    }

    initVariable(level){
        this.level = level
        this.scale = 5*Math.pow(2, level)

        this.max_agg_w = this.scale
        this.min_agg_w = 2+level

        this.x_block_n = this.width / this.scale
        this.y_block_n = this.height / this.scale

        this.wScale.range(d3.range(this.min_agg_w, this.max_agg_w))

        this.legend_container
        .attr('transform', `translate(${this.margin.left + this.width+30},${150})`)
    }

    updateAggregated(level){
        // console.log(level,selectedVersion)
        let aggPoints = []
        let labels = funcVersion[selectedVersion].label_train
        this.initVariable(level)
        if(!aggDataStore[selectedVersion][level].length){
            // this.labelsMap = new Map()
            // d3.nest()
            //     .key(d=>d)
            //     .entries(labels)
            //     .forEach(x=>{
            //         this.labelsMap.set( +x.key, {
            //             distance: 0,
            //             number: 0
            //         }) 
            //     })
            aggPoints = this.aggregatePoints(points, labels)
            let data2rect = [...Array(exampleNumber)].map(_=>-999)
            aggPoints.forEach((x,i)=>{
                x.points.forEach((y,j)=>{
                    data2rect[y.id] = i
                })
            })
            data2rectStore[selectedVersion][level] = data2rect
            aggDataStore[selectedVersion][level] = aggPoints
        }else{
            aggPoints = aggDataStore[selectedVersion][level]
        }
        const { x_block_n, y_block_n, height, width, container, color,max_agg_w, label} = this
        
        this.wScale.domain([d3.min(aggPoints, d=>Math.log(d.points.length)), d3.max(aggPoints, d=>Math.log(d.points.length))]).range(d3.range(this.min_agg_w, this.max_agg_w-1))
        this.xScale.domain([-x_block_n/2, x_block_n/2])
        this.yScale.domain([-y_block_n/2, y_block_n/2])
        const { xScale, yScale, wScale } = this
        this.xAxis
            .transition()
            .duration(100)
            .call(
                d3.axisBottom(xScale)
                .tickSize(-height)
                .ticks(x_block_n)
                .tickFormat(d=>'') 
            )
        this.yAxis
            .transition()
            .duration(100)
            .call(
                d3.axisLeft(yScale)
                .tickSize(-width)
                .ticks(y_block_n)
                .tickFormat(d=>'')
            )
        
        // this.displacement(points, aggPoints)
        let update = container.selectAll('rect')
            .data(aggPoints)
    
        update.exit().style('opacity', 0).remove()

        update
            .enter()
            .append('rect')
            .merge(update)
            .on('mouseover', function(d,i){
                const data = [
                    {
                        key: 'label',
                        value: colorMap.get(+d.points[0].label).labelName
                    },
                    {
                        key: 'count',
                        value: d.points.length
                    }
                ]
                renderTooltip(data)

            })
            .on('mouseout', function(){
                clearTooltip()
            })
            .attr('class', (d,i)=>{
                // let str = 'agg-block '
                // d.points.forEach(x=>{
                //     str += `agg-block-${x.id} `
                // })
                // return str
                return 'agg-block'
            })
            .attr('id', (d,i)=>`agg-block-${i}`)
            .attr('x', d=>{
                
                return d.cid*max_agg_w+max_agg_w/2-wScale(Math.log(d.points.length))/2+0.5
            })
            .attr('y', d=>{
                return d.rid*max_agg_w+max_agg_w/2-wScale(Math.log(d.points.length))/2+0.5
            })
            .attr('width',  d=>{
                return wScale(Math.log(d.points.length))
            })
            .attr('height', d=>{
                return wScale(Math.log(d.points.length))
            })
            .attr('fill', d=>{
                return  colorMap.get(+d.points[0].label).color
            })
        
        this.renderLegend()
        this.activateLasso()
    }

    renderLegend(){
        const { legend_container, wScale, level } = this
        legend_container.selectAll(".legend-item").remove()
        // let width = (wScale.range()).slice(-1)[0]
        let range = level === 2 ? wScale.range().filter((x,i)=>(i%2 === 0)) :  wScale.range()
        const maxValue = d3.max(range);
        const maxH  = maxValue + 6
        let padding = 6
        let items = legend_container.selectAll(".legend-item")
            .data(range)
            .enter()
            .append("g")
            .attr("class", "legend-item")
            .attr("transform", function(d, i) {
                return `translate(0, ${18*i})`;
            });

            // 在每个条目的<g>元素中创建方块和标签
            items.append("rect")
            .attr("x", (d,i)=>(maxValue - d) / 2)
            .attr("y", (d,i)=>{
                return 9-d/2 
            })
            .attr("width", function(d) {
                return d ;
            })
            .attr("height", function(d) {
                return d;
            })
            .attr('fill','#ccc')

            items.append("text")
            .attr("x", function(d) {
                return level === 2 ? 20 : 14
            })
            .attr("y", function(d,i) {
                return 13
            })
            .style('font-size', '12px')
            .attr('text-anchor', 'start')
            .text(function(d) {
                return Math.ceil(Math.exp(wScale.invertExtent(d)[1]));
            });
    }

    highlightRect(ids){
        const { level } = this
        // 这几个id所在的高亮，其他的都不高亮
        let data2rect = data2rectStore[selectedVersion][level]
        d3.selectAll('.agg-block')
            .style('opacity', .2)

        ids.forEach(x=>{
            d3.select(`#agg-block-${data2rect[x]}`)
                .style('opacity', 1)
        })
    }

    clearHighlight(){
        d3.selectAll('.agg-block')
            .style('opacity', 1)
    }

    // 聚成四个的
    gridMerge(largeDist){
        let rowL = largeDist.length
        let colL = largeDist[0].length
        let blockn = 2
        let matrix = this.getArray(rowL/blockn, colL/blockn)
        for (let i = 0; i < rowL/blockn; i++){
            for(let j = 0; j < colL/blockn; j++){
                for( let k1 = 0; k1<blockn; k1++){
                    for (let k2 = 0; k2<blockn; k2++){
                        let rid = i*blockn + k1
                        let cid = j*blockn + k2
                        // console.log(rid, cid)
                        largeDist[rid][cid].forEach((points,label)=>{
                            if( matrix[i][j].has(label) ){
                                let lastp = matrix[i][j].get(label)
                                matrix[i][j].set(label, lastp.concat(points) )
                            }else{
                                matrix[i][j].set(label, points)
                            }
                        })
                    }
                }
            }
        }
        // console.log(matrix)
        return matrix
    }

    aggregatePoints(points, labels){
        const { max_agg_w, y_block_n, x_block_n } = this
        let matrix = this.getArray(y_block_n, x_block_n)
        let sh = 1.03
        this.xScale.domain([d3.min(points,(d)=>d[0])*sh, d3.max(points,(d)=>d[0])*sh]).nice()
        this.yScale.domain([d3.min(points,(d)=>d[1])*sh, d3.max(points,(d)=>d[1])*sh]).nice()
        points.forEach((p,i)=>{
            let cid = Math.floor(this.xScale(p[0]) / max_agg_w)
            let rid = Math.floor(this.yScale(p[1]) / max_agg_w)
            let label = labels[i]
            if( matrix[rid][cid].has(label) ){
                let lastp = matrix[rid][cid].get(label)
                lastp.push({
                    id: i,
                    label
                })
                matrix[rid][cid].set(label, lastp)
            }else{
                matrix[rid][cid].set( label, [{id: i, label }] )
            }
        })
        matrix = this.permeate(matrix)

        // 恢复画图数据
        let gridData = []
        for (let i = 0; i<this.y_block_n; i++){
            for (let j =0; j<this.x_block_n; j++){
                matrix[i][j].forEach(function (value, key, map) {
                    gridData.push({
                        rid: i,
                        cid: j,
                        points: value
                    })
                })
            }
        }
        return gridData
    }

    getCount(matrix, rid, cid, label){
        let count = 0
        for (let i = rid; i < rid+3; i++){
            for(let j = cid; j < cid+3; j++){
                if(rid >= 0 && rid<= (matrix.length-1) && cid >= 0 && cid <= (matrix[0].length-1) )
                if( matrix[i][j].size > 0 ){
                    for (let [key,value] of matrix[i][j]){
                        if(key === label){
                            count += matrix[i][j].get(key).length
                        }
                    }
                }  
            }
        }
        return count
    }

    // 以及最大得分的方向，以及该方向是否由1->2
    getDir(densityList, pos, matrix, label){
        let u1 = 1, u2 = 2, u3 = 1

        let y = pos[0]
        let x = pos[1]
        let top = [y-1, x],
        topl = [y-1,x-1],
        left = [y,x-1],
        bottoml = [y+1,x-1],
        bottom = [y+1,x],
        bottomr = [y+1,x+1],
        right = [y,x+1],
        topr = [y-1,x+1]

        let dirs = [top, topl, left, bottoml, bottom, bottomr, right, topr]
        let score = densityList.slice(0, 8).map(x=>(x*u3))
        // 八个方向是否有空或者单独1，有的话，返回该方向的大小
        function check(label, i){
            let item = matrix[dirs[i][0]][dirs[i][1]]
            if( item.size === 0 ){
                return { empty: true }
            }else if( item.size === 1 && item.has(label)){
                return { occupy: true }
            }else{
                return {}
            }
        }
        
        for (let i = 0; i < 8; i++){
            let testGrid = check( label, i )
            if (testGrid.empty){
                score[i] += u1
            }else if(testGrid.occupy){
                score[i] += u2
            }
        }

        let ids = d3.range(8)
        let maxS = -1
        let maxId = ids[Math.floor(Math.random() * ids.length)]
        score.forEach((x,i)=>{
            if(x > maxS && Math.random() < 0.9){
                maxId = i
                maxS = x
            }
        })
        let rid = dirs[maxId][0]
        let cid = dirs[maxId][1]

        let targetGrid = matrix[rid][cid]
        
        // 是否由1->2？
        if( (targetGrid.size === 1) && !targetGrid.has(label) ){
            return {
                rid,
                cid,
                conflict: true
            }
        }else{
            return {
                rid,
                cid,
            }
        }
    }

    permeate(datas){
        const { y_block_n, x_block_n, getCount, getDir } = this
        let queue = []
        let iteration_n = 0
        let matrix = d3.range(0, y_block_n+6).map((rid)=>{
            return d3.range(0, x_block_n+6).map((cid)=>{
                if(rid<3 || rid > y_block_n+2 || cid <3 || cid > x_block_n+2){
                    return new Map()
                }else{
                    if(datas[rid-3][cid-3].size > 1){
                        queue.unshift({
                            cid,
                            rid,
                        })
                    }
                    return datas[rid-3][cid-3]
                }
            })
        })
        // let lastPos = {  }
        // let repeat = false
        // // console.log(queue)
        while(queue.length){
            if( iteration_n > 7990 ){ 
               if(iteration_n > 8001){
                    return this.permeate(datas)
               }
             }
            iteration_n++
            queue = shuffle(queue)
            const { cid, rid }  = queue.pop()

            let label2Walk = new Map()
            let totalL = 0
            let totalGrid = 0
            for (let [key, value] of matrix[rid][cid]){
                totalGrid += value.length
                const countList = [
                    getCount(matrix, rid-3, cid-1, key),
                    getCount(matrix, rid-3, cid-3, key),
                    getCount(matrix, rid-1, cid-3, key),
                    getCount(matrix, rid+1, cid-3, key),
                    getCount(matrix, rid+1, cid-1, key),
                    getCount(matrix, rid+1, cid+1, key),
                    getCount(matrix, rid-1, cid+1, key),
                    getCount(matrix, rid-3, cid+1, key),
                ]
                totalL += d3.sum(countList)
                label2Walk.set(key, 
                    countList,
                )
            }

            // 一个格子占主导，移动其他密度最大的格子
            let occupyLabel = -999
            let sh = 0.7

            let walkLabel = -999
            let tempDensity = -999
            let maxDensityList = []

            for(let [key, value] of matrix[rid][cid]){
                if( value.length > totalGrid * sh ){
                    occupyLabel = key
                    break
                }
            }

            for(let [key, value] of matrix[rid][cid]){
                if( occupyLabel !== key ){
                    let countList = label2Walk.get(key)
                    if(!totalL){
                        walkLabel = key
                        maxDensityList = countList
                        break;
                    }
                    const density = d3.sum(countList) / totalL
                    if(density > tempDensity){
                        walkLabel = key
                        tempDensity = density
                        maxDensityList = countList.map(x=>(x/totalL))
                    }
                }
            }

            const walkObj = getDir(maxDensityList, [rid, cid], matrix, walkLabel)

            if(walkObj.conflict){
                queue.unshift({rid: walkObj.rid, cid: walkObj.cid})
            }

            let points = matrix[rid][cid].get(walkLabel)
            matrix[rid][cid].delete(walkLabel)
            let walkin = matrix[walkObj.rid][walkObj.cid]
            if(walkin.has(walkLabel)){
                let lastp = walkin.get(walkLabel)
                walkin.set(walkLabel, lastp.concat(points))
            }else{
                walkin.set(walkLabel, points)
            }
            if(matrix[rid][cid].size > 1){
                queue.unshift({rid, cid})
            }

        }
        
        let filterMatrix = this.getArray(y_block_n, x_block_n)   
        for (let i = 3; i<matrix.length-3; i++){
            for (let j = 3; j<matrix[0].length-3; j++){
                matrix[i][j].forEach(function (value, key, map) {
                    filterMatrix[i-3][j-3] = new Map()
                    filterMatrix[i-3][j-3].set( key, value )
                })
            }
        }
        return filterMatrix
    }

    getArray(rown, coln){
        return d3.range(0, rown).map(_=>{
            return d3.range(0, coln).map(__=>{
                return new Map()
            })
        })
    }

    activateLasso(){
        // console.log(d3.selectAll('.agg-block'))
        this.lasso
            .closePathDistance(100)
            .closePathSelect(true)
            .targetArea(d3.select('#agg-container-svg'))
            .items(d3.selectAll('.agg-block'))
            .on("start",()=>{
                this.lasso.items()
                    .style('opacity', '0.3')
            })
            .on("draw",()=>{
                this.lasso.possibleItems()
                    .style('opacity', '1')
            
                this.lasso.notPossibleItems()
                    .style('opacity', '0.3')
            })
            .on("end",()=>{
               
                let ids = []
                const selected = this.lasso.selectedItems()
                    .style('opacity', '1')

                this.lasso.notSelectedItems()
                    .style('opacity', '0.3')

                selected.each(function(d, i){
                    if(d){
                        ids = ids.concat(d.points.map(p=>(p.id)))
                    }
                    textReview.renderTexts(ids)
                })

                if(selected.nodes().length === 0){
                    d3.selectAll('.agg-block')
                        .style('opacity', '1')
                }
            })
            
        d3.select('#agg-container-svg').call(this.lasso)
    }
}